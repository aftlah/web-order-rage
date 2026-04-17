import assert from "node:assert/strict";

function rateLimitKey(usernameOrEmail) {
  return "rage_login_rl_v1:" + String(usernameOrEmail || "").trim().toLowerCase();
}

function canAttemptLogin(storage, usernameOrEmail, nowMs) {
  const key = rateLimitKey(usernameOrEmail);
  const raw = storage.get(key);
  if (!raw) return { ok: true, retryAfterSec: 0 };
  const obj = JSON.parse(raw);
  const windowMs = 5 * 60 * 1000;
  const maxFails = 5;
  const firstAt = typeof obj.firstAt === "number" ? obj.firstAt : nowMs;
  const fails = typeof obj.fails === "number" ? obj.fails : 0;
  if (nowMs - firstAt > windowMs) return { ok: true, retryAfterSec: 0 };
  if (fails >= maxFails) {
    const retryAfter = Math.ceil((windowMs - (nowMs - firstAt)) / 1000);
    return { ok: false, retryAfterSec: retryAfter };
  }
  return { ok: true, retryAfterSec: 0 };
}

function recordFailedAttempt(storage, usernameOrEmail, nowMs) {
  const key = rateLimitKey(usernameOrEmail);
  const raw = storage.get(key);
  const windowMs = 5 * 60 * 1000;
  if (!raw) {
    storage.set(key, JSON.stringify({ firstAt: nowMs, fails: 1 }));
    return;
  }
  const obj = JSON.parse(raw) || {};
  const firstAt = typeof obj.firstAt === "number" ? obj.firstAt : nowMs;
  const fails = typeof obj.fails === "number" ? obj.fails : 0;
  if (nowMs - firstAt > windowMs) {
    storage.set(key, JSON.stringify({ firstAt: nowMs, fails: 1 }));
  } else {
    storage.set(key, JSON.stringify({ firstAt, fails: fails + 1 }));
  }
}

function isMin6(pw) {
  return String(pw || "").length >= 6;
}

{
  const storage = new Map();
  const user = "leo";
  const t0 = 0;
  for (let i = 0; i < 5; i++) recordFailedAttempt(storage, user, t0);
  const blocked = canAttemptLogin(storage, user, t0);
  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfterSec > 0);
  const okLater = canAttemptLogin(storage, user, t0 + 5 * 60 * 1000 + 1);
  assert.equal(okLater.ok, true);
}

{
  assert.equal(isMin6("12345"), false);
  assert.equal(isMin6("123456"), true);
  assert.equal(isMin6("abcdef"), true);
}

console.log("OK");

