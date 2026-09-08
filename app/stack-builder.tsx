"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ExternalLink, LockKeyhole, Plus, Save, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StackButton } from "./brand";
import { cards, topics, type Topic } from "./content";
import { activationError, emphasisLabels, stackMix, type StackDefinition, type PersonalStack } from "./personal-stacks";
import type { PersonalStacksModel } from "./use-personal-stacks";
import { Assembly } from "./stack-assembly";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { stackSkins, type StackSkin } from "./stack-skins";

export type StackEditor = { id: string; initial: StackDefinition; record: PersonalStack | null };

export function StackBuilder({ editor, model, onClose, onActivated, returnFocus }: { editor: StackEditor; model: PersonalStacksModel; onClose: () => void; onActivated: (record: PersonalStack) => void; returnFocus: () => void }) {
  const [definition, setDefinition] = useState<StackDefinition>(() => structuredClone(editor.initial));
  const [id, setId] = useState(editor.id);
  const [revision, setRevision] = useState(editor.record?.revision ?? 0);
  const [step, setStep] = useState(0);
  const [adult, setAdult] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [notice, setNotice] = useState("");
  const baseline = useRef(editor.record ? JSON.stringify(editor.initial) : "");
  const stageTitle = useRef<HTMLHeadingElement>(null);
  const stepMounted = useRef(false);
  const dirty = JSON.stringify(definition) !== baseline.current;
  const latest = model.records.find(record => record.id === id);
  const conflict = !!latest && latest.revision !== revision;
  const mix = stackMix(definition);
  const candidates = stackMix({ ...definition, excludedIds: [] });
  const problem = activationError(definition);
  const canSave = model.status === "ready" && !model.busy && (model.eligible || adult) && !conflict;
  const preview = { id, skin: definition.skin || "prism", name: definition.name, description: definition.purpose, practiceIds: [], layers: definition.layers.map((layer, index) => ({ topic: layer.topic, label: layer.topic, color: ["blue", "lime", "orange", "pearl", "blue", "lime"][index], description: "", cardIds: [] })) };
  useEffect(() => { if (!stepMounted.current) { stepMounted.current = true; return; } stageTitle.current?.focus({ preventScroll: true }); }, [step]);
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", guard); return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  function close() { if (model.busy) return; if (dirty) setDiscard(true); else onClose(); }
  function topicChoice(topic: Topic, enabled: boolean) {
    setDefinition(current => ({ ...current, layers: enabled ? [...current.layers, { topic, emphasis: 2 as const }].slice(0, 6) : current.layers.filter(layer => layer.topic !== topic), excludedIds: current.excludedIds.filter(id => cards.some(card => card.id === id && card.topic !== topic)) }));
  }
  function move(index: number, direction: -1 | 1) {
    setDefinition(current => { const layers = [...current.layers]; const target = index + direction; if (target < 0 || target >= layers.length) return current; [layers[index], layers[target]] = [layers[target], layers[index]]; return { ...current, layers }; });
    setNotice(`Layer moved ${direction === -1 ? "up" : "down"}.`);
  }
  async function save(activate: boolean) {
    setNotice("");
    const record = await model.save(id, revision, definition, activate, adult);
    if (!record) return;
    setRevision(record.revision); setDefinition(record.draft); baseline.current = JSON.stringify(record.draft);
    if (activate) { onActivated(record); onClose(); }
    else setNotice("Draft saved to your account.");
  }
  return <><Sheet open onOpenChange={open => { if (!open) close(); }}><SheetContent className="stack-builder-sheet" showCloseButton={false} onCloseAutoFocus={event => { event.preventDefault(); returnFocus(); }} onEscapeKeyDown={event => { if (model.busy) event.preventDefault(); }}>
    <SheetHeader className="builder-header"><div><span className="builder-private"><LockKeyhole size={13}/>Private to you</span><SheetTitle>{editor.record ? "Customize your Stack" : "Build your Stack"}</SheetTitle><SheetDescription>Choose your focus. Shape your layers. Make it yours.</SheetDescription></div><button type="button" className="builder-close" aria-label="Close Stack builder" disabled={model.busy} onClick={close}><X size={21}/></button></SheetHeader>
    <ol className="builder-steps" aria-label="Build steps">{["Name & topics", "Layers & skins", "Preview"].map((name, index) => <li key={name}><button type="button" disabled={model.busy} onClick={() => setStep(index)} aria-current={step === index ? "step" : undefined}><span>{step > index ? <Check size={14}/> : index + 1}</span><strong>{name}</strong></button></li>)}</ol>
    <div className="builder-scroll"><h2 ref={stageTitle} tabIndex={-1} className="builder-stage-title">{["What are you building toward?", "Give each layer its place.", "See what’s coming your way."][step]}</h2>
      {step === 0 && <div className="builder-focus">
        <div className="builder-field"><label htmlFor="stack-name">Stack name</label><Input id="stack-name" value={definition.name} maxLength={80} placeholder="Give your Stack a name" disabled={model.busy} onChange={event => setDefinition(current => ({ ...current, name: event.target.value }))}/></div>
        <div className="builder-field"><label htmlFor="stack-purpose">Your purpose</label><Textarea id="stack-purpose" rows={3} maxLength={300} value={definition.purpose} placeholder="What do you want to learn or build?" disabled={model.busy} onChange={event => setDefinition(current => ({ ...current, purpose: event.target.value }))}/></div>
        <fieldset className="builder-topics"><legend>Topic layers <span>{definition.layers.length} / 6</span></legend><p>Choose up to six. You can adjust their emphasis next.</p><div>{topics.map(topic => { const selected = definition.layers.some(layer => layer.topic === topic); return <label key={topic} className={selected ? "selected" : ""}><Checkbox checked={selected} disabled={model.busy || (!selected && definition.layers.length >= 6)} onCheckedChange={value => topicChoice(topic, value === true)}/><span>{topic}</span><small>{cards.filter(card => card.topic === topic).length} ideas</small></label>; })}</div></fieldset>
      </div>}
      {step === 1 && <div className="builder-layers"><div className="builder-assembly"><Assembly stack={preview}/></div><p className="builder-explanation">Order shapes the visual. Emphasis puts more of that topic near the start of your mix.</p><fieldset className="builder-skins"><legend>Your Stack’s skin</legend><RadioGroup value={definition.skin || "prism"} disabled={model.busy} onValueChange={skin => setDefinition(current => ({ ...current, skin: skin as StackSkin }))} className="stack-skin-options">{stackSkins.map(skin => <label key={skin.id} className="stack-skin-choice" data-selected={(definition.skin || "prism") === skin.id}><Assembly stack={{ ...preview, skin: skin.id }}/><span><RadioGroupItem value={skin.id} id={`skin-${skin.id}`}/><strong>{skin.name}</strong></span><small>{skin.description}</small></label>)}</RadioGroup><p>Only the look changes. Your topics, content order, and practice results stay the same.</p></fieldset>{definition.layers.length === 0 && <StackButton tone="secondary" onClick={() => setStep(0)}><Plus size={16}/>Choose topics first</StackButton>}<div className="builder-layer-rows">{definition.layers.map((layer, index) => <div className="builder-layer-row" key={layer.topic}><div className="builder-layer-name"><span>{index + 1}</span><strong>{layer.topic}</strong><button type="button" aria-label={`Remove ${layer.topic}`} disabled={model.busy} onClick={() => topicChoice(layer.topic, false)}><X size={17}/></button></div><div className="builder-layer-settings"><Select value={String(layer.emphasis)} disabled={model.busy} onValueChange={value => setDefinition(current => ({ ...current, layers: current.layers.map(item => item.topic === layer.topic ? { ...item, emphasis: Number(value) as 1 | 2 | 3 } : item) }))}><SelectTrigger aria-label={`${layer.topic} emphasis`}><SelectValue/></SelectTrigger><SelectContent className="builder-select-content">{Object.entries(emphasisLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><div className="builder-order"><button type="button" aria-label={`Move ${layer.topic} up`} disabled={model.busy || index === 0} onClick={() => move(index, -1)}><ArrowUp size={18}/></button><button type="button" aria-label={`Move ${layer.topic} down`} disabled={model.busy || index === definition.layers.length - 1} onClick={() => move(index, 1)}><ArrowDown size={18}/></button></div></div></div>)}</div></div>}
      {step === 2 && <div className="builder-preview"><div className="builder-preview-title"><h3>{definition.name || "Untitled Stack"}</h3><p>{definition.purpose || "Add a purpose in Name & topics."}</p><span>{mix.length} ideas · {new Set(mix.map(card => card.source)).size} sources</span></div><p className="builder-explanation">This is your starting mix from the current library. Remove anything that doesn’t fit. New material won’t silently change this version.</p>{candidates.length === 0 && <p>Choose a topic to see its content.</p>}<div className="builder-preview-ideas">{[...mix, ...candidates.filter(card => definition.excludedIds.includes(card.id))].map(card => <div className="builder-preview-idea" key={card.id}><Checkbox id={`include-${card.id}`} checked={!definition.excludedIds.includes(card.id)} disabled={model.busy} onCheckedChange={checked => setDefinition(current => ({ ...current, excludedIds: checked === true ? current.excludedIds.filter(id => id !== card.id) : [...current.excludedIds, card.id] }))}/><div><label htmlFor={`include-${card.id}`}>{card.title}</label><small>{card.topic} · {card.kind}</small><a href={card.source} target="_blank" rel="noopener noreferrer">{card.sourceName}<ExternalLink size={13}/></a></div></div>)}</div><p className="builder-explanation">Source links are included. Independent factual review is pending. Watching or reading does not grant earned access.</p></div>}
      {!model.eligible && <label className="builder-adult"><Checkbox checked={adult} disabled={model.busy} onCheckedChange={value => setAdult(value === true)}/><span>I confirm that I’m 18 or older.<small>Required to save. We record your confirmation, not your date of birth.</small></span></label>}
      {model.error && <div className="builder-error" role="alert"><p>{model.error}</p>{conflict && <StackButton tone="secondary" onClick={() => { setId(crypto.randomUUID()); setRevision(0); baseline.current = ""; model.clearError(); setNotice("Your draft is now a new private Stack. Save when ready."); }}>Keep this draft as a new Stack</StackButton>}</div>}
      {step === 2 && problem && <p className="builder-validation">{problem}</p>}
      <p className="builder-save-status" role="status">{model.busy ? "Saving…" : notice || (dirty ? "Unsaved draft" : "Saved to your account")}</p>
    </div>
    <footer className="builder-footer"><div><StackButton tone="quiet" disabled={model.busy || step === 0} onClick={() => setStep(value => value - 1)}><ArrowLeft size={17}/>Back</StackButton><StackButton tone="secondary" disabled={!canSave} onClick={() => void save(false)}><Save size={16}/>Save draft</StackButton></div>{step < 2 ? <StackButton tone="primary" disabled={model.busy} onClick={() => setStep(value => value + 1)}>Continue<ArrowRight size={17}/></StackButton> : <StackButton tone="primary" disabled={!canSave || !!problem} onClick={() => void save(true)}>{editor.record?.active ? "Update Stack" : "Use this Stack"}<Check size={17}/></StackButton>}</footer>
  </SheetContent></Sheet><AlertDialog open={discard} onOpenChange={setDiscard}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Leave this unsaved draft?</AlertDialogTitle><AlertDialogDescription>Your last saved version is kept. Changes since your last save will be discarded.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction onClick={onClose}>Discard changes</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></>;
}
