import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {deflateRawSync} from 'node:zlib';

// ZIP writer using only Node built-ins, so LAN packaging needs no Python or npm dependencies.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(data){let n=0xffffffff;for(const b of data)n=table[(n^b)&255]^(n>>>8);return (n^0xffffffff)>>>0;}
function walk(folder){return fs.readdirSync(folder,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(e=>e.isDirectory()?walk(path.join(folder,e.name)):[path.join(folder,e.name)]);}
const files=['src','public','server','scripts','tests','docs'].flatMap(folder=>walk(path.join(root,folder))).map(p=>({name:path.relative(root,p).split(path.sep).join('/'),data:fs.readFileSync(p)}));
for(const name of ['index.html','README.md','package.json','.gitignore','.gitattributes'])files.push({name,data:fs.readFileSync(path.join(root,name))});
const local=[],central=[];let offset=0;
for(const file of files){
 const name=Buffer.from(file.name),data=deflateRawSync(file.data),crc=crc32(file.data);
 const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(8,8);header.writeUInt16LE(33,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(data.length,18);header.writeUInt32LE(file.data.length,22);header.writeUInt16LE(name.length,26);
 const directory=Buffer.alloc(46);directory.writeUInt32LE(0x02014b50);directory.writeUInt16LE(20,4);directory.writeUInt16LE(20,6);directory.writeUInt16LE(0x800,8);directory.writeUInt16LE(8,10);directory.writeUInt16LE(33,14);directory.writeUInt32LE(crc,16);directory.writeUInt32LE(data.length,20);directory.writeUInt32LE(file.data.length,24);directory.writeUInt16LE(name.length,28);directory.writeUInt32LE(offset,42);
 local.push(header,name,data);central.push(directory,name);offset+=header.length+name.length+data.length;
}
const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
fs.writeFileSync(path.join(root,'dist/own-the-night-lan.zip'),Buffer.concat([...local,directory,end]));
console.log(`Packaged ${files.length} files into dist/own-the-night-lan.zip`);
