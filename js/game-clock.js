// Advance with elapsed browser time; changing the operating-system clock cannot mint time.
const gameElapsedNow=()=>typeof performance!=='undefined'?performance.now():Date.now();
let gameClockEpoch=Date.now(),gameClockAnchor=gameElapsedNow();
function gameNow(){return Math.floor(gameClockEpoch+Math.max(0,gameElapsedNow()-gameClockAnchor));}
function gameClockSync(serverTime){if(!Number.isSafeInteger(serverTime)||serverTime<=0)return;gameClockEpoch=serverTime;gameClockAnchor=gameElapsedNow();}
