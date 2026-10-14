import { hashPassword, verifyPassword, isHashed } from "../supabase/functions/_shared/password.ts";

let pass = 0, fail = 0;
function check(name: string, cond: boolean) {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}`); }
}

console.log("Password module tests\n");

// 1. hash produces expected format
const h = await hashPassword("admin123");
check("hash has pbkdf2 prefix", h.startsWith("pbkdf2$"));
check("hash has 4 parts", h.split("$").length === 4);
check("isHashed(h) true", isHashed(h));
check("hash != plaintext", h !== "admin123");
check("no plaintext leaks into hash", !h.includes("admin123"));
console.log(`  -> ${h.slice(0, 40)}...\n`);

// 2. correct password verifies
check("verify correct password (hashed)", await verifyPassword("admin123", h));
check("verify wrong password (hashed) rejected", !(await verifyPassword("wrongpass", h)));

// 3. salts differ per call (no fixed salt bug)
const h2 = await hashPassword("admin123");
check("two hashes of same pw differ (unique salt)", h1(h) !== h1(h2));
check("both still verify", await verifyPassword("admin123", h2));
function h1(x: string) { return x; }

// 4. legacy plaintext backwards compatibility
check("verify correct plaintext", await verifyPassword("admin123", "admin123"));
check("reject wrong plaintext", !(await verifyPassword("nope", "admin123")));
check("isHashed(plaintext) false", !isHashed("admin123"));

// 5. edge cases / malformed input must not throw
check("empty stored rejects", !(await verifyPassword("x", "")));
check("malformed hash rejects", !(await verifyPassword("x", "pbkdf2$bad")));
check("missing parts rejects", !(await verifyPassword("x", "pbkdf2$100000$$")));
check("unicode password round-trips", await verifyPassword("pa$$wörd🔒", await hashPassword("pa$$wörd🔒")));
const empty = await hashPassword("");
check("empty password round-trips", await verifyPassword("", empty));
check("empty password rejects wrong", !(await verifyPassword("x", empty)));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);