/**
 * R.A.G.E — shared client security utilities (no secrets).
 * Load before config.js on login; after config.js on protected pages.
 */
(function (global) {
  "use strict";

  const LOGIN_PATH = "login.html";
  const RL_PREFIX = "rage_login_rl_v2:";
  const RL_WINDOW_MS = 5 * 60 * 1000;
  const RL_MAX_FAILS = 5;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function validatePassword(pw) {
    const s = String(pw || "");
    if (s.length < 6) {
      return { ok: false, message: "Password minimal 6 karakter" };
    }
    if (s.length > 128) {
      return { ok: false, message: "Password terlalu panjang (maks. 128)" };
    }
    return { ok: true, message: "" };
  }

  function validateAdminPin(pin) {
    const s = String(pin || "");
    if (!s) {
      return {
        ok: false,
        message:
          "ADMIN_DELETE_PIN belum diatur di config.js. Set PIN minimal 6 karakter.",
      };
    }
    if (s.length < 6) {
      return { ok: false, message: "PIN delete minimal 6 karakter" };
    }
    return { ok: true, message: "" };
  }

  function warnIfServiceRoleExposed() {
    try {
      const key = String(
        (global.window && global.window.SUPABASE_SERVICE_ROLE_KEY) || ""
      ).trim();
      if (key && key.length > 20) {
        console.warn(
          "[SECURITY] SUPABASE_SERVICE_ROLE_KEY ada di config.js — jangan commit ke git atau bagikan file config."
        );
      }
    } catch (e) {}
  }

  function getSupabaseAuthStorageKey() {
    try {
      const keys = Object.keys(global.localStorage || {});
      return (
        keys.find(function (k) {
          return k.startsWith("sb-") && k.endsWith("-auth-token");
        }) || null
      );
    } catch (e) {
      return null;
    }
  }

  function readStoredSession() {
    try {
      const storages = [global.localStorage, global.sessionStorage];
      for (let i = 0; i < storages.length; i++) {
        const store = storages[i];
        if (!store) continue;
        const keys = Object.keys(store);
        const key = keys.find(function (k) {
          return k.startsWith("sb-") && k.endsWith("-auth-token");
        });
        if (!key) continue;
        const raw = store.getItem(key);
        if (!raw) continue;
        const obj = JSON.parse(raw);
        let expSec = 0;
        if (typeof obj.expires_at === "number") expSec = obj.expires_at;
        else if (
          obj.currentSession &&
          typeof obj.currentSession.expires_at === "number"
        )
          expSec = obj.currentSession.expires_at;
        const hasToken = !!(
          obj.access_token ||
          (obj.currentSession && obj.currentSession.access_token)
        );
        return { hasToken, expSec, storage: store, key };
      }
    } catch (e) {}
    return null;
  }

  function isSessionValid(sess) {
    if (!sess || !sess.hasToken) return false;
    if (!sess.expSec) return true;
    return sess.expSec * 1000 > Date.now();
  }

  function redirectToLogin() {
    const path = String(global.location.pathname || "");
    if (path.toLowerCase().endsWith(LOGIN_PATH)) return;
    global.location.replace(LOGIN_PATH);
  }

  /** Early redirect on protected pages (runs before heavy scripts). */
  function bootstrapAuthGuard(options) {
    const opts = options || {};
    if (opts.requireAuth === false) return;
    const path = String(global.location.pathname || "").toLowerCase();
    if (path.endsWith(LOGIN_PATH)) return;
    const sess = readStoredSession();
    if (!isSessionValid(sess)) {
      redirectToLogin();
    }
  }

  function rateLimitKey(usernameOrEmail) {
    return RL_PREFIX + String(usernameOrEmail || "").trim().toLowerCase();
  }

  function readRateLimit(store, key) {
    try {
      const raw = store.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function canAttemptLogin(usernameOrEmail) {
    try {
      const key = rateLimitKey(usernameOrEmail);
      const now = Date.now();
      const stores = [global.sessionStorage, global.localStorage];
      for (let i = 0; i < stores.length; i++) {
        const store = stores[i];
        if (!store) continue;
        const obj = readRateLimit(store, key);
        if (!obj) continue;
        const firstAt = typeof obj.firstAt === "number" ? obj.firstAt : now;
        const fails = typeof obj.fails === "number" ? obj.fails : 0;
        if (now - firstAt > RL_WINDOW_MS) continue;
        if (fails >= RL_MAX_FAILS) {
          const retryAfter = Math.ceil(
            (RL_WINDOW_MS - (now - firstAt)) / 1000
          );
          return { ok: false, retryAfterSec: retryAfter };
        }
      }
      return { ok: true, retryAfterSec: 0 };
    } catch (e) {
      return { ok: true, retryAfterSec: 0 };
    }
  }

  function recordFailedAttempt(usernameOrEmail) {
    try {
      const key = rateLimitKey(usernameOrEmail);
      const now = Date.now();
      const stores = [global.sessionStorage, global.localStorage];
      stores.forEach(function (store) {
        if (!store) return;
        const obj = readRateLimit(store, key);
        const firstAt =
          obj && typeof obj.firstAt === "number" && now - obj.firstAt <= RL_WINDOW_MS
            ? obj.firstAt
            : now;
        const fails =
          obj &&
          typeof obj.fails === "number" &&
          now - (obj.firstAt || 0) <= RL_WINDOW_MS
            ? obj.fails + 1
            : 1;
        store.setItem(key, JSON.stringify({ firstAt, fails }));
      });
    } catch (e) {}
  }

  function clearRateLimit(usernameOrEmail) {
    try {
      const key = rateLimitKey(usernameOrEmail);
      [global.sessionStorage, global.localStorage].forEach(function (store) {
        if (store) store.removeItem(key);
      });
    } catch (e) {}
  }

  /** Prefer sessionStorage for JWT (cleared when tab closes). */
  function createSupabaseAuthStorage() {
    const primary = global.localStorage;
    const fallback = global.sessionStorage;
    return {
      getItem: function (key) {
        try {
          return (
            (primary && primary.getItem(key)) ||
            (fallback && fallback.getItem(key)) ||
            null
          );
        } catch (e) {
          return null;
        }
      },
      setItem: function (key, value) {
        try {
          if (primary) primary.setItem(key, value);
        } catch (e) {}
      },
      removeItem: function (key) {
        try {
          if (primary) primary.removeItem(key);
          if (fallback) fallback.removeItem(key);
        } catch (e) {}
      },
    };
  }

  function sanitizeChatHtml(text) {
    const escaped = escapeHtml(text);
    return escaped
      .replace(/\*\*(.+?)\*\*/g, '<b class="text-amber-400 font-bold">$1</b>')
      .replace(/\n/g, "<br>");
  }

  function genericLoginError() {
    return "Username atau password salah. Periksa kembali lalu coba lagi.";
  }

  global.RageSecurity = {
    escapeHtml,
    validatePassword,
    validateAdminPin,
    warnIfServiceRoleExposed,
    bootstrapAuthGuard,
    redirectToLogin,
    readStoredSession,
    isSessionValid,
    canAttemptLogin,
    recordFailedAttempt,
    clearRateLimit,
    createSupabaseAuthStorage,
    sanitizeChatHtml,
    genericLoginError,
    LOGIN_PATH,
  };
})(typeof window !== "undefined" ? window : globalThis);
