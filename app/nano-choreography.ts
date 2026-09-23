export type NanoPoint={x:number;y:number};

/** Deterministic stream paths, ending exactly on the material they rebuild. */
export function swarmFrames(start:NanoPoint,end:NanoPoint,index:number,screen:boolean):Keyframe[]{
 const lane=index%4,phase=lane*Math.PI/2+(index%7)*.09;
 const radius=(screen?44:23)+(index%9)*1.6;
 const frames:Keyframe[]=[];
 for(let step=0;step<=24;step++){
  const t=step/24;
  // Stagger release slightly, orbit, then home. No random flickering or flashing.
  const p=Math.max(0,Math.min(1,(t-(index%5)*.012)/(1-(index%5)*.012)));
  const motion=p<.42?p/.84:p<=.58?.5:.5+(p-.58)/.84;
  const travel=motion*motion*(3-2*motion);
  const envelope=p===0||p===1?0:Math.sin(Math.PI*motion);
  const angle=phase+motion*Math.PI*1.65;
  const x=(end.x-start.x)*travel+Math.cos(angle)*radius*envelope;
  const y=(end.y-start.y)*travel+Math.sin(angle)*radius*.68*envelope;
  const opacity=p<.16?p/.16:p>.8?(1-p)/.2:1;
  frames.push({offset:t,opacity:opacity*(index%3===0?.85:.65),transform:`translate(${x}px,${y}px) rotate(${angle*180/Math.PI}deg) scale(${.4+envelope*.8})`});
 }
 return frames;
}
