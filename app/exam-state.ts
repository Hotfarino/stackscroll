import { z } from "zod";
import type { BankQuestion } from "./certification-bank";
import type { ExamAttempt, ExamResult, AttemptSummary } from "./certification-catalog";

export type ExamData = { setVersion: string; title: string; code: string; questions: BankQuestion[]; answers: number[][]; flagged: number[]; index: number };
export type ExamRow = { id: string; user_id: string; exam_id: string; data: string; revision: number; last_operation_id: string; last_operation_hash: string; started_at: number; updated_at: number; submitted_at: number | null };
export const examEditSchema = z.object({ answers: z.array(z.array(z.number().int().min(0).max(7)).max(8)).max(100), flagged: z.array(z.number().int().nonnegative()).max(100), index: z.number().int().nonnegative() }).strict();
export function validateExamEdit(data: ExamData, edit: z.infer<typeof examEditSchema>): ExamData {
  if (edit.answers.length !== data.questions.length || edit.index >= data.questions.length) throw new Error("This attempt has a different question list. Reload it before continuing.");
  if (new Set(edit.flagged).size !== edit.flagged.length || edit.flagged.some(index => index >= data.questions.length)) throw new Error("Invalid flagged question.");
  for (let i = 0; i < edit.answers.length; i++) {
    const answer = edit.answers[i], question = data.questions[i];
    if (new Set(answer).size !== answer.length || answer.length > question.selectCount || answer.some(value => value >= question.options.length)) throw new Error("Choose only the requested number of options.");
  }
  return { ...data, ...edit, answers: edit.answers.map(answer => [...answer].sort((a, b) => a - b)), flagged: [...edit.flagged].sort((a, b) => a - b) };
}
export function gradeExam(data: ExamData): ExamResult {
  let correct = 0, unanswered = 0;
  const domains = new Map<string, { name: string; correct: number; total: number }>();
  data.questions.forEach((question, index) => {
    const answer = data.answers[index];
    const right = answer.length === question.correct.length && question.correct.every(value => answer.includes(value));
    if (right) correct++; if (answer.length === 0) unanswered++;
    const domain = domains.get(question.domain) || { name: question.domain, correct: 0, total: 0 };
    domain.total++; if (right) domain.correct++; domains.set(question.domain, domain);
  });
  return { correct, total: data.questions.length, unanswered, domains: [...domains.values()] };
}
export function summarizeAttempt(row: ExamRow): AttemptSummary {
  const data = JSON.parse(row.data) as ExamData;
  return { id: row.id, examId: row.exam_id, revision: row.revision, setVersion: data.setVersion, title: data.title, code: data.code, total: data.questions.length, answered: data.answers.filter(answer => answer.length > 0).length, startedAt: row.started_at, updatedAt: row.updated_at, submittedAt: row.submitted_at, result: row.submitted_at !== null ? gradeExam(data) : null };
}
export function publicAttempt(row: ExamRow): ExamAttempt {
  const data = JSON.parse(row.data) as ExamData;
  return { ...summarizeAttempt(row), answers: data.answers, flagged: data.flagged, index: data.index,
    questions: data.questions.map(({ id, domain, prompt, options, selectCount, correct, explanation, sources }) => ({ id, domain, prompt, options, selectCount, ...(row.submitted_at !== null ? { review: { correct, explanation, sources } } : {}) })) };
}
