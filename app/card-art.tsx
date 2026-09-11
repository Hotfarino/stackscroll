import { ArrowUpRight, Headphones, Layers, Play } from "lucide-react";
import "./card-visuals.css";

type ArtLayout = "cover" | "compact" | "podcast" | "humor";

/** Original conceptual covers, never publisher thumbnails or incident photographs. */
export function CardArt({ topic, layout = "cover", href, format, label }: {
  topic: string;
  layout?: ArtLayout;
  href?: string;
  format?: "video" | "podcast";
  label?: string;
}) {
  const hardware = ["Networking", "CompTIA", "CCNA", "Cloud", "Data centers"].includes(topic);
  const asset = layout === "humor" ? "tech-break" : hardware ? "infrastructure" : "agentic-systems";
  const Icon = format === "video" ? Play : format === "podcast" ? Headphones : Layers;
  const content = <>
    <img className="card-art-image" src={`/media/cards/${asset}.webp`} width={1536} height={1024} loading="lazy" decoding="async" alt=""/>
    <span className="card-art-label"><Icon size={14}/>{label || (format === "podcast" ? "Ideas worth listening to" : format === "video" ? "Press into a new idea" : "Inside the stack")}</span>
    <span className="card-art-credit">AI topic artwork</span>
    {href && <span className="card-art-link"><ArrowUpRight size={20}/><span className="sr-only">Open source</span></span>}
    {layout === "podcast" && <span className="card-art-wave" aria-hidden="true">{[12,22,34,18,42,28,48,36,20,40,28,14,30,44,22,34,18,12].map((height,i)=><i key={i} style={{height}}/>)}</span>}
  </>;
  const className = `card-art art-${layout} art-${asset}`;
  return href ? <a className={className} href={href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${topic} ${format === "podcast" ? "podcast" : format === "video" ? "video" : "source"} at the publisher`}>{content}</a> : <div className={className}>{content}</div>;
}

/** Native UI geometry ties recall cards to the user's personal stack. */
export function RecallStack() {
  return <span className="recall-stack" aria-hidden="true"><span/><span/><span><Layers size={24} strokeWidth={1.5}/></span></span>;
}
