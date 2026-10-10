import assert from 'node:assert/strict';
import {createGameServer} from '../server/game-server.mjs';
const server=createGameServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
try{for(const url of ['/','/game.bundle.js','/style.css','/src/net/peer-client.js','/src/vendor/peerjs.min.js']){const response=await fetch(base+url);assert.equal(response.status,200,url);await response.arrayBuffer();}for(const url of ['/api/create','/api/events','/server/game-server.mjs','/package.json'])assert.equal((await fetch(base+url)).status,404,url);console.log('PASS: optional static hosting, browser bundle and peer modules, no server-side rooms');}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
