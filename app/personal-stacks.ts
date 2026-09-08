import { z } from "zod";
import { cards, topics, type Card, type Topic } from "./content";
import { learningStacks } from "./stacks";
import { stackSkinIds } from "./stack-skins";
import type { StackCollection } from "./stack-collections";

export const adultPolicy = "18plus-v1";
export const emphasisLabels = { 1: "Supporting", 2: "Balanced", 3: "Main focus" } as const;
export const storedStackDefinitionSchema = z.object({
  name: z.string().trim().max(80),
  skin: z.enum(stackSkinIds).default("prism"),
  purpose: z.string().trim().max(300),
  layers: z.array(z.object({ topic: z.enum(topics as [Topic, ...Topic[]]), emphasis: z.union([z.literal(1), z.literal(2), z.literal(3)]) }).strict()).max(6),
  excludedIds: z.array(z.string().max(80)).max(1100),
}).strict().superRefine((value, context) => {
  if (new Set(value.layers.map(layer => layer.topic)).size !== value.layers.length) context.addIssue({ code: "custom", message: "Choose each topic only once." });
  if (new Set(value.excludedIds).size !== value.excludedIds.length) context.addIssue({ code: "custom", message: "Excluded ideas must be unique." });
});
export const stackDefinitionSchema = storedStackDefinitionSchema.superRefine((value, context) => {
  if (value.excludedIds.some(id => !cards.some(card => card.id === id))) context.addIssue({ code: "custom", message: "An excluded idea is no longer in the catalog. Review this draft." });
});
export type StackDefinition = z.infer<typeof stackDefinitionSchema>;
export type StackEdition = { definition: StackDefinition; contentIds: string[]; practiceIds: string[] };
export type PersonalStack = { id: string; draft: StackDefinition; revision: number; activeVersion: number | null; active: StackEdition | null; createdAt: number; updatedAt: number };

export function aiInfrastructureStarter(): StackDefinition {
  return { skin: "prism", name: "AI Systems Builder", purpose: "Build agentic software and understand AI/ML systems, supported by data center fundamentals.", layers: [{ topic: "Agentic AI", emphasis: 3 }, { topic: "Machine learning", emphasis: 3 }, { topic: "AI workflows", emphasis: 2 }, { topic: "Data centers", emphasis: 1 }], excludedIds: [] };
}
export function emptyStack(): StackDefinition { return { skin: "prism", name: "", purpose: "", layers: [], excludedIds: [] }; }

// Deterministic weighted scheduling: emphasis changes early representation,
// never adds duplicates, invents content, or removes a supporting topic.
export function stackMix(definition: StackDefinition, pool: Card[] = cards): Card[] {
  const excluded = new Set(definition.excludedIds);
  const seen = new Set<string>();
  const queues = definition.layers.map(layer => ({ ...layer, credit: 0, items: pool.filter(card => {
    if (card.topic !== layer.topic || excluded.has(card.id) || seen.has(card.id)) return false;
    seen.add(card.id); return true;
  }) })).sort((a, b) => a.topic.localeCompare(b.topic, "en-US"));
  const result: Card[] = [];
  while (queues.some(queue => queue.items.length)) {
    const available = queues.filter(queue => queue.items.length);
    const total = available.reduce((sum, queue) => sum + queue.emphasis, 0);
    for (const queue of available) queue.credit += queue.emphasis;
    const chosen = available.reduce((best, queue) => queue.credit > best.credit ? queue : best);
    chosen.credit -= total; result.push(chosen.items.shift()!);
  }
  return result;
}
export function activationError(definition: StackDefinition): string | null {
  if (definition.name.trim().length < 3) return "Give your Stack a name with at least 3 characters.";
  if (definition.purpose.trim().length < 8) return "Add a short purpose for your Stack.";
  if (!definition.layers.length) return "Choose at least one topic layer.";
  if (definition.layers.some(layer => !stackMix(definition).some(card => card.topic === layer.topic))) return "Keep at least one idea in every layer, or remove the empty layer.";
  if (stackMix(definition).length < 3) return "Keep at least three ideas before using this Stack.";
  return null;
}
export function createEdition(definition: StackDefinition): StackEdition {
  const error = activationError(definition); if (error) throw new Error(error);
  return { definition, contentIds: stackMix(definition).map(card => card.id), practiceIds: learningStacks.filter(practice => definition.layers.some(layer => layer.topic === practice.topic)).map(practice => practice.id) };
}
const colors = ["blue", "lime", "orange", "pearl", "blue", "lime"];
export function personalCollection(record: PersonalStack, draft = false): StackCollection {
  const definition = !draft && record.active ? record.active.definition : record.draft;
  const ids = new Set(!draft && record.active ? record.active.contentIds : stackMix(definition).map(card => card.id));
  return { id: record.id, skin: definition.skin || "prism", name: definition.name || "Untitled Stack", description: definition.purpose || "A private Stack in progress.", layers: definition.layers.map((layer, index) => ({ topic: layer.topic, label: layer.topic, color: colors[index], description: `${emphasisLabels[layer.emphasis]} in this Stack.`, cardIds: cards.filter(card => card.topic === layer.topic && ids.has(card.id)).map(card => card.id) })), practiceIds: !draft && record.active ? record.active.practiceIds : learningStacks.filter(practice => definition.layers.some(layer => layer.topic === practice.topic)).map(practice => practice.id) };
}
