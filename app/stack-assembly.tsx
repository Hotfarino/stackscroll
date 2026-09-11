"use client";
import type {CSSProperties} from "react";
import type {StackCollection} from "./stack-collections";

// The sheets are an interactive topic diagram, with a matching flat control list.
export function Assembly({ stack, expanded = false, selected = 0, onSelect }: { stack: StackCollection; expanded?: boolean; selected?: number; onSelect?: (index: number) => void }) {
  return <div className="stack-assembly" data-expanded={expanded} data-stack-skin={stack.skin || "prism"} style={{"--layer-count":stack.layers.length,"--layer-gap":`${Math.min(52,150/Math.max(1,stack.layers.length-1))}px`} as CSSProperties} aria-hidden={!onSelect || undefined}>
    {stack.layers.map((layer, index) => {
      const style = { "--layer-index": index, "--layer-order": stack.layers.length - index } as CSSProperties;
      const face = <span className={`assembly-face tone-${layer.color}`}><span className="assembly-trace"/><span className="assembly-label">{layer.label}</span><span className="assembly-index">0{index + 1}</span></span>;
      return onSelect ? <button type="button" key={layer.topic} className="assembly-sheet" style={style} data-selected={selected === index} aria-pressed={selected === index} aria-label={`Explore ${layer.topic} layer`} onClick={() => onSelect(index)}>{face}</button> : <span key={layer.topic} className="assembly-sheet" style={style}>{face}</span>;
    })}
  </div>;
}

