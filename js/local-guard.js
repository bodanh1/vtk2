"use strict";
// A local deterrent, not an authority for currency or ownership. No network calls.
(function(){
  const ErrorType=Error,urls=new Set(Array.from(document.scripts,s=>s.src).filter(Boolean).map(cleanURL));
  const own=cleanURL(document.currentScript?.src||''),seen=new WeakMap(),roots=new WeakSet();
  let current,lastNotice=0;
  function cleanURL(s){return String(s).replace(/[?#].*$/,'').replace(/:\d+(?::\d+)?$/,'');}
  function trusted(){
    let stack;try{stack=new ErrorType().stack;}catch{return true;}
    // Older engines without usable stacks stay compatible rather than losing progress.
    if(typeof stack!=='string'||!stack.trim())return true;
    if(/\beval\b|evalmachine\.|eval code|debugger eval|\bVM\d+\b|(?:at\s+|^)console:\d|at\s+<anonymous>:\d/im.test(stack))return false;
    for(const line of stack.split('\n')){
      const match=line.match(/(?:https?|file):\/\/[^\s)]+/);
      if(!match)continue;
      const url=cleanURL(match[0]);if(url===own)continue;
      return urls.has(url)&&!/\beval\b|eval code|debugger eval/i.test(line);
    }
    return false;
  }
  function blocked(){const now=performance.now();if(now-lastNotice>5000){lastNotice=now;try{if(typeof toast==='function')toast('Không thể chỉnh dữ liệu trực tiếp ngoài thao tác game.');}catch{}}}
  function allowed(){if(trusted())return true;blocked();return false;}
  function collection(value,deep=false){
    if(!value||typeof value!=='object')return value;
    if(seen.has(value))return seen.get(value);
    const proxy=new Proxy(value,{
      ...(deep?{get(target,key,receiver){return collection(Reflect.get(target,key,receiver),true);}}:{}),
      set(target,key,v){if(!allowed())return true;return Reflect.set(target,key,v,target);},
      deleteProperty(target,key){if(!allowed())return true;return Reflect.deleteProperty(target,key);},
      defineProperty(target,key,d){if(!allowed())return false;return Reflect.defineProperty(target,key,d);}
    });seen.set(value,proxy);seen.set(proxy,proxy);return proxy;
  }
  const numbers=['gold','xp','knb','lvl','speed','attrPts','skPts','stage','maxStage','totalKills','tienThaoUntil','queHoaUntil','thienSonUntil'];
  function protect(state){
    if(!state||typeof state!=='object'||roots.has(state))return state;
    roots.add(state);
    for(const key of [...numbers,'inv','eq','attr','sk','rps']){
      let value=numbers.includes(key)?state[key]:collection(state[key],key==='rps');
      Object.defineProperty(state,key,{enumerable:true,configurable:false,get(){return value;},set(next){
        if(!allowed())return;
        if(numbers.includes(key)){
          if(typeof next!=='number'||!Number.isFinite(next))return;
          if(key==='speed'&&![1,1.5,2].includes(next))return;
          if(['gold','xp','knb'].includes(key)&&next<0)return;
          value=next;
        }else value=collection(next,key==='rps');
      }});
    }
    return state;
  }
  // The browser uses this accessor; the Worker retains its own module-local state.
  Object.defineProperty(window,'S',{configurable:false,enumerable:true,get(){return current;},set(state){if(allowed())current=protect(state);}});
  const write=Storage.prototype.setItem,remove=Storage.prototype.removeItem,clear=Storage.prototype.clear;
  Storage.prototype.setItem=function(key,value){if(this===localStorage&&String(key).startsWith('jxidle')&&!allowed())return;return write.call(this,key,value);};
  Storage.prototype.removeItem=function(key){if(this===localStorage&&String(key).startsWith('jxidle')&&!allowed())return;return remove.call(this,key);};
  Storage.prototype.clear=function(){if(this===localStorage&&!allowed())return;return clear.call(this);};
})();
