export const DEFAULT_LOTS = ["Café offert", "Burger offert", "Dessert offert", "-10 %", "Soin offert", "Petit cadeau", "Retentez votre chance", "Cadeau surprise"];

export function normalizeWheelSlug(value) {
  return String(value || "").toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function validWheelSlug(value) {
  return typeof value === "string" && value.length <= 80 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function wheelBusinessInput(body) {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 100) throw new Error("Le nom du commerce doit contenir entre 1 et 100 caractères.");
  if (body.slug !== undefined && typeof body.slug !== "string") throw new Error("L’identifiant du commerce est invalide.");
  const slug = normalizeWheelSlug(body.slug || name);
  if (!validWheelSlug(slug)) throw new Error("L’identifiant doit contenir entre 1 et 80 caractères (lettres, chiffres et tirets).");
  if (!Array.isArray(body.lots) || body.lots.length !== 8 || body.lots.some((lot) =>
    typeof lot !== "string" || !lot.trim() || lot.length > 60)) {
    throw new Error("Renseignez exactement 8 lots, de 1 à 60 caractères chacun.");
  }
  return { name, slug, lots: body.lots.map((lot) => lot.trim()) };
}
