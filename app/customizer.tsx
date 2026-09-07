"use client";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { SlidersHorizontal, Rows3, ScanLine, List, Check, RotateCcw, Pin, ArrowRight } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { topics } from "./content";
import { defaultPreferences, preferenceKey, readPreferences, type Preferences } from "./preferences";

export function useDisplayPreferences() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [loaded, setLoaded] = useState(false);
  const [canSave, setCanSave] = useState(true);
  const warned = useRef(false);
  useEffect(() => {
    try { setPreferences(readPreferences(localStorage.getItem(preferenceKey))); }
    catch { setCanSave(false); }
    setLoaded(true);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.skin = preferences.skin;
    root.dataset.density = preferences.density;
    root.dataset.motion = preferences.reduceMotion ? "reduced" : "system";
    root.dataset.sources = preferences.expandSources ? "expanded" : "collapsed";
    root.style.fontSize = `${preferences.textScale}%`;
    root.classList.toggle("dark", preferences.skin !== "daylight");
    if (!loaded) return;
    try { localStorage.setItem(preferenceKey, JSON.stringify(preferences)); }
    catch {
      setCanSave(false);
      if (!warned.current) { toast("Display changes apply for this session. Device storage is unavailable."); warned.current = true; }
    }
  }, [preferences, loaded]);
  return { preferences, setPreferences, canSave };
}

export function Customizer({ preferences: p, onChange, canSave }: {
  preferences: Preferences; onChange: Dispatch<SetStateAction<Preferences>>; canSave: boolean;
}) {
  function set<K extends keyof Preferences>(key: K, value: Preferences[K]) { onChange(current => ({ ...current, [key]: value })); }
  return <Sheet>
    <SheetTrigger asChild><button className="customize-trigger" aria-label="Customize your interface"><SlidersHorizontal size={17}/><span>Customize</span></button></SheetTrigger>
    <SheetContent className="customizer" aria-describedby="customizer-description">
      <SheetHeader className="customizer-header">
        <span className="customizer-kicker">STACKSCROLL / YOUR SPACE</span>
        <SheetTitle className="customizer-title">Set your rhythm.</SheetTitle>
        <SheetDescription id="customizer-description">{canSave ? "Changes apply immediately and save on this device." : "Changes apply for this session. Device storage is unavailable."}</SheetDescription>
      </SheetHeader>
      <div className="customizer-body">
        <section className="custom-section">
          <div className="setting-heading"><h3>01 / Reading layout</h3></div>
          <RadioGroup value={p.layout} onValueChange={value => set("layout", value as Preferences["layout"])} className="layout-choices" aria-label="Reading layout">
            {[
              {id:"stream",name:"Stream",detail:"The continuous feed",icon:Rows3},
              {id:"focus",name:"Focus",detail:"One card at a time",icon:ScanLine},
              {id:"index",name:"Index",detail:"Browse, then open",icon:List},
            ].map(option => <label className={`layout-choice ${p.layout === option.id ? "chosen" : ""}`} key={option.id}>
              <RadioGroupItem value={option.id} className="setting-radio"/>
              <option.icon size={23}/><strong>{option.name}</strong><span>{option.detail}</span>
            </label>)}
          </RadioGroup>
        </section>
        <section className="custom-section">
          <div className="setting-heading"><h3>02 / Color & light</h3></div>
          <RadioGroup value={p.skin} onValueChange={value => set("skin", value as Preferences["skin"])} className="skin-choices" aria-label="Color theme">
            {[
              {id:"signal",name:"Signal",detail:"Charcoal / lime"},
              {id:"midnight",name:"Midnight",detail:"Ink / ice"},
              {id:"daylight",name:"Daylight",detail:"White / cobalt"},
            ].map(option => <label className={`skin-choice ${p.skin === option.id ? "chosen" : ""}`} key={option.id}>
              <RadioGroupItem value={option.id} className="setting-radio"/>
              <span className={`theme-swatch swatch-${option.id}`} aria-hidden="true"><i/><i/><i/>{p.skin === option.id && <Check size={16}/>}</span>
              <strong>{option.name}</strong><span>{option.detail}</span>
            </label>)}
          </RadioGroup>
        </section>
        <section className="custom-section">
          <div className="setting-heading"><h3>03 / Type & spacing</h3></div>
          <p className="setting-label" id="type-label">Reading size</p>
          <RadioGroup value={String(p.textScale)} onValueChange={value => set("textScale", Number(value) as Preferences["textScale"])} className="segmented-setting" aria-labelledby="type-label">
            {[{value:100,label:"Standard"},{value:112,label:"Large"},{value:125,label:"Extra large"}].map(option => <label key={option.value} className={p.textScale === option.value ? "chosen" : ""}><RadioGroupItem value={String(option.value)} className="setting-radio"/>{option.label}</label>)}
          </RadioGroup>
          <p className="setting-label" id="spacing-label">Card spacing</p>
          <RadioGroup value={p.density} onValueChange={value => set("density", value as Preferences["density"])} className="segmented-setting" aria-labelledby="spacing-label">
            <label className={p.density === "comfortable" ? "chosen" : ""}><RadioGroupItem value="comfortable" className="setting-radio"/>Comfortable</label>
            <label className={p.density === "compact" ? "chosen" : ""}><RadioGroupItem value="compact" className="setting-radio"/>Compact</label>
          </RadioGroup>
          <p className="setting-note">Compact spacing keeps the text at your chosen size.</p>
        </section>
        <section className="custom-section">
          <div className="setting-heading"><h3>04 / Keep what helps</h3></div>
          {[
            {key:"showRail" as const,label:"Learning sidebar",detail:"Paths, review queue, and progress on wide screens."},
            {key:"showActivity" as const,label:"Daily activity",detail:"Show your daily count and learning statistics."},
            {key:"expandSources" as const,label:"Expand source details",detail:"Show the reference and review status under each card."},
            {key:"reduceMotion" as const,label:"Reduce motion",detail:"Stop interface animations and smooth scrolling."},
          ].map(option => <div className="switch-setting" key={option.key}><label htmlFor={`setting-${option.key}`}><strong>{option.label}</strong><span>{option.detail}</span></label><Switch id={`setting-${option.key}`} checked={p[option.key]} onCheckedChange={value => set(option.key, value)}/></div>)}
        </section>
        <section className="custom-section">
          <div className="setting-heading"><h3>05 / Quick topics</h3><Pin size={15}/></div>
          <p className="setting-note">Pinned topics come first in your navigation. All topics stay available.</p>
          <div className="pin-topics">{topics.map(topic => <label key={topic} className={p.pinnedTopics.includes(topic) ? "pinned" : ""}><Checkbox checked={p.pinnedTopics.includes(topic)} onCheckedChange={checked => set("pinnedTopics", checked === true ? [...p.pinnedTopics, topic] : p.pinnedTopics.filter(t => t !== topic))}/><span>{topic}</span></label>)}</div>
        </section>
      </div>
      <SheetFooter className="customizer-footer">
        <button className="reset-display" onClick={() => { onChange({...defaultPreferences,pinnedTopics:[]}); toast("Display defaults restored. Learning progress and saved cards are kept."); }}><RotateCcw size={14}/>Reset display</button>
        <SheetClose asChild><button className="primary-button">Back to learning <ArrowRight size={16}/></button></SheetClose>
      </SheetFooter>
    </SheetContent>
  </Sheet>;
}
