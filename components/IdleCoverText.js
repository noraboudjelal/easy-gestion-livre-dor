export default function IdleCoverText({ text }) {
  if (!text?.trim()) return null;

  const cleanText = text.trim();
  const eventMatch = cleanText.match(/^(Anniversaire|Mariage|Baby Shower|Baptême)\s+(de|d[’'])\s+(.+)$/i);

  if (eventMatch) {
    const eventLabel = eventMatch[1];
    const connector = eventMatch[2];
    const name = eventMatch[3];
    return (
      <span style={{
        position: "absolute", left: "5%", right: "5%", top: "43%",
        transform: "translateY(-50%)", textAlign: "center", pointerEvents: "none",
        color: "#fff", fontFamily: "'Libre Baskerville', Georgia, serif",
        fontStyle: "italic", fontWeight: 700, lineHeight: 1.02,
        textShadow: "0 3px 7px rgba(0,0,0,.85), 0 6px 24px rgba(0,0,0,.65)",
      }}>
        <span style={{display:"block",fontSize:"clamp(42px, 9cqi, 118px)"}}>{eventLabel}</span>
        <span style={{display:"block",fontSize:"clamp(30px, 6cqi, 76px)",margin:"8px 0 2px"}}>{connector}</span>
        <span style={{display:"block",fontSize:"clamp(52px, 11cqi, 150px)"}}>{name}</span>
      </span>
    );
  }

  return (
    <span style={{
      position: "absolute", left: "5%", right: "5%", top: "43%",
      transform: "translateY(-50%)", textAlign: "center", pointerEvents: "none",
      color: "#fff", fontFamily: "'Libre Baskerville', Georgia, serif",
      fontStyle: "italic", fontWeight: 700,
      fontSize: cleanText.length > 60 ? "clamp(32px, 7cqi, 96px)" : cleanText.length > 32 ? "clamp(40px, 9cqi, 120px)" : "clamp(48px, 11cqi, 150px)",
      lineHeight: 1.08, overflowWrap: "break-word", whiteSpace: "pre-wrap",
      textShadow: "0 3px 7px rgba(0,0,0,.85), 0 6px 24px rgba(0,0,0,.65)",
    }}>{cleanText}</span>
  );
}
