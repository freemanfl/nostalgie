const fs = require('node:fs');
const path = require('node:path');
const sharp = require('C:/Users/Farid/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(__dirname, '..');
(async () => {
 const files = ['interior-enhanced.png','motorcycle.jpg','dining.jpg','entrance.jpg'];
 const manifest = {};
 for (const file of files) {
  const source = path.join(root,'images',file), name = path.parse(file).name;
  const info = await sharp(source).metadata();
  const widths = [...new Set([480,800,1200,1600].filter(w=>w<=info.width).concat(info.width))];
  manifest[file] = {width:info.width,height:info.height,variants:[]};
  for (const width of widths) {
   const output = `images/${name}-${width}.webp`;
   await sharp(source).resize({width,withoutEnlargement:true}).webp({quality:82}).toFile(path.join(root,output));
   manifest[file].variants.push({width,path:output,bytes:fs.statSync(path.join(root,output)).size});
  }
 }
 fs.writeFileSync(path.join(root,'images/manifest.json'),JSON.stringify(manifest,null,2));
 console.log(JSON.stringify(Object.fromEntries(Object.entries(manifest).map(([k,v])=>[k,{original:fs.statSync(path.join(root,'images',k)).size,largest:v.variants.at(-1).bytes}]))));
})();
