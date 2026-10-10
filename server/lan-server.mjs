import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {makeSimulation,stepSimulation,snapshot} from '../src/simulation.js';
const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=path.join(projectRoot,'public');
export function createLanServer(){
 const rooms=new Map(),sessions=new Map();const token=()=>crypto.randomBytes(18).toString('hex');
 const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 const emit=room=>{const data={room:room.code,host:room.host,players:room.players.map(p=>({id:p.id,name:p.name,car:p.car})),state:room.sim?snapshot(room.sim):null,config:room.config};const text='data: '+JSON.stringify(data)+'\n\n';for(const p of room.players)for(const stream of p.streams)stream.write(text);};
 const body=async req=>{let text='';for await(const chunk of req){text+=chunk;if(text.length>10000)throw new Error('Request too large');}return text?JSON.parse(text):{};};
 const server=http.createServer(async(req,res)=>{try{
   const url=new URL(req.url,'http://localhost');
   if(url.pathname==='/api/info')return json(res,200,{lan:true,version:4});
   if(url.pathname.startsWith('/api/')){
     const value=req.method==='POST'?await body(req):{},key=value.token||url.searchParams.get('token');
     if(url.pathname==='/api/create'||url.pathname==='/api/join'){
       let room;if(url.pathname==='/api/create'){const code=crypto.randomBytes(3).toString('hex').toUpperCase();room={code,players:[],config:{map:Math.max(0,Math.min(3,Number(value.map)||0)),weather:['clear','fog','rain','storm','snow'].includes(value.weather)?value.weather:'clear'},sim:null};rooms.set(code,room);}else{room=rooms.get(String(value.room).trim().toUpperCase());if(!room)return json(res,404,{error:'Room not found. Check the code.'});if(room.sim?.mode==='race')return json(res,409,{error:'Race in progress. Join before the next start.'});if(room.players.length>=6)return json(res,409,{error:'Room is full (six players).'});}
       const id=token(),credential=token(),p={id,token:credential,name:String(value.name||'DRIVER').replace(/[<>]/g,'').slice(0,16),car:Math.max(0,Math.min(7,Number(value.car)||0)),input:{},inputAt:0,streams:new Set(),lastSeen:Date.now()};if(!room.players.length)room.host=id;room.players.push(p);sessions.set(credential,{room,p});emit(room);return json(res,200,{token:credential,id,room:room.code,host:room.host});
     }
     const session=sessions.get(key);if(!session)return json(res,403,{error:'Join a room first.'});const {room,p}=session;p.lastSeen=Date.now();
     if(url.pathname==='/api/events'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});res.write(': connected\n\n');p.streams.add(res);emit(room);req.on('close',()=>p.streams.delete(res));return;}
     if(url.pathname==='/api/input'){const i=value.input||{};p.input={steer:Math.max(-1,Math.min(1,Number(i.steer)||0)),gas:!!i.gas,brake:!!i.brake,handbrake:!!i.handbrake,nitro:!!i.nitro,recover:!!i.recover,autopilot:!!i.autopilot};p.inputAt=Date.now();return json(res,200,{ok:true});}
     if(url.pathname==='/api/start'){if(p.id!==room.host)return json(res,403,{error:'Only the host can start.'});room.sim=makeSimulation({...room.config,humans:room.players.map(p=>({id:p.id,name:p.name,car:p.car}))});emit(room);return json(res,200,{ok:true});}
     if(url.pathname==='/api/pause'){if(p.id!==room.host)return json(res,403,{error:'Only the host can pause the room.'});if(room.sim)room.sim.paused=!!value.paused;emit(room);return json(res,200,{ok:true});}
     if(url.pathname==='/api/leave'){room.players=room.players.filter(x=>x!==p);sessions.delete(key);for(const stream of p.streams)stream.end();if(p.id===room.host){room.host=room.players[0]?.id;if(room.sim){room.sim.paused=true;room.sim.mode='finished';}}if(!room.players.length)rooms.delete(room.code);else emit(room);return json(res,200,{ok:true});}
     return json(res,404,{error:'Unknown action.'});
   }
   let requested;try{requested=decodeURIComponent(url.pathname);}catch{return json(res,400,{error:'Invalid path'});}const source=requested.startsWith('/src/'),base=source?path.join(projectRoot,'src'):root;const target=requested==='/afterglow-lan.zip'?path.join(projectRoot,'dist/afterglow-lan.zip'):path.resolve(base,'.'+(source?requested.slice(4):requested==='/'?'/index.html':requested));if(requested!=='/afterglow-lan.zip'&&!target.startsWith(base+path.sep))return json(res,403,{error:'Invalid path'});
   if(!fs.existsSync(target)||!fs.statSync(target).isFile())return json(res,404,{error:'Not found'});const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.zip':'application/zip'}[path.extname(target)]||'application/octet-stream';res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-cache'});fs.createReadStream(target).pipe(res);
 }catch(e){json(res,400,{error:e.message});}});
 let ticks=0;const tick=setInterval(()=>{for(const room of rooms.values()){if(room.sim?.mode==='race'){const inputs={};for(const p of room.players)inputs[p.id]=Date.now()-p.inputAt<1500?p.input:{brake:true};stepSimulation(room.sim,1/60,inputs);}if(ticks%3===0)emit(room);}ticks++;},1000/60);
 server.on('close',()=>{clearInterval(tick);for(const room of rooms.values())for(const p of room.players)for(const stream of p.streams)stream.end();});return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT)||8080;const server=createLanServer();server.listen(port,'0.0.0.0',()=>{console.log(`APEX LAN is running. Open http://localhost:${port} on this computer.`);for(const nic of Object.values(os.networkInterfaces()))for(const a of nic||[])if(a.family==='IPv4'&&!a.internal)console.log(`Other computers on your network: http://${a.address}:${port}`);console.log('Open LAN MULTIPLAYER, create a room, and share the address and room code. Ctrl+C stops the server.');});
}
