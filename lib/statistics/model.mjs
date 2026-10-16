export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const EVENTS = ['visit', 'product_click', 'whatsapp', 'phone', 'instagram', 'facebook', 'tiktok', 'social_other'];
export const CONSENT_VERSION = 1;
export const CONSENT_DAYS = 180;

export function validConsent(value, now = Date.now()) {
  return value?.version === CONSENT_VERSION && typeof value.accepted === 'boolean' &&
    Number.isFinite(value.at) && value.at <= now && now - value.at < CONSENT_DAYS * 86400000;
}

export function validateEvent(body) {
  if (!body || !UUID.test(body.catalogId || '') || !UUID.test(body.visitorId || '') ||
      !UUID.test(body.eventId || '') || !UUID.test(body.sessionId || '') ||
      !EVENTS.includes(body.kind) || body.consent !== CONSENT_VERSION) return false;
  return body.kind === 'product_click' ? UUID.test(body.productId || '') : body.productId == null;
}

export function contactKind(href) {
  try {
    const url = new URL(href);
    if (url.protocol === 'tel:') return 'phone';
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const matches = (domain) => host === domain || host.endsWith('.' + domain);
    if (matches('wa.me') || matches('whatsapp.com')) return 'whatsapp';
    for (const name of ['instagram', 'facebook', 'tiktok']) if (matches(name + '.com')) return name;
    if (['linkedin.com', 'youtube.com', 'youtu.be', 'pinterest.com', 'x.com', 'twitter.com'].some(matches)) return 'social_other';
  } catch {}
  return null;
}

export function validRange(from, to, bucket, now = new Date()) {
  if (!['day', 'week', 'month', 'year'].includes(bucket) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(to || '')) return false;
  const start = new Date(from + 'T00:00:00Z'), end = new Date(to + 'T00:00:00Z');
  const earliest = new Date(now); earliest.setUTCMonth(earliest.getUTCMonth() - 13);
  earliest.setUTCHours(0, 0, 0, 0);
  return !isNaN(start) && !isNaN(end) && start.toISOString().slice(0, 10) === from &&
    end.toISOString().slice(0, 10) === to && start <= end && start >= earliest &&
    to <= new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(now) && (end - start) / 86400000 <= 366;
}
