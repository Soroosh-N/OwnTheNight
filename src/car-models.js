import * as THREE from './vendor/three.js';
const material=color=>new THREE.MeshStandardMaterial({color,roughness:.48,metalness:.25,flatShading:true});
function shell(sections,mat,parent){const vertices=[],indices=[];
 for(const [z,w,b,t] of sections)vertices.push(-w,b,z,w,b,z,w,t,z,-w,t,z);
 for(let i=0;i<sections.length-1;i++)for(let j=0;j<4;j++){const a=i*4+j,b=i*4+(j+1)%4,c=(i+1)*4+j,d=(i+1)*4+(j+1)%4;indices.push(a,c,b,b,c,d);}
 indices.push(0,1,2,0,2,3);const e=(sections.length-1)*4;indices.push(e,e+2,e+1,e,e+3,e+2);
 for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const m=new THREE.Mesh(geometry,mat);parent.add(m);return m;
}
export function makeCar(spec){
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);const paint=material(spec.color),accent=material(spec.accent),black=material(0x111c29),glass=material(0x193344),chrome=material(0x9cbed1);
 const w=spec.width/2,L=spec.length/2,h=spec.height;
 const add=(geo,m,x,y,z,parent=body)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);parent.add(o);return o;};
 const box=(W,H,D,m,x,y,z,parent)=>add(new THREE.BoxGeometry(W,H,D),m,x,y,z,parent);
 const oval=(W,H,D,m,x,y,z)=>{const o=add(new THREE.SphereGeometry(1,14,8),m,x,y,z);o.scale.set(W,H,D);return o;};
 const wing=(height,width=w*2.15)=>{box(width,.12,.48,accent,0,height,-L+.18);box(.1,.35,.12,black,-w*.65,height-.2,-L+.2);box(.1,.35,.12,black,w*.65,height-.2,-L+.2);};
 const cabin=(front,rear,top,roofWidth)=>shell([[rear,w*.88,.82,.85],[rear+.36,roofWidth,.82,top],[front-.36,roofWidth,.82,top],[front,w*.82,.82,.92]],glass,body);
 const front=spec.style;
 if(front==='muscle'){
   shell([[-L,w,.35,.93],[-1.4,w,.35,1.03],[.6,w,.35,1.02],[L,w*.91,.38,.91]],paint,body);
   cabin(.45,-1.6,h,.75);box(1.5,.09,1.05,paint,0,h+.01,-.52);
   for(const x of [-.29,.29]){box(.22,.025,2,accent,x,1.04,1.24);box(.22,.02,1.03,accent,x,h+.06,-.52);}
   box(w*1.6,.28,.07,black,0,.72,L+.015);box(.55,.12,.6,black,0,1.07,1.0);
   for(const side of [-1,1])for(let i=0;i<3;i++)box(.1,.3,.07,new THREE.MeshBasicMaterial({color:0xff374e}),side*(.58+i*.15),.8,-L-.03);
   wing(1.12,w*1.7);
 }else if(front==='hyper'){
   shell([[-L,w*.86,.35,.94],[-1.35,w,.32,1.03],[.65,w,.32,.94],[L,w*.81,.4,.74]],paint,body);
   oval(w*.96,.34,1.8,accent,0,.82,-.3);oval(.85,.34,1.15,glass,0,.88,-.35);oval(.75,.09,.78,paint,0,h-.02,-.5);
   box(.53,.53,.08,chrome,0,.65,L+.04);box(.4,.43,.11,black,0,.66,L+.09);
   for(const side of [-1,1]){const ring=add(new THREE.TorusGeometry(.61,.065,5,18,Math.PI*1.5),chrome,side*(w+.018),.85,-.12);ring.rotation.y=Math.PI/2;ring.scale.set(1,.88,1);box(.07,.25,.6,black,side*w,.67,-.7);}
   box(w*1.65,.06,.06,new THREE.MeshBasicMaterial({color:0xff344c}),0,.92,-L-.07);wing(1.12,w*1.8);
 }else if(front==='f40'){
   shell([[-L,w*.99,.32,.86],[-.9,w,.32,.95],[.7,w,.32,.83],[L,w*.8,.38,.53]],paint,body);
   cabin(.75,-.8,h,.72);box(1.44,.08,.9,paint,0,h+.02,-.12);
   for(let i=0;i<7;i++)box(1.5,.06,.07,black,0,1.0,-.95-i*.14);
   for(const side of [-1,1]){const pop=box(.47,.25,.4,paint,side*.64,.85,1.35);pop.rotation.x=-.15;box(.35,.17,.045,new THREE.MeshBasicMaterial({color:0xe7f4ff}),side*.64,.86,1.58);box(.07,.2,.6,black,side*w,.65,-.35);}
   wing(1.55,w*2.22);box(w*1.6,.2,.05,black,0,.5,L+.02);
 }else if(front==='wedge'){
   shell([[-L,w*.9,.32,.82],[-1.4,w,.3,.99],[.5,w*.96,.3,.84],[L,w*.67,.4,.5]],paint,body);
   cabin(.76,-1.2,h,.72);box(1.43,.09,1.05,paint,0,h+.02,-.35);
   for(const side of [-1,1]){shell([[-1.25,.06,.56,.89],[.05,.06,.42,.62]],black,body).position.x=side*w;const intake=box(.05,.36,.75,black,side*w,.68,-.78);intake.rotation.z=side*.25;for(let i=0;i<3;i++)box(.2,.06,.03,new THREE.MeshBasicMaterial({color:0xff294e}),side*(.46+i*.21),.78,-L-.06);}
   for(let i=0;i<4;i++)box(1.1,.05,.15,black,0,.98,-1.0-i*.2);wing(1.12);
 }else if(front==='porsche'){
   oval(w,.45,L,paint,0,.7,0);oval(w*.91,.39,1.1,paint,0,.88,-1.05);oval(.76,.39,1.1,glass,0,.97,-.34);oval(.7,.12,.72,paint,0,h-.04,-.3);
   for(const side of [-1,1]){oval(.3,.27,.66,paint,side*.69,.97,1.34);const lamp=add(new THREE.CylinderGeometry(.22,.22,.06,14),new THREE.MeshBasicMaterial({color:0xe9f6ff}),side*.69,1.12,L-.18);lamp.rotation.x=Math.PI/2;}
   wing(1.17,w*1.83);box(w*1.55,.07,.04,new THREE.MeshBasicMaterial({color:0xff3450}),0,.86,-L-.01);
 }else if(front==='skyline'){
   shell([[-L,w,.38,1.01],[-1.35,w,.35,1.04],[.9,w,.35,1.02],[L,w*.93,.38,.86]],paint,body);
   cabin(.79,-1.26,h,.79);box(1.58,.08,1.25,paint,0,h+.02,-.22);wing(1.58,w*2.12);
   for(const side of [-1,1])for(const off of [0,.3]){const lamp=add(new THREE.CylinderGeometry(off?.12:.16,off?.12:.16,.06,12),new THREE.MeshBasicMaterial({color:0xff3550}),side*(.43+off),.85,-L-.04);lamp.rotation.x=Math.PI/2;}
   box(1.38,.2,.045,black,0,.75,L+.04);box(.3,.035,.04,chrome,0,.75,L+.07);
 }else if(front==='bmw'){
   shell([[-L,w,.36,1.0],[-1.1,w,.34,1.04],[1.0,w,.34,1.0],[L,w*.92,.4,.82]],paint,body);
   cabin(.9,-1.28,h,.77);box(1.53,.09,1.21,paint,0,h+.015,-.2);
   for(const side of [-1,1]){box(.22,.23,.06,chrome,side*.15,.81,L+.03);box(.15,.17,.08,black,side*.15,.82,L+.08);box(.37,.19,.05,new THREE.MeshBasicMaterial({color:0xff3852}),side*.66,.91,-L-.03);}
   box(.22,.025,1.35,accent,.27,1.045,1.2);box(.1,.025,1.35,material(0x314edb),.1,1.045,1.2);wing(1.13,w*1.7);
 }else{
   oval(w,.4,L,paint,0,.67,0);oval(.73,.32,1.0,glass,0,.92,-.15);oval(.64,.08,.58,paint,0,h-.02,-.25);
   for(const side of [-1,1]){box(.43,.23,.37,paint,side*.61,.93,1.38);box(.31,.15,.04,new THREE.MeshBasicMaterial({color:0xeaf6ff}),side*.61,.94,1.6);oval(.33,.08,.035,new THREE.MeshBasicMaterial({color:0xff3851}),side*.5,.79,-L+.04);}wing(1.26,w*1.9);
 }
 const wheels=[];for(const x of [-w,w])for(const z of [-L*.65,L*.65]){
   const g=new THREE.Group();g.position.set(x,.4,z);root.add(g);const tire=add(new THREE.CylinderGeometry(.4,.4,.28,14),black,0,0,0,g);tire.rotation.z=Math.PI/2;
   const rim=add(new THREE.CylinderGeometry(.245,.245,.3,8),chrome,0,0,0,g);rim.rotation.z=Math.PI/2;wheels.push(g);
   box(.19,.18,.4,paint,x,1.04,.4);
 }
 // Distinct lamp signatures, with actual spotlights lighting the road ahead.
 const lampMat=new THREE.MeshBasicMaterial({color:0xd9f2ff});
 for(const side of [-1,1]){
   if(!['porsche','f40','rx7'].includes(front)){
     for(let i=0;i<(front==='hyper'?4:1);i++)box(front==='hyper'?.085:.45,.09,.065,lampMat,side*(w*.6+(front==='hyper'?i*.11:0)),front==='wedge'?.64:.87,L-.02);
     if(front==='wedge'){const y=box(.3,.055,.06,lampMat,side*w*.64,.72,L-.02);y.rotation.z=side*.42;}
   }
 }
 const beam=new THREE.SpotLight(0xc8e8ff,22,85,.36,.55,1.2);beam.position.set(0,1.02,L-.12);const target=new THREE.Object3D();target.position.set(0,-.3,48);root.add(beam,target);beam.target=target;
 const glowGeo=new THREE.BufferGeometry();glowGeo.setAttribute('position',new THREE.Float32BufferAttribute([-1,.12,L,1,.12,L,-6,.12,40,6,.12,40],3));glowGeo.setIndex([0,2,1,1,2,3]);
 const glow=add(glowGeo,new THREE.MeshBasicMaterial({color:0xb7d9f3,transparent:true,opacity:.055,depthWrite:false,side:THREE.DoubleSide}),0,0,0,root);
 const flames=[];for(const x of [-.5,.5]){const f=add(new THREE.ConeGeometry(.18,2.2,6),new THREE.MeshBasicMaterial({color:0x74dfff}),x,.45,-L-1,root);f.rotation.x=-Math.PI/2;f.visible=false;flames.push(f);}
 box(spec.width*1.12,.015,spec.length*1.08,new THREE.MeshBasicMaterial({color:0x060b17,transparent:true,opacity:.4}),0,.04,0,root);
 root.userData={chassis:body,wheels,flames,beam,glow,spec};return root;
}
export function animateCar(root,state,dt){const data=root.userData;data.chassis.rotation.z=state.roll||0;data.chassis.rotation.x=state.pitch||0;data.chassis.position.y=state.heave||0;data.wheels.forEach(w=>w.rotation.x+=state.speed*dt/.4);data.flames.forEach(f=>{f.visible=state.boosting;f.scale.y=.7+Math.random()*.6;});}
