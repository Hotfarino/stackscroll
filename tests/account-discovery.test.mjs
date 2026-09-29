import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

test("anonymous visitors get a visible account-creation entry point",()=>{
 const ui=readFileSync("app/account-access.tsx","utf8");
 assert.match(ui,/Sign in or create a Stackscroll account/);
 assert.match(ui,/Create new account/);
 assert.match(ui,/submit\("sign-up"\)/);
 assert.match(ui,/At least 8 characters/);
 assert.doesNotMatch(ui,/>Demo</);
});

test("account creation remains same-origin and server validated",()=>{
 const route=readFileSync("app/api/auth/sign-up/route.ts","utf8");
 assert.match(route,/origin.*new URL\(request\.url\)\.origin/);
 assert.match(route,/z\.string\(\)\.email\(\)/);
 assert.match(route,/password:z\.string\(\)\.min\(8\)/);
 assert.match(route,/confirmationRequired/);
});
