'use strict';
const drawFootDoll=drawDoll;
drawDoll=function(c,x,y,act,dir,t,scale,alpha,state){
 const rider=state||(typeof S!=='undefined'?S:null);
 if(!rider||!rider.mounted||!mountEquipped(rider)||act==='die'||!c||c.x!==undefined)
  return drawFootDoll(c,x,y,act,dir,t,scale,alpha,state);
 clientRideWarm(rider);
 const height=drawClientRiding(c,x,y,act,dir,t,scale,alpha,rider);
 if(height!==null)return height;
 // Keep the normal character while its native seated rig loads; never stretch standing legs.
 clientRideWarm(rider);
 return drawFootDoll(c,x,y,act,dir,t,scale,alpha,rider);
};

const footDollActLen=dollActLen;
dollActLen=function(state,act){if(state?.mounted&&mountEquipped(state)&&act!=="die"){const plan=clientRidePlan(state,act);if(plan)return(plan.body.per||plan.body.n)*(plan.body.interval||1)/18;}return footDollActLen(state,act);};
