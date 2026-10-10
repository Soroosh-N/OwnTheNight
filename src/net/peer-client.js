import {iceServers,connectionKind} from './relay.js';
import {makeSimulation,stepSimulation,snapshot} from '../simulation.js';

const chars='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function randomRoom(){let code='';for(let i=0;i<5;i++)code+=chars[Math.random()*chars.length|0];return code;}
export function cleanRoom(value){const match=String(value||'').match(/#join[-=]?([A-Za-z0-9]+)/i);return (match?match[1]:String(value||'')).trim().replace(/[^A-Za-z0-9]/g,'').toUpperCase();}
export function peerId(code){return 'ownthenight-race-'+cleanRoom(code).toLowerCase();}
export function inviteLink(code,location=globalThis.location){return /^https?:/.test(location?.protocol)?location.origin+location.pathname+'#join-'+cleanRoom(code):'';}
const bounded=(value,max)=>Math.max(0,Math.min(max,Math.floor(Number(value)||0)));
const profile=data=>({name:String(data.name||'DRIVER').replace(/[<>]/g,'').slice(0,16),car:bounded(data.car,7)});
const sanitize=input=>({steer:Math.max(-1,Math.min(1,Number(input?.steer)||0)),gas:!!input?.gas,brake:!!input?.brake,handbrake:!!input?.handbrake,nitro:!!input?.nitro,recover:!!input?.recover,autopilot:!!input?.autopilot});
const messageFor=error=>error?.type==='peer-unavailable'?'No game found with that code.':error?.type==='unavailable-id'?'That code is already in use.':error?.type==='network'||error?.type==='server-error'?'Cannot reach the room service. Check your internet connection.':String(error?.message||error?.type||error);

// PeerJS cloud exchanges connection metadata; game traffic is sent directly
// over reliable, raw WebRTC data channels. The host owns race simulation.
export function createMultiplayerClient(onUpdate,onError,options={}){
 let peer,session=null,role='solo',room=null,hostConnection=null,sim=null,clock=0,accumulator=0,sequence=0,disposed=false,creating=false,pendingReject;
 const links=new Map(),inputs=new Map(),now=options.now||(()=>performance.now());
 const Peer=options.Peer||globalThis.peerjs?.Peer;
 const send=(connection,packet)=>{if(connection?.open&&!(connection.dataChannel?.bufferedAmount>1000000))try{connection.send(JSON.stringify(packet));}catch(error){onError(messageFor(error));}};
 const packet=()=>({room:room.code,host:session.id,players:room.players.map(p=>({...p,route:p.id===session.id?'HOST':links.get(p.id)?.route||'CONNECTING'})),config:room.config,state:sim?snapshot(sim):null});
 function publish(){if(!room||role!=='host')return;const value=packet();onUpdate(value,session);for(const link of links.values())if(link.id)send(link.connection,{t:'state',packet:value});}
 function lost(message){if(disposed)return;onError(message);if(sim)sim.paused=true;}
 function attach(connection){
  const link={connection,id:null,route:'CONNECTING'};links.set(connection,link);
  const greetingTimer=setTimeout(()=>{if(!link.id){links.delete(connection);connection.close();}},10000);
  connection.on('open',async()=>{link.route=await connectionKind(connection.peerConnection);if(!disposed)publish();});
  connection.on('data',raw=>{try{
   if(typeof raw!=='string'||raw.length>20000)return;const value=JSON.parse(raw);
   if(value.t==='hello'&&!link.id){if(sim?.mode==='race'||room.players.length>=6){send(connection,{t:'error',message:sim?.mode==='race'?'Race in progress. Join before the next start.':'Room is full (six players).'});setTimeout(()=>connection.close(),50);return;}
    clearTimeout(greetingTimer);link.id='guest'+(++sequence);links.delete(connection);links.set(link.id,link);room.players.push({id:link.id,...profile(value.profile)});send(connection,{t:'welcome',session:{id:link.id,host:session.id,room:room.code}});publish();return;
   }
   if(!link.id)return;
   if(value.t==='input')inputs.set(link.id,{input:sanitize(value.input),time:now()});
   else if(value.t==='leave')connection.close();
  }catch{onError('Ignored an invalid peer message.');}});
  connection.on('close',()=>{clearTimeout(greetingTimer);links.delete(link.id||connection);inputs.delete(link.id);if(room){room.players=room.players.filter(p=>p.id!==link.id);if(sim){const driver=sim.drivers.find(d=>d.id===link.id);if(driver){driver.human=false;driver.name+=' (AI)';}}}if(!disposed)publish();});
  connection.on('error',error=>onError(messageFor(error)));
 }
 async function openPeer(id){if(!Peer)throw Error('WebRTC multiplayer library is unavailable. Use a current Chrome, Edge or Firefox browser.');const config={debug:0,config:{iceServers:await iceServers()},...(globalThis.OWN_THE_NIGHT_PEER_OPTS||{})};
  return new Promise((resolve,reject)=>{let settled=false;const timer=setTimeout(()=>{if(!settled){settled=true;peer?.destroy();reject(Error('Room service timed out. Check your internet connection.'));}},20000);
   peer=id?new Peer(id,config):new Peer(config);
   peer.on('open',()=>{if(!settled){settled=true;clearTimeout(timer);resolve(peer);}});
   peer.on('error',error=>{if(!settled){settled=true;clearTimeout(timer);reject(Object.assign(Error(messageFor(error)),{type:error.type}));}else{pendingReject?.(Error(messageFor(error)));lost(messageFor(error));}});
   peer.on('disconnected',()=>onError('Room signaling disconnected. Existing racers remain connected; reconnect to invite new racers.'));
  });
 }
 const api={
  get session(){return session;},get role(){return role;},get simulation(){return sim;},get available(){return !!Peer;},
  async detect(){return !!Peer;},
  async create(data){if(creating)throw Error('Already connecting.');creating=true;await api.leave();disposed=false;
   try{let code;for(let attempt=0;attempt<4;attempt++){code=options.code?options.code():randomRoom();try{await openPeer(peerId(code));break;}catch(error){peer?.destroy();if(error.type!=='unavailable-id'||attempt===3)throw error;}}
    role='host';session={id:'host',host:'host',room:code};room={code,players:[{id:'host',...profile(data)}],config:{map:bounded(data.map,3),weather:['clear','fog','rain','storm','snow'].includes(data.weather)?data.weather:'clear'}};peer.on('connection',attach);publish();return session;
   }catch(error){await api.leave();throw error;}finally{creating=false;}
  },
  async join(data){if(creating)throw Error('Already connecting.');const code=cleanRoom(data.room);if(!/^[A-Z0-9]{5}$/.test(code))throw Error('Enter the five-character room code.');creating=true;await api.leave();disposed=false;
   try{await openPeer();role='guest';return await new Promise((resolve,reject)=>{let settled=false;const finish=(error)=>{if(settled)return;settled=true;clearTimeout(timer);pendingReject=null;if(error){peer?.destroy();reject(error);}else resolve(session);};pendingReject=finish;
    const timer=setTimeout(()=>finish(Error('Found the room but could not connect. Try the same Wi-Fi or hotspot, or configure a TURN relay.')),20000);
    hostConnection=peer.connect(peerId(code),{reliable:true,serialization:'raw'});
    hostConnection.on('open',()=>send(hostConnection,{t:'hello',profile:profile(data)}));
    hostConnection.on('data',raw=>{try{if(typeof raw!=='string'||raw.length>1000000)return;const value=JSON.parse(raw);if(value.t==='welcome'){session=value.session;finish();}else if(value.t==='state'&&session)onUpdate(value.packet,session);else if(value.t==='error')finish(Error(value.message));}catch(error){onError(messageFor(error));}});
    hostConnection.on('close',()=>{if(!settled)finish(Error('Host disconnected before joining.'));else lost('Lost connection to host. Leave the room and rejoin.');});hostConnection.on('error',error=>finish(Error(messageFor(error))));
   });}catch(error){await api.leave();throw error;}finally{creating=false;}
  },
  async start(){if(role!=='host')throw Error('Only the host can start.');sim=makeSimulation({...room.config,humans:room.players.map(p=>({...p}))});accumulator=0;clock=0;publish();},
  async pause(paused){if(role!=='host')throw Error('Only the host can pause all racers.');if(sim)sim.paused=!!paused;publish();},
  async send(input){if(!session)return;if(role==='host')inputs.set(session.id,{input:sanitize(input),time:now()});else send(hostConnection,{t:'input',input:sanitize(input)});},
  tick(dt,input){if(role!=='host'||!session)return;inputs.set(session.id,{input:sanitize(input),time:now()});if(!sim){accumulator=0;clock=0;return;}accumulator+=Math.min(dt,.1);while(accumulator>=1/60){const values={};for(const p of room.players){const value=inputs.get(p.id);values[p.id]=value&&now()-value.time<1500?value.input:{brake:true};}stepSimulation(sim,1/60,values);accumulator-=1/60;}clock+=dt;if(clock>=.05){clock=0;publish();}},
  async leave(){disposed=true;pendingReject?.(Error('Connection cancelled.'));pendingReject=null;for(const link of links.values())link.connection.close();links.clear();if(hostConnection){send(hostConnection,{t:'leave'});hostConnection.close();hostConnection=null;}peer?.destroy();peer=null;session=null;room=null;sim=null;role='solo';inputs.clear();accumulator=0;}
 };
 return api;
}
