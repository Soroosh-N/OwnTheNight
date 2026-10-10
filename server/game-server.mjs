import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Optional static server. Multiplayer now connects between browsers using
// PeerJS/WebRTC; this process does not own rooms or race simulation.
const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function createGameServer(){return http.createServer((req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost'),requested=decodeURIComponent(url.pathname),source=requested.startsWith('/src/'),base=path.join(projectRoot,source?'src':'public');
  const target=requested==='/own-the-night-lan.zip'?path.join(projectRoot,'dist/own-the-night-lan.zip'):path.resolve(base,'.'+(source?requested.slice(4):requested==='/'?'/index.html':requested));
  if(requested!=='/own-the-night-lan.zip'&&!target.startsWith(base+path.sep)){res.writeHead(403);res.end('Invalid path');return;}
  if(!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404);res.end('Not found');return;}
  const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.zip':'application/zip'}[path.extname(target)]||'application/octet-stream';res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-cache'});const stream=fs.createReadStream(target);stream.on('error',()=>res.destroy());stream.pipe(res);
 }catch{res.writeHead(400);res.end('Invalid request');}
});}
