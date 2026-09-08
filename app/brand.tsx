import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

// Provisional identity: the name, typeface and palette can change independently.
export const brandName = "Stackscroll";

export function StackMark() {
  return <svg className="stack-mark" viewBox="0 0 28 28" fill="none" aria-hidden="true" focusable="false">
    <path d="M3 3h18v4H3zM7 12h18v4H7zM3 21h18v4H3z" fill="currentColor"/>
  </svg>;
}

export function Brand() {
  return <span className="brand"><StackMark/><span className="brand-wordmark">{brandName}</span></span>;
}

type StackButtonProps = ComponentProps<typeof Button> & { tone?: "primary" | "secondary" | "quiet" };

export function StackButton({ tone = "primary", className = "", type = "button", ...props }: StackButtonProps) {
  return <Button type={type} variant={tone === "primary" ? "default" : tone === "secondary" ? "outline" : "ghost"} className={`stack-button ${tone}-button ${className}`} {...props}/>;
}
