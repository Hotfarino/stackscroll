export type NanoPoint={x:number;y:number};
const smooth=(value:number)=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
/** Continuous, time-based motion with a complete dispersed phase. */
export function nanoPhase(progress:number){
 const t=Math.max(0,Math.min(1,progress));
 return {
  scatter:t<.4?smooth(t/.4):t<.58?1:1-smooth((t-.58)/.34),
  cover:Math.min(smooth(t/.08),1-smooth((t-.92)/.08)),
  travel:smooth(t),turn:smooth(t)*Math.PI*1.15,
 };
}
