// Public, indexable marketing pages only. Private tools, admin, dynamic
// customer pages and demonstrations are intentionally excluded.
export default function sitemap() {
  const base = 'https://lehnova.fr';
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/plaques-nfc-toulouse`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/catalogue-numerique-toulouse`, changeFrequency: 'monthly', priority: 0.8 },
  ];
}
