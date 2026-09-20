"use client";
import {useId,type CSSProperties} from "react";
const regions={logo:[95,23,55,56],discover:[31,154,49,51],stacks:[31,154,49,51],lab:[98,945,43,47],radar:[163,946,45,46],saved:[231,946,42,47],search:[295,946,46,47],profile:[361,945,47,48],settings:[427,944,49,49]} as const;
export type ReferenceIconName=keyof typeof regions;
// Silhouette clips remove the screenshot background while retaining the reference material.
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
 const key=useId().replace(/:/g,"");const [x,y,w,h]=regions[name];const shape=name==="logo"?null:outlines[name];
 return <svg className={`reference-icon ${className}`} viewBox={`-2 -2 ${w+4} ${h+4}`} width={size} height={size} style={{"--reference-size":`${size}px`} as CSSProperties} aria-hidden="true" focusable="false">
 <defs>{shape&&<clipPath id={`${key}-clip`}><path d={shape}/></clipPath>}<filter id={`${key}-shine`} filterUnits="userSpaceOnUse" x={-2} y={-2} width={w+4} height={h+4} colorInterpolationFilters="sRGB"><feComponentTransfer><feFuncR type="linear" slope="1.24" intercept=".035"/><feFuncG type="linear" slope="1.24" intercept=".035"/><feFuncB type="linear" slope="1.24" intercept=".035"/></feComponentTransfer></filter><filter id={`${key}-logo`} filterUnits="userSpaceOnUse" x={-2} y={-2} width={w+4} height={h+4} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="1.15 0 0 0 0 0 1.15 0 0 0 0 0 1.15 0 0 .65 1.15 .2 0 -.22"/></filter></defs>
 {shape&&<path d={shape} fill="#142128" stroke="#F6FCFF" strokeWidth="2.6" strokeLinejoin="round"/>}
 <g clipPath={shape?`url(#${key}-clip)`:undefined}><image href="/brand/ui-reference-artwork.png" x={-x} y={-y} width="1448" height="1086" filter={`url(#${key}-${shape?"shine":"logo"})`}/></g>
 {shape&&<path d={shape} fill="none" stroke="#F3FAFF" strokeOpacity=".92" strokeWidth="1.9" strokeLinejoin="round"/>}
 </svg>;
}
