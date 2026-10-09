import fs from 'node:fs';
import path from 'node:path';
import {png} from './mount-png.mjs';
const root=path.resolve(process.argv[2]||'../Client_VLTK_SHXT');
function hash(p){let h=0;const b=Buffer.from(p.toLowerCase().replaceAll('/','\\'));for(let i=0;i<b.length;i++){h=Number((BigInt(h)+BigInt((i+1)*b[i]))%0x8000000bn);h=Math.imul(h,0xffffffef)>>>0;}return(h^0x12345678)>>>0;}
function nrv(src,size){const out=Buffer.alloc(size);let ip=0,op=0,bits=0,last=1;const byte=()=>{if(ip>=src.length)throw Error('NRV input overrun');return src[ip++]};const bit=()=>{bits=bits&127?bits*2:byte()*2+1;return(bits>>8)&1};const put=v=>{if(op>=size)throw Error('NRV output overrun');out[op++]=v};for(;;){while(bit())put(byte());let distance=1;do{distance=distance*2+bit();if(distance>0x1000002)throw Error('NRV distance overflow')}while(!bit());if(distance===2)distance=last;else{distance=(distance-3)*256+byte();if(distance===0xffffffff)break;last=++distance}let length=bit()*2+bit();if(!length){length=1;do{length=length*2+bit();if(length>size)throw Error('NRV length overflow')}while(!bit());length+=2}length+=distance>0xd00?1:0;if(distance>op)throw Error('NRV lookbehind');for(let i=0;i<=length;i++)put(out[op-distance]);}if(op!==size||ip!==src.length)throw Error('NRV size mismatch');return out;}
const names=fs.readFileSync(path.join(root,'package.ini'),'latin1').split(/\r?\n/).filter(x=>/^\d+=/.test(x)).map(x=>x.split('=')[1]);
const packs=names.map(name=>{const fd=fs.openSync(path.join(root,'data',name),'r'),h=Buffer.alloc(32);fs.readSync(fd,h,0,32,0);if(h.toString('ascii',0,4)!=='PACK')throw Error('PACK signature');const idx=Buffer.alloc(h.readUInt32LE(4)*16);fs.readSync(fd,idx,0,idx.length,h.readUInt32LE(8));const entries=new Map();for(let i=0;i<idx.length;i+=16)entries.set(idx.readUInt32LE(i),{offset:idx.readUInt32LE(i+4),size:idx.readUInt32LE(i+8),flag:idx.readUInt32LE(i+12)});return{name,fd,entries}});
function read(p){for(const pak of packs){const e=pak.entries.get(hash(p));if(!e)continue;const b=Buffer.alloc(e.flag&0xffffff);fs.readSync(pak.fd,b,0,b.length,e.offset);const method=e.flag>>>24;if(method!==0&&method!==1&&method!==32&&method!==17)throw Error(`Unsupported method ${method}: ${p}`);return{data:method===17?splitSprite(b):method!==0?nrv(b,e.size):b,pak:pak.name,id:hash(p)}}return null;}

// Decode only sampled frames, then crop their common bounds before allocating an atlas.
function sprite(b,file){
 if(b.toString('ascii',0,3)!=='SPR')throw Error('SPR signature');
 const w=b.readUInt16LE(4),h=b.readUInt16LE(6),total=b.readUInt16LE(12),colors=b.readUInt16LE(14),d=b.readUInt16LE(16),interval=b.readUInt16LE(18)||1;
 if(!d||total%d||w*h>2000000)throw Error('SPR dimensions');
 const per=total/d,n=Math.min(8,per),frames=Array.from({length:n},(_,i)=>Math.floor(i*per/n)),table=32+colors*3,base=table+total*8,decoded=[];
 let x0=w,y0=h,x1=-1,y1=-1;
 for(let row=0;row<d;row++)for(const frame of frames){const f=row*per+frame,start=base+b.readUInt32LE(table+f*8),end=start+b.readUInt32LE(table+f*8+4),fw=b.readUInt16LE(start),fh=b.readUInt16LE(start+2),ox=b.readInt16LE(start+4),oy=b.readInt16LE(start+6),rgba=Buffer.alloc(w*h*4);let p=start+8,pixel=0;
 while(pixel<fw*fh){if(p+2>end)throw Error('SPR RLE truncated');const count=b[p++],alpha=b[p++];if(!count||pixel+count>fw*fh)throw Error('SPR RLE length');for(let i=0;i<count;i++,pixel++){const x=pixel%fw+ox,y=Math.floor(pixel/fw)+oy;if(alpha){if(p>=end)throw Error('SPR palette truncated');const color=b[p++];if(color>=colors)throw Error('SPR palette index');if(x>=0&&y>=0&&x<w&&y<h){const at=(y*w+x)*4;b.copy(rgba,at,32+color*3,35+color*3);rgba[at+3]=alpha;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}}}}
 decoded.push(rgba);}
 if(x1<x0)return null;const cw=x1-x0+1,ch=y1-y0+1,W=cw*n,H=ch*d,out=Buffer.alloc(W*H*4);
 decoded.forEach((rgba,f)=>{const row=Math.floor(f/n),col=f%n;for(let y=0;y<ch;y++){const from=((y+y0)*w+x0)*4,to=((row*ch+y)*W+col*cw)*4;rgba.copy(out,to,from,from+cw*4)}});
 fs.writeFileSync(file,png(W,H,out));return{f:file.replaceAll('\\','/'),w:cw,h:ch,ax:160-x0,ay:220-y0,d,n,per,frames,interval,sourceW:w,sourceH:h,compact:true};
}
function close(){for(const p of packs)fs.closeSync(p.fd)}
export {root,read,sprite,close};
function splitSprite(b){
 if(b.toString('ascii',0,3)!=='SPR')throw Error('Split SPR header');const count=b.readUInt16LE(12),colors=b.readUInt16LE(14),base=32+colors*3,table=Buffer.alloc(count*8),frames=[];let offset=0,pos=base+count*8;
 for(let i=0;i<count;i++){const compressed=b.readUInt32LE(base+i*8),size=b.readInt32LE(base+i*8+4);if(pos+compressed>b.length)throw Error('Split SPR truncated');const frame=size<0?b.subarray(pos,pos+compressed):nrv(b.subarray(pos,pos+compressed),size);if(frame.length!==Math.abs(size))throw Error('Split SPR frame size');table.writeUInt32LE(offset,i*8);table.writeUInt32LE(frame.length,i*8+4);frames.push(frame);offset+=frame.length;pos+=compressed;}if(pos!==b.length)throw Error('Split SPR trailing bytes');return Buffer.concat([b.subarray(0,base),table,...frames]);
}
