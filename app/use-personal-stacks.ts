"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { adultPolicy, createEdition, type PersonalStack, type StackDefinition } from "./personal-stacks";

type ApiData = { error?: string; eligible?: boolean; stacks?: PersonalStack[]; stack?: PersonalStack };
const localKey="stackscroll-personal-stacks-v1";
function readLocal(){try{return JSON.parse(localStorage.getItem(localKey)||"[]") as PersonalStack[];}catch{return [];}}

export function usePersonalStacks() {
  const [records, setRecords] = useState<PersonalStack[]>([]);
  const [eligible, setEligible] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [storageMode,setStorageMode]=useState<"account"|"device">("account");
  const lock = useRef(false);
  const pending = useRef<{ key: string; id: string } | null>(null);
  const refresh = useCallback(async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/personal-stacks", { cache: "no-store" });
      const data = await response.json() as ApiData;
      if (!response.ok || !Array.isArray(data.stacks)) throw new Error(data.error || "Your Stacks could not be loaded.");
      setRecords(data.stacks); setEligible(data.eligible === true); setStatus("ready");
    } catch { setRecords(readLocal());setEligible(true);setStorageMode("device");setStatus("ready"); }
    finally { lock.current = false; setBusy(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  async function post(body: unknown) {
    const response = await fetch("/api/personal-stacks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json() as ApiData;
    const stack = data.stack;
    if (stack) setRecords(current => [stack, ...current.filter(record => record.id !== stack.id)]);
    if (!response.ok) throw new Error(data.error || "Could not save this change. Your draft is kept.");
    return data;
  }
  async function save(id: string, revision: number, definition: StackDefinition, activate: boolean, adultConfirmed: boolean): Promise<PersonalStack | null> {
    if (lock.current || status !== "ready") return null;
    lock.current = true; setBusy(true); setError("");
    try {
      if(storageMode==="device"){
        const previous=records.find(record=>record.id===id),now=Date.now();
        const stack:PersonalStack={id,draft:definition,revision:(previous?.revision??revision)+1,activeVersion:activate?(previous?.activeVersion??0)+1:previous?.activeVersion??null,active:activate?createEdition(definition):previous?.active??null,createdAt:previous?.createdAt??now,updatedAt:now};
        const next=[stack,...records.filter(record=>record.id!==id)];setRecords(next);localStorage.setItem(localKey,JSON.stringify(next));return stack;
      }
      if (!eligible) {
        if (!adultConfirmed) throw new Error("Confirm that you are 18 or older to save your Stack.");
        await post({ operation: "attest", adult: true, policy: adultPolicy }); setEligible(true);
      }
      const body = { operation: activate ? "activate" : "save", stackId: id, revision, definition };
      const key = JSON.stringify(body);
      if (pending.current?.key !== key) pending.current = { key, id: crypto.randomUUID() };
      const data = await post({ ...body, operationId: pending.current.id });
      if (!data.stack) throw new Error("The saved Stack was not returned. Try again to confirm this change.");
      pending.current = null;
      return data.stack;
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save. Your draft is kept."); return null; }
    finally { lock.current = false; setBusy(false); }
  }
  async function remove(record: PersonalStack) {
    if (lock.current) return false;
    lock.current = true; setBusy(true); setError("");
    try { if(storageMode==="device"){const next=records.filter(item=>item.id!==record.id);setRecords(next);localStorage.setItem(localKey,JSON.stringify(next));return true;}await post({ operation: "delete", stackId: record.id, revision: record.revision }); setRecords(current => current.filter(item => item.id !== record.id)); return true; }
    catch (error) { setError(error instanceof Error ? error.message : "Could not delete this Stack."); return false; }
    finally { lock.current = false; setBusy(false); }
  }
  return { records, eligible, status, busy, error, storageMode, refresh, save, remove, clearError: () => setError("") };
}
export type PersonalStacksModel = ReturnType<typeof usePersonalStacks>;
