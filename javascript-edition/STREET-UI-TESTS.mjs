import fs from "node:fs";
import assert from "node:assert/strict";
import {cars,maps} from "./dist/catalog.js";
import {buildWorld,disposeWorld} from './dist/world.js';
import {createTrack} from './dist/track.js';
const ctx=new Proxy({}, {get:(o,k)=>o[k]??(()=>{})}),elements=new Map();
function el(id){if(!elements.has(id)){const o={hidden:false,style:{},classList:{toggle(){},remove(){}},getContext:()=>ctx,children:[],textContent:'',setAttribute(){}};let html='';Object.defineProperty(o,'innerHTML',{get:()=>html,set:value=>{html=value;o.children=[...value.matchAll(/data-(car|map|weather)="([^"]+)"/g)].map(m=>({dataset:{[m[1]]:m[2]}}));}});elements.set(id,o);}return elements.get(id);}
globalThis.document={getElementById:el,createElement:()=>({getContext:()=>ctx}),querySelectorAll:s=>s==='[data-car]'?el('cars').children:s==='[data-map]'?el('maps').children:s==='[data-weather]'?el('weatherchoices').children:[],body:el('body')};
globalThis.window=globalThis;globalThis.innerWidth=1440;globalThis.innerHeight=900;globalThis.devicePixelRatio=1;globalThis.matchMedia=()=>({matches:false});globalThis.localStorage={getItem:()=>null,setItem(){}};
const events={};globalThis.addEventListener=(n,f)=>events[n]=f;let frame,renderedScene;globalThis.requestAnimationFrame=f=>frame=f;globalThis.captureRaceScene=s=>renderedScene=s;
const source=fs.readFileSync(new URL('./dist/street-game.js',import.meta.url),'utf8').replace(/'\.\/(.+?\.js)'/g,(_,name)=>JSON.stringify(new URL('./dist/'+name,import.meta.url).href)).replace("new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'})","({setPixelRatio(){},setSize(){},render(s){captureRaceScene(s);}})");
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
assert.equal(el('cars').children.length,8);assert.equal(el('maps').children.length,4);
for(let i=0;i<8;i++){el('cars').children[i].onclick();assert.equal(racingDiagnostics().selectedCar,cars[i].id);}
for(let i=0;i<4;i++){el('maps').children[i].onclick();assert.equal(racingDiagnostics().selectedMap,maps[i].id);frame(16+i*16);let spots=0,points=0;renderedScene.traverse(o=>{if(o.isSpotLight)spots++;if(o.isPointLight)points++;});assert.equal(spots,6);assert.ok(points>=6);}
el('start').onclick();assert.equal(racingDiagnostics().mode,'race');el('pause').onclick();const before=racingDiagnostics().elapsed;frame(100);assert.equal(racingDiagnostics().elapsed,before);el('resume').onclick();assert.equal(racingDiagnostics().paused,false);el('garagebtn').onclick();assert.equal(racingDiagnostics().mode,'garage');

assert.equal(el("weatherchoices").children.length,5); for(let i=0;i<5;i++){const b=el("weatherchoices").children[i]; b.onclick(); assert.equal(racingDiagnostics().weather,b.dataset.weather);frame(1000+i*16);} console.log("PASS: entry startup, eight cars, four maps, five weather options, headlights, pause/resume and garage");
const scenery=buildWorld(createTrack(maps[0]));
assert.equal(scenery.breakableModels.size,scenery.layout.props.filter(p=>p.breakable).length);
const [id,entry]=[...scenery.breakableModels].find(([,e])=>e.prop.type==='streetlamp');
assert.ok(entry.group.children.length>=2,'Breakable lamp geometry survives static batching');
scenery.updateProps({[id]:{time:0,vx:30,vz:0}},1.2);
assert.ok(Math.abs(entry.group.rotation.x)+Math.abs(entry.group.rotation.z)>1,'Broken lamp topples visibly');
scenery.updateProps({},0);assert.equal(entry.group.rotation.x,0);assert.equal(entry.group.rotation.z,0);
disposeWorld(scenery);console.log('PASS: individual breakable meshes, visible toppling and new-race reset');
