import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

// Canonical outlined stack mark. See docs/stackscroll-ui-bible.md.
export const brandName = "Stackscroll";

export function StackMark() {
  return <svg className="stack-mark" viewBox="0 0 48 56" fill="none" aria-hidden="true" focusable="false">
    <g strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
      <path d="M7 18 24 8 41 18 33 23M7 18l26 15 8-5-26-15" stroke="var(--mark-top)"/>
      <path d="m7 26 26 15 8-5-26-15" stroke="var(--mark-middle)"/>
      <path d="m7 34 17 10 17-10M7 41l17 10 17-10" stroke="var(--mark-bottom)"/>
    </g>
  </svg>;
}

export function Brand() {
  return <span className="brand"><StackMark/><span className="brand-wordmark">{brandName}</span></span>;
}

type StackButtonProps = ComponentProps<typeof Button> & { tone?: "primary" | "secondary" | "quiet" };

export function StackButton({ tone = "primary", className = "", type = "button", ...props }: StackButtonProps) {
  return <Button type={type} variant={tone === "primary" ? "default" : tone === "secondary" ? "outline" : "ghost"} className={`stack-button ${tone}-button ${className}`} {...props}/>;
}
