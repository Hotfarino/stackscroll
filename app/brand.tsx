import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

// Provisional identity: the name, typeface and palette can change independently.
export const brandName = "Stackscroll";

export function StackMark() {
  return <svg className="stack-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
    <path d="M3 22 18 15 29 19 14 26Z" fill="var(--mark-bottom)"/>
    <path d="M3 15 18 8 29 12 14 19Z" fill="var(--mark-middle)"/>
    <path d="M3 8 18 1 29 5 23 8 21 7.3 18.5 8.5 20.5 9.2 14 12Z" fill="var(--mark-top)"/>
    <path d="m3 8 11 4 6.5-2.8M3 15l11 4 15-7M3 22l11 4 15-7" stroke="var(--glass-highlight)" strokeWidth=".8" strokeLinejoin="miter"/>
  </svg>;
}

export function Brand() {
  return <span className="brand"><StackMark/><span className="brand-wordmark">{brandName}</span></span>;
}

type StackButtonProps = ComponentProps<typeof Button> & { tone?: "primary" | "secondary" | "quiet" };

export function StackButton({ tone = "primary", className = "", type = "button", ...props }: StackButtonProps) {
  return <Button type={type} variant={tone === "primary" ? "default" : tone === "secondary" ? "outline" : "ghost"} className={`stack-button ${tone}-button ${className}`} {...props}/>;
}
