export default function IdleCoverText({ text }) {
  if (!text?.trim()) return null;
  return (
    <span style={{
      position: "absolute", left: "5%", right: "5%", top: "50%",
      transform: "translateY(-50%)", textAlign: "center", pointerEvents: "none",
      color: "#fff", fontFamily: "'Libre Baskerville', Georgia, serif",
      fontStyle: "italic", fontWeight: 700,
      fontSize: text.length > 60 ? "clamp(32px, 7cqi, 96px)" : text.length > 32 ? "clamp(40px, 9cqi, 120px)" : "clamp(48px, 11cqi, 150px)",
      lineHeight: 1.08, overflowWrap: "break-word", whiteSpace: "pre-wrap",
      textShadow: "0 3px 7px rgba(0,0,0,.85), 0 6px 24px rgba(0,0,0,.65)",
    }}>{text}</span>
  );
}
