import * as THREE from './vendor/three.js';
export function createTrack(def){
 const points=def.points.map(([x,z])=>new THREE.Vector3(x,0,z));
 const rough=new THREE.CatmullRomCurve3(points,true,'centripetal');
 points.forEach(p=>p.multiplyScalar(def.length/rough.getLength()));
 const curve=new THREE.CatmullRomCurve3(points,true,'centripetal'),length=curve.getLength();
 const sample=d=>{const t=((d%length)+length)%length/length,p=curve.getPointAt(t),v=curve.getTangentAt(t).normalize();return {p,v,right:new THREE.Vector3(-v.z,0,v.x)};};
 const curvature=(d,look=20)=>{const a=sample(d).v,b=sample(d+look).v;return a.angleTo(b)/look*Math.sign(a.x*b.z-a.z*b.x);};
 const count=720,segments=Array.from({length:count+1},(_,i)=>sample(i/count*length).p);
 const project=(x,z,previous=0)=>{let best=Infinity,index=0,ratio=0;for(let i=0;i<count;i++){const a=segments[i],b=segments[i+1],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz))),dist=(x-a.x-dx*t)**2+(z-a.z-dz*t)**2;if(dist<best){best=dist;index=i;ratio=t;}}const wrapped=(index+ratio)/count*length;let d=wrapped+Math.round((previous-wrapped)/length)*length;const frame=sample(d);return {d,lane:(x-frame.p.x)*frame.right.x+(z-frame.p.z)*frame.right.z,offroad:Math.sqrt(best)>11,frame};};
 return {curve,length,points,sample,curvature,project,definition:def};
}
