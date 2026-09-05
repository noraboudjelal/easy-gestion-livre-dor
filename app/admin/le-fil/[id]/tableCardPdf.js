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

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(6, 6, PAGE_WIDTH - 12, PAGE_HEIGHT - 12);

  doc.setLineDashPattern([2, 2], 0);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.line(PANEL_WIDTH, 6, PANEL_WIDTH, PAGE_HEIGHT - 6);
  doc.line(PANEL_WIDTH * 2, 6, PANEL_WIDTH * 2, PAGE_HEIGHT - 6);
  doc.setLineDashPattern([], 0);

  // Volet gauche : Le Fil et son QR code.
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("LE FIL", leftX, 25, { align: "center" });
  drawOrnament(doc, leftX, 32);
  doc.setTextColor(0, 0, 0);
  doc.setFont("times", "bolditalic");
  doc.setFontSize(32);
  centeredLines(doc, "Partagez vos plus beaux souvenirs", leftX, 47, 78, { lineHeightFactor: 1.05 });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  centeredLines(doc, "Envoyez vos messages, photos et vidéos en direct !", leftX, 88, 72, { lineHeightFactor: 1.25 });
  doc.addImage(qrData, "PNG", leftX - 21, 111, 42, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("SCANNEZ-MOI", leftX, 164, { align: "center" });
  drawOrnament(doc, leftX, 179, 28);
  doc.setFont("times", "italic");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("Merci", leftX, 191, { align: "center" });

  // Volet central : table, événement et invités.
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TABLE", centerX, 25, { align: "center" });
  drawOrnament(doc, centerX, 32);
  doc.setTextColor(0, 0, 0);
  doc.setFont("times", "bold");
  const tableNumber = String(table.table_number || "");
  doc.setFontSize(tableNumber.length > 4 ? 62 : tableNumber.length > 2 ? 86 : tableNumber.length > 1 ? 104 : 120);
  doc.text(tableNumber, centerX, 76, { align: "center", maxWidth: 82 });
  doc.setFont("times", "italic");
  const { intro: eventIntro, link: eventLink, title: eventTitle } = getTableCardEventWording(event);
  let eventSize = 25;
  doc.setFontSize(eventSize);
  while ((doc.getTextWidth(eventIntro) > 82 || doc.getTextWidth(eventTitle) > 82) && eventSize > 11) {
    eventSize -= 0.5;
    doc.setFontSize(eventSize);
  }
  doc.text(eventIntro, centerX, 89, { align: "center" });
  let centerY = 89 + eventSize * 0.3528 + 3;
  if (eventLink) {
    doc.text(eventLink, centerX, centerY, { align: "center" });
    centerY += eventSize * 0.3528 + 3;
  }
  doc.setTextColor(0, 0, 0);
  doc.setFont("times", "italic");
  doc.setFontSize(eventSize);
  doc.text(eventTitle, centerX, centerY, { align: "center" });
  centerY += eventSize * 0.3528 + 8;
  drawOrnament(doc, centerX, centerY, 24);
  centerY += 11;

  if (guests.length) {
    const availableHeight = 192 - centerY;
    const lineHeightFactor = 1.28;
    const maximumGuestSize = guests.length <= 10 ? 11.5 : 10.5;
    const guestSize = Math.min(maximumGuestSize, availableHeight / (guests.length * 0.3528 * lineHeightFactor));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(guestSize);
    doc.setTextColor(0, 0, 0);
    doc.text(guests.map(String), centerX, centerY, { align: "center", lineHeightFactor, maxWidth: 76 });
  }

  // Volet droit : invitation musicale et participation au Fil.
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("LE FIL / DJ", rightX, 25, { align: "center" });
  drawOrnament(doc, rightX, 32);
  doc.setTextColor(0, 0, 0);
  doc.setFont("times", "bolditalic");
  doc.setFontSize(34);
  centeredLines(doc, "Demandez votre musique", rightX, 49, 78, { lineHeightFactor: 1.05 });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  centeredLines(doc, "Proposez un titre au DJ et participez au Fil de l’événement.", rightX, 88, 72, { lineHeightFactor: 1.25 });

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.9);
  doc.circle(rightX, 133, 13, "S");
  doc.setFillColor(0, 0, 0);
  doc.roundedRect(rightX - 16, 131, 5, 13, 1.5, 1.5, "F");
  doc.roundedRect(rightX + 11, 131, 5, 13, 1.5, 1.5, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(2.3);
  doc.line(rightX - 10, 140, rightX + 10, 140);
  drawOrnament(doc, rightX, 160, 28);
  doc.setFont("times", "italic");
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text("À vous de jouer !", rightX, 176, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  centeredLines(doc, "Messages · photos · vidéos · musique", rightX, 190, 70);
}

export const TABLE_CARD_DIMENSIONS = { pageWidth: PAGE_WIDTH, pageHeight: PAGE_HEIGHT, panelWidth: PANEL_WIDTH };

