import {ReferenceIcon} from "./reference-icon";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

// Canonical outlined stack mark. See docs/stackscroll-ui-bible.md.
export const brandName = "Stackscroll";

export function StackMark() {
  return <ReferenceIcon name="logo" size={48} className="stack-mark"/>;
}

export function Brand() {
  return <span className="brand"><StackMark/><span className="brand-wordmark">{brandName}</span></span>;
}

type StackButtonProps = ComponentProps<typeof Button> & { tone?: "primary" | "secondary" | "quiet" };

export function StackButton({ tone = "primary", className = "", type = "button", ...props }: StackButtonProps) {
  return <Button type={type} variant={tone === "primary" ? "default" : tone === "secondary" ? "outline" : "ghost"} className={`stack-button ${tone}-button ${className}`} {...props}/>;
}
