import { ArrowUpRight, Radar } from "lucide-react";
import type { CSSProperties } from "react";
import { topics, type Card, type Topic } from "./content";

const radarTopics: { topic: Topic; label: string; x: number; y: number }[] = [
  { topic: "Agentic AI", label: "AI agents", x: 50, y: 19 },
  { topic: "Cloud", label: "Cloud", x: 78, y: 35 },
  { topic: "Development", label: "Code", x: 76, y: 71 },
  { topic: "Data centers", label: "Data centers", x: 47, y: 83 },
  { topic: "Networking", label: "Networks", x: 22, y: 63 },
  { topic: "Machine learning", label: "ML", x: 24, y: 29 },
];

export function TopicRadar({ selected, onSelect }: { selected: Topic | "all"; onSelect: (topic: Topic | "all") => void }) {
  return <section className="topic-radar" aria-labelledby="topic-radar-title">
    <header><h2 id="topic-radar-title"><Radar size={17}/>Tech radar</h2><span>Browse topics</span></header>
    <div className="radar-map" role="group" aria-label="Choose a topic">
      <svg viewBox="0 0 280 260" aria-hidden="true" focusable="false">
        <g fill="none" stroke="currentColor"><circle cx="140" cy="130" r="108"/><circle cx="140" cy="130" r="74"/><circle cx="140" cy="130" r="38"/><path d="M140 15v230M20 130h240M58 48l164 164M58 212 222 48"/></g>
        <path className="radar-sector" d="M140 130 87 36A108 108 0 0 1 140 22Z"/>
      </svg>
      {radarTopics.map(item => <button type="button" key={item.topic} aria-pressed={selected === item.topic} onClick={() => onSelect(item.topic)} style={{ "--radar-x": `${item.x}%`, "--radar-y": `${item.y}%` } as CSSProperties}><i aria-hidden="true"/><span>{item.label}</span></button>)}
    </div>
    <p>Follow an interest into the feed.</p>
    <div className="radar-filters" role="group" aria-label="All topic filters">
      {(["all", ...topics] as const).map(topic => <button type="button" key={topic} aria-pressed={selected === topic} onClick={() => onSelect(topic)}>{topic === "all" ? "All topics" : topic}</button>)}
    </div>
  </section>;
}

export function FeaturedFind({ card }: { card: Card }) {
  return <section className="featured-find" aria-label="Featured source">
    <img src="/media/cards/agentic-systems.webp" width="1536" height="1024" alt=""/>
    <div className="featured-copy"><span className="eyebrow">Featured source · {card.topic}</span><h2>{card.title}</h2><p>{card.sourceName}{card.date ? ` · ${card.date}` : ""}</p><a href={card.source} target="_blank" rel="noopener noreferrer">Read at source<ArrowUpRight size={18}/></a></div>
    <small className="featured-art-credit">AI concept artwork</small>
  </section>;
}
