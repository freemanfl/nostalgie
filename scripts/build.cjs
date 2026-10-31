const fs = require('node:fs');
const path = require('node:path');
const less = require('less');
const postcss = require('postcss');
const cssnano = require('cssnano');
const root = path.resolve(__dirname, '..');
async function build() {
  for (const name of ['root', 'critical', 'local', 'menu']) {
    const filename = path.join(root, 'css', name + '.less');
    const result = await less.render(fs.readFileSync(filename, 'utf8'), {
      filename, math: 'parens-division', rewriteUrls: 'off'
    });
    const css = result.css.replaceAll('url(fonts/', 'url(../fonts/');
    const optimized = await postcss([cssnano({preset:'default'})]).process(css, {from:filename});
    fs.writeFileSync(path.join(root,'css',name+'.css'), optimized.css + '\n');
    console.log(name + '.css: ' + Buffer.byteLength(optimized.css) + ' bytes');
  }
  // One menu data source generates both the landing panels and printable menu.
  const groups = JSON.parse(fs.readFileSync(path.join(root,'menu-data.json'),'utf8'));
  const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  const price = value => typeof value === 'number' ? value + ' Kč' : esc(value);
  const tabs = groups.map(([name],i)=>`<button type="button" class="menu-tab${i===0?' active':''}" id="menu-tab-${i}" role="tab" aria-controls="menu-panel-${i}" aria-selected="${i===0}" tabindex="${i===0?0:-1}">${esc(name)}</button>`).join('');
  const panels = groups.map(([name,items],i)=>`<section class="landing-menu-panel" id="menu-panel-${i}" role="tabpanel" aria-labelledby="menu-tab-${i}" tabindex="0" ${i?'hidden':''}><div class="panel-heading"><h3>${esc(name)}</h3><span>${items.length} položek</span></div><div class="landing-dishes" tabindex="0" role="list" aria-label="${esc(name)} – posuňte pro další jídla">${items.map(([n,p,desc])=>`<div class="landing-dish" role="listitem"><div><h4>${esc(n)}</h4>${desc?`<p>${esc(desc)}</p>`:''}</div><strong>${price(p)}</strong></div>`).join('')}</div></section>`).join('');
  const indexPath = path.join(root,'index.html');
  let html = fs.readFileSync(indexPath,'utf8');
  html = html.replace(/<!-- MENU:START -->[^]*?<!-- MENU:END -->/, `<!-- MENU:START --><div class="landing-menu"><div class="menu-panels">${panels}</div><div class="menu-tabs" role="tablist" aria-label="Kategorie jídelního lístku" aria-orientation="horizontal">${tabs}</div></div><!-- MENU:END -->`);
  fs.writeFileSync(indexPath, html);
  const menuPath = path.join(root,'menu.html');
  let menu = fs.readFileSync(menuPath,'utf8');
  const links = groups.map(([n],i)=>`<a href="#category-${i}">${esc(n)}</a>`).join('');
  const sections = groups.map(([n,items],i)=>`<section class="menu" id="category-${i}"><h2 class="menu-top">${esc(n)}</h2>${items.map(([name,p,desc])=>`<div class="dish"><span>${esc(name)}${desc?`<small class="item-description">${esc(desc)}</small>`:''}</span><strong>${price(p)}</strong></div>`).join('')}</section>`).join('');
  menu = menu.replace(/<!-- MENU:START -->[^]*?<!-- MENU:END -->/,`<!-- MENU:START --><nav class="menu-categories" aria-label="Kategorie jídelního lístku">${links}</nav>${sections}<!-- MENU:END -->`);
  fs.writeFileSync(menuPath,menu);
  const output = path.join(root,'dist');
  fs.mkdirSync(output,{recursive:true});
  const files = new Set(['index.html','menu.html','css/root.css','css/critical.css','css/local.css','css/menu.css','css/no-script.css','js/site.js','js/restore.js','images/favicon.svg']);
  for (const filename of ['index.html','menu.html']) {
    const doc = fs.readFileSync(path.join(root,filename),'utf8');
    for (const match of doc.matchAll(/(?:src|href)="([^"#]+)"/g)) if (!/^(https?:|tel:|data:)/.test(match[1])) files.add(match[1]);
    for (const match of doc.matchAll(/srcset="([^"]+)"/g)) for (const item of match[1].split(',')) files.add(item.trim().split(' ')[0]);
  }
  for (let i=0;i<5;i++) files.add('fonts/midcentury-'+i+'.ttf');
  for (const name of files) {
    const target=path.join(output,name); fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.copyFileSync(path.join(root,name),target);
  }
  fs.writeFileSync(path.join(root,'scripts/deploy-files.json'),JSON.stringify([...files].sort(),null,2));
  console.log('Static bundle: '+files.size+' files in dist/');

}
build().catch(error => { console.error(error); process.exitCode = 1; });
