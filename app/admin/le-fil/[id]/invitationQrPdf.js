const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 8;
const COLUMNS = 4;
const ROWS = 5;
const CARD_WIDTH = (PAGE_WIDTH - MARGIN * 2) / COLUMNS;
const CARD_HEIGHT = (PAGE_HEIGHT - MARGIN * 2) / ROWS;

function fitCenteredText(doc, text, centerX, y, maxWidth) {
  let size = 11;
  doc.setFont("times", "italic");
  doc.setFontSize(size);
  while (doc.getTextWidth(text) > maxWidth && size > 7) {
    size -= 0.5;
    doc.setFontSize(size);
  }
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines.slice(0, 2), centerX, y, { align: "center", lineHeightFactor: 1.05 });
}

function drawMinimalOrnament(doc, centerX, y) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.18);
  doc.line(centerX - 7, y, centerX - 2, y);
  doc.circle(centerX, y, 0.7, "S");
  doc.line(centerX + 2, y, centerX + 7, y);
}

export function addInvitationQrSheet(doc, event, qrData) {
  const eventTitle = String(event?.event_title || "").trim();

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");
  doc.setDrawColor(190, 190, 190);
  doc.setLineWidth(0.15);

  for (let column = 0; column <= COLUMNS; column += 1) {
    const x = MARGIN + column * CARD_WIDTH;
    doc.line(x, MARGIN, x, PAGE_HEIGHT - MARGIN);
  }
  for (let row = 0; row <= ROWS; row += 1) {
    const y = MARGIN + row * CARD_HEIGHT;
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  }

  for (let row = 0; row < ROWS; row += 1) {
    for (let column = 0; column < COLUMNS; column += 1) {
      const x = MARGIN + column * CARD_WIDTH;
      const y = MARGIN + row * CARD_HEIGHT;
      const centerX = x + CARD_WIDTH / 2;

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.18);
      doc.rect(x + 0.7, y + 0.7, CARD_WIDTH - 1.4, CARD_HEIGHT - 1.4);

      doc.setTextColor(0, 0, 0);
      doc.setFont("times", "bold");
      doc.setFontSize(8);
      doc.text("LE FIL", centerX, y + 6, { align: "center", charSpace: 0.6 });
      drawMinimalOrnament(doc, centerX, y + 9);

      fitCenteredText(doc, eventTitle, centerX, y + 13.5, CARD_WIDTH - 7);
      doc.addImage(qrData, "PNG", centerX - 12, y + 21, 24, 24);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text("Scannez pour confirmer", centerX, y + 49, { align: "center" });
      doc.text("votre présence", centerX, y + 52.3, { align: "center" });
    }
  }
}

export const INVITATION_QR_LAYOUT = {
  columns: COLUMNS,
  rows: ROWS,
  count: COLUMNS * ROWS,
  cardWidth: CARD_WIDTH,
  cardHeight: CARD_HEIGHT,
};
