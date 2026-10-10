import assert from 'node:assert/strict';
import {cars,maps} from '../src/catalog.js';
import {createTrack} from '../src/track.js';
import {createState,drive,obstacleContact} from '../src/free-driving.js';
import {weatherPresets} from '../src/weather.js';
import {makeSimulation,stepSimulation,snapshot} from '../src/simulation.js';
const dt=1/60,track=createTrack(maps[0]),spec=cars[0],weather=weatherPresets[0];
for(const steer of [0,1,-1]){
 const s=createState(track);s.heading=0;s.vx=0;s.vz=50;
 for(let i=0;i<60;i++)drive(s,{handbrake:true,steer},dt,spec,weather);
 assert.ok(s.speed<25,'Handbrake removes total kinetic energy, including lateral motion');
 let speed=s.speed;const releasedSpeed=s.speed;
 for(let i=0;i<90;i++){drive(s,{steer:0},dt,spec,weather);assert.ok(s.speed<=speed+.001,'Release cannot create a speed rebound');speed=s.speed;}
 assert.ok(s.speed<=releasedSpeed);
}
const bench={x:0,z:0,heading:0,w:2,l:.8,breakable:true,mass:45,id:'bench'};
const driver={spec,state:{...createState(track),heading:0,x:0,z:0,vx:0,vz:40,speed:40}};
assert.equal(obstacleContact(driver,bench),true);assert.equal(bench.broken,true);assert.ok(driver.state.vz>35&&driver.state.vz<40);assert.equal(obstacleContact(driver,bench),false);
const pole={...bench,broken:false,mass:100,id:'pole'};assert.equal(obstacleContact(driver,pole),true);assert.ok(driver.state.vz>30);
for(let map=0;map<4;map++){
 const sim=makeSimulation({map});assert.ok(sim.layout.props.filter(p=>['wall','hedge'].includes(p.type)).length>200);
 assert.equal(new Set(sim.layout.props.map(p=>p.variant)).size,6);
 const prop=sim.layout.obstacles.find(o=>o.breakable),person=sim.drivers[0];sim.drivers=[person];sim.countdown=0;
 person.state.x=prop.x;person.state.z=prop.z;person.state.vx=10;person.state.vz=0;
 stepSimulation(sim,dt,{});assert.ok(sim.brokenProps[prop.id]);assert.deepEqual(snapshot(sim).brokenProps,sim.brokenProps);
}
console.log('PASS: permanent handbrake deceleration, no release rebound, yielding furniture/poles, persistent shared destruction, six facade variants and neighborhood boundaries');
