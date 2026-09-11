export function offersUrl(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || value.length > 2000) throw new Error('URL des offres invalide.');
  let url;
  try { url = new URL(value.trim()); } catch { throw new Error('Indiquez une URL complète (https://…).'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('URL des offres invalide.');
  return url.href;
}

export function statisticsDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
}

export function parisToday() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone:'Europe/Paris', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(new Date());
  return ['year','month','day'].map(type => parts.find(p => p.type === type).value).join('-');
}
