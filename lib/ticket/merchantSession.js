import "server-only";

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const TICKET_MERCHANT_COOKIE = "lehnova-ticket-merchant";
export const TICKET_MERCHANT_SESSION_MAX_AGE = 60 * 60 * 12;

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("Secret de session Ticket manquant.");
  return value;
}

function safeEqual(left, right) {
  const a = Buffer.from(left || "");
  const b = Buffer.from(right || "");
  return a.length === b.length && timingSafeEqual(a, b);
}

function sign(value) {
  return createHmac("sha256", secret()).update(`ticket-session:${value}`).digest("base64url");
}

export function normalizeAccessCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function generateAccessCode(length = 8) {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

export function hashAccessCode(code) {
  return createHmac("sha256", secret()).update(`ticket-code:${normalizeAccessCode(code)}`).digest("hex");
}

function encryptionKey() {
  return createHash("sha256").update(`ticket-code-encryption:${secret()}`).digest();
}

export function encryptAccessCode(code) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(normalizeAccessCode(code), "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptAccessCode(value) {
  const [iv, tag, encrypted, extra] = String(value || "").split(".");
  if (!iv || !tag || !encrypted || extra) throw new Error("Code Ticket chiffré invalide.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
}

export function createMerchantSessionToken(businessId) {
  const payload = Buffer.from(JSON.stringify({ businessId, expiresAt: Math.floor(Date.now() / 1000) + TICKET_MERCHANT_SESSION_MAX_AGE })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyMerchantSessionToken(token) {
  const [payload, signature, extra] = String(token || "").split(".");
  if (!payload || !signature || extra || !safeEqual(signature, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof data.businessId === "string" && data.expiresAt > Math.floor(Date.now() / 1000) ? data.businessId : null;
  } catch {
    return null;
  }
}

export function merchantBusinessIdFromRequest(request) {
  const cookie = (request.headers.get("cookie") || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${TICKET_MERCHANT_COOKIE}=`));
  return verifyMerchantSessionToken(cookie ? decodeURIComponent(cookie.slice(TICKET_MERCHANT_COOKIE.length + 1)) : "");
}

export function merchantCookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/ticket", maxAge: TICKET_MERCHANT_SESSION_MAX_AGE };
}
