"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowRight, ChevronRight, Download, ExternalLink, Layers, LockKeyhole, Pencil, Plus, Trash2, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { StackButton } from "./brand";
import { Assembly } from "./stack-assembly";
import { StackBuilder, type StackEditor } from "./stack-builder";
import { usePersonalStacks } from "./use-personal-stacks";
import { aiInfrastructureStarter, emptyStack, personalCollection, emphasisLabels, type PersonalStack } from "./personal-stacks";
import { collectionMatchesSearch, collectionSources, collectionPractice } from "./stack-collections";
import { cardMatchesSearch } from "./content-search";
import { cards, cardById, type Card, type Topic } from "./content";
import type { LearningStack } from "./stacks";
import "./stack-builder.css";

export function PersonalStackWorkspace({ discovery, onPractice, renderContent, seedTopic, onSeedConsumed }: { seedTopic?: Topic | null; onSeedConsumed?: () => void; discovery: ReactNode; onPractice: (stack: LearningStack) => void; renderContent: (card: Card) => ReactNode }) {
  const model = usePersonalStacks();
  const [view, setView] = useState("mine");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<StackEditor | null>(null);
  const [deleting, setDeleting] = useState<PersonalStack | null>(null);
  const builderTrigger = useRef<HTMLElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const activated = useRef(false);
  const handledSeed = useRef<Topic | null>(null);
  useEffect(() => {
    if (!seedTopic) { handledSeed.current = null; return; }
    if (model.status !== "ready" || handledSeed.current === seedTopic) return;
    handledSeed.current = seedTopic;
    setView("mine");
    setEditor({ id: crypto.randomUUID(), record: null, initial: { ...emptyStack(), name: `${seedTopic} Stack`, purpose: `Explore ${seedTopic} and connect useful ideas through practice.`, layers: [{ topic: seedTopic, emphasis: 3 }] } });
    onSeedConsumed?.();
  }, [seedTopic, model.status, onSeedConsumed]);
  const selected = model.records.find(record => record.id === selectedId && record.active);
  const visible = model.records.filter(record => collectionMatchesSearch(personalCollection(record), query) || record.draft.name.toLowerCase().includes(query.toLowerCase()));
  function build(record?: PersonalStack, blank = false) {
    activated.current = false; builderTrigger.current = document.activeElement as HTMLElement; model.clearError();
    setEditor({ id: record?.id || crypto.randomUUID(), initial: record?.draft || (blank ? emptyStack() : aiInfrastructureStarter()), record: record || null });
  }
  function open(record: PersonalStack) {
    if (!record.active) { build(record); return; }
    setSelectedId(record.id);
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
    const reduced = document.documentElement.dataset.motion === "reduced" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });
  }
  function download(record: PersonalStack) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `stack-${record.id}.json`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="stack-explorer personal-stack-workspace">
    <header className="stack-explorer-heading"><div><span className="eyebrow">YOUR INTERESTS, CONNECTED</span><h1 ref={heading} tabIndex={-1}>{selected && view === "mine" ? selected.active!.definition.name : "Your Stacks."}</h1></div><StackButton tone="primary" disabled={model.status !== "ready" || model.busy} onClick={() => build(undefined, true)}><Plus size={18}/>Build a Stack</StackButton></header>
    <Tabs value={view} onValueChange={setView}><TabsList variant="line" className="stack-browse-tabs" aria-label="Stack collections"><TabsTrigger value="mine">My Stacks <span>{model.records.length}</span></TabsTrigger><TabsTrigger value="discover">Discover</TabsTrigger></TabsList>
      <TabsContent value="mine">
        <p className="stack-customize-help">Choose <strong>Customize</strong> on a Stack to change its name, topics, layers, and skin.</p>
        {model.status === "loading" && <p className="stack-account-status" role="status">Loading your private Stacks…</p>}
        {model.error && !editor && <div className="stack-account-status" role="alert"><p>{model.error}</p><StackButton tone="secondary" disabled={model.busy} onClick={() => void model.refresh()}>Reload my Stacks</StackButton></div>}
        {selected ? <><div className="personal-stack-toolbar"><StackButton tone="quiet" onClick={() => setSelectedId(null)}>All my Stacks</StackButton><StackButton tone="secondary" onClick={() => build(selected)}><Pencil size={16}/>Customize</StackButton></div><OwnedStack key={`${selected.id}-${selected.activeVersion}`} record={selected} onPractice={onPractice} renderContent={renderContent}/></> : <>
          {model.status === "ready" && model.records.length === 0 && <section className="stack-first-build"><div className="stack-first-art"><Assembly stack={personalCollection({ id: "starter", draft: aiInfrastructureStarter(), revision: 0, active: null, activeVersion: null, createdAt: 0, updatedAt: 0 })}/></div><div><span className="eyebrow">A STARTING POINT FOR YOU</span><h2>AI systems, from code to infrastructure.</h2><p>Agentic coding and machine learning up front. Data center fundamentals underneath.</p><StackButton tone="primary" onClick={() => build()}>Build from this starting point<ArrowRight size={17}/></StackButton><p className="stack-preview-note">Name it, choose a skin, and shape the topics around your curiosity.</p></div></section>}
          {model.records.length > 0 && <div className="stack-search"><Input value={query} maxLength={200} onChange={event => setQuery(event.target.value)} aria-label="Search my Stacks" placeholder="Search your Stacks or their content"/>{query && <button type="button" onClick={() => setQuery("")}>Clear</button>}</div>}
          <div className="my-stacks-grid">{visible.map(record => { const stack = personalCollection(record); return <article key={record.id} className="my-stack-card"><button type="button" className="my-stack-open" onClick={() => open(record)}><Assembly stack={stack}/><span><small><LockKeyhole size={12}/>{record.active ? `Active · version ${record.activeVersion}` : "Private draft"}</small><strong>{stack.name}</strong><span>{stack.layers.length} layers · {record.active?.contentIds.length || 0} active ideas</span></span><ChevronRight size={19}/></button><div className="my-stack-actions"><StackButton tone="quiet" onClick={() => build(record)}><Pencil size={15}/>{record.active ? "Customize" : "Continue draft"}</StackButton>{record.active && JSON.stringify(record.draft) !== JSON.stringify(record.active.definition) && <span>Draft changes saved</span>}<button type="button" aria-label={`Download ${stack.name}`} onClick={() => download(record)}><Download size={17}/></button><button type="button" aria-label={`Delete ${stack.name}`} onClick={() => setDeleting(record)}><Trash2 size={17}/></button></div></article>; })}</div>
          {query && visible.length === 0 && <p className="stack-account-status">No saved Stack matches this search.</p>}
        </>}
      </TabsContent><TabsContent value="discover">{discovery}</TabsContent>
    </Tabs>
    {editor && <StackBuilder key={editor.id} editor={editor} model={model} onClose={() => setEditor(null)} onActivated={record => { activated.current = true; setView("mine"); open(record); }} returnFocus={() => { if (activated.current) heading.current?.focus({ preventScroll: true }); else if (builderTrigger.current?.isConnected) builderTrigger.current.focus({ preventScroll: true }); else heading.current?.focus({ preventScroll: true }); }}/>}
    <AlertDialog open={deleting !== null} onOpenChange={open => { if (!open && !model.busy) setDeleting(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this private Stack?</AlertDialogTitle><AlertDialogDescription>This removes its drafts and saved versions. Your separate practice progress and saved cards are kept.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={model.busy}>Cancel</AlertDialogCancel><AlertDialogAction disabled={model.busy} onClick={event => { event.preventDefault(); if (deleting) void model.remove(deleting).then(ok => { if (ok) { if (selectedId === deleting.id) setSelectedId(null); setDeleting(null); } }); }}>Delete Stack</AlertDialogAction></AlertDialogFooter>{model.error && <p role="alert" className="builder-error">{model.error}</p>}</AlertDialogContent></AlertDialog>
  </div>;
}

function OwnedStack({ record, onPractice, renderContent }: { record: PersonalStack; onPractice: (stack: LearningStack) => void; renderContent: (card: Card) => ReactNode }) {
  const stack = personalCollection(record);
  const [tab, setTab] = useState("mix");
  const [contentQuery, setContentQuery] = useState("");
  const [contentLimit, setContentLimit] = useState(24);
  const [layerIndex, setLayerIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [inspecting, setInspecting] = useState<Card | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const layer = stack.layers[layerIndex];
  const sources = collectionSources(stack);
  const practices = collectionPractice(stack);
  const mix = record.active!.contentIds.flatMap(id => { const card = cardById.get(id); return card ? [card] : []; });
  const list = (items: Card[]) => {
    const results = items.filter(card => cardMatchesSearch(card, contentQuery));
    return <><div className="catalog-list-controls"><Input type="search" aria-label="Search this Stack’s content" placeholder="Find an idea in this Stack" maxLength={200} value={contentQuery} onChange={event => { setContentQuery(event.target.value); setContentLimit(24); }}/><p role="status">{results.length} ideas{contentQuery ? " match your search" : " in this selection"}</p></div><div className="stack-idea-list">{results.slice(0, contentLimit).map(card => <button type="button" key={card.id} onClick={event => { trigger.current = event.currentTarget; setInspecting(card); }}><span className="stack-idea-kind">{card.kind === "resource" ? "guide" : card.kind}</span><span><strong>{card.title}</strong><small>{card.topic} · {card.sourceName}</small></span><ArrowRight size={18}/></button>)}</div>{contentLimit < results.length ? <StackButton tone="secondary" className="catalog-list-more" onClick={() => setContentLimit(value => value + 24)}>Show 24 more ideas</StackButton> : <p className="stack-mix-finish">{contentQuery ? "End of these search results." : "You’ve reached the end of this selection."}</p>}</>;
  };
  function select(index: number) { setLayerIndex(index); setTab("layer"); setContentQuery(""); setContentLimit(24); }
  return <section className="owned-stack" data-stack-skin={stack.skin || "prism"}><p className="owned-stack-purpose">{stack.description}</p><span className="builder-private"><LockKeyhole size={13}/>Private · version {record.activeVersion}</span><div className="stack-studio-body"><div className="stack-stage"><Assembly stack={stack} expanded={expanded} selected={layerIndex} onSelect={select}/><button type="button" className="stack-expand-control" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}><Layers size={16}/>{expanded ? "Settle" : "Expand"}<ArrowDown size={15}/></button></div><div className="stack-layer-list">{stack.layers.map((item, index) => <button type="button" key={item.topic} aria-pressed={layerIndex === index} className="stack-layer-choice" onClick={() => select(index)}><span className={`layer-swatch tone-${item.color}`}/><span><strong>{item.topic}</strong><small>{emphasisLabels[record.active!.definition.layers[index].emphasis]} · {item.cardIds.length} ideas</small></span><ChevronRight size={18}/></button>)}</div></div>
    <Tabs value={tab} onValueChange={value => { setTab(value); setContentLimit(24); setContentQuery(""); }} className="stack-detail-tabs"><TabsList variant="line" aria-label="Your Stack details"><TabsTrigger value="mix">My mix</TabsTrigger><TabsTrigger value="layer">Layer</TabsTrigger><TabsTrigger value="sources">Sources</TabsTrigger><TabsTrigger value="practice">Practice</TabsTrigger></TabsList>
      <TabsContent value="mix"><div className="stack-topic-heading"><h3>Your emphasis sets the mix.</h3><p>{mix.length} ideas in this version. Edit and update your Stack when you want to change it.</p></div>{list(mix)}</TabsContent>
      <TabsContent value="layer"><div className="stack-topic-heading"><h3>{layer.topic}</h3><p>{layer.description}</p></div>{list(mix.filter(card => card.topic === layer.topic))}</TabsContent>
      <TabsContent value="sources"><div className="stack-topic-heading"><h3>Go straight to the source.</h3><p>References for the ideas and practice in this Stack. Independent factual review is pending.</p></div><div className="stack-source-list">{sources.slice(0, contentLimit).map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><span>{source.name}<small>{new URL(source.url).hostname}</small></span><ExternalLink size={17}/></a>)}</div>{contentLimit < sources.length && <StackButton tone="secondary" className="catalog-list-more" onClick={() => setContentLimit(value => value + 24)}>Show 24 more sources</StackButton>}</TabsContent>
      <TabsContent value="practice"><div className="stack-topic-heading"><h3>Try a related task.</h3><p>Each sequence has an explanation, a question, and a finish.</p></div>{practices.length === 0 && <p>No authored practice sequence is available for these layers yet.</p>}<div className="owned-practice-list">{practices.map(practice => <article key={practice.id}><span>{practice.topic} · {practice.minutes} min estimate</span><h4>{practice.title}</h4><p>{practice.description}</p><StackButton tone="secondary" onClick={() => onPractice(practice)}>Open practice<ArrowRight size={16}/></StackButton></article>)}</div><p className="stack-preview-note">Practice progress is separate from this Stack. Completion does not grant earned access.</p></TabsContent>
    </Tabs>
    <Sheet open={inspecting !== null} onOpenChange={open => { if (!open) setInspecting(null); }}><SheetContent className="stack-idea-sheet" showCloseButton={false} onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus({ preventScroll: true }); }}><SheetClose asChild><button type="button" className="stack-idea-close" aria-label="Close idea"><X size={20}/></button></SheetClose><SheetHeader><SheetTitle>{inspecting?.title || "Explore an idea"}</SheetTitle><SheetDescription>{inspecting?.topic} · From {stack.name}</SheetDescription></SheetHeader><div className="stack-sheet-content">{inspecting && renderContent(inspecting)}</div></SheetContent></Sheet>
  </section>;
}
