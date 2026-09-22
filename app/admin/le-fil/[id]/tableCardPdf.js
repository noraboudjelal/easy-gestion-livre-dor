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

export function addTableCardPage(doc, event, table, qrData) {
  const guests = table.guest_names || [];
  const centers = [PANEL_WIDTH / 2, PANEL_WIDTH * 1.5, PANEL_WIDTH * 2.5];
  const [leftX, centerX, rightX] = centers;
  const ink = [66, 61, 49];
  const soft = [151, 137, 111];

  doc.setFillColor(255, 253, 249);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");

  // Face 1 — numéro de table. Les noms des invités restent optionnels.
  doc.setTextColor(...ink);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("TABLE", leftX, 38, { align: "center" });

  doc.setFont("times", "normal");
  const tableNumber = String(table.table_number || "");
  doc.setFontSize(tableNumber.length > 4 ? 58 : tableNumber.length > 2 ? 78 : tableNumber.length > 1 ? 92 : 108);
  doc.text(tableNumber, leftX, 92, { align: "center", maxWidth: 78 });

  doc.setDrawColor(...soft);
  doc.setLineWidth(0.35);
  doc.line(leftX - 21, 107, leftX - 5, 107);
  doc.line(leftX + 5, 107, leftX + 21, 107);
  doc.setDrawColor(...soft);
  doc.setLineWidth(0.35);
  doc.circle(leftX, 107, 1.1, "S");

  const { title: eventTitle } = getTableCardEventWording(event);
  doc.setTextColor(...ink);
  doc.setFont("times", "italic");
  doc.setFontSize(18);
  centeredLines(doc, eventTitle, leftX, 128, 76, { lineHeightFactor: 1.08 });

  if (guests.length) {
    doc.setFont("helvetica", "normal");
    const maxGuestSize = guests.length <= 8 ? 10.5 : guests.length <= 12 ? 9 : 7.8;
    doc.setFontSize(maxGuestSize);
    doc.setTextColor(...ink);
    doc.text(guests.map(String), leftX, 151, { align: "center", lineHeightFactor: 1.25, maxWidth: 72 });
  }

  // Face 2 — Le Fil.
  doc.setTextColor(...ink);
  doc.setFont("times", "italic");
  doc.setFontSize(31);
  doc.text("Le Fil", centerX, 37, { align: "center" });
  doc.setDrawColor(...soft);
  doc.setLineWidth(0.35);
  doc.line(centerX - 18, 45, centerX - 4, 45);
  doc.line(centerX + 4, 45, centerX + 18, 45);
  doc.setDrawColor(...soft);
  doc.setLineWidth(0.35);
  doc.circle(centerX, 45, 1.1, "S");

  doc.setTextColor(...ink);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text("ÉCRIVEZ UN MOT", centerX, 61, { align: "center" });
  doc.text("LAISSEZ UNE PHOTO", centerX, 69, { align: "center" });
  doc.text("OU UNE VIDÉO", centerX, 77, { align: "center" });

  doc.addImage(qrData, "PNG", centerX - 22, 88, 44, 44);
  doc.setFont("times", "italic");
  doc.setFontSize(17);
  doc.text("Scannez-moi !", centerX, 145, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...soft);
  doc.text("UN MOT   ·   UNE PHOTO   ·   UNE VIDÉO", centerX, 163, { align: "center" });
  doc.setFontSize(7);
  doc.text("MERCI D’ÊTRE LÀ", centerX, 188, { align: "center" });

  // Face 3 — musique uniquement, sans cagnotte.
  doc.setTextColor(...ink);
  doc.setFont("times", "normal");
  doc.setFontSize(30);
  doc.text("♫", rightX, 44, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11.5);
  doc.text("CHOISISSEZ", rightX, 65, { align: "center" });
  doc.text("UNE MUSIQUE", rightX, 75, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(...soft);
  doc.text("POUR FAIRE DANSER", rightX, 90, { align: "center" });
  doc.text("LA PISTE !", rightX, 98, { align: "center" });

  // Le même QR ouvre Le Fil, où la demande de musique est accessible.
  doc.addImage(qrData, "PNG", rightX - 19, 112, 38, 38);
  doc.setTextColor(...ink);
  doc.setFont("times", "italic");
  doc.setFontSize(15);
  doc.text("Scannez-moi !", rightX, 161, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...soft);
  doc.text("MERCI DE FAIRE PARTIE", rightX, 181, { align: "center" });
  doc.text("DE CETTE BELLE JOURNÉE", rightX, 189, { align: "center" });
}

export const TABLE_CARD_DIMENSIONS = { pageWidth: PAGE_WIDTH, pageHeight: PAGE_HEIGHT, panelWidth: PANEL_WIDTH };

