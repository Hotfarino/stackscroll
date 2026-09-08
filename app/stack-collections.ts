import { cards, type Topic } from "./content";
import { learningStacks } from "./stacks";
import { matchesSearch } from "./content-search";

export type StackLayer = { topic: Topic; label: string; color: string; description: string; cardIds: string[] };
export type StackCollection = { id: string; skin?: import("./stack-skins").StackSkin; name: string; description: string; layers: StackLayer[]; practiceIds: string[] };

// Curated design-preview collections. These are not user-created memberships.
export const stackCollections: StackCollection[] = [
  { id: "network-cloud", name: "Network → Cloud", description: "Follow names, packets, and routes into cloud infrastructure.", practiceIds: ["dns-diagnosis", "routing-decisions", "cloud-boundaries"], layers: [
    { topic: "Networking", label: "Networking", color: "blue", description: "Understand name resolution and how packets reach their next hop.", cardIds: ["net-mac", "subnet-lesson", "flash-dns"] },
    { topic: "CCNA", label: "Routing", color: "lime", description: "Practice subnet sizing, broadcast domains, and route selection.", cardIds: ["flash-cidr", "flash-vlan", "ccna-route"] },
    { topic: "Cloud", label: "Cloud", color: "pearl", description: "Connect subnet routing, security groups, and availability zones.", cardIds: ["cloud-private", "cloud-sg", "cloud-region"] },
  ] },
  { id: "build-code", name: "Build with code", description: "Connect language fundamentals, dependable changes, and coding agents.", practiceIds: ["safe-shared-code", "agent-feedback"], layers: [
    { topic: "Development", label: "Development", color: "orange", description: "Preserve shared history and check how software behaves.", cardIds: ["dev-git", "dev-idempotence", "dev-tests"] },
    { topic: "Languages", label: "Languages", color: "pearl", description: "Spot Python defaults, asynchronous returns, and runtime validation gaps.", cardIds: ["python-default", "flash-async", "ts-types"] },
    { topic: "Agentic AI", label: "Agents", color: "blue", description: "Give a coding agent a bounded task and useful feedback.", cardIds: ["agent-loop", "agent-scope", "agent-tools"] },
  ] },
  { id: "ai-systems", name: "AI systems", description: "Connect model evaluation, agent feedback, and checked automation.", practiceIds: ["ml-generalization", "agent-feedback"], layers: [
    { topic: "Machine learning", label: "Machine learning", color: "lime", description: "Investigate leakage, overfitting, and classification metrics.", cardIds: ["ml-leakage", "ml-overfit", "ml-precision"] },
    { topic: "Agentic AI", label: "Agents", color: "blue", description: "Understand dynamic tool use and observable success conditions.", cardIds: ["agent-loop", "agent-tools", "agent-scope"] },
    { topic: "AI workflows", label: "Workflows", color: "orange", description: "Validate extracted data, review consequential changes, and compare prompt versions.", cardIds: ["workflow-validate", "workflow-human", "workflow-eval"] },
  ] },
];

export function collectionCards(stack: StackCollection) {
  const ids = new Set(stack.layers.flatMap(layer => layer.cardIds));
  return cards.filter(card => ids.has(card.id));
}
export function collectionPractice(stack: StackCollection) {
  return stack.practiceIds.flatMap(id => { const item = learningStacks.find(sequence => sequence.id === id); return item ? [item] : []; });
}
export function collectionSources(stack: StackCollection) {
  const items = [...collectionCards(stack), ...collectionPractice(stack).flatMap(practice => [practice.concept, practice.question, practice.recall])];
  return [...new Map(items.map(card => [card.source, { name: card.sourceName, url: card.source }])).values()];
}
export function collectionMatchesSearch(stack: StackCollection, query: string) {
  return matchesSearch(query, [stack.name, stack.description, ...stack.layers.flatMap(layer => [layer.topic, layer.description]), ...collectionCards(stack).flatMap(card => [card.title, card.body, card.back, card.takeaway, card.code, card.language, card.sourceName]), ...collectionPractice(stack).flatMap(practice => [practice.title, practice.objective, practice.description])]);
}
