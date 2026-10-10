import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createMultiplayerClient,cleanRoom,peerId,inviteLink} from '../src/net/peer-client.js';
import {defaultIceServers,pickRelayRoutes,connectionKind} from '../src/net/relay.js';
const peers=new Map(),constructed=[],connections=[];let next=0;
class Connection extends EventEmitter{
 constructor(){super();this.open=false;this.peerConnection={getStats:async()=>new Map([['pair',{type:'candidate-pair',selected:true,state:'succeeded',localCandidateId:'local',remoteCandidateId:'remote'}],['local',{candidateType:'host'}],['remote',{candidateType:'srflx'}]])};this.dataChannel={bufferedAmount:0};}
 send(value){assert.equal(typeof value,'string');queueMicrotask(()=>this.other?.emit('data',value));}
 close(){if(this.closed)return;this.closed=true;this.open=false;this.emit('close');if(this.other&&!this.other.closed)this.other.close();}
}
class Peer extends EventEmitter{
 constructor(id,opts){super();if(typeof id==='object'){opts=id;id='random'+(++next);}this.id=id;this.opts=opts;this.links=[];constructed.push(this);queueMicrotask(()=>{if(peers.has(id)){this.emit('error',{type:'unavailable-id'});return;}peers.set(id,this);this.emit('open',id);});}
 connect(id,opts){connections.push({id,opts});const local=new Connection(),remote=new Connection();local.other=remote;remote.other=local;this.links.push(local);queueMicrotask(()=>{const destination=peers.get(id);if(!destination){this.emit('error',{type:'peer-unavailable'});return;}destination.links.push(remote);destination.emit('connection',remote);local.open=remote.open=true;remote.emit('open');local.emit('open');});return local;}
 destroy(){if(peers.get(this.id)===this)peers.delete(this.id);for(const c of this.links)c.close();}
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
let time=0,hostPacket,guestPacket;const errors=[];
const host=createMultiplayerClient(p=>hostPacket=p,e=>errors.push(e),{Peer,code:()=> 'K7QFM',now:()=>time});
const guest=createMultiplayerClient(p=>guestPacket=p,e=>errors.push(e),{Peer,now:()=>time});
try{
 await host.create({name:'HOST',car:0,map:1,weather:'rain'});
 assert.equal(host.session.room,'K7QFM');assert.equal(constructed[0].id,peerId('K7QFM'));assert.deepEqual(constructed[0].opts.config.iceServers,defaultIceServers);
 await guest.join({name:'FRIEND',car:2,room:'https://example.com/#join-K7QFM'});await flush();
 assert.equal(hostPacket.players.length,2);assert.equal(guestPacket.players.length,2);assert.equal(hostPacket.players[1].route,'DIRECT');
 assert.deepEqual(connections[0].opts,{reliable:true,serialization:'raw'});
 const extras=[];for(let i=0;i<4;i++){const racer=createMultiplayerClient(()=>{},()=>{},{Peer});await racer.join({room:'K7QFM',name:'EXTRA'+i});extras.push(racer);}await flush();assert.equal(hostPacket.players.length,6);
 const overflow=createMultiplayerClient(()=>{},()=>{},{Peer});await assert.rejects(overflow.join({room:'K7QFM'}),/Room is full/);await overflow.leave();for(const racer of extras)await racer.leave();await flush();assert.equal(hostPacket.players.length,2);
 await assert.rejects(guest.start(),/Only the host/);await assert.rejects(guest.pause(true),/Only the host/);
 await host.start();await flush();assert.equal(guestPacket.state.drivers.filter(d=>d.human).length,2);assert.equal(guestPacket.state.drivers.length,6);assert.equal(guestPacket.state.weather,'rain');
 await guest.send({steer:999,gas:true});await flush();host.tick(.05,{});await flush();assert.ok(Math.abs(host.simulation.drivers[1].state.steering)<=1);
 for(let i=0;i<360;i++){time+=1000/60;await guest.send({autopilot:true});await flush();host.tick(1/60,{autopilot:true});}await flush();
 assert.ok(guestPacket.state.drivers.filter(d=>d.human).every(d=>d.state.speed>1));
 assert.deepEqual(guestPacket.state,hostPacket.state,'Guest receives host-owned simulation');
 await host.pause(true);await flush();const elapsed=guestPacket.state.elapsed;for(let i=0;i<20;i++)host.tick(1/60,{});await flush();assert.equal(guestPacket.state.elapsed,elapsed);assert.equal(guestPacket.state.paused,true);
 await host.pause(false);host.tick(.1,{});await flush();assert.ok(guestPacket.state.elapsed>elapsed);
 const obstacle=host.simulation.layout.obstacles.find(o=>o.breakable),driver=host.simulation.drivers[0];driver.state.x=obstacle.x;driver.state.z=obstacle.z;driver.state.vx=10;driver.state.vz=0;host.tick(.1,{});await flush();assert.ok(guestPacket.state.brokenProps[obstacle.id]);
 const late=createMultiplayerClient(()=>{},()=>{},{Peer});await assert.rejects(late.join({room:'K7QFM',name:'LATE'}),/Race in progress/);await late.leave();
 await guest.leave();await flush();assert.equal(hostPacket.players.length,1);assert.equal(host.simulation.drivers[1].human,false,'Disconnected driver becomes AI');
 const missing=createMultiplayerClient(()=>{},()=>{},{Peer});await assert.rejects(missing.join({room:'ABCDE'}),/No game found/);await missing.leave();
 assert.equal(cleanRoom('https://a.test/#join-k7qfm'),'K7QFM');assert.equal(inviteLink('K7QFM',{protocol:'file:'}),'');assert.equal(inviteLink('K7QFM',{protocol:'https:',origin:'https://a.test',pathname:'/game/'}),'https://a.test/game/#join-K7QFM');
 const servers=pickRelayRoutes([{urls:['turn:x:80','turn:x:443?transport=tcp','turns:x:443','turn:x:443'],username:'u',credential:'c'}]);assert.equal(servers.length,3);assert.ok(servers.some(s=>s.urls.startsWith('turns:')));
 assert.equal(await connectionKind({getStats:async()=>new Map([['p',{type:'candidate-pair',selected:true,state:'succeeded',localCandidateId:'l'}],['l',{candidateType:'relay'}]])}),'RELAY');
 assert.deepEqual(errors,[]);
 console.log('PASS: PeerJS signaling IDs, reliable raw WebRTC messages, two-browser handshake, host authority, finite input rules, pause/resume, damage sync, disconnect recovery, invite links and TURN route detection');
}finally{await guest.leave();await host.leave();}
