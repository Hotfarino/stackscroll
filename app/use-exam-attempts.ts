"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { adultPolicy } from "./personal-stacks";
import type { ExamAttempt, AttemptSummary } from "./certification-catalog";
type ApiResponse = { error?: string; eligible?: boolean; attempts?: AttemptSummary[]; attempt?: ExamAttempt };

export function useExamAttempts() {
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]), [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading"), [eligible, setEligible] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const lock = useRef(false), pending = useRef<{ key: string; id: string } | null>(null), pendingStart = useRef<{ examId: string; id: string } | null>(null);
  const retry = useRef<(() => Promise<unknown>) | null>(null);
  function receive(value: ExamAttempt) { setAttempt(value); setAttempts(current => [value, ...current.filter(item => item.id !== value.id)]); }
  const refresh = useCallback(async () => {
    if (lock.current) return; lock.current = true; setBusy(true); setError("");
    try { const response = await fetch("/api/exam-attempts", { cache: "no-store" }); const data = await response.json() as ApiResponse; if (!response.ok || !Array.isArray(data.attempts)) throw new Error(data.error || "Could not load practice."); setAttempts(data.attempts); setEligible(data.eligible === true); setStatus("ready"); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not load practice."); setStatus("error"); }
    finally { lock.current = false; setBusy(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  async function run(action: () => Promise<unknown>) {
    if (lock.current) return false; lock.current = true; setBusy(true); setError("");
    try { await action(); retry.current = null; return true; }
    catch (error) { setError(error instanceof Error ? error.message : "Could not save practice."); return false; }
    finally { lock.current = false; setBusy(false); }
  }
  async function post(body: Record<string, unknown>, path = "/api/exam-attempts") {
    const key = JSON.stringify(body);
    if (pending.current?.key !== key) pending.current = { key, id: crypto.randomUUID() };
    const payload = body.operation === "attest" || body.operation === "delete" ? body : { ...body, operationId: pending.current.id };
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json() as ApiResponse;
    if (data.attempt) receive(data.attempt);
    if (!response.ok) { if (response.status === 409) retry.current = null; throw new Error(data.error || "Could not save practice."); }
    pending.current = null; return data;
  }
  async function start(examId: string, adult: boolean) {
    if (status !== "ready") return false;
    if (pendingStart.current?.examId !== examId) pendingStart.current = { examId, id: crypto.randomUUID() };
    const id = pendingStart.current.id;
    return run(async () => {
      if (!eligible) { if (!adult) throw new Error("Confirm that you are 18 or older to start."); await post({ operation: "attest", adult: true, policy: adultPolicy }, "/api/personal-stacks"); setEligible(true); }
      const data = await post({ operation: "start", id, examId }); if (!data.attempt) throw new Error("Could not confirm this attempt. Try again."); pendingStart.current = null;
    });
  }
  async function open(id: string) { return run(async () => { const response = await fetch(`/api/exam-attempts?id=${encodeURIComponent(id)}`, { cache: "no-store" }); const data = await response.json() as ApiResponse; if (!response.ok || !data.attempt) throw new Error(data.error || "Could not open this attempt."); receive(data.attempt); }); }
  async function save(edit: Pick<ExamAttempt, "answers" | "index" | "flagged">, submit = false) {
    if (!attempt || attempt.submittedAt !== null) return false;
    const body = { operation: "save", id: attempt.id, revision: attempt.revision, edit, submit };
    const action = async () => { const data = await post(body); if (!data.attempt) throw new Error("Could not confirm this answer. Retry the save."); };
    retry.current = () => run(action); return run(action);
  }
  async function remove(value: AttemptSummary) { return run(async () => { await post({ operation: "delete", id: value.id, revision: value.revision }); setAttempts(current => current.filter(item => item.id !== value.id)); if (attempt?.id === value.id) setAttempt(null); }); }
  return { attempts, attempt, status, eligible, busy, error, refresh, start, open, save, remove, retrySave: () => retry.current?.(), canRetry: !!retry.current, close: () => { if (!lock.current) { setAttempt(null); setError(""); retry.current = null; } } };
}
export type ExamModel = ReturnType<typeof useExamAttempts>;
