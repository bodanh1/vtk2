import fs from 'node:fs';import {createHash} from 'node:crypto';import {read,png} from './mount-png.mjs';
export function compactShadow(s){
 if(s.frameMap)return s;const im=read(s.f),height=s.h*s.d,unique=[],indices=new Map(),map=[];
 for(let col=0;col<s.n;col++){const strip=Buffer.alloc(s.w*height*4);for(let y=0;y<height;y++)im.rgba.copy(strip,y*s.w*4,(y*im.w+col*s.w)*4,(y*im.w+(col+1)*s.w)*4);const hash=createHash('sha256').update(strip).digest('hex');let index=indices.get(hash);if(index===undefined){index=unique.length;indices.set(hash,index);unique.push(strip);}else if(!unique[index].equals(strip))throw Error('shadow hash collision');map.push(index);}
 if(unique.length===s.n)return s;
 const width=s.w*unique.length,out=Buffer.alloc(width*height*4);for(let col=0;col<unique.length;col++)for(let y=0;y<height;y++)unique[col].copy(out,(y*width+col*s.w)*4,y*s.w*4,(y+1)*s.w*4);
 const originalHash=createHash('sha256').update(im.rgba).digest('hex');fs.writeFileSync(s.f,png(width,height,out));return{...s,n:unique.length,frames:map.reduce((a,v,i)=>{if(a[v]===undefined)a[v]=i;return a},[]),frameMap:map,sourcePixelHash:originalHash};
}
