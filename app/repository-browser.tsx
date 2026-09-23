"use client";
import {useState} from "react";
import {GitFork,ExternalLink,Bookmark,Layers} from "lucide-react";
import type {Card,Topic} from "./content";
import {permittedCatalogExcerpt} from "./content-rights";
import {StackButton} from "./brand";

export function RepositoryBrowser({cards,query,saved,onSave,onBuild}:{cards:Card[];query:string;saved:Card[];onSave:(card:Card)=>void;onBuild:(topic:Topic)=>void}){
 const [topic,setTopic]=useState("all");
 const repos=cards.filter(card=>card.catalog?.format==="repository"&&/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(card.source));
 const topics=[...new Set(repos.map(card=>card.topic))];
 const terms=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
 const shown=repos.filter(card=>(topic==="all"||card.topic===topic)&&terms.every(term=>`${card.title} ${card.source} ${card.topic} ${card.catalog?.tags.join(" ")} ${permittedCatalogExcerpt(card)??""}`.toLowerCase().includes(term)));
 return <section className="repository-browser"><div className="page-heading"><div><span className="eyebrow">OPEN THE CODE</span><h1>GitHub Repos</h1><p>Projects to inspect, learn from, and bring into your Stacks.</p></div></div><div className="repo-filters" aria-label="Repository topics">{["all",...topics].map(value=><StackButton key={value} tone={topic===value?"primary":"secondary"} aria-pressed={topic===value} onClick={()=>setTopic(value)}>{value==="all"?"All repos":value}</StackButton>)}</div><p role="status">{shown.length} repositories · Curated library</p>{!shown.length&&<p>No repositories match. Try another topic or search.</p>}<div className="repository-list">{shown.map(card=>{const isSaved=saved.some(item=>item.id===card.id);return <article className="learning-card repository-card" key={card.id}><div className="repo-identity"><GitFork size={32} className="repo-nav-icon"/><div><span className="eyebrow">{card.topic}</span><h2><a href={card.source} target="_blank" rel="noopener noreferrer">{card.source.replace("https://github.com/","")}<ExternalLink size={16}/></a></h2></div></div><p>{permittedCatalogExcerpt(card)||card.body||card.title}</p><div className="catalog-tags">{card.catalog?.tags.slice(0,4).map(tag=><span key={tag}>{tag}</span>)}</div>{card.catalog?.prompt&&<details><summary>Something to try</summary><p>{card.catalog.prompt}</p></details>}<footer><StackButton tone="secondary" onClick={()=>onBuild(card.topic)}><Layers size={16}/>Build a Stack</StackButton><StackButton tone="quiet" aria-pressed={isSaved} onClick={()=>onSave(card)}><Bookmark size={16}/>{isSaved?"Saved":"Save"}</StackButton><a href={card.source} target="_blank" rel="noopener noreferrer">View repo<ExternalLink size={15}/></a></footer><small>Source listing checked {card.catalog?.checkedAt.slice(0,10)}. Check the repository for current activity and license.</small></article>;})}</div></section>;
}
