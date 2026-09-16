export default function IdleCoverText({ text }) {
  if (!text?.trim()) return null;
  return (
    <span style={{
      position: "absolute", left: "7%", right: "7%", top: "50%",
      transform: "translateY(-50%)", textAlign: "center", pointerEvents: "none",
      color: "#fff", fontFamily: "'Libre Baskerville', Georgia, serif",
      fontStyle: "italic", fontWeight: 700,
      fontSize: text.length > 60 ? "clamp(20px, 5cqi, 68px)" : "clamp(24px, 7cqi, 88px)",
      lineHeight: 1.15, overflowWrap: "anywhere", whiteSpace: "pre-wrap",
      textShadow: "0 2px 5px rgba(0,0,0,.8), 0 4px 18px rgba(0,0,0,.6)",
    }}>{text}</span>
  );
}
