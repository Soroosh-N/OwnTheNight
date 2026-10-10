import {spawn} from 'node:child_process';
import {createLanServer} from '../server/lan-server.mjs';
import os from 'node:os';

const server=createLanServer();
let port=Number(process.env.PORT)||8080;
server.on('error',error=>{
 if(error.code==='EADDRINUSE'&&!process.env.PORT&&port<8090){port++;server.listen(port,'0.0.0.0');return;}
 console.error('Could not start the game: '+error.message);
 server.close();process.exitCode=1;
});
server.on('listening',()=>{
 const url=`http://localhost:${port}`;
 console.log(`Afterglow is ready: ${url}`);
 console.log('Keep this terminal open while playing. Ctrl+C stops the game.');
 for(const list of Object.values(os.networkInterfaces()))for(const address of list||[])if(address.family==='IPv4'&&!address.internal)console.log(`LAN players: http://${address.address}:${port}`);
 if(process.platform==='win32'&&process.env.AFTERGLOW_NO_OPEN!=='1'){
  const browser=spawn('cmd.exe',['/c','start','',url],{windowsHide:true,stdio:'ignore'});
  browser.on('error',()=>console.log('Open the address above in your browser.'));
 }
});
server.listen(port,'0.0.0.0');
