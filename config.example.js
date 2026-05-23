// Salin ke config.js — upload config.js ke hosting (jangan commit ke git)

const SHEETS_WEB_APP_URL = "";
window.SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
window.SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY_HERE";

// Diperlukan untuk admin: ganti password & username user langsung (jangan dibagikan ke publik)
window.SUPABASE_SERVICE_ROLE_KEY = "YOUR_SERVICE_ROLE_KEY_HERE";
window.AUTH_EMAIL_DOMAIN = "rage.example.com";
window.LEGACY_AUTH_EMAIL_DOMAIN = "rage.local";

// Wajib: PIN konfirmasi hapus (min. 6 karakter)
window.ADMIN_DELETE_PIN = "";

window.DISCORD_WEBHOOK_URL = "YOUR_DISCORD_WEBHOOK_URL_HERE";
window.DISCORD_ORDER_PAYMENT_WEBHOOK_URL = "YOUR_DISCORD_ORDER_PAYMENT_WEBHOOK_URL_HERE";
window.DISCORD_DRUGS_WEBHOOK_URL = "YOUR_DISCORD_DRUGS_WEBHOOK_URL_HERE";
window.DISCORD_RAGE_CASH_WEBHOOK_URL = "YOUR_DISCORD_RAGE_CASH_WEBHOOK_URL_HERE";
window.DISCORD_ENABLED = true;
window.MAINTENANCE_MODE = false;

window.AI_API_KEY = "YOUR_GROQ_API_KEY_HERE";
window.AI_MODEL = "llama-3.3-70b-versatile";
window.AI_API_URL = "https://api.groq.com/openai/v1/chat/completions";
