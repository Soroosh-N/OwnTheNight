// Shared deterministic scenery/obstacle layout for local and LAN simulation.
export function streetLayout(track){const props=[],obstacles=[];let seed=track.definition.id.length*1709;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const place=(d,offset)=>{const {p,right,v}=track.sample(d);return {x:p.x+right.x*offset,z:p.z+right.z*offset,heading:Math.atan2(v.x,v.z)};};
 const clear=(p,r)=>Math.abs(track.project(p.x,p.z,0).lane)>r;
 for(let d=0,i=0;d<track.length;d+=23,i++)for(const side of [-1,1]){
   const theme=track.definition.theme,p=place(d+rand()*8,side*(19+rand()*6));if(!clear(p,16))continue;
   const type=theme==='ridge'?(i%4?'tree':'cabin'):theme==='dock'?(i%4?'container':'warehouse'):(i%5?'shop':'apartment');
   const w=type==='tree'?2.6:8+rand()*7,l=type==='tree'?2.6:8+rand()*9,h=type==='tree'?8+rand()*8:type==='apartment'?15+rand()*24:type==='container'?3+rand()*3:6+rand()*7;
   props.push({...p,type,w,l,h,color:Math.floor(rand()*5),side,d});obstacles.push({...p,w,l,type});
   const b=place(d+11,side*14.7);props.push({...b,type:i%3?'bench':'bin',w:i%3?2:.8,l:.8,h:i%3?.9:1.2,color:0});obstacles.push({...b,w:i%3?2:.8,l:.8,type:'furniture'});
   if(i%4===0){const parked=place(d+15,side*15.8);if(clear(parked,12)){props.push({...parked,type:'parked',w:1.9,l:4.5,h:1.3,color:i%5});obstacles.push({...parked,w:1.9,l:4.5,type:'parked'});}}
 }
 for(let x=-350;x<=350;x+=42)for(let z=-350;z<=350;z+=42){const p={x:x+rand()*8,z:z+rand()*8,heading:0};if(!clear(p,32)||props.some(o=>Math.hypot(o.x-p.x,o.z-p.z)<(o.w+o.l)*.6+12))continue;const theme=track.definition.theme,type=theme==='ridge'?'tree':theme==='city'?'apartment':theme==='dock'?'warehouse':rand()>.55?'tree':'cabin',w=type==='tree'?2.4:18+rand()*9,l=type==='tree'?2.4:18+rand()*10,h=type==='tree'?10+rand()*8:type==='apartment'?22+rand()*65:8+rand()*8;props.push({...p,type,w,l,h,color:Math.floor(rand()*5),side:1});obstacles.push({...p,w,l,type});}
 for(let d=0,i=0;d<track.length;d+=160,i++){const crossing=place(d,0);props.push({...crossing,type:'crossing',w:20,l:5,h:.02,color:0});for(const side of [-1,1])props.push({...place(d,side*13),type:'signal',w:.3,l:.3,h:4.5,color:i%2});}
 return {props,obstacles};
}
