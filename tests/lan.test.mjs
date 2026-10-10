import assert from 'node:assert/strict';
import {createLanServer} from '../server/lan-server.mjs';
const server=createLanServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const post=async(route,data)=>{const res=await fetch(base+'/api/'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return {status:res.status,data:await res.json()};};
const controllers=[];
try{
 assert.equal((await (await fetch(base+'/api/info')).json()).lan,true);
 assert.match(await (await fetch(base)).text(),/street-game.js/);
 const host=(await post('create',{name:'HOST',car:0,map:1,weather:'rain'})).data;
 const guest=(await post('join',{name:'GUEST',car:2,room:host.room})).data;
 assert.equal((await post('start',{token:guest.token})).status,403);
 assert.equal((await post('start',{token:host.token})).status,200);
 let packet;
 async function watch(session){const controller=new AbortController();controllers.push(controller);const response=await fetch(base+'/api/events?token='+session.token,{signal:controller.signal});const reader=response.body.getReader();let buffer='';(async()=>{try{while(true){const {value,done}=await reader.read();if(done)break;buffer+=new TextDecoder().decode(value);let end;while((end=buffer.indexOf('\n\n'))>=0){const block=buffer.slice(0,end);buffer=buffer.slice(end+2);if(block.startsWith('data: '))packet=JSON.parse(block.slice(6));}}}catch{}})();}
 await watch(host);await watch(guest);
 const delay=ms=>new Promise(r=>setTimeout(r,ms));
 for(let i=0;i<55;i++){await Promise.all([post('input',{token:host.token,input:{autopilot:true}}),post('input',{token:guest.token,input:{autopilot:true}})]);await delay(100);}
 assert.equal(packet.players.length,2);assert.equal(packet.state.drivers.length,6);assert.equal(packet.state.drivers.filter(d=>d.human).length,2);assert.equal(packet.state.weather,'rain');assert.ok(packet.state.drivers.filter(d=>d.human).every(d=>d.state.speed>1));
 assert.equal((await post('join',{name:'LATE',room:host.room})).status,409);
 await post('pause',{token:host.token,paused:true});await delay(100);const elapsed=packet.state.elapsed;await delay(150);assert.equal(packet.state.elapsed,elapsed);
 await post('pause',{token:host.token,paused:false});await delay(150);assert.ok(packet.state.elapsed>elapsed);
 console.log('PASS: two LAN clients, shared authoritative race, different cars, AI fill, host permissions, input movement, pause/resume and late-join protection');
}finally{for(const c of controllers)c.abort();server.closeAllConnections();await new Promise(r=>server.close(r));}
