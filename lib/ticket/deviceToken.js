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
  const item = document.cookie.split("; ").find((part) => part.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
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

  document.cookie = `${cookieName(slug)}=${encodeURIComponent(token)}; Max-Age=31536000; Path=/ticket/${encodeURIComponent(slug)}; SameSite=Lax; Secure`;
  return token;
}

