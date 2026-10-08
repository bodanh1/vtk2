"use strict";
// Phục hồi việc thay ba ô/kho bị gián đoạn trước khi game đọc localStorage.
function cloudRecoverStorage(){const key='jxidle_cloud_install_journal';try{const journal=JSON.parse(localStorage.getItem(key)||'null');if(!journal||!journal.raw)return;const keys=Object.keys(journal.raw).filter(k=>/^jxidle(?:_[a-zA-Z0-9]+)*$/.test(k));for(const k of keys)localStorage.removeItem(k);for(const k of keys)if(typeof journal.raw[k]==='string')localStorage.setItem(k,journal.raw[k]);localStorage.removeItem(key);}catch(e){console.warn('Chưa thể phục hồi bản lưu tại máy',e);}}
cloudRecoverStorage();
