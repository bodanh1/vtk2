import fs from 'node:fs';
const root='../Client_VLTK_SHXT',res=fs.readFileSync(root+'/settings/item/horseres.txt','latin1').split(/\r?\n/).slice(1).filter(x=>x.trim()).map(x=>x.split('\t')),m=JSON.parse(fs.readFileSync('docs/mount-client-manifest.json'));m.res={};
for(const r of fs.readFileSync(root+'/settings/item/horse.txt','latin1').split(/\r?\n/).slice(1).filter(x=>x.trim()).map(x=>x.split('\t'))){const row=+r[3]*10+(+r[11]),kind=+res[row]?.[1]-1;if(Number.isInteger(kind)&&kind>0)m.res[r[2]+':'+r[3]+':'+r[11]]=kind;}
fs.writeFileSync('docs/mount-client-manifest.json',JSON.stringify(m,null,2));fs.writeFileSync('js/mount-client-data.js','window.JMOUNT='+JSON.stringify(m)+';\n');console.log(Object.entries(m.res).filter(([k])=>k.endsWith(':1')).slice(0,9));
