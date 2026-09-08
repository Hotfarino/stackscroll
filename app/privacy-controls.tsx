"use client";
import { Shield, X } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { StackButton } from "./brand";

export function PrivacyControls({blocked,onBlock,onUnload,onClearHistory,onClearVideos,onResetInterests}: {blocked:boolean;onBlock:(value:boolean)=>void;onUnload:()=>void;onClearHistory:()=>void;onClearVideos:()=>void;onResetInterests:()=>void}) {
  return <Sheet><SheetTrigger asChild><button className="customize-trigger privacy-trigger" aria-label="Privacy controls"><Shield size={17}/><span>Privacy</span></button></SheetTrigger>
    <SheetContent className="customizer privacy-panel"><SheetHeader><SheetTitle>Your privacy</SheetTitle><SheetDescription>Control playback and the learning data stored on this device.</SheetDescription></SheetHeader><div className="customizer-body">
      <section className="custom-section"><h3>Video playback</h3><div className="privacy-switch"><label htmlFor="block-external-videos">Block embedded videos<span>Keep watching on the original platform instead.</span></label><Switch id="block-external-videos" checked={blocked} onCheckedChange={onBlock}/></div><p>Each video asks before loading. Permission to load a player is not remembered after you leave the feed or reload.</p><StackButton tone="secondary" onClick={onUnload}><X size={15}/>Unload active player</StackButton></section>
      <section className="custom-section"><h3>Your learning data</h3><p>Stackscroll does not record video watch history or send viewing events to advertising tools. Saved cards, quiz results, and recall schedules stay on this device.</p>
        <AlertDialog><AlertDialogTrigger asChild><StackButton tone="secondary">Clear learning history</StackButton></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Clear learning history?</AlertDialogTitle><AlertDialogDescription>This removes quiz answers, completed cards, and recall schedules from this device. Bookmarks and display settings are kept.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onClearHistory}>Clear history</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        <StackButton tone="quiet" onClick={onClearVideos}>Remove saved video bookmarks</StackButton>
      </section>
      <section className="custom-section"><h3>Interests & feed</h3><p>Your chosen path and pinned topics shape the feed. Watching a video does not change your interests.</p><StackButton tone="secondary" onClick={onResetInterests}>Reset my interests</StackButton></section>
      <nav className="privacy-links" aria-label="Policies"><a href="/privacy">Privacy notice</a><a href="/terms">Video & content terms</a><a href="/content-review">Content review workspace</a></nav>
    </div></SheetContent>
  </Sheet>;
}
