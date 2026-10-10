import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {checkStateSecurity} from '../src/state-security.js';
import {cleanBundle} from '../src/cloud-account.js';
import {parseSave} from '../src/account.js';
import {GAME} from '../gen/game.js';
test('speed and balances checked by cloud/market cleaner and online parser',()=>{
 const state=GAME.newSave();state.fac=Object.keys(GAME.FAC)[0];state.mode='ctc';
 for(const speed of [5,10,Infinity,'2',0]){assert.throws(()=>cleanBundle({v:1,slots:[{...state,speed},null,null],shared:{}}));assert.throws(()=>parseSave({...state,speed}));}
 for(const key of ['gold','knb'])for(const value of [-1,Infinity,NaN,'100',Number.MAX_SAFE_INTEGER+1])assert.throws(()=>checkStateSecurity({...state,[key]:value}));
 assert.equal(checkStateSecurity({...state,speed:2.5}).speed,2);
 assert.equal(checkStateSecurity({...state,speed:2,gold:1e12}).speed,2);
 assert.throws(()=>cleanBundle({v:1,slots:[state,null,null],shared:{jxidle_stash:{gold:-1}}}));
});
test('operating system clock jumps cannot mint session time; server time rebases clock',()=>{
 let wall=100000,elapsed=10;const c={Date:{now:()=>wall},performance:{now:()=>elapsed}};vm.createContext(c);vm.runInContext(fs.readFileSync('js/game-clock.js','utf8'),c);
 wall+=86400000;elapsed+=1000;assert.equal(c.gameNow(),101000);
 wall=1;elapsed+=1000;assert.equal(c.gameNow(),102000);
 c.gameClockSync(500000);elapsed+=100;assert.equal(c.gameNow(),500100);
 c.gameClockSync(NaN);assert.equal(c.gameNow(),500100);
});
test('actual game speed never exceeds two including legacy admin override',()=>{
 const src=fs.readFileSync('js/main.js','utf8'),expr=src.match(/const gameSpeed=([^;]+);/)[1];
 const c={S:{speed:2},ADMV:{speed:10},modeSpeedOk:s=>[1,1.5,2].includes(s)};vm.createContext(c);const speed=vm.runInContext(expr,c);
 assert.equal(speed(),2);c.ADMV.speed=Infinity;assert.equal(speed(),2);c.ADMV.speed=0;c.S.speed=10;assert.equal(speed(),1);c.S.speed=1.5;assert.equal(speed(),1.5);
});
