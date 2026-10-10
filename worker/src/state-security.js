import {HttpError} from './http.js';
// Shared by cloud uploads, marketplace bundles and online snapshots.
export function checkStateSecurity(state){
 if(state.speed!=null){if(state.speed===2.5)state.speed=2;else if(![1,1.5,2].includes(state.speed))throw new HttpError(400,'bad_save','Tốc độ tối đa là x2');}
 for(const key of ['gold','knb'])if(state[key]!=null&&(typeof state[key]!=='number'||!Number.isFinite(state[key])||state[key]<0||state[key]>Number.MAX_SAFE_INTEGER))throw new HttpError(400,'bad_save','Số dư tiền không hợp lệ');
 return state;
}
