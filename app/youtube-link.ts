export function youtubeLinkId(source:string):string|null {
 try{const url=new URL(source);if(url.protocol!=="https:"||url.username||url.password||url.port)return null;
 const id=url.hostname==="youtu.be"?url.pathname.slice(1):["www.youtube.com","youtube.com"].includes(url.hostname)?url.pathname==="/watch"?url.searchParams.get("v"):url.pathname.startsWith("/shorts/")?url.pathname.slice(8):null:null;
 return id&&/^[\w-]{11}$/.test(id)?id:null;}catch{return null;}
}
