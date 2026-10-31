const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
let checked = 0;
function localReference(value, base) {
  if (/^(https?:|data:|tel:|mailto:|#)/.test(decodeURIComponent(value))) return;
  const file = path.resolve(base, decodeURIComponent(value.split(/[?#]/)[0]));
  if (!fs.existsSync(file)) throw Error('Missing local asset: ' + value);
  checked++;
}
for (const name of ['index.html','menu.html','he.html','menu-he.html']) {
  const html = fs.readFileSync(path.join(root,name),'utf8');
  if (/<style\b|<script(?![^>]*\bsrc=)/i.test(html)) throw Error('Embedded CSS/JS remains in '+name);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  if (new Set(ids).size !== ids.length) throw Error('Duplicate HTML ids in '+name);
  for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
    if (match[1].startsWith('#') && !ids.includes(match[1].slice(1))) throw Error('Broken anchor '+match[1]);
    localReference(match[1],root);
  }
  for (const match of html.matchAll(/srcset="([^"]+)"/g)) for(const item of match[1].split(',')) localReference(item.trim().split(' ')[0],root);
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\bwidth=/.test(match[0]) || !/\bheight=/.test(match[0])) throw Error('Unsized image in '+name);
  }
}
for (const name of ['root','critical','local','menu','hebrew']) {
  const css=fs.readFileSync(path.join(root,'css',name+'.css'),'utf8');
  for(const match of css.matchAll(/url\(["']?([^\s)'";]+)["']?\)/g)) localReference(match[1],path.join(root,'css'));
}
for(const name of ['site','restore']) execFileSync(process.execPath,['--check',path.join(root,'js',name+'.js')]);
const groups=JSON.parse(fs.readFileSync(path.join(root,'menu-data.json'),'utf8'));
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
if ([...index.matchAll(/class="menu-tab(?: active)?"/g)].length!==groups.length) throw Error('Menu category mismatch');
if ([...index.matchAll(/class="landing-dish"/g)].length!==groups.reduce((n,g)=>n+g[1].length,0)) throw Error('Menu item mismatch');
const hebrewGroups=JSON.parse(fs.readFileSync(path.join(root,'menu-data-he.json'),'utf8'));
const hebrewIndex=fs.readFileSync(path.join(root,'he.html'),'utf8');
if(!hebrewIndex.includes('lang="he" dir="rtl"'))throw Error('Hebrew language/direction missing');
if([...hebrewIndex.matchAll(/class="landing-dish"/g)].length!==hebrewGroups.reduce((n,g)=>n+g[1].length,0))throw Error('Hebrew menu item mismatch');
if(hebrewGroups.length!==groups.length)throw Error('Menu locale category mismatch');
groups.forEach((group,i)=>{if(group[1].length!==hebrewGroups[i][1].length)throw Error('Menu locale length mismatch');group[1].forEach((item,j)=>{if(item[1]!==hebrewGroups[i][1][j][1])throw Error('Price differs between locales');});});
const deployFiles=JSON.parse(fs.readFileSync(path.join(root,'scripts/deploy-files.json'),'utf8'));
for(const file of deployFiles) if(!fs.existsSync(path.join(root,'dist',file))) throw Error('Missing deploy file '+file);
console.log(`PASS: ${checked} local references, sized images, unique ids, anchors, JS syntax, and ${groups.length} menu categories.`);
