import assert from "node:assert/strict";

const base=new URL(process.env.STACKSCROLL_BASE_URL||"https://stackscroll.bigdawgroof812178.chatgpt.site/");
const checks=[
 ["/",200],
 ["/api/news",200],
 ["/api/videos",200],
 ["/api/auth/session",200],
 ["/api/user-state",401],
 ["/api/profile",401],
];

for(const [path,status] of checks){
 const response=await fetch(new URL(path,base),{redirect:"manual",signal:AbortSignal.timeout(15_000)});
 assert.equal(response.status,status,`${path} returned ${response.status}, expected ${status}`);
 assert.equal(response.headers.get("x-robots-tag"),"noindex, nofollow, noarchive",`${path} must remain unindexed during the public beta`);
 if(path==="/"){
  const html=await response.text();
  assert.match(html,/Public demo · account sync optional/);
  assert.match(html,/Stackscroll/);
 }else if(path==="/api/auth/session"){
  assert.deepEqual(await response.json(),{authenticated:false,email:null});
 }else await response.body?.cancel();
 console.log(`ok ${status} ${path}`);
}

const crossOrigin=await fetch(new URL("/api/auth/sign-in",base),{method:"POST",headers:{Origin:"https://attacker.invalid","Content-Type":"application/json"},body:JSON.stringify({email:"nobody@example.invalid",password:"not-a-real-password"}),redirect:"manual",signal:AbortSignal.timeout(15_000)});
assert.equal(crossOrigin.status,403,"cross-origin sign-in must be rejected before credentials are processed");
console.log("ok 403 cross-origin sign-in");
console.log("StackScroll live smoke passed");
