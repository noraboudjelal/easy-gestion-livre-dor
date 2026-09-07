// One renderer for both the preview and the downloaded PNG.
export const COVER_STYLES = [
  { id: "editorial", label: "Éditorial", description: "Photographie immersive, contraste et grandes lettres." },
  { id: "minimal", label: "Minimal", description: "Papier ivoire, filet délicat et typographie sculpturale." },
  { id: "romantic", label: "Romantique", description: "Portrait en arche, lumière douce et tons chaleureux." },
];

export function coverDefaults(event) {
  return {
    title: (event.event_title || event.client || "").replace(/^mariage\s+(?:de|d[’'])\s*/i, ""),
    date: (event.event_date || "").slice(0, 10),
    welcome: "Bienvenue",
    subtitle: event.event_type === "Mariage" ? "Le Fil de notre mariage" : "Le Fil de notre événement",
    style: "minimal", background: "#fffaf2", ink: "#392f27", accent: "#b48645",
    width: 2048, height: 2732, photo: "", x: 50, y: 50, veil: 45,
  };
}

let fontsPromise;
export function loadCoverFonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      new FontFace("Fil Cover", "url(/fonts/instrument-serif.ttf)"),
      new FontFace("Fil Cover", "url(/fonts/instrument-serif-italic.ttf)", { style: "italic" }),
    ].map(async (font) => { await font.load(); document.fonts.add(font); })).catch((error) => {
      fontsPromise = null;
      throw new Error("La typographie n’a pas pu être chargée. Réessayez avant de télécharger.");
    });
  }
  return fontsPromise;
}

export async function loadCoverPhoto(url) {
  if (!url) return null;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  try { await img.decode(); } catch { throw new Error("Image illisible. Choisissez une photo JPG, PNG ou WebP."); }
  return img;
}

function dateLabel(value) {
  if (!value) return "";
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function drawCover(canvas, config, photo, width = config.width, height = config.height) {
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("La génération d’image n’est pas disponible dans ce navigateur.");
  // Layout in a 1000-unit coordinate space, with proportional safe areas.
  ctx.scale(width / 1000, width / 1000);
  const h = height / width * 1000;
  const { style, background, ink, accent } = config;
  ctx.fillStyle = background; ctx.fillRect(0, 0, 1000, h);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const line = (x1, y1, x2, y2, color, opacity = 1) => {
    ctx.save(); ctx.globalAlpha = opacity; ctx.strokeStyle = color; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
  };
  const text = (value, y, size, color, italic = false, maxWidth = 800) => {
    ctx.fillStyle = color; ctx.font = `${italic ? "italic " : ""}${size}px "Fil Cover", Georgia, serif`;
    // Fit even very long names without clipping or changing the content.
    const measured = ctx.measureText(value).width;
    if (measured > maxWidth) ctx.font = `${italic ? "italic " : ""}${size * maxWidth / measured}px "Fil Cover", Georgia, serif`;
    ctx.fillText(value, 500, y);
  };
  const tracked = (value, y, color) => {
    ctx.save(); ctx.fillStyle = color; ctx.font = '12px Arial, sans-serif';
    const chars = [...value.toLocaleUpperCase("fr-FR")];
    const spacing = 3.2;
    const total = chars.reduce((sum, c) => sum + ctx.measureText(c).width, 0) + Math.max(0, chars.length - 1) * spacing;
    if (total > 800) { text(value, y, 22, color); ctx.restore(); return; }
    let x = 500 - total / 2; ctx.textAlign = "left";
    for (const c of chars) { ctx.fillText(c, x, y); x += ctx.measureText(c).width + spacing; }
    ctx.restore();
  };
  const picture = (x, y, w, ph) => {
    if (!photo) return;
    const scale = Math.max(w / photo.naturalWidth, ph / photo.naturalHeight);
    const sw = w / scale, sh = ph / scale;
    ctx.drawImage(photo, (photo.naturalWidth - sw) * config.x / 100, (photo.naturalHeight - sh) * config.y / 100, sw, sh, x, y, w, ph);
  };
  const names = config.title.trim().split(/\s+(?:&|et)\s+/i);
  const couple = names.length === 2;
  const title = (center, color, size = 128, stacked = true) => {
    if (couple && stacked) {
      text(names[0], center - 92, size, color);
      text("&", center + 2, 64, color, true);
      text(names[1], center + 104, size, color);
    } else text(config.title.trim(), center, size, color, false);
  };

  if (style === "editorial") {
    picture(0, 0, 1000, h);
    if (!photo) { ctx.fillStyle = ink; ctx.fillRect(0, 0, 1000, h); }
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "rgba(16,13,10,0.15)");
    gradient.addColorStop(0.4, `rgba(16,13,10,${0.2 + config.veil / 170})`);
    gradient.addColorStop(1, "rgba(16,13,10,0.75)");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1000, h);
    tracked(config.welcome, h * 0.365, "#fffaf2");
    title(h * 0.54, "#fffaf2", 142);
    text(dateLabel(config.date), h * 0.735, 28, "#fffaf2", true);
    line(460, h * 0.81, 540, h * 0.81, "#fffaf2", 0.7);
    tracked(config.subtitle, h * 0.855, "#fffaf2");
  } else if (style === "romantic") {
    const ax = 160, ay = h * 0.24, aw = 680, ah = h * 0.38;
    ctx.save(); ctx.beginPath();
    ctx.moveTo(ax, ay + ah); ctx.lineTo(ax, ay + aw / 2);
    ctx.arc(500, ay + aw / 2, aw / 2, Math.PI, 0);
    ctx.lineTo(ax + aw, ay + ah); ctx.closePath(); ctx.clip();
    ctx.fillStyle = accent; ctx.globalAlpha = 0.16; ctx.fillRect(ax, ay, aw, ah); ctx.globalAlpha = 1;
    picture(ax, ay, aw, ah);
    ctx.fillStyle = background; ctx.globalAlpha = config.veil / 250; ctx.fillRect(ax, ay, aw, ah); ctx.globalAlpha = 1;
    const fade = ctx.createLinearGradient(0, ay + ah * 0.55, 0, ay + ah);
    fade.addColorStop(0, `${background}00`); fade.addColorStop(1, background);
    ctx.fillStyle = fade; ctx.fillRect(ax, ay, aw, ah); ctx.restore();
    text(config.welcome, h * 0.62, 32, ink, true);
    title(h * 0.705, ink, 114, false);
    text(dateLabel(config.date), h * 0.775, 27, ink, true);
    line(475, h * 0.825, 525, h * 0.825, accent);
    tracked(config.subtitle, h * 0.865, ink);
  } else {
    ctx.strokeStyle = accent; ctx.globalAlpha = 0.45; ctx.lineWidth = 0.8;
    ctx.strokeRect(58, 58, 884, h - 116); ctx.globalAlpha = 1;
    tracked(config.welcome, h * 0.365, ink);
    title(h * 0.535, ink, 145);
    line(473, h * 0.71, 527, h * 0.71, accent);
    text(dateLabel(config.date), h * 0.757, 29, ink, true);
    tracked(config.subtitle, h * 0.865, ink);
  }
}
