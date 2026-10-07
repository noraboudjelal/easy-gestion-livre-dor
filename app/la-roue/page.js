"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./wheel.module.css";

const STORAGE_KEY = "lehnova-la-roue-v1";
const DEFAULT_CONFIG = {
  commerce: "",
  lots: ["Café offert", "Burger offert", "Dessert offert", "-10 %", "Soin offert", "Petit cadeau", "Retentez votre chance", "Cadeau surprise"],
};
const WHEEL_COLORS = ["#FF6B6B", "#4ECDC4", "#FFD93D", "#A78BFA", "#FF9F45", "#6BCB77", "#FF6FB5", "#5EC8F2"];

// Geometry copied from the existing Le Fil wheel. Keep that wheel independent.
function wheelPolarToCartesian(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function describeWheelSlice(cx, cy, r, startAngle, endAngle) {
  const start = wheelPolarToCartesian(cx, cy, r, endAngle);
  const end = wheelPolarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function validateConfig(value) {
  if (!value || typeof value.commerce !== "string" || value.commerce.length > 80 ||
      !Array.isArray(value.lots) || value.lots.length !== 8 ||
      value.lots.some((lot) => typeof lot !== "string" || !lot.trim() || lot.length > 60)) {
    return null;
  }
  return { commerce: value.commerce.trim(), lots: value.lots.map((lot) => lot.trim()) };
}

function configLink(config) {
  const url = new URL("/la-roue", window.location.origin);
  url.searchParams.set("configuration", JSON.stringify(config));
  return url.href;
}

export default function LaRoue() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [draft, setDraft] = useState(DEFAULT_CONFIG);
  const [ready, setReady] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState("");
  const [shareLink, setShareLink] = useState("");
  const spinTimeout = useRef(null);
  const spinLock = useRef(false);

  useEffect(() => {
    let initial = DEFAULT_CONFIG;
    const shared = new URLSearchParams(window.location.search).get("configuration");
    try {
      const raw = shared !== null ? shared : window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = validateConfig(JSON.parse(raw));
        if (saved) initial = saved;
        else setNotice("Configuration invalide : les lots par défaut sont affichés.");
      }
    } catch {
      setNotice("Configuration inaccessible : les lots par défaut sont affichés.");
    }
    setConfig(initial);
    setDraft(initial);
    setShareLink(configLink(initial));
    setReady(true);
    return () => clearTimeout(spinTimeout.current);
  }, []);

  function saveConfig(event) {
    event.preventDefault();
    if (spinLock.current || !ready) return;
    const next = validateConfig(draft);
    if (!next) {
      setNotice("Renseignez les huit lots (60 caractères maximum par lot).");
      return;
    }
    setConfig(next);
    setDraft(next);
    setResult(null);
    setRotation(0);
    setShareLink(configLink(next));
    // Remove a previously opened snapshot so reload uses this browser's saved edits.
    const url = new URL(window.location.href);
    url.searchParams.delete("configuration");
    window.history.replaceState(null, "", url.href);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setNotice("Lots enregistrés dans ce navigateur. Partagez le lien ci-dessous pour ce commerce.");
    } catch {
      setNotice("Lots appliqués. La sauvegarde locale est indisponible : conservez le lien ci-dessous.");
    }
  }

  function spinWheel() {
    if (spinLock.current || !ready) return;
    spinLock.current = true;
    setSpinning(true);
    setResult(null);
    const winnerIndex = Math.floor(Math.random() * config.lots.length);
    const sliceAngle = 360 / config.lots.length;
    const targetCenter = sliceAngle * winnerIndex + sliceAngle / 2;
    const currentMod = ((rotation % 360) + 360) % 360;
    // Same five turns, easing and duration as the original wheel.
    setRotation(rotation - currentMod + 5 * 360 + (360 - targetCenter));
    spinTimeout.current = setTimeout(() => {
      setResult(config.lots[winnerIndex]);
      setSpinning(false);
      spinLock.current = false;
    }, 4600);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareLink);
      setNotice("Lien copié. Il contient les huit lots et le nom de ce commerce.");
    } catch {
      setNotice("Sélectionnez et copiez le lien dans le champ ci-dessous.");
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.brand}>LEHNOVA</p>
          <h1>La Roue</h1>
          <p>{config.commerce || "Tournez la roue et découvrez votre lot !"}</p>
        </header>

        <section className={styles.card} aria-label="Roue des lots">
          <p className={styles.intro}>Huit lots, une surprise à chaque tour.</p>
          <div className={styles.stage}>
            <div className={styles.wheelWrap}>
              <div className={styles.pointer} aria-hidden="true" />
              <svg viewBox="0 0 200 200" role="img" aria-label="Roue à huit lots"
                className={styles.wheel}
                style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? "transform 4.5s cubic-bezier(0.17,0.89,0.32,1.13)" : "none" }}>
                {config.lots.map((lot, index) => {
                  const startAngle = 45 * index;
                  const endAngle = 45 * (index + 1);
                  const mid = (startAngle + endAngle) / 2;
                  const pos = wheelPolarToCartesian(100, 100, 98 * 0.62, mid);
                  return (
                    <g key={index}>
                      <title>{lot}</title>
                      <path d={describeWheelSlice(100, 100, 98, startAngle, endAngle)} fill={WHEEL_COLORS[index]} stroke="#ffffff" strokeWidth="2" />
                      <text x={pos.x} y={pos.y} fill="#241a15" fontSize="8" fontWeight="700" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${mid + 90}, ${pos.x}, ${pos.y})`}>
                        {lot.length > 14 ? `${lot.slice(0, 13)}…` : lot}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className={styles.hub} aria-hidden="true">🎉</div>
            </div>
          </div>
          <button type="button" className={styles.spinButton} disabled={!ready || spinning} onClick={spinWheel}>
            {spinning ? "🎡 Ça tourne…" : "🚀 Lancer la roue"}
          </button>
          <div aria-live="polite" aria-atomic="true">
            {result !== null && !spinning && (
              <div className={styles.result}>
                <p>La roue a parlé</p>
                <h2>{result}</h2>
              </div>
            )}
          </div>
          <details className={styles.lots}>
            <summary>Voir les 8 lots</summary>
            <ol>{config.lots.map((lot, index) => <li key={index}>{lot}</li>)}</ol>
          </details>
        </section>

        <details className={styles.card}>
          <summary className={styles.editTitle}>Personnaliser les lots</summary>
          <p className={styles.help}>Modifiez les huit textes, puis enregistrez. Chaque lot a la même chance de sortir.</p>
          <form onSubmit={saveConfig}>
            <fieldset className={styles.fields} disabled={!ready || spinning}>
              <label>Nom du commerce (facultatif)
                <input value={draft.commerce} maxLength={80} onChange={(event) => setDraft({ ...draft, commerce: event.target.value })} />
              </label>
              {draft.lots.map((lot, index) => (
                <label key={index}>Lot {index + 1}
                  <input required maxLength={60} value={lot} onChange={(event) => setDraft({ ...draft, lots: draft.lots.map((text, position) => position === index ? event.target.value : text) })} />
                </label>
              ))}
              <button type="submit" className={styles.button}>Enregistrer les lots</button>
            </fieldset>
          </form>
          <p className={styles.help}>La sauvegarde est locale à ce navigateur. Pour chaque client, conservez son lien personnalisé : il ouvre directement sa roue avec ses lots. Toute modification nécessite un nouveau lien.</p>
          <label className={styles.linkLabel}>Lien personnalisé de ce commerce
            <input readOnly value={shareLink} onFocus={(event) => event.target.select()} />
          </label>
          <button type="button" className={styles.button} disabled={!ready} onClick={copyLink}>Copier le lien</button>
        </details>
        <p role="status" className={styles.notice}>{notice}</p>
      </div>
    </main>
  );
}
