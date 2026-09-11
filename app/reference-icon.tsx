import type {CSSProperties} from "react";

// Viewports display the user's actual reference artwork, without redrawing it.
const regions = {
 logo:[95,23,55,56], discover:[31,154,49,51], stacks:[31,154,49,51],
 lab:[98,945,43,47], radar:[163,946,45,46], saved:[231,946,42,47],
 search:[295,946,46,47], profile:[361,945,47,48], settings:[427,944,49,49],
} as const;
export type ReferenceIconName=keyof typeof regions;
export function ReferenceIcon({name,size=30,className=""}:{name:ReferenceIconName;size?:number;className?:string}) {
 const [x,y,w,h]=regions[name];
 return <svg className={`reference-icon ${className}`} viewBox={`${x} ${y} ${w} ${h}`} width={size} height={size} style={{"--reference-size":`${size}px`} as CSSProperties} aria-hidden="true" focusable="false" overflow="hidden"><image href="/brand/ui-reference-artwork.png" x="0" y="0" width="1448" height="1086"/></svg>;
}
