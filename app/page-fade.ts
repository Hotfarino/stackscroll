/** Latest navigation wins. Animation failures must never block navigation. */
export function createPageFade(getSurface:()=>Element|null,reduced:()=>boolean,commit:(change:()=>void)=>void){
 let generation=0,animation:Animation|null=null,pending:(()=>void)|null=null;
 let watchdog:ReturnType<typeof setTimeout>|undefined;
 function cancel(){generation++;if(watchdog)clearTimeout(watchdog);watchdog=undefined;pending=null;animation?.cancel();animation=null;}
 function finish(){const change=pending;cancel();if(change)commit(change);}
 function run(change:()=>void){
  const surface=getSurface();
  const opacity=surface?getComputedStyle(surface).opacity:"1";
  cancel();pending=change;
  if(!surface||reduced()||typeof surface.animate!=="function"){finish();return;}
  const ticket=generation;
  function enter(){
   if(ticket!==generation)return;
   const update=pending;pending=null;
   if(watchdog)clearTimeout(watchdog);watchdog=undefined;
   try{
    if(update)commit(update);
    animation?.cancel();animation=null;
    const incoming=getSurface();
    if(!incoming||reduced())return;
    animation=incoming.animate([
     {opacity:0,transform:"translateX(0)",filter:"none",clipPath:"inset(0)"},
     {offset:.16,opacity:.35,transform:"translateX(3px)",filter:"contrast(1.14) saturate(1.18)",clipPath:"inset(18% 0 56% 0)"},
     {offset:.24,opacity:.56,transform:"translateX(-2px)",filter:"none",clipPath:"inset(58% 0 18% 0)"},
     {opacity:1,transform:"translateX(0)",filter:"none",clipPath:"inset(0)"},
    ],{duration:300,easing:"cubic-bezier(.22,1,.36,1)"});
    const current=animation;
    current.finished.then(()=>{if(ticket===generation){current.cancel();animation=null;}},()=>{});
   }catch{animation?.cancel();animation=null;}
  }
  try{
   animation=surface.animate([
    {opacity,transform:"translateX(0)",filter:"none",clipPath:"inset(0)"},
    {offset:.48,opacity:.78,transform:"translateX(-3px)",filter:"contrast(1.12) saturate(1.16)",clipPath:"inset(12% 0 62% 0)"},
    {offset:.62,opacity:.58,transform:"translateX(2px)",filter:"none",clipPath:"inset(64% 0 12% 0)"},
    {opacity:0,transform:"translateX(0)",filter:"none",clipPath:"inset(0)"},
   ],{duration:190,easing:"ease-in",fill:"forwards"});
   animation.finished.then(enter,()=>{if(ticket===generation)finish();});
   watchdog=setTimeout(()=>{if(ticket===generation)finish();},600);
  }catch{finish();}
 }
 return {run,finish,cancel};
}
