import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const source=fs.readFileSync('js/account-admin.js','utf8');
function setup(user){const nodes=new Map();let after;
const node=id=>({id,hidden:false,classList:{contains:()=>false},setAttribute(){},remove(){nodes.delete(this.id);}});
nodes.set('jxActs',node('jxActs'));nodes.set('jxRanking',{after(b){after=b;nodes.set(b.id,b);}});
const c={CLOUD:{user},document:{getElementById:id=>nodes.get(id)||null,createElement:()=>node('')},window:{}};
vm.createContext(c);vm.runInContext(source,c);return{c,nodes,after:()=>after};}
test('Admin button follows server-confirmed role and is inserted next to Rankings',()=>{
for(const user of [null,{username:'danh'},{username:'other',isAdmin:false}])assert.equal(setup(user).nodes.has('jxAccountAdmin'),false);
const t=setup({username:'danh',isAdmin:true});assert.equal(t.after().id,'jxAccountAdmin');assert.equal(t.after().hidden,false);
t.nodes.get('jxActs').classList.contains=()=>true;t.c.window.accountAdminRefresh();assert.equal(t.after().hidden,true);
t.c.CLOUD.user=null;t.c.window.accountAdminRefresh();assert.equal(t.nodes.has('jxAccountAdmin'),false);
});
