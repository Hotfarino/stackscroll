"use client";

import { useRef, useState,  type ReactNode } from "react";
import { ArrowDown, ArrowRight, BookOpen, Check, ChevronRight, ExternalLink, Heart, Layers, Search, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { StackButton } from "./brand";
import { cards, type Card, type Topic } from "./content";
import { type LearningStack } from "./stacks";
import { stackCollections, collectionCards, collectionPractice, collectionSources, collectionMatchesSearch, type StackCollection } from "./stack-collections";
import "./stack-explorer.css";
import {Assembly} from "./stack-assembly";
import {PersonalStackWorkspace} from "./personal-stack-workspace";

function StackDiscovery({ onPractice, renderContent }: { onPractice: (stack: LearningStack) => void; renderContent: (card: Card) => ReactNode }) {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(stackCollections[0].id);
  const [layerIndex, setLayerIndex] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [tab, setTab] = useState("content");
  const [liked, setLiked] = useState<string[]>([]);
  const [followed, setFollowed] = useState<string[]>([]);
  const [inspecting, setInspecting] = useState<Card | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const ideaTrigger = useRef<HTMLButtonElement | null>(null);
  const stack = stackCollections.find(item => item.id === activeId)!;
  const layer = stack.layers[layerIndex];
  const visible = stackCollections.filter(item => collectionMatchesSearch(item, query));
  const layerCards = layer.cardIds.flatMap(id => { const card = cards.find(item => item.id === id); return card ? [card] : []; });
  const sources = collectionSources(stack);
  const practices = collectionPractice(stack);
  function open(item: StackCollection) {
    setActiveId(item.id); setLayerIndex(0); setExpanded(true); setTab("content");
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      const reduced = document.documentElement.dataset.motion === "reduced" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      heading.current?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" });
    });
  }
  function selectLayer(index: number) { setLayerIndex(index); setTab("content"); }
  function toggle(items: string[], id: string) { return items.includes(id) ? items.filter(item => item !== id) : [...items, id]; }

  return <div className="stack-explorer">
    <header className="stack-explorer-heading"><div><span className="eyebrow">YOUR INTERESTS, CONNECTED</span><h1>Find your Stack.</h1><p>A few interests. A direction that’s yours.</p></div><span className="stack-preview-label">Design preview</span></header>
    <div className="stack-search"><Search size={19} aria-hidden="true"/><Input aria-label="Search Stacks" placeholder="Search Stacks, topics, or skills" value={query} maxLength={200} onChange={event => setQuery(event.target.value)}/>{query && <button type="button" onClick={() => setQuery("")}>Clear</button>}</div>
    <div className="stack-discovery-label"><h2>Start somewhere interesting</h2><span aria-live="polite">{visible.length} {visible.length === 1 ? "Stack" : "Stacks"}</span></div>
    <div className="stack-discovery-grid">
      {visible.map((item, index) => <button type="button" className="stack-discovery-card" key={item.id} aria-label={`Explore ${item.name}`} aria-current={stack.id === item.id ? "true" : undefined} onClick={() => open(item)}>
        <div className="stack-tile-top"><span>0{index + 1}</span><span>{item.layers.length} layers</span></div>
        <Assembly stack={item}/><div className="stack-tile-copy"><h3>{item.name}</h3><p>{item.description}</p></div>
        <div className="stack-tile-footer"><span>{collectionCards(item).length} ideas · {collectionPractice(item).length} practice sequences</span><ArrowRight size={17}/></div>
      </button>)}
    </div>
    {visible.length === 0 && <div className="stack-search-empty"><h3>No Stack matches that yet.</h3><p>Try a topic such as cloud, code, or agents.</p><StackButton tone="secondary" onClick={() => setQuery("")}>Show all Stacks</StackButton></div>}

    <section className="stack-studio" aria-labelledby="active-stack-title">
      <div className="stack-studio-heading"><div><span className="eyebrow">INSIDE THE STACK</span><h2 id="active-stack-title" ref={heading} tabIndex={-1}>{stack.name}</h2><p>{stack.description}</p></div><span className="stack-curator">Stackscroll selection</span></div>
      <div className="stack-studio-body">
        <div className="stack-stage"><Assembly stack={stack} expanded={expanded} selected={layerIndex} onSelect={selectLayer}/><button type="button" className="stack-expand-control" onClick={() => setExpanded(value => !value)} aria-expanded={expanded}><Layers size={16}/>{expanded ? "Settle layers" : "Expand layers"}<ArrowDown size={15} className={expanded ? "is-expanded" : ""}/></button></div>
        <div className="stack-layer-list"><span className="eyebrow">CHOOSE A LAYER</span>{stack.layers.map((item, index) => <button type="button" key={item.topic} aria-pressed={layerIndex === index} className="stack-layer-choice" onClick={() => selectLayer(index)}><span className={`layer-swatch tone-${item.color}`}/><span><strong>{item.topic}</strong><small>{item.cardIds.length} ideas</small></span><ChevronRight size={18}/></button>)}<div className="stack-social-controls"><StackButton tone={followed.includes(stack.id) ? "secondary" : "primary"} aria-pressed={followed.includes(stack.id)} onClick={() => setFollowed(current => toggle(current, stack.id))}>{followed.includes(stack.id) ? <><Check size={16}/>Following</> : <>Follow Stack<ArrowRight size={16}/></>}</StackButton><button type="button" className="stack-like" aria-label={`${liked.includes(stack.id) ? "Unlike" : "Like"} ${stack.name} (preview)`} aria-pressed={liked.includes(stack.id)} onClick={() => setLiked(current => toggle(current, stack.id))}><Heart size={21} fill={liked.includes(stack.id) ? "currentColor" : "none"}/><span>{liked.includes(stack.id) ? "1" : "0"}</span></button></div><p className="stack-preview-note">Likes and follows are previews for this visit. They reset when you leave Stacks.</p></div>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="stack-detail-tabs"><TabsList variant="line" aria-label="Stack details"><TabsTrigger value="content">Ideas</TabsTrigger><TabsTrigger value="sources">Sources <span>{sources.length}</span></TabsTrigger><TabsTrigger value="path">Practice</TabsTrigger></TabsList>
        <TabsContent value="content"><div className="stack-topic-heading"><h3>{layer.topic}</h3><p>{layer.description}</p></div><div className="stack-idea-list">{layerCards.map(card => <button type="button" key={card.id} onClick={event => { ideaTrigger.current = event.currentTarget; setInspecting(card); }}><span className="stack-idea-kind">{card.kind}</span><span><strong>{card.title}</strong><small>{card.sourceName} · {card.level}</small></span><ArrowRight size={18}/></button>)}</div></TabsContent>
        <TabsContent value="sources"><div className="stack-topic-heading"><h3>Go straight to the source.</h3><p>References from this collection. Independent factual review is pending.</p></div><div className="stack-source-list">{sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><span>{source.name}<small>{new URL(source.url).hostname}</small></span><ExternalLink size={17}/></a>)}</div></TabsContent>
        <TabsContent value="path"><div className="stack-topic-heading"><h3>Turn an idea into practice.</h3><p>Choose a starting point. Each sequence has an explanation, a question, and a finish.</p></div><ul className="stack-path-list">{practices.map(practice => <li key={practice.id}><span className="stack-path-number"><BookOpen size={17}/></span><div><span className="stack-path-meta">{practice.topic} · {practice.minutes} min estimate</span><h4>{practice.title}</h4><p>{practice.description}</p><StackButton tone="secondary" onClick={() => onPractice(practice)}>Open practice<ArrowRight size={16}/></StackButton></div></li>)}</ul><p className="stack-preview-note">These are existing practice sequences. Completion does not grant earned access.</p></TabsContent>
      </Tabs>
    </section>
    <Sheet open={inspecting !== null} onOpenChange={open => { if (!open) setInspecting(null); }}><SheetContent className="stack-idea-sheet" showCloseButton={false} onCloseAutoFocus={event => { event.preventDefault(); ideaTrigger.current?.focus({ preventScroll: true }); }}><SheetClose asChild><button type="button" className="stack-idea-close" aria-label="Close idea"><X size={20}/></button></SheetClose><SheetHeader><SheetTitle>{inspecting?.title || "Explore an idea"}</SheetTitle><SheetDescription>{inspecting?.topic} · From {stack.name}</SheetDescription></SheetHeader><div className="stack-sheet-content">{inspecting && renderContent(inspecting)}</div></SheetContent></Sheet>
  </div>;
}

export function StackExplorer(props: {seedTopic?:Topic|null;onSeedConsumed?:()=>void;onPractice:(stack:LearningStack)=>void;renderContent:(card:Card)=>ReactNode}) {return <PersonalStackWorkspace {...props} discovery={<StackDiscovery {...props}/>}/>;}
