const PREFIX = "lehnova-ticket";

function storageKey(slug) {
  return `${PREFIX}:${slug}:device-token`;
}

function cookieName(slug) {
  return `${PREFIX}-${encodeURIComponent(slug)}`;
}

function readCookie(name) {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  try {
    const item = document.cookie.split(/;\s*/).find((part) => part.startsWith(prefix));
    return item ? decodeURIComponent(item.slice(prefix.length)) : null;
  } catch { return null; }
}

function validToken(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function createToken() {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function getOrCreateDeviceToken(slug) {
  if (typeof window === "undefined" || !slug) return null;

  let token = null;
  try {
    token = window.localStorage.getItem(storageKey(slug));
  } catch {}

  if (!validToken(token)) token = readCookie(cookieName(slug));
  if (!validToken(token)) token = createToken();

  try {
    window.localStorage.setItem(storageKey(slug), token);
  } catch {}

  try { document.cookie = `${cookieName(slug)}=${encodeURIComponent(token)}; Max-Age=31536000; Path=/; SameSite=Lax; Secure`; } catch {}
  return token;
}

// Read-only recovery: catalogue views must never generate a token or a ticket.
export function readDeviceToken(slug) {
  if (typeof window === 'undefined' || !slug) return null;
  let token;
  try { token = window.localStorage.getItem(storageKey(slug)); } catch {}
  if (!validToken(token)) token = readCookie(cookieName(slug));
  return validToken(token) ? token : null;
}

const ACTIVE_KEY = 'lehnova-ticket-active-slug';
export function rememberActiveTicket(slug) {
  if (typeof window === 'undefined' || !slug) return;
  try { window.localStorage.setItem(ACTIVE_KEY, slug); } catch {}
  try { document.cookie = `${ACTIVE_KEY}=${encodeURIComponent(slug)}; Max-Age=31536000; Path=/; SameSite=Lax; Secure`; } catch {}
}

export function savedTicketSlugs() {
  if (typeof window === 'undefined') return [];
  const slugs = [];
  try {
    const active = window.localStorage.getItem(ACTIVE_KEY);
    if (active) slugs.push(active);
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const match = window.localStorage.key(i)?.match(/^lehnova-ticket:(.+):device-token$/);
      if (match) slugs.push(match[1]);
    }
  } catch {}
  const activeCookie = readCookie(ACTIVE_KEY);
  if (activeCookie) slugs.unshift(activeCookie);
  return [...new Set(slugs)].filter(slug => typeof slug === 'string' && slug.length <= 200 && readDeviceToken(slug));
}

