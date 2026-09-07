import { z } from "zod";
import { topics, type Topic } from "./content";

const topicSchema = z.enum(topics as [Topic, ...Topic[]]);
export const preferencesSchema = z.object({
  skin: z.enum(["signal", "midnight", "daylight"]).catch("signal"),
  layout: z.enum(["stream", "focus", "index"]).catch("stream"),
  density: z.enum(["comfortable", "compact"]).catch("comfortable"),
  textScale: z.union([z.literal(100), z.literal(112), z.literal(125)]).catch(100),
  showRail: z.boolean().catch(true),
  showActivity: z.boolean().catch(true),
  expandSources: z.boolean().catch(false),
  reduceMotion: z.boolean().catch(false),
  pinnedTopics: z.array(topicSchema).max(topics.length).transform(items => [...new Set(items)]).catch([]),
});
export type Preferences = z.infer<typeof preferencesSchema>;
export const defaultPreferences: Preferences = preferencesSchema.parse({});
export const preferenceKey = "stackscroll-display-v1";
export function readPreferences(raw: string | null): Preferences {
  if (!raw) return { ...defaultPreferences, pinnedTopics: [] };
  try { return preferencesSchema.parse(JSON.parse(raw)); }
  catch { return { ...defaultPreferences, pinnedTopics: [] }; }
}
export function orderedTopics(pinned: Topic[]) {
  return [...pinned, ...topics.filter(topic => !pinned.includes(topic))];
}
