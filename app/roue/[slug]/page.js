"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

export default function CustomerWheel() {
 const { slug } = useParams(), search = useSearchParams(), token = search.get("token");
 const [wheel, setWheel] = useState(null), [loading, setLoading] = useState(false), [angle, setAngle] = useState(0), [outcome, setOutcome] = useState(null), [error, setError] = useState("");
 useEffect(() => { fetch("/api/roue/" + encodeURIComponent(slug)).then(r => r.json()).then(d => { if (d.wheel) setWheel(d.wheel); else setError(d.error); }).catch(() => setError("Roue indisponible")); }, [slug]);
 async function spin() {
  if (loading || outcome || !token) return;
  setLoading(true); setError("");
  try {
   const r = await fetch("/api/roue/" + encodeURIComponent(slug), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
   const d = await r.json(); if (!r.ok) throw new Error(d.error);
   setAngle(a => a + 1800 + (d.won ? 0 : 180)); setOutcome(d);
  } catch (e) { setError(e.message); } finally { setLoading(false); }
 }
 return <main style={{ minHeight: "100vh", padding: 32, textAlign: "center", background: "#fbf1ee", color: "#463237", fontFamily: "system-ui" }}>
 <p>LEHNOVA · ANIMATION MARKETING</p><h1>{wheel?.name || "La Roue"}</h1>
 {wheel && <><p>Offerte après {wheel.min_purchase} € d'achat minimum · 1 chance sur {wheel.win_denominator} de gagner</p>
 <div style={{ margin: "24px auto", width: 270, height: 270, borderRadius: "50%", border: "9px solid #b99560", background: `conic-gradient(#c6a46a 0deg ${360 / wheel.win_denominator}deg, #f6b7c4 ${360 / wheel.win_denominator}deg 360deg)`, transform: "rotate(" + angle + "deg)", transition: "transform 3s ease-out", display: "grid", placeItems: "center", boxShadow: "0 5px 20px #d4bcb3" }}><span style={{ background: "white", padding: 12, borderRadius: 50 }}>🎁</span></div>
 {!outcome ? <button disabled={loading || !token} onClick={spin} style={{ padding: "15px 30px", background: "#b99560", border: 0, borderRadius: 12, fontWeight: 700 }}>{loading ? "Tirage…" : "Faire tourner la roue"}</button> :
 <h2 role="status">{outcome.won ? "🎉 Bravo ! " + outcome.prize : "Pas gagné cette fois. Merci pour votre visite !"}</h2>}
 </>}
 {error && <p role="alert">{error}</p>}
 {!token && <p>Un lien de participation remis lors de l'achat est nécessaire.</p>}
 </main>;
}
