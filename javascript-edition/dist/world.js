import * as THREE from './three.js';
import {streetLayout} from './street-layout.js';
import {batchWorld} from './batch-world.js';
const standard=c=>new THREE.MeshStandardMaterial({color:c,roughness:.86,flatShading:true});
const glow=c=>new THREE.MeshBasicMaterial({color:c});
export function buildWorld(track){
 const root=new THREE.Group(),def=track.definition,color=def.color;
 let seed=def.id.length*513;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const dark=standard(0x172431),stone=standard(0x354354),ground=standard(def.theme==='city'?0x172332:def.theme==='ridge'?0x263b3d:0x29333e),cream=glow(0xb1c6c4),accent=glow(color);
 const add=(geo,m,x=0,y=0,z=0,parent=root)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);parent.add(o);return o;};
 const box=(w,h,d,m,x,y,z,parent)=>add(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent);
 const instances=(geo,m,items)=>{const o=new THREE.InstancedMesh(geo,m,items.length),dummy=new THREE.Object3D();items.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(p.rx||0,p.angle||0,0);dummy.scale.set(p.sx||1,p.sy||1,p.sz||1);dummy.updateMatrix();o.setMatrixAt(i,dummy.matrix);});root.add(o);return o;};
 add(new THREE.PlaneGeometry(6000,6000),standard(0x102a3a),0,-2,0).rotation.x=-Math.PI/2;
 add(new THREE.CylinderGeometry(660,695,3,16),ground,0,-1.6,0);
 function ribbon(offset,width,m,y){const verts=[],indices=[];for(let i=0;i<=720;i++){const {p,right}=track.sample(i/720*track.length);for(const edge of [offset-width/2,offset+width/2])verts.push(p.x+right.x*edge,y,p.z+right.z*edge);if(i<720){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();const o=add(geo,m);o.material.side=THREE.DoubleSide;}
 ribbon(0,29,stone,.015);ribbon(0,22,standard(0x253440),.09);ribbon(-10.9,.24,cream,.12);ribbon(10.9,.24,cream,.12);
 const dashes=[],curbsA=[],curbsB=[],posts=[],lamps=[],lightPools=[];
 for(let d=0;d<track.length;d+=12){const {p,v}=track.sample(d);dashes.push({x:p.x,y:.13,z:p.z,angle:Math.atan2(v.x,v.z)});}
 for(let d=0,i=0;d<track.length;d+=5,i++){const {p,v,right}=track.sample(d);for(const side of [-1,1])(i%2?curbsA:curbsB).push({x:p.x+right.x*side*11.6,y:.17,z:p.z+right.z*side*11.6,angle:Math.atan2(v.x,v.z)});}
 instances(new THREE.BoxGeometry(.18,.025,3),glow(0xc1b685),dashes);instances(new THREE.BoxGeometry(.85,.18,4.8),stone,curbsA);instances(new THREE.BoxGeometry(.85,.18,4.8),stone,curbsB);
 ribbon(-14,5,stone,.15);ribbon(14,5,stone,.15);
 for(let d=0,i=0;d<track.length;d+=37,i++){const {p,v,right}=track.sample(d),side=i%2?1:-1,x=p.x+right.x*side*14.3,z=p.z+right.z*side*14.3;
   posts.push({x,y:4.6,z});lamps.push({x:x-right.x*side*1.2,y:9.1,z:z-right.z*side*1.2,angle:Math.atan2(v.x,v.z)});
   lightPools.push({x:p.x+right.x*side*5,y:.13,z:p.z,angle:Math.atan2(v.x,v.z)});
 }
 // Lamp meshes are individual breakable props below.
 instances(new THREE.CircleGeometry(9,14),new THREE.MeshBasicMaterial({color:0xffd8a1,transparent:true,opacity:.045,depthWrite:false}),lightPools.map(p=>({...p,rx:-Math.PI/2,sx:.85,sy:1.4})));
 const movingLights=Array.from({length:5},()=>{const l=new THREE.PointLight(def.theme==='city'?color:0xffdab0,36,37,1.45);root.add(l);return l;});
 function updateLights(distance){const nearest=Math.floor(distance/37);movingLights.forEach((l,i)=>{const p=lamps[((nearest+i-2)%lamps.length+lamps.length)%lamps.length];l.position.set(p.x,8.9,p.z);});}
 // Luminous windows use instancing so a whole skyline costs a few draw calls.
 const windows=[],neonWindows=[];
 const roadSamples=Array.from({length:240},(_,i)=>track.sample(i/240*track.length).p);
 const clearRoad=(x,z,r=21)=>roadSamples.every(p=>(p.x-x)**2+(p.z-z)**2>r*r);
 const buildingCount=def.theme==='city'?150:def.theme==='dock'?75:65;
 for(let i=0;i<buildingCount;i++){
   const {p,v,right}=track.sample(rand()*track.length),off=(rand()>.5?1:-1)*(40+rand()*100),x=p.x+right.x*off,z=p.z+right.z*off;if(!clearRoad(x,z,28))continue;
   const h=def.theme==='city'?20+rand()*70:def.theme==='dock'?9+rand()*12:10+rand()*25,w=12+rand()*12,depth=12+rand()*10;
   const b=box(w,h,depth,standard([0x263c50,0x334351,0x353948][i%3]),x,h/2,z);b.rotation.y=Math.atan2(v.x,v.z);
   const building=new THREE.Group();building.position.set(x,0,z);building.rotation.y=b.rotation.y;root.add(building);
   box(w+.3,.22,depth+.3,accent,0,h+.05,0,building);
   for(const side of [-1,1])for(let y=4;y<h-1;y+=3.5)for(let xx=-w/2+2;xx<w/2-1;xx+=2.7){if(rand()<.23)continue;const local=new THREE.Vector3(xx,y,side*(depth/2+.04)).applyAxisAngle(new THREE.Vector3(0,1,0),b.rotation.y);(i%4?windows:neonWindows).push({x:x+local.x,y,z:z+local.z,angle:b.rotation.y});}
   if(def.theme==='dock')for(let j=0;j<3;j++)box(w*.8,.09,.6,glow(0xffd98e),0,3+j*1.5,depth/2+.07,building);
 }
 instances(new THREE.BoxGeometry(1.2,1.6,.07),glow(0xffd39e),windows);instances(new THREE.BoxGeometry(1.2,1.6,.07),accent,neonWindows);
 if(def.theme==='dock'){
   for(let i=0;i<30;i++){const {p,right}=track.sample(track.length*.2+i*19),x=p.x+right.x*35,z=p.z+right.z*35;if(!clearRoad(x,z,22))continue;const h=3+(i%3)*3;box(5,h,11,standard([0x8c5158,0x435977,0x4a746d][i%3]),x,h/2,z);}
   for(const d of [.12,.5,.8]){const {p,right,v}=track.sample(track.length*d),crane=new THREE.Group();crane.position.copy(p).addScaledVector(right,48);crane.rotation.y=Math.atan2(v.x,v.z);root.add(crane);box(1,35,1,stone,-14,17.5,0,crane);box(1,35,1,stone,14,17.5,0,crane);box(48,1,2,stone,0,35,0,crane);box(48,.09,.13,accent,0,35.6,1,crane);}
 }
 if(def.theme==='coast'||def.theme==='ridge')for(let i=0;i<250;i++){
   const {p,right}=track.sample(rand()*track.length),off=(rand()>.5?1:-1)*(25+rand()*100),x=p.x+right.x*off,z=p.z+right.z*off;if(!clearRoad(x,z,19))continue;
   const tree=new THREE.Group();tree.position.set(x,0,z);root.add(tree);const height=7+rand()*9;
   add(new THREE.CylinderGeometry(.3,.55,height,5),stone,0,height/2,0,tree);
   if(def.theme==='ridge'){add(new THREE.ConeGeometry(3.5,height*.8,5),standard(0x274645),0,height*.8,0,tree);add(new THREE.ConeGeometry(2.5,height*.65,5),standard(0x3c5655),0,height*1.15,0,tree);}
   else for(let j=0;j<5;j++){const leaf=add(new THREE.ConeGeometry(2,6,3),standard(0x35594e),Math.sin(j)*2,height,Math.cos(j)*2,tree);leaf.rotation.set(Math.cos(j)*1.1,j,Math.sin(j)*1.1);}
 }
 for(let i=0;i<24;i++){const a=i/24*Math.PI*2,r=850+rand()*100;const m=add(new THREE.ConeGeometry(110+rand()*100,150+rand()*230,5),standard(i%2?0x25334d:0x2d3d54),Math.sin(a)*r,50,Math.cos(a)*r);m.rotation.y=rand()*5;}
 if(def.theme==='ridge'){
   for(const d of [.24,.62]){const {p,v}=track.sample(track.length*d);const tunnel=new THREE.Group();tunnel.position.copy(p);tunnel.rotation.y=Math.atan2(v.x,v.z);root.add(tunnel);for(let i=0;i<5;i++){box(1,8,1,stone,-13,4,i*7,tunnel);box(1,8,1,stone,13,4,i*7,tunnel);box(27,1,1,stone,0,8,i*7,tunnel);box(24,.1,.15,accent,0,7.45,i*7,tunnel);}}
 }
 const stars=[];for(let i=0;i<300;i++){const a=rand()*Math.PI*2,r=800+rand()*300;stars.push(Math.sin(a)*r,250+rand()*650,Math.cos(a)*r);}const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));root.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xd3dfff,size:1.8,sizeAttenuation:false})));
 add(new THREE.SphereGeometry(35,20,14),glow(0xd5e5f5),-580,360,-650);
 const start=track.sample(0),gate=new THREE.Group();gate.position.copy(start.p);gate.rotation.y=Math.atan2(start.v.x,start.v.z);root.add(gate);
 box(.6,7,.6,dark,24,3.5,0,gate);box(12,2,.35,dark,24,7,0,gate);
 const c=document.createElement('canvas');c.width=1024;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#193840';ctx.fillRect(0,0,1024,128);ctx.fillStyle='#d6f2df';ctx.font='bold 55px sans-serif';ctx.textAlign='center';ctx.fillText(def.name.toUpperCase()+' →',512,85);const sign=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)});box(11.8,1.85,.03,sign,24,7,-.19,gate);box(11.8,1.85,.03,sign,24,7,.19,gate);
 const layout=streetLayout(track),palette=[0x394e64,0x685c63,0x4a6263,0x534e63,0x6b604e],shopNames=['NIGHT OWL','GARAGE 24','NOODLES','MARKET','COFFEE','MOTEL','PHARMACY','RECORDS'];
 const blockMaterials=palette.map(standard),windowMat=glow(0xffd1a0),lightColors=[0x6addd4,0xe18edc,0xffc26f];
 const groupedWindows=[],sideWindows=[],breakableModels=new Map();
 for(let i=0;i<layout.props.length;i++){const prop=layout.props[i],g=new THREE.Group();g.position.set(prop.x,0,prop.z);g.rotation.y=prop.heading;root.add(g);if(prop.breakable){g.userData.breakable=true;breakableModels.set(prop.id,{group:g,prop});}
   if(prop.type==='wall'||prop.type==='hedge'){box(prop.w,prop.h,prop.l,prop.type==='hedge'?standard(0x304c3d):blockMaterials[prop.color],0,prop.h/2,0,g);if(prop.type==='wall'){box(prop.w+.2,.18,prop.l+.1,stone,0,prop.h+.09,0,g);for(const z of [-prop.l/2,prop.l/2])box(prop.w+.4,prop.h+.3,.6,stone,0,(prop.h+.3)/2,z,g);}continue;}
   if(prop.type==='streetlamp'){add(new THREE.CylinderGeometry(.12,.18,9,5),dark,0,4.5,0,g);box(3,.17,.5,glow(0xffe0af),-prop.side*1.2,9.1,0,g);box(.9,.18,.5,stone,-prop.side*.4,8.9,0,g);continue;}
   if(prop.type==='crossing'){for(let j=-4;j<=4;j++)box(1.1,.012,4.5,cream,j*2,.14,0,g);continue;}
   if(prop.type==='signal'){box(.18,4.5,.18,dark,0,2.25,0,g);box(.45,1.1,.35,dark,0,4,0,g);for(let j=0;j<3;j++)box(.15,.15,.07,glow(j===(prop.color?0:2)?j===0?0xec5960:0x72c586:0x26383e),0,4.3-j*.3,.2,g);continue;}
   if(prop.type==='tree'){add(new THREE.CylinderGeometry(.23,.5,prop.h,5),stone,0,prop.h/2,0,g);add(new THREE.ConeGeometry(3,prop.h*.7,6),standard(0x304d44),0,prop.h,0,g);continue;}
   if(prop.type==='bench'){box(2,.16,.7,stone,0,.55,0,g);box(2,.5,.15,dark,0,.9,-.3,g);for(const side of [-1,1])box(.13,.6,.15,dark,side*.8,.3,0,g);continue;}
   if(prop.type==='bin'){box(.8,1,.8,dark,0,.5,0,g);box(.9,.15,.9,stone,0,1.05,0,g);continue;}
   if(prop.type==='parked'){box(1.9,.65,4.5,blockMaterials[prop.color],0,.6,0,g);box(1.55,.6,2.2,dark,0,1.2,-.2,g);for(const side of [-1,1])for(const z of [-1.4,1.4]){const w=add(new THREE.CylinderGeometry(.35,.35,.2,10),dark,side*.96,.35,z,g);w.rotation.z=Math.PI/2;}continue;}
   box(prop.w,prop.h,prop.l,blockMaterials[prop.color],0,prop.h/2,0,g);
   if(prop.type==='container'){for(let j=-3;j<=3;j++)box(.08,prop.h,.07,stone,j*.65,prop.h/2,prop.l/2+.04,g);continue;}
   const face=prop.side>0?1:-1,variant=prop.variant;
   // Each facade gets a different roofline and architectural silhouette.
   if(variant===0||prop.type==='cabin'){const roof=add(new THREE.CylinderGeometry(0,prop.w*.76,prop.h*.3,4),standard(0x4a3946),0,prop.h+prop.h*.12,0,g);roof.rotation.y=Math.PI/4;roof.scale.z=prop.l/prop.w;box(.8,2,.8,stone,prop.w*.2,prop.h+1.5,0,g);}
   else if(variant===1){box(prop.w*.72,prop.h*.22,prop.l*.65,blockMaterials[(prop.color+1)%5],0,prop.h*1.11,0,g);box(2,.7,2,dark,0,prop.h*1.25,0,g);}
   else if(variant===2){for(let z=-prop.l/2+1;z<prop.l/2;z+=3){box(1,prop.h,.25,stone,face*(prop.w/2+.1),prop.h/2,z,g);}box(prop.w+.6,.5,prop.l+.6,stone,0,prop.h,0,g);}
   else if(variant===3){for(let y=4;y<prop.h;y+=3.3){box(1.4,.18,prop.l*.7,stone,face*(prop.w/2+.65),y,0,g);box(.08,.75,prop.l*.7,dark,face*(prop.w/2+1.3),y+.4,0,g);}}
   else if(variant===4){box(prop.w+.5,.4,prop.l+.5,stone,0,prop.h+.2,0,g);add(new THREE.CylinderGeometry(1.1,1.1,2.5,8),dark,0,prop.h+1.5,prop.l*.2,g);for(let y=3;y<prop.h;y+=4)box(.12,.35,prop.l+.15,cream,face*(prop.w/2+.12),y,0,g);}
   else{box(prop.w*.48,prop.h*.35,prop.l*.4,blockMaterials[(prop.color+2)%5],-prop.w*.2,prop.h*1.175,0,g);for(let z=-prop.l/2+1;z<prop.l/2;z+=2)box(.8,.25,1.2,stone,face*(prop.w/2+.35),prop.h*.55,z,g);}
   box(.08,2,1.1,dark,face*(prop.w/2+.08),1,prop.l*.25,g);
   if(['shop','cabin'].includes(prop.type)){const canopy=box(2,.2,prop.l*.75,standard([0x8b5260,0x446e6b,0x8b754a][variant%3]),face*(prop.w/2+.9),2.3,0,g);canopy.rotation.z=-face*.12;}

   for(let row=2;row<prop.h-1;row+=2.8)for(let z=-prop.l/2+1;z<prop.l/2-1;z+=2){const local=new THREE.Vector3(face*(prop.w/2+.04),row,z).applyAxisAngle(new THREE.Vector3(0,1,0),prop.heading);sideWindows.push({x:prop.x+local.x,y:row,z:prop.z+local.z,angle:prop.heading+Math.PI/2});}
   if(['shop','cabin','warehouse'].includes(prop.type)){box(.06,1.5,prop.l*.75,glow(lightColors[i%3]),face*(prop.w/2+.06),3.0,0,g);const board=document.createElement('canvas');board.width=512;board.height=96;const pen=board.getContext('2d');pen.fillStyle='#132735';pen.fillRect(0,0,512,96);pen.fillStyle=['#6addd4','#e18edc','#ffc26f'][i%3];pen.font='bold 45px sans-serif';pen.textAlign='center';pen.fillText(shopNames[i%shopNames.length],256,65);const boardMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(board)});const b=box(prop.l*.7,1.25,.035,boardMat,face*(prop.w/2+.11),3.02,0,g);b.rotation.y=face*Math.PI/2;box(.05,2,1.2,dark,face*(prop.w/2+.04),1,0,g);}
 }
 instances(new THREE.BoxGeometry(.8,1.2,.04),windowMat,sideWindows);
 const roadSurface=root.children.find(o=>o.isMesh&&o.geometry.type==='BufferGeometry'&&o.material.color?.getHex()===0x253440);
 function updateProps(broken={},elapsed=0){for(const [id,entry] of breakableModels){const hit=broken?.[id],g=entry.group,p=entry.prop;if(!hit){g.position.set(p.x,0,p.z);g.rotation.set(0,p.heading,0);continue;}const age=Math.max(0,elapsed-hit.time),t=Math.min(1,age/1.1),direction=Math.atan2(hit.vx,hit.vz),distance=Math.min(3.5,Math.hypot(hit.vx,hit.vz)*.045)*t;g.position.set(p.x+Math.sin(direction)*distance,Math.sin(t*Math.PI)*.35,p.z+Math.cos(direction)*distance);const local=direction-p.heading;g.rotation.set(Math.cos(local)*t*1.45,p.heading,-Math.sin(local)*t*1.45);}}
 updateLights(0);batchWorld(root);return {root,updateLights,updateProps,layout,roadSurface,breakableModels};
}
export function disposeWorld(world){world.root.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{m.map?.dispose();m.dispose();});}});}
