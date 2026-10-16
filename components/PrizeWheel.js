"use client";

import { useId } from "react";
import styles from "./PrizeWheel.module.css";

const COLORS = ["#e3b9aa", "#f7edda", "#8dada3", "#f4d49a", "#c38d88", "#e9ded0", "#9baeb8", "#ddbf91"];
function point(radius, degrees) {
  const a = (degrees - 90) * Math.PI / 180;
  return { x: 200 + radius * Math.cos(a), y: 200 + radius * Math.sin(a) };
}
function slice(start, end) {
  const a = point(170, start), b = point(170, end);
  return `M 200 200 L ${a.x} ${a.y} A 170 170 0 0 1 ${b.x} ${b.y} Z`;
}
function labelLines(value) {
  const words = String(value).trim().split(/\s+/);
  const lines = [""];
  for (const word of words) {
    const last = lines.length - 1;
    if (lines[last] && (lines[last] + " " + word).length > 13 && lines.length < 2) lines.push(word);
    else lines[last] += (lines[last] ? " " : "") + word;
  }
  return lines.map(line => line.length > 16 ? line.slice(0, 15) + "…" : line);
}

export default function PrizeWheel({ lots = [], rotation = 0, spinning = false, duration = 4500 }) {
  const id = useId().replace(/:/g, "");
  return (
    <div className={styles.machine} data-spinning={spinning}>
      <div className={styles.pedestal} aria-hidden="true" />
      <div className={styles.frame}>
        <svg className={styles.disc} viewBox="0 0 400 400" role="img" aria-label="Roue à huit lots"
          style={{ transform: `rotate(${rotation}deg)`, "--spin-duration": `${duration}ms` }}>
          <defs>
            <radialGradient id={id + "surface"} cx="35%" cy="22%" r="85%">
              <stop offset="0" stopColor="#fff" stopOpacity=".32" />
              <stop offset=".5" stopColor="#fff" stopOpacity="0" />
              <stop offset="1" stopColor="#352318" stopOpacity=".22" />
            </radialGradient>
          </defs>
          <circle cx="200" cy="200" r="172" fill="#775536" />
          {Array.from({ length: 8 }, (_, i) => {
            const lot = lots[i] || "", mid = i * 45 + 22.5, pos = point(112, mid), lines = labelLines(lot);
            return <g key={i}>
              <title>{lot}</title>
              <path d={slice(i * 45, (i + 1) * 45)} fill={COLORS[i]} stroke="#fff8e8" strokeWidth="1.5" />
              <g transform={`translate(${pos.x} ${pos.y}) rotate(${mid - 90})`}>
                {lines.map((line, index) => <text key={index} x="0" y={(index - (lines.length - 1) / 2) * 13}
                  dominantBaseline="middle" textAnchor="middle" fill="#302b26" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700">{line}</text>)}
              </g>
            </g>;
          })}
          <circle cx="200" cy="200" r="170" fill={`url(#${id}surface)`} pointerEvents="none" />
          {Array.from({ length: 32 }, (_, i) => {
            const p = point(176, i * 11.25);
            return <circle key={i} cx={p.x} cy={p.y} r="2.8" fill="#fff0ca" stroke="#825b34" strokeWidth="1" />;
          })}
        </svg>
        <svg className={styles.rim} viewBox="0 0 400 400" aria-hidden="true">
          <defs>
            <linearGradient id={id + "metal"} x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#fff0cc" /><stop offset=".24" stopColor="#b58a4f" />
              <stop offset=".5" stopColor="#f8dfaa" /><stop offset=".75" stopColor="#916331" /><stop offset="1" stopColor="#e7c78f" />
            </linearGradient>
          </defs>
          <circle cx="200" cy="200" r="188" fill="none" stroke="#60452f" strokeWidth="20" />
          <circle cx="200" cy="200" r="188" fill="none" stroke={`url(#${id}metal)`} strokeWidth="15" />
          {Array.from({ length: 24 }, (_, i) => {
            const p = point(188, i * 15);
            return <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#fff6d6" stroke="#a77a43" strokeWidth="1" />;
          })}
        </svg>
        <div className={styles.pointer} aria-hidden="true"><span /></div>
        <div className={styles.hub} aria-hidden="true"><span>L</span></div>
      </div>
    </div>
  );
}
