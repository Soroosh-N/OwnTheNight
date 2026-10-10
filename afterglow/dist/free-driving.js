const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),wrap=x=>Math.atan2(Math.sin(x),Math.cos(x));
export function createState(track,d=0,lane=0){const {p,v,right}=track.sample(d);return {x:p.x+right.x*lane,z:p.z+right.z*lane,heading:Math.atan2(v.x,v.z),vx:0,vz:0,speed:0,lane,yaw:0,slip:0,lateral:0,steering:0,yawRate:0,nitro:100,nitroLocked:false,boosting:false,handbraking:false,drifting:false,roll:0,pitch:0,heave:0,damage:{front:0,rear:0,left:0,right:0},impacts:[],offroad:false,contact:0};}
export function drive(s,input,dt,car,weather,offroad=false){
 const forward={x:Math.sin(s.heading),z:Math.cos(s.heading)},right={x:-forward.z,z:forward.x};let longitudinal=s.vx*forward.x+s.vz*forward.z,lateral=s.vx*right.x+s.vz*right.z;
 const oldSpeed=longitudinal,grip=car.grip*weather.grip*(offroad?.52:1);
 s.steering+=(clamp(input.steer||0,-1,1)-s.steering)*(1-Math.exp(-dt*9));s.handbraking=!!input.handbrake;
 if(!input.nitro&&s.nitro>=15)s.nitroLocked=false;if(s.nitro<=0)s.nitroLocked=true;
 s.boosting=!!input.nitro&&!s.nitroLocked&&s.nitro>0&&longitudinal>8&&!s.handbraking;
 const acceleration=(input.gas?car.accel: -Math.sign(longitudinal)*2.5)+(s.boosting?9:0);
 longitudinal+=acceleration*dt;
 if(input.brake){if(longitudinal>1)longitudinal=Math.max(0,longitudinal-34*dt);else longitudinal=Math.max(-12,longitudinal-12*dt);}
 if(s.handbraking)longitudinal*=Math.exp(-dt*.24);
 const limit=car.max*.93+(s.boosting?20:0);longitudinal=clamp(longitudinal,-12,limit);longitudinal*=Math.exp(-dt*(offroad?.32:.009));
 // Heading is integrated in world space. There is no road-tangent alignment,
 // curve speed clamp, lateral boundary, or invisible automatic steering.
 const steerAngle=.47/(1+Math.abs(longitudinal)/9);
 const mechanicalRate=-s.steering*longitudinal/(car.length*.59)*Math.tan(steerAngle)*(s.handbraking?1.8:1),tractionRate=grip*40/Math.max(12,Math.abs(longitudinal));
 const targetRate=s.handbraking?mechanicalRate:clamp(mechanicalRate,-tractionRate,tractionRate);
 s.yawRate+=(targetRate-s.yawRate)*(1-Math.exp(-dt*(s.handbraking?6:9)*grip));
 s.heading=wrap(s.heading+s.yawRate*dt);
 // Inertia keeps travel direction separate from body heading; tire grip pulls
 // sideways velocity down, more slowly on a loose, wet, or handbraked rear.
 const nf={x:Math.sin(s.heading),z:Math.cos(s.heading)},nr={x:-nf.z,z:nf.x};
 const oldWorld={x:forward.x*longitudinal+right.x*lateral,z:forward.z*longitudinal+right.z*lateral};
 longitudinal=oldWorld.x*nf.x+oldWorld.z*nf.z;lateral=oldWorld.x*nr.x+oldWorld.z*nr.z;
 const energy=longitudinal*longitudinal+lateral*lateral;lateral*=Math.exp(-dt*(s.handbraking?.5:8.5)*grip);
 longitudinal=Math.sign(longitudinal||1)*Math.sqrt(Math.max(0,energy-lateral*lateral));
 s.vx=nf.x*longitudinal+nr.x*lateral;s.vz=nf.z*longitudinal+nr.z*lateral;s.x+=s.vx*dt;s.z+=s.vz*dt;s.speed=Math.hypot(s.vx,s.vz);s.lateral=lateral;s.slip=Math.atan2(lateral,Math.max(1,Math.abs(longitudinal)));s.drifting=s.speed>12&&Math.abs(s.slip)>.10;
 if(s.boosting){s.nitro=Math.max(0,s.nitro-28*dt);if(!s.nitro){s.boosting=false;s.nitroLocked=true;}}else if(!input.nitro)s.nitro=Math.min(100,s.nitro+(s.drifting?18:6)*dt);
 s.roll+=(clamp(-s.yawRate*s.speed*.0025,-.11,.11)-s.roll)*(1-Math.exp(-dt*8));s.pitch+=(clamp(-(longitudinal-oldSpeed)/dt*.002,-.08,.1)-s.pitch)*(1-Math.exp(-dt*8));s.contact=Math.max(0,s.contact-dt*4);s.heave=Math.abs(s.roll)*.15+s.contact*.03;s.offroad=offroad;
}
export function recordImpact(s,car,wx,wz,severity){if(severity<1.3)return;const dx=wx-s.x,dz=wz-s.z,localX=-(dx*Math.cos(s.heading)-dz*Math.sin(s.heading)),localZ=dx*Math.sin(s.heading)+dz*Math.cos(s.heading);const zone=Math.abs(localZ)/(car.length/2)>Math.abs(localX)/(car.width/2)?(localZ>0?'front':'rear'):(localX>0?'right':'left');
 s.damage[zone]=Math.min(1,s.damage[zone]+clamp(severity/55,.025,.24));s.impactSerial=(s.impactSerial||0)+1;s.impacts.push({id:s.impactSerial,x:-localX,y:.65,z:localZ,zone,amount:s.damage[zone]});if(s.impacts.length>20)s.impacts.shift();s.contact=1;
}
function shape(d){const s=d.state,f={x:Math.sin(s.heading),z:Math.cos(s.heading)},r={x:-f.z,z:f.x};return {x:s.x,z:s.z,f,r,halfL:d.spec.length/2,halfW:d.spec.width/2};}
const dot=(a,b)=>a.x*b.x+a.z*b.z;
export function carContact(a,b){const A=shape(a),B=shape(b),delta={x:B.x-A.x,z:B.z-A.z};if(Math.hypot(delta.x,delta.z)>6.5)return false;let overlap=Infinity,n;
 for(const axis of [A.f,A.r,B.f,B.r]){const extent=d=>Math.abs(dot(d.f,axis))*d.halfL+Math.abs(dot(d.r,axis))*d.halfW,depth=extent(A)+extent(B)-Math.abs(dot(delta,axis));if(depth<=0)return false;if(depth<overlap){overlap=depth;const side=dot(delta,axis)>0?1:-1;n={x:axis.x*side,z:axis.z*side};}}
 const inverseA=1/a.spec.mass,inverseB=1/b.spec.mass,total=inverseA+inverseB,move=Math.min(overlap+.01,2);
 a.state.x-=n.x*move*inverseA/total;a.state.z-=n.z*move*inverseA/total;b.state.x+=n.x*move*inverseB/total;b.state.z+=n.z*move*inverseB/total;
 const closing=(b.state.vx-a.state.vx)*n.x+(b.state.vz-a.state.vz)*n.z;
 if(closing<0){const impulse=Math.min(-closing*1.12/total,8/Math.max(inverseA,inverseB));for(const [d,inv,sign] of [[a,inverseA,-1],[b,inverseB,1]]){d.state.vx+=n.x*impulse*inv*sign;d.state.vz+=n.z*impulse*inv*sign;d.state.yawRate+=clamp(dot(n,shape(d).r)*sign*impulse*inv*.025,-.15,.15);}
   const point={x:(A.x+B.x)/2,z:(A.z+B.z)/2};recordImpact(a.state,a.spec,point.x,point.z,-closing);recordImpact(b.state,b.spec,point.x,point.z,-closing);
 }return true;
}
export function obstacleContact(driver,obstacle){const s=driver.state,dx=s.x-obstacle.x,dz=s.z-obstacle.z,c=Math.cos(obstacle.heading||0),sn=Math.sin(obstacle.heading||0),lx=dx*c-dz*sn,lz=dx*sn+dz*c,qx=clamp(lx,-obstacle.w/2,obstacle.w/2),qz=clamp(lz,-obstacle.l/2,obstacle.l/2),ex=lx-qx,ez=lz-qz,dist=Math.hypot(ex,ez),radius=driver.spec.width*.56;if(dist>=radius)return false;
 const nx=dist>0?ex/dist:Math.abs(lx)/(obstacle.w/2)>Math.abs(lz)/(obstacle.l/2)?Math.sign(lx)||1:0,nz=dist>0?ez/dist:nx?0:Math.sign(lz)||1,wx=nx*c+nz*sn,wz=-nx*sn+nz*c,depth=radius-dist+.02;
 s.x+=wx*depth;s.z+=wz*depth;const incoming=s.vx*wx+s.vz*wz;if(incoming<0){recordImpact(s,driver.spec,s.x-wx*radius,s.z-wz*radius,-incoming);s.vx-=wx*incoming*1.12;s.vz-=wz*incoming*1.12;s.vx*=.82;s.vz*=.82;}return true;
}
