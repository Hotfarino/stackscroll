"use client";
import { useState } from "react";
import {BookOpen, ExternalLink, Headphones, Play, Smile, Sparkles, ArrowRight, Code2} from "lucide-react";
import {Bookmark} from "./reference-bookmark";
import { StackButton } from "./brand";
import type { Card } from "./content";
import { CardArt } from "./card-art";
import "./catalog.css";

const labels = { guide: "Field guide", reference: "Under the hood", article: "Engineering article", repository: "Open-source find", podcast: "Listen in", video: "Watch at source", humor: "Tech break", practice: "Try it" };
const icons = { guide: BookOpen, reference: Code2, article: BookOpen, repository: Code2, podcast: Headphones, video: Play, humor: Smile, practice: Sparkles };

export function CatalogCard({ card, saved, onSave, onBuild }: { card: Card; saved: boolean; onSave: () => void; onBuild: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const meta = card.catalog!;
  const Icon = icons[meta.format];
  const humor = card.kind === "humor";
  const media = meta.format === "video" || meta.format === "podcast";
  const featured = meta.format === "article" || media;
  return <article className={`learning-card catalog-card catalog-${meta.format} ${humor ? "catalog-humor" : ""}`} data-topic={card.topic}>
    <div className="card-top"><div className="topic-icon"><Icon size={19}/></div><div className="card-author"><strong>{card.topic}</strong><span>{humor ? "Stackscroll original" : card.sourceName}</span></div><span className="kind-badge"><Icon size={13}/>{labels[meta.format]}</span></div>
    {!humor && <CardArt topic={card.topic} layout={meta.format === "podcast" ? "podcast" : featured ? "cover" : "compact"} format={media ? meta.format as "video" | "podcast" : undefined} href={featured ? card.source : undefined} label={media ? undefined : meta.format === "repository" ? "Build something" : meta.format === "reference" ? "Under the hood" : "Field notes"}/>}
    <div className="card-main">
      {humor ? <div className="humor-scene"><div className="humor-terminal-head"><span/><span/><span/><small>life-in-tech.log</small></div><h2 className="humor-setup">{card.title}</h2><CardArt topic={card.topic} layout="humor"/><div className="humor-punchline">{card.body}<span className="humor-cursor" aria-hidden="true">▋</span></div>{card.code && <pre>{card.code}</pre>}<span className="humor-signature">stackscroll / tech break</span></div> : <><h2>{card.title}</h2>{card.date && <p className="catalog-publication">Published {new Date(card.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</p>}{meta.excerpt && <blockquote className="catalog-excerpt"><span>From the publisher</span><p>“{meta.excerpt}”</p></blockquote>}{card.body && <p className="card-body">{card.body}</p>}<div className="catalog-tags">{meta.tags.slice(0, 4).map(tag => <span key={tag}>{tag}</span>)}</div></>}
      {!humor && <a className="catalog-open" href={card.source} target="_blank" rel="noopener noreferrer">{meta.format === "podcast" ? "Listen at the publisher" : meta.format === "video" ? "Watch at the publisher" : meta.format === "repository" ? "Explore the repository" : "Open the full source"}<ExternalLink size={16}/></a>}
      {meta.prompt && <details className="catalog-next"><summary><Sparkles size={15}/>{humor ? "There’s a real idea underneath" : "Make the connection"}</summary><p>{meta.prompt}</p>{humor && <a href={card.source} target="_blank" rel="noopener noreferrer">Explore the related concept<ExternalLink size={13}/></a>}<StackButton tone="quiet" onClick={onBuild}>Bring this topic into a Stack<ArrowRight size={15}/></StackButton></details>}
    </div>
    <div className="catalog-provenance"><button type="button" onClick={() => setRevealed(!revealed)} aria-expanded={revealed}>{humor ? "Original humor · not an incident report" : "Source preview · opens externally"}<span>{revealed ? "−" : "+"}</span></button>{revealed && <div><p>{humor ? "Written for Stackscroll. Scenarios are fictional; the link explores the underlying technical idea." : "A discovery link and short publisher preview. The full work stays with its publisher. This listing is not an independent fact-check or a redistribution license."}</p><p>{humor ? "Related source checked" : "Publisher listing checked"} {new Date(meta.checkedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}.{card.date && ` Published ${new Date(card.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}.`}</p></div>}</div>
    <footer className="card-footer"><span className="catalog-publisher">{humor ? "Stackscroll original" : card.sourceName}</span><button className={`icon-button save-button ${saved ? "is-saved" : ""}`} aria-label={`${saved ? "Unsave" : "Save"} ${card.title}`} aria-pressed={saved} onClick={onSave}><Bookmark size={18} fill={saved ? "currentColor" : "none"}/></button></footer>
  </article>;
}
