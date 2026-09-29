/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  SUPABASE_URL?: string;
  SUPABASE_SECRET_KEY?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

const publicReads=new Set([
  "/api/news","/api/videos","/api/videos/thumbnail","/api/catalog/thumbnail","/api/catalog/video","/api/social-projects",
]);
const publicAuthPrefix="/api/auth/";

const securityPolicy=[
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob: https://znigmlhrodabqdjuhrwe.supabase.co",
  "media-src 'self'",
  "connect-src 'self'",
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
].join("; ");

function secured(response:Response,request:Request){
  const headers=new Headers(response.headers);
  headers.set("Content-Security-Policy",securityPolicy);
  headers.set("Permissions-Policy","camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()");
  headers.set("Referrer-Policy","no-referrer");
  headers.set("X-Content-Type-Options","nosniff");
  headers.set("X-Frame-Options","DENY");
  headers.set("X-Robots-Tag","noindex, nofollow, noarchive");
  headers.set("Cross-Origin-Opener-Policy","same-origin");
  headers.set("Cross-Origin-Resource-Policy","same-origin");
  if(new URL(request.url).protocol==="https:")headers.set("Strict-Transport-Security","max-age=31536000; includeSubDomains");
  if(new URL(request.url).pathname.startsWith("/api/"))headers.set("Cache-Control","no-store");
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

function unauthenticated(request:Request){
  return secured(Response.json({error:"Authentication required."},{status:401}),request);
}

function requestLimit(url:URL,method:string){
  if(url.pathname.startsWith("/api/auth/"))return method==="GET"?60:10;
  if(method!=="GET")return url.pathname==="/api/feed-ingestion"?10:60;
  if(url.pathname.endsWith("/thumbnail"))return 180;
  return 90;
}

async function rateLimit(request:Request,env:Env,ctx:ExecutionContext){
  const id=request.headers.get("oai-authenticated-user-id")||`anonymous:${request.headers.get("cf-connecting-ip")||"unknown"}`;
  const url=new URL(request.url),now=Date.now(),windowMs=60_000,bucket=Math.floor(now/windowMs),expires=(bucket+1)*windowMs;
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(`${id}:${request.method}:${url.pathname}:${bucket}`));
  const scope=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("");
  try{
    const row=await env.DB.prepare("INSERT INTO api_rate_limits (scope,count,expires_at) VALUES (?,1,?) ON CONFLICT(scope) DO UPDATE SET count=count+1,expires_at=excluded.expires_at RETURNING count").bind(scope,expires).first<{count:number}>();
    if(Math.random()<.02)ctx.waitUntil(env.DB.prepare("DELETE FROM api_rate_limits WHERE expires_at < ?").bind(now-windowMs).run().then(()=>undefined));
    const limit=requestLimit(url,request.method);
    if((row?.count??limit+1)>limit){const response=Response.json({error:"Too many requests. Try again shortly."},{status:429,headers:{"Retry-After":String(Math.max(1,Math.ceil((expires-now)/1000)))}});return secured(response,request);}
    return null;
  }catch{
    if(request.method!=="GET")return secured(Response.json({error:"Request protection is temporarily unavailable. Try again."},{status:503}),request);
    return null;
  }
}

function cookie(request:Request,name:string){
  for(const part of (request.headers.get("cookie")||"").split(";")){const [key,...value]=part.trim().split("=");if(key===name)return decodeURIComponent(value.join("="));}
  return "";
}

async function withSupabaseIdentity(request:Request,env:Env){
  if(request.headers.get("oai-authenticated-user-id"))return request;
  const token=cookie(request,"stackscroll_access"),url=env.SUPABASE_URL?.replace(/\/$/,""),key=env.SUPABASE_SECRET_KEY;
  if(!token||!url||!key)return request;
  try{
    const response=await fetch(`${url}/auth/v1/user`,{headers:{apikey:key,Authorization:`Bearer ${token}`},redirect:"manual",signal:AbortSignal.timeout(5000)});
    if(!response.ok)return request;
    const account=await response.json() as {id?:string;email?:string};if(!account.id)return request;
    const headers=new Headers(request.headers);headers.set("oai-authenticated-user-id",account.id);if(account.email)headers.set("oai-authenticated-user-email",account.email);
    return new Request(request,{headers});
  }catch{return request;}
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // The Sites access gate is the primary control. This second boundary keeps
    // API data closed if a route is ever exposed through another hostname.
    if(url.pathname.startsWith("/api/")){
      request=await withSupabaseIdentity(request,env);
      const publicMetric=request.method==="POST"&&url.pathname==="/api/metrics";
      const publicRequest=(request.method==="GET"&&publicReads.has(url.pathname))||publicMetric||url.pathname.startsWith(publicAuthPrefix);
      if(!request.headers.get("oai-authenticated-user-id")&&!publicRequest)return unauthenticated(request);
      const limited=await rateLimit(request,env,ctx);if(limited)return limited;
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const response=await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      return secured(response,request);
    }

    return secured(await handler.fetch(request, env, ctx),request);
  },
};

export default worker;
