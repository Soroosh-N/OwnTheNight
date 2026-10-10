import {cars,maps} from './catalog.js';
import {createTrack} from './track.js';
import {weatherPresets} from './weather.js';
import {createState,drive,carContact,obstacleContact} from './free-driving.js';
import {streetLayout} from './street-layout.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),wrap=x=>Math.atan2(Math.sin(x),Math.cos(x));
export const profiles=[{name:'SABLE',skill:'EXPERT',reaction:.06,precision:.995,pace:1.03,boostAt:20},{name:'ROOK',skill:'EXPERT',reaction:.085,precision:.98,pace:1.0,boostAt:24},{name:'JUNO',skill:'HARD',reaction:.10,precision:.96,pace:.98,boostAt:28},{name:'MILO',skill:'HARD',reaction:.13,precision:.92,pace:.94,boostAt:35},{name:'FINCH',skill:'NORMAL',reaction:.18,precision:.86,pace:.9,boostAt:42}];
export function botInput(driver,sim){const s=driver.state,p=driver.profile||profiles[1],track=sim.track;
 const lookAhead=clamp(10+s.speed*.35,12,39),near=track.curvature(driver.d+8);let curve=0;for(let ahead=0;ahead<=Math.max(45,s.speed*1.2);ahead+=10)curve=Math.max(curve,Math.abs(track.curvature(driver.d+ahead,7)));
 let lane=Math.sign(near)*1.2+Math.sin(sim.elapsed*.4+driver.slot)*(1-p.precision)*2;
 let blocked=false;for(const other of sim.drivers){if(other===driver||other.finished)continue;const gap=other.d-driver.d;if(gap>0&&gap<30&&Math.abs(other.state.lane-s.lane)<2.8){lane=other.state.lane+(s.lane>=other.state.lane?4:-4);blocked=gap<5&&Math.abs(s.lane-other.state.lane)<2.2;}}
 lane=clamp(lane,-7,7);const gateD=driver.nextGate*track.length/32,targetD=driver.d>gateD+30?gateD:driver.d+lookAhead,target=track.sample(targetD),tx=target.p.x+target.right.x*lane,tz=target.p.z+target.right.z*lane,desired=Math.atan2(tx-s.x,tz-s.z),error=wrap(desired-s.heading);
 const rate=-.47/(1+s.speed/9)*Math.max(s.speed,12)/(driver.spec.length*.59),steer=clamp((2*Math.max(s.speed,12)*Math.sin(error)/lookAhead+s.slip*1.5)/rate,-1,1);
 const availableGrip=driver.spec.grip*sim.weather.grip;
 const cornerSpeed=curve>.001?Math.sqrt(32*availableGrip/curve)*p.pace:driver.spec.max*.93+20;
 let safe=Math.min(driver.spec.max*.93+20,Math.max(12,cornerSpeed));if(Math.abs(error)>.6)safe=Math.min(safe,Math.max(12,24/Math.abs(error)));if(Math.abs(s.lane)>9)safe=Math.min(safe,22);
 const brake=s.speed>safe+1||blocked;
 const nitro=!brake&&!s.offroad&&curve<.004&&!s.nitroLocked&&(s.boosting?s.nitro>0:s.nitro>p.boostAt);
 return {steer,gas:!brake,brake,handbrake:false,nitro};
}
export function makeSimulation(config={}){
 const track=createTrack(maps[config.map||0]),weather=weatherPresets.find(w=>w.id===config.weather)||weatherPresets[0],layout=streetLayout(track),humans=config.humans||[{id:'local',name:'YOU',car:config.car||0}];
 const drivers=[];for(let slot=0;slot<6;slot++){const human=humans[slot],profile=human?profiles[2]:profiles[Math.max(0,slot-humans.length)],spec=cars[human?.car??[4,3,2,1,5][Math.max(0,slot-humans.length)%5]],d=-Math.floor(slot/2)*8,lane=slot%2?3.3:-3.3;
   drivers.push({id:human?.id||'ai'+slot,name:human?.name||profile.name,spec,state:createState(track,d,lane),human:!!human,profile,slot,d,checkpoint:0,nextGate:1,lapTimes:[],lapStart:0,finished:null,reactionClock:0,input:{gas:true},nitroSeconds:0,recoverCooldown:0});
 }
 return {track,weather,layout,drivers,elapsed:0,countdown:3.5,mode:'race',paused:false,contacts:0,config};
}
export function resetToRoad(sim,driver){if(driver.recoverCooldown>0)return;const d=driver.checkpoint*sim.track.length/32,damage=driver.state.damage,impacts=driver.state.impacts;driver.state=createState(sim.track,d,driver.slot%2?3.3:-3.3);driver.state.damage=damage;driver.state.impacts=impacts;driver.d=d;driver.recoverCooldown=5;}
export function stepSimulation(sim,dt,inputs={}){if(sim.mode!=='race'||sim.paused)return;if(sim.countdown>0){sim.countdown-=dt;return;}sim.elapsed+=dt;
 for(const driver of sim.drivers){if(driver.finished!=null)continue;driver.recoverCooldown=Math.max(0,driver.recoverCooldown-dt);
   let input=inputs[driver.id]||{};if(!driver.human||input.autopilot){driver.reactionClock-=dt;if(driver.reactionClock<=0){driver.input=botInput(driver,sim);driver.reactionClock=driver.profile?.reaction||.08;}input=driver.input;}
   if(input.recover){resetToRoad(sim,driver);input={};}drive(driver.state,input,dt,driver.spec,sim.weather,Math.abs(driver.state.lane)>11);
   const p=sim.track.project(driver.state.x,driver.state.z,driver.d);driver.d=p.d;driver.state.lane=p.lane;driver.state.yaw=wrap(Math.atan2(p.frame.v.x,p.frame.v.z)-driver.state.heading);
   if(driver.state.boosting)driver.nitroSeconds+=dt;
   for(const obstacle of sim.layout.obstacles){if(Math.abs(driver.state.x-obstacle.x)>obstacle.w+5||Math.abs(driver.state.z-obstacle.z)>obstacle.l+5)continue;if(obstacleContact(driver,obstacle))sim.contacts++;}
   const gateD=driver.nextGate*sim.track.length/32,gate=sim.track.sample(gateD),dx=driver.state.x-gate.p.x,dz=driver.state.z-gate.p.z;
   if(Math.hypot(dx,dz)<29&&driver.d>gateD-27){driver.checkpoint=driver.nextGate;driver.nextGate++;if(driver.checkpoint%32===0){driver.lapTimes.push(sim.elapsed-driver.lapStart);driver.lapStart=sim.elapsed;if(driver.checkpoint>=96){driver.finished=sim.elapsed;driver.state.boosting=false;}}}
 }
 for(let i=0;i<sim.drivers.length;i++)for(let j=i+1;j<sim.drivers.length;j++)if(!sim.drivers[i].finished&&!sim.drivers[j].finished&&carContact(sim.drivers[i],sim.drivers[j]))sim.contacts++;
 if(sim.drivers.filter(d=>d.human).every(d=>d.finished!=null))sim.mode='finished';
}
export function standings(sim){return sim.drivers.slice().sort((a,b)=>{if(a.finished!=null&&b.finished!=null)return a.finished-b.finished;if(a.finished!=null)return -1;if(b.finished!=null)return 1;return (b.checkpoint-a.checkpoint)||(b.d-a.d);});}
export function snapshot(sim){return {map:maps.indexOf(sim.track.definition),weather:sim.weather.id,elapsed:sim.elapsed,countdown:sim.countdown,mode:sim.mode,paused:sim.paused,contacts:sim.contacts,drivers:sim.drivers.map(d=>({id:d.id,name:d.name,car:cars.indexOf(d.spec),human:d.human,skill:d.human?'PLAYER':d.profile.skill,slot:d.slot,d:d.d,state:d.state,checkpoint:d.checkpoint,nextGate:d.nextGate,lapTimes:d.lapTimes,finished:d.finished,nitroSeconds:d.nitroSeconds,recoverCooldown:d.recoverCooldown}))};}
