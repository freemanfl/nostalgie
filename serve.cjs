const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.ttf':'font/ttf','.woff2':'font/woff2','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
 let url; try { url = decodeURIComponent(req.url.split('?')[0]); } catch {res.writeHead(400);return res.end('Bad request');}
 if(url==='/')url='/index.html';
 if(!(/^\/(?:index|menu)\.html$/.test(url)||/^\/(?:css|js|fonts|images)\/[a-zA-Z0-9_.-]+$/.test(url))){res.writeHead(404);return res.end('Not found');}
 const file=path.resolve(root,'.'+url),type=mime[path.extname(file)];
 if(!file.startsWith(root+path.sep)||!type||!fs.existsSync(file)){res.writeHead(404);return res.end('Not found');}
 res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
 fs.createReadStream(file).pipe(res);
}).listen(4176,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4176'));
