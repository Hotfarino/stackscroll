import type {LucideProps} from "lucide-react";
import {ReferenceIcon} from "./reference-icon";
export function Bookmark({size=24,className=""}:LucideProps) {
 return <ReferenceIcon name="saved" size={typeof size==="number"?size:Number(size)||24} className={className}/>;
}
