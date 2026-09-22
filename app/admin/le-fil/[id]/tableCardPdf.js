const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;
const PANEL_WIDTH = PAGE_WIDTH / 3;

function drawOrnament(doc, centerX, y, width = 32) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.line(centerX - width / 2, y, centerX - 3, y);
  doc.line(centerX + 3, y, centerX + width / 2, y);
  doc.circle(centerX, y, 1.2, "S");
}

function centeredLines(doc, text, centerX, y, maxWidth, options = {}) {
  const lines = doc.splitTextToSize(String(text || ""), maxWidth);
  doc.text(lines, centerX, y, { align: "center", lineHeightFactor: options.lineHeightFactor || 1.25 });
  return lines.length;
}

const EVENT_WORDINGS = {
  Mariage: { intro: "Bienvenue au mariage", link: "de", prefix: /^mariage\s+de\s+/i },
  Anniversaire: { intro: "Bienvenue à l’anniversaire", link: "de", prefix: /^anniversaire\s+de\s+/i },
  Baptême: { intro: "Bienvenue au baptême", link: "de", prefix: /^baptême\s+de\s+/i },
  "Baby Shower": { intro: "Bienvenue à la Baby Shower", link: "de", prefix: /^baby\s*shower\s+de\s+/i },
  "Pot de départ": { intro: "Bienvenue au pot de départ", link: "de", prefix: /^pot\s+de\s+départ\s+de\s+/i },
  "Départ en retraite": { intro: "Bienvenue au départ en retraite", link: "de", prefix: /^départ\s+en\s+retraite\s+de\s+/i },
  Henné: { intro: "Bienvenue à la cérémonie du henné", link: "de", prefix: /^(?:cérémonie\s+du\s+)?henné\s+de\s+/i },
  Circoncision: { intro: "Bienvenue à la circoncision", link: "de", prefix: /^circoncision\s+de\s+/i },
  Fiançailles: { intro: "Bienvenue aux fiançailles", link: "de", prefix: /^fiançailles\s+de\s+/i },
  Inauguration: { intro: "Bienvenue à l’inauguration", link: "de", prefix: /^inauguration\s+de\s+/i },
  "Lancement de produit": { intro: "Bienvenue au lancement", link: "de", prefix: /^lancement(?:\s+de\s+produit)?\s+de\s+/i },
  "Fête d'entreprise": { intro: "Bienvenue à la fête d’entreprise", link: "de", prefix: /^fête\s+d['’]entreprise\s+de\s+/i },
  "Vos avis": { intro: "Bienvenue dans", link: "", prefix: /^vos\s+avis\s*[-:]?\s*/i },
  "Entre Nous": { intro: "Bienvenue dans", link: "", prefix: /^entre\s+nous\s*[-:]?\s*/i },
  "Notre Journal": { intro: "Bienvenue dans", link: "", prefix: /^notre\s+journal\s*[-:]?\s*/i },
  Autre: { intro: "Bienvenue pour", link: "", prefix: null },
};

export function getTableCardEventWording(event = {}) {
  const wording = EVENT_WORDINGS[event.event_type] || EVENT_WORDINGS.Autre;
  const originalTitle = String(event.event_title || "").trim();
  const title = wording.prefix ? originalTitle.replace(wording.prefix, "").trim() || originalTitle : originalTitle;
  return { intro: wording.intro, link: wording.link, title };
}

function drawFloralCorner(doc, x, y, flipX = 1, flipY = 1) {
  const sage = [129, 142, 113];
  const cream = [236, 228, 211];
  doc.setDrawColor(...sage);
  doc.setLineWidth(0.45);
  const sx = (v) => x + v * flipX;
  const sy = (v) => y + v * flipY;
  doc.line(sx(0), sy(0), sx(24), sy(20));
  doc.line(sx(8), sy(7), sx(18), sy(2));
  doc.line(sx(12), sy(11), sx(5), sy(19));
  doc.line(sx(17), sy(14), sx(29), sy(10));
  doc.setFillColor(...sage);
  [[12,4],[18,8],[8,13],[23,13],[15,18]].forEach(([dx,dy]) => {
    doc.ellipse(sx(dx), sy(dy), 2.8, 1.15, "F");
  });
  doc.setFillColor(...cream);
  doc.setDrawColor(190, 180, 158);
  [[5,5],[25,6],[27,17]].forEach(([dx,dy]) => {
    doc.circle(sx(dx), sy(dy), 2.4, "FD");
    doc.circle(sx(dx + 2.2), sy(dy + 1), 2.2, "FD");
    doc.circle(sx(dx - 1), sy(dy + 2.2), 2.1, "FD");
  });
}

export function addTableCardPage(doc, event, table, qrData) {
  const guests = table.guest_names || [];
  const [leftX, centerX, rightX] = [PANEL_WIDTH / 2, PANEL_WIDTH * 1.5, PANEL_WIDTH * 2.5];
  const ink = [58, 55, 47];
  const soft = [139, 128, 105];
  const qrY = 104;
  const qrSize = 42;

  doc.setFillColor(255, 252, 246);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");

  // Décor floral discret : chaque face reste lisible et équilibrée.
  drawFloralCorner(doc, 7, 8, 1, 1);
  drawFloralCorner(doc, PANEL_WIDTH - 7, PAGE_HEIGHT - 8, -1, -1);
  drawFloralCorner(doc, PANEL_WIDTH + 7, PAGE_HEIGHT - 8, 1, -1);
  drawFloralCorner(doc, PANEL_WIDTH * 2 - 7, 8, -1, 1);
  drawFloralCorner(doc, PANEL_WIDTH * 2 + 7, 8, 1, 1);
  drawFloralCorner(doc, PAGE_WIDTH - 7, PAGE_HEIGHT - 8, -1, -1);

  // FACE 1 — table.
  doc.setTextColor(...ink);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("TABLE", leftX, 39, { align: "center" });

  const tableNumber = String(table.table_number || "");
  doc.setFont("times", "normal");
  doc.setFontSize(tableNumber.length > 3 ? 60 : tableNumber.length > 1 ? 82 : 98);
  doc.text(tableNumber, leftX, 91, { align: "center" });

  doc.setDrawColor(...soft);
  doc.setLineWidth(0.3);
  doc.line(leftX - 21, 105, leftX - 4, 105);
  doc.circle(leftX, 105, 1.1, "S");
  doc.line(leftX + 4, 105, leftX + 21, 105);

  const { title: eventTitle } = getTableCardEventWording(event);
  doc.setTextColor(...ink);
  doc.setFont("times", "italic");
  doc.setFontSize(17);
  centeredLines(doc, eventTitle, leftX, 124, 72, { lineHeightFactor: 1.08 });

  if (guests.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(guests.length <= 8 ? 10 : guests.length <= 12 ? 8.5 : 7.2);
    doc.text(guests.map(String), leftX, 148, { align: "center", lineHeightFactor: 1.28, maxWidth: 70 });
  }

  // FACE 2 — Le Fil.
  doc.setTextColor(...ink);
  doc.setFont("times", "italic");
  doc.setFontSize(30);
  doc.text("Le Fil", centerX, 39, { align: "center" });

  doc.setDrawColor(...soft);
  doc.setLineWidth(0.3);
  doc.line(centerX - 17, 48, centerX - 4, 48);
  doc.circle(centerX, 48, 1.1, "S");
  doc.line(centerX + 4, 48, centerX + 17, 48);

  doc.setTextColor(...ink);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.2);
  doc.text("ÉCRIVEZ UN MOT", centerX, 66, { align: "center" });
  doc.text("LAISSEZ UNE PHOTO", centerX, 75, { align: "center" });
  doc.text("OU UNE VIDÉO", centerX, 84, { align: "center" });

  // Les deux QR sont volontairement sur la même ligne.
  doc.addImage(qrData, "PNG", centerX - qrSize / 2, qrY, qrSize, qrSize);
  doc.setFont("times", "italic");
  doc.setFontSize(15);
  doc.text("Scannez-moi !", centerX, 158, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...soft);
  doc.text("UN MOT  ·  UNE PHOTO  ·  UNE VIDÉO", centerX, 174, { align: "center" });
  doc.text("MERCI D’ÊTRE LÀ", centerX, 190, { align: "center" });

  // FACE 3 — musique, même grille verticale que Le Fil.
  doc.setTextColor(...ink);
  doc.setFont("times", "italic");
  doc.setFontSize(25);
  doc.text("Musique", rightX, 39, { align: "center" });

  doc.setDrawColor(...soft);
  doc.setLineWidth(0.3);
  doc.line(rightX - 17, 48, rightX - 4, 48);
  doc.circle(rightX, 48, 1.1, "S");
  doc.line(rightX + 4, 48, rightX + 17, 48);

  doc.setTextColor(...ink);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.2);
  doc.text("CHOISISSEZ UNE MUSIQUE", rightX, 66, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(...soft);

  doc.addImage(qrData, "PNG", rightX - qrSize / 2, qrY, qrSize, qrSize);
  doc.setTextColor(...ink);
  doc.setFont("times", "italic");
  doc.setFontSize(15);
  doc.text("Scannez-moi !", rightX, 158, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...soft);
  doc.text("PROPOSEZ VOTRE TITRE", rightX, 174, { align: "center" });
}

export const TABLE_CARD_DIMENSIONS = { pageWidth: PAGE_WIDTH, pageHeight: PAGE_HEIGHT, panelWidth: PANEL_WIDTH };

