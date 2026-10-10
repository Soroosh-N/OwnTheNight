// Same connection routes as Emberwake's net/relay.js. Configure your own
// Metered app to improve connectivity on networks that block direct WebRTC.
export const relayConfig={meteredApp:'',meteredKey:''};
export const defaultIceServers=[
 {urls:'stun:stun.l.google.com:19302'},
 {urls:['turn:openrelay.metered.ca:80','turn:openrelay.metered.ca:443','turn:openrelay.metered.ca:443?transport=tcp'],username:'openrelayproject',credential:'openrelayproject'}
];
export function pickRelayRoutes(servers){const routes=servers.flatMap(s=>[].concat(s.urls||s.url||[]).map(url=>({url,username:s.username,credential:s.credential}))),selected=[];
 for(const match of [u=>/^turn:.*:80(\?|$)/.test(u)&&!u.includes('transport=tcp'),u=>/^turn:.*:443\?transport=tcp/.test(u),u=>/^turns:/.test(u)]){const route=routes.find(r=>match(r.url)&&!selected.includes(r));if(route)selected.push(route);}
 for(const route of routes)if(selected.length<3&&/^turns?:/.test(route.url)&&!selected.includes(route))selected.push(route);
 return selected.map(r=>({urls:r.url,username:r.username,credential:r.credential}));
}
let cache;
export async function iceServers(){if(cache&&Date.now()-cache.time<30*60*1000)return cache.servers;let servers=defaultIceServers;
 if(relayConfig.meteredApp&&relayConfig.meteredKey){try{const response=await fetch('https://'+relayConfig.meteredApp+'.metered.live/api/v1/turn/credentials?apiKey='+encodeURIComponent(relayConfig.meteredKey));if(response.ok){const data=await response.json(),routes=Array.isArray(data)?pickRelayRoutes(data):[];if(routes.length)servers=[defaultIceServers[0],...routes];}}catch{console.warn('Relay credentials unavailable; using default connection routes.');}}
 cache={time:Date.now(),servers};return servers;
}
export async function connectionKind(pc){try{const stats=await pc.getStats();let pair;stats.forEach(s=>{if(s.type==='transport'&&s.selectedCandidatePairId)pair=stats.get(s.selectedCandidatePairId);});if(!pair)stats.forEach(s=>{if(s.type==='candidate-pair'&&(s.selected||s.nominated)&&s.state==='succeeded')pair=pair||s;});if(!pair)return 'CONNECTING';return [stats.get(pair.localCandidateId),stats.get(pair.remoteCandidateId)].some(c=>c?.candidateType==='relay')?'RELAY':'DIRECT';}catch{return 'CONNECTING';}}
