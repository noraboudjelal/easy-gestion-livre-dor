"use client";

import { useEffect, useRef, useState } from "react";

export default function IdleCover({ event, timeoutMs = 60000 }) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);

  const title = (event?.event_title || event?.client || "Bienvenue").replace(/^mariage\s+(?:de|d[’'])\s*/i, "");
  const date = event?.event_date
    ? new Date(`${event.event_date}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "";

  function arm() {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(true), timeoutMs);
  }

  useEffect(() => {
    arm();
    const activity = () => {
      if (!visible) arm();
    };
    window.addEventListener("pointerdown", activity, { passive: true });
    window.addEventListener("keydown", activity);
    window.addEventListener("touchstart", activity, { passive: true });
    return () => {
      clearTimeout(timerRef.current);
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
      window.removeEventListener("touchstart", activity);
    };
  }, [visible, timeoutMs]);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => { setVisible(false); arm(); }}
      aria-label="Entrer dans Le Fil"
      style={{
        position: "fixed", inset: 0, zIndex: 9999, border: 0, padding: 0, cursor: "pointer",
        background: "linear-gradient(145deg,#f8f1e7,#efe1cf)", color: "#3a2e25",
        display: "grid", placeItems: "center", textAlign: "center",
      }}
    >
      <div style={{ padding: 36, width: "min(88vw,760px)" }}>
        <div style={{ fontSize: 13, letterSpacing: ".28em", textTransform: "uppercase", color: "#a6792b", marginBottom: 22 }}>Le Fil</div>
        <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: "clamp(44px,8vw,88px)", lineHeight: 1.05, marginBottom: 20 }}>{title}</div>
        {date && <div style={{ fontSize: "clamp(16px,2.4vw,24px)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 34 }}>{date}</div>}
        <div style={{ width: 72, height: 1, background: "#b48645", margin: "0 auto 28px" }} />
        <div style={{ fontSize: "clamp(18px,2.8vw,28px)", marginBottom: 12 }}>Bienvenue</div>
        <div style={{ fontSize: "clamp(14px,2vw,18px)", color: "#7b6b5d" }}>Touchez l’écran pour entrer</div>
      </div>
    </button>
  );
}
