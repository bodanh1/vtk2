import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const source=fs.readFileSync('js/skill-scroll.js','utf8');
for(const desktop of [false,true])test(`skill point changes retain scroll on ${desktop?'PC sidebar':'mobile panel'}`,()=>{
const parent={scrollTop:85,scrollLeft:0,parentElement:null};let sidebar=desktop?{scrollTop:310,scrollLeft:2}:null;
const panel={scrollTop:240,scrollLeft:3,parentElement:parent,querySelector:()=>sidebar};
const c={document:{getElementById:()=>panel},window:{renderSkill(){panel.scrollTop=0;panel.scrollLeft=0;parent.scrollTop=0;if(desktop)sidebar={scrollTop:0,scrollLeft:0};return 123;}}};
vm.createContext(c);vm.runInContext(source,c);
for(let i=0;i<3;i++){assert.equal(c.window.renderSkill(),123);assert.equal(panel.scrollTop,240);assert.equal(panel.scrollLeft,3);assert.equal(parent.scrollTop,85);if(desktop){assert.equal(sidebar.scrollTop,310);assert.equal(sidebar.scrollLeft,2);}}
});
