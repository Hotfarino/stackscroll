import {z} from "zod";
import {stateSchema} from "./learning";
import {preferencesSchema} from "./preferences";

export const playlistSchema=z.object({name:z.string().max(80),ids:z.array(z.string().min(1).max(100)).max(100)}).transform(value=>({...value,ids:[...new Set(value.ids)]}));
export const feedMemorySchema=z.object({seen:z.record(z.number().finite()),dismissed:z.array(z.string().min(1).max(2000)).max(5000),seed:z.number().int().nonnegative()});
export const accountStateSchema=z.object({
 learning_state:stateSchema,
 feed_memory:feedMemorySchema,
 preferences:preferencesSchema,
 video_playlist:playlistSchema,
});
export type AccountState=z.infer<typeof accountStateSchema>;
export type AccountStateKey=keyof AccountState;
