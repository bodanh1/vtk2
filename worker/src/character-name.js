import {HttpError} from './http.js';
export const reservedCharacterName=name=>String(name||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes('admin');
export function requireCharacterName(name,account){if(reservedCharacterName(name)&&account?.username!=='danh')throw new HttpError(400,'reserved_character_name','Tên có chữ admin chỉ dành cho tài khoản danh');}
