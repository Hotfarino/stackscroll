"use client";
import {useId,type CSSProperties} from "react";
const regions={logo:[95,23,55,56],discover:[31,154,49,51],stacks:[31,154,49,51],lab:[98,945,43,47],radar:[163,946,45,46],saved:[231,946,42,47],search:[295,946,46,47],profile:[361,945,47,48],settings:[427,944,49,49]} as const;
export type ReferenceIconName=keyof typeof regions;
// Vector masters preserve the reference silhouettes and dimensions at every pixel density.
const outlines:Record<Exclude<ReferenceIconName,"logo">,string>={
 discover:"M8 17 26 8 41 17V23L35 27 41 31V36L25 46 8 36V30L14 27 8 23Z",
 stacks:"M8 17 26 8 41 17V23L35 27 41 31V36L25 46 8 36V30L14 27 8 23Z",
 lab:"M16 9H29V13H26V22L34 36Q37 43 29 43H14Q7 43 10 36L18 22V13H16Z",
 radar:"M40 23A17.5 17.5 0 1 1 5 23A17.5 17.5 0 1 1 40 23Z",
 saved:"M11 10Q11 7 15 7H30Q33 7 33 10V42L22 34 11 42Z",
 search:"M32 20A13 13 0 1 0 27 30L37 41 42 37 31 27A13 13 0 0 0 32 20Z",
 profile:"M32 15A9 9 0 1 1 14 15A9 9 0 1 1 32 15ZM9 41V36Q9 26 23 26Q37 26 37 36V41Z",
 settings:"M20 6H28L30 12 36 10 41 16 37 21 43 25 41 32 35 33 34 40 26 42 23 37 17 40 11 35 13 29 7 26 9 19 15 17 14 11Z"
};
export function ReferenceIcon({name,size=30,className=""}:{name:ReferenceIconName;size?:number;className?:string}){
 const key=useId().replace(/:/g,"");const [,,w,h]=regions[name];const shape=name==="logo"?null:outlines[name];
 return <svg className={`reference-icon ${className}`} viewBox={`-2 -2 ${w+4} ${h+4}`} width={size} height={size} style={{"--reference-size":`${size}px`} as CSSProperties} aria-hidden="true" focusable="false">
 <defs><linearGradient id={`${key}-face`} x2=".85" y2="1"><stop stopColor="#788992"/><stop offset=".3" stopColor="#283740"/><stop offset=".65" stopColor="#111A20"/><stop offset="1" stopColor="#365C69"/></linearGradient><linearGradient id={`${key}-edge`} x2=".8" y2="1"><stop stopColor="#F3FAFF"/><stop offset=".4" stopColor="#D3E2E9"/><stop offset="1" stopColor="#46D7EE"/></linearGradient></defs>
 <g stroke={`url(#${key}-edge)`} strokeWidth="1.9" strokeLinejoin="round" strokeLinecap="round">
 {shape?<path d={shape} fill={`url(#${key}-face)`}/>:<path transform="translate(-95 -23)" d="m101 41 21-13 20 11-9 5M101 41l20 12 8-5M111 48l-10 6 22 12 19-11-14-8M101 62l21 12 20-12-8-5" fill="none" strokeWidth="3"/>}
 <g fill="none" strokeWidth="1.5">
 {(name==="stacks"||name==="discover")&&<path d="m8 17 17 10 16-10M8 30l17 10 16-9M14 27l11 7 10-7M25 27v7m0 6v6"/>}
 {name==="lab"&&<path d="M18 14h8M15 31h14m-12 5h2m7 3h1"/>}
 {name==="radar"&&<><circle cx="22.5" cy="23" r="11"/><circle cx="22.5" cy="23" r="5"/><path d="M22.5 23 34 11"/></>}
 {name==="search"&&<circle cx="19" cy="20" r="9" fill="#10171C"/>}
 {name==="settings"&&<circle cx="25" cy="24" r="7" fill="#10171C"/>}
 </g></g>
 </svg>;
}
