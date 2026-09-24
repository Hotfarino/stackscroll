export type AccountStateKey="learning_state"|"feed_memory"|"preferences"|"video_playlist";

export async function readAccountState<T=Record<string,unknown>>():Promise<Partial<T>|null>{
 const response=await fetch("/api/user-state",{cache:"no-store"});
 if(!response.ok)throw new Error("Account storage is unavailable.");
 const data=await response.json() as {state?:Partial<T>|null};
 return data.state??null;
}

export async function writeAccountState(field:AccountStateKey,value:unknown){
 const response=await fetch("/api/user-state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({field,value})});
 if(!response.ok)throw new Error("Account storage is unavailable.");
}
