"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./wheel.module.css";

const WHEEL_COLORS = ["#FF6B6B", "#4ECDC4", "#FFD93D", "#A78BFA", "#FF9F45", "#6BCB77", "#FF6FB5", "#5EC8F2"];

// Copied from Le Fil; its original wheel remains untouched.
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

export default function WheelGame({ lots, disabled = false, onSpinChange }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const spinTimeout = useRef(null);
  const spinLock = useRef(false);
  useEffect(() => () => clearTimeout(spinTimeout.current), []);

  function spinWheel() {
    if (spinLock.current || disabled) return;
    spinLock.current = true;
    setSpinning(true);
    onSpinChange?.(true);
    setResult(null);
    const winnerIndex = Math.floor(Math.random() * lots.length);
    const sliceAngle = 360 / lots.length;
    const targetCenter = sliceAngle * winnerIndex + sliceAngle / 2;
    const currentMod = ((rotation % 360) + 360) % 360;
    setRotation(rotation - currentMod + 5 * 360 + (360 - targetCenter));
    spinTimeout.current = setTimeout(() => {
      setResult(lots[winnerIndex]);
      setSpinning(false);
      spinLock.current = false;
      onSpinChange?.(false);
    }, 4600);
  }

  return (
    <section className={styles.card} aria-label="Roue des lots">
      <p className={styles.intro}>Huit lots, une surprise à chaque tour.</p>
      <div className={styles.stage}>
        <div className={styles.wheelWrap}>
          <div className={styles.pointer} aria-hidden="true" />
          <svg viewBox="0 0 200 200" role="img" aria-label="Roue à huit lots" className={styles.wheel}
            style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? "transform 4.5s cubic-bezier(0.17,0.89,0.32,1.13)" : "none" }}>
            {lots.map((lot, index) => {
              const startAngle = 45 * index;
              const endAngle = 45 * (index + 1);
              const mid = (startAngle + endAngle) / 2;
              const pos = wheelPolarToCartesian(100, 100, 98 * 0.62, mid);
              return <g key={index}>
                <title>{lot}</title>
                <path d={describeWheelSlice(100, 100, 98, startAngle, endAngle)} fill={WHEEL_COLORS[index]} stroke="#ffffff" strokeWidth="2" />
                <text x={pos.x} y={pos.y} fill="#241a15" fontSize="8" fontWeight="700" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${mid + 90}, ${pos.x}, ${pos.y})`}>
                  {lot.length > 14 ? `${lot.slice(0, 13)}…` : lot}
                </text>
              </g>;
            })}
          </svg>
          <div className={styles.hub} aria-hidden="true">🎉</div>
        </div>
      </div>
      <button type="button" className={styles.spinButton} disabled={disabled || spinning} onClick={spinWheel}>
        {spinning ? "🎡 Ça tourne…" : "🚀 Lancer la roue"}
      </button>
      <div aria-live="polite" aria-atomic="true">
        {result !== null && !spinning && <div className={styles.result}><p>La roue a parlé</p><h2>{result}</h2></div>}
      </div>
      <details className={styles.lots}>
        <summary>Voir les 8 lots</summary>
        <ol>{lots.map((lot, index) => <li key={index}>{lot}</li>)}</ol>
      </details>
    </section>
  );
}
