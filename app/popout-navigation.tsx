"use client";
import type {CSSProperties} from "react";
import {Menu,GitFork,Check} from "lucide-react";
import {DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem,DropdownMenuLabel,DropdownMenuSeparator} from "@/components/ui/dropdown-menu";
import {ReferenceIcon,type ReferenceIconName} from "./reference-icon";

type Destination = "feed"|"explore"|"stacks"|"practice"|"repos"|"saved";
const artwork:Partial<Record<Destination,ReferenceIconName>>={feed:"discover",explore:"radar",stacks:"stacks",practice:"lab",saved:"saved"};
export function PopoutNavigation({items,view,onNavigate,due=0}:{items:readonly {id:Destination;label:string;detail:string}[];view:Destination;onNavigate:(view:Destination)=>void;due?:number}){
 return <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="popout-trigger" aria-label="Open workspace menu"><Menu size={20}/><span>Menu</span></button></DropdownMenuTrigger>
 <DropdownMenuContent className="workspace-popout" align="start" sideOffset={10} collisionPadding={12}>
  <DropdownMenuLabel>YOUR WORKSPACE</DropdownMenuLabel><DropdownMenuSeparator/>
  {items.map((item,index)=><DropdownMenuItem key={item.id} className="workspace-popout-item" style={{"--item-order":index} as CSSProperties} aria-current={view===item.id?"page":undefined} onSelect={()=>onNavigate(item.id)}>
   {item.id==="repos"?<GitFork size={28}/>:<ReferenceIcon name={artwork[item.id]!} size={28}/>}
   <span className="popout-copy"><strong>{item.label}</strong><small>{item.detail}</small></span>
   {item.id==="practice"&&due>0&&<span className="popout-due" aria-label={`${due} reviews due`}>{due}</span>}
   {view===item.id&&<Check size={16} className="popout-current"/>}
  </DropdownMenuItem>)}
 </DropdownMenuContent></DropdownMenu>;
}
