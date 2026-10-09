"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

function parisDay() {
 return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export default function CustomerWheel() {
 const { slug } = useParams();
 const [wheel, setWheel] = useState(null);
 const [receipt, setReceipt] = useState("");
 const [played, setPlayed] = useState(false);
 const [loading, setLoading] = useState(false);
 const [result, setResult] = useState(null);
 const [angle, setAngle] = useState(0);
 const [error, setError] = useState("");
 const storageKey = "lehnova-wheel-played-" + slug;
 useEffect(() => {
   try { setPlayed(window.localStorage.getItem(storageKey) === parisDay()); } catch {}
   fetch("/api/roue/" + encodeURIComponent(slug), { cache: "no-store" })
    .then(r => r.json()).then(d => d.wheel ? setWheel(d.wheel) : setError(d.error || "Roue indisponible"))
    .catch(() => setError("Roue indisponible"));
 }, [slug, storageKey]);
 async function spin(event) {
   event.preventDefault();
   if (!wheel || loading || played || result) return;
   const cleaned = receipt.trim().toUpperCase();
   if (!/^[A-Z0-9/_-]{3,64}$/.test(cleaned)) { setError("Saisis le numéro figurant sur ton ticket de caisse."); return; }
   setLoading(true); setError("");
   try {
     const response = await fetch("/api/roue/" + encodeURIComponent(slug), {
       method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receipt: cleaned })
     });
     const data = await response.json();
     if (!response.ok) throw new Error(data.error || "Participation impossible");
     try { window.localStorage.setItem(storageKey, data.play_day || parisDay()); } catch {}
     setPlayed(true); setResult(data);
     setAngle(a => a + 1800 + (data.won ? 0 : 180));
   } catch (e) { setError(e.message); } finally { setLoading(false); }
 }
 const blocked = played && !result;
 return <main style={{ minHeight:"100vh", background:"#fbf1ee", color:"#463237", padding:"36px 16px", textAlign:"center", fontFamily:"system-ui" }}>
  <div style={{ maxWidth:520, margin:"0 auto" }}>
  <p style={{ letterSpacing:3, color:"#98774e" }}>LEHNOVA · ANIMATION MARKETING</p>
  <h1>{wheel?.name || "La Roue"}</h1>
  {wheel && <>
   <p>Réservée aux clients ayant effectué un achat de {wheel.min_purchase} € minimum.</p>
   <p>Une participation par jour et par navigateur · 1 chance sur {wheel.win_denominator} de gagner.</p>
   <div aria-label="Roue de tirage" style={{ width:"min(80vw,280px)", height:"min(80vw,280px)", boxSizing:"border-box", borderRadius:"50%", border:"10px solid #b99560", margin:"28px auto", background:`conic-gradient(#c6a46a 0deg ${360 / wheel.win_denominator}deg, #f6b7c4 ${360 / wheel.win_denominator}deg 360deg)`, boxShadow:"0 8px 18px #e0c9c2", display:"grid", placeItems:"center", transform:`rotate(${angle}deg)`, transition:"transform 3s ease-out" }}>
    <span style={{ background:"white", padding:18, borderRadius:50, fontSize:32 }}>🎁</span>
   </div>
   {result ? <h2 role="status">{result.won ? "🎉 Félicitations ! " + result.prize : "Pas gagné cette fois. Merci pour votre visite !"}</h2>
    : blocked ? <h2 role="status">Vous avez déjà joué aujourd'hui ! Revenez demain.</h2>
    : <form onSubmit={spin} style={{ display:"grid", gap:12, maxWidth:350, margin:"0 auto" }}>
      <label htmlFor="receipt">Numéro du ticket de caisse</label>
      <input id="receipt" required minLength={3} maxLength={64} autoComplete="off" placeholder="Ex. 000124" value={receipt} onChange={e=>setReceipt(e.target.value)} style={{ fontSize:18,padding:13,borderRadius:10,border:"1px solid #b99560" }} />
      <button disabled={loading} type="submit" style={{ background:"#b99560",border:0,padding:15,borderRadius:12,fontWeight:700,cursor:"pointer" }}>{loading ? "Tirage en cours…" : "Faire tourner la roue"}</button>
    </form>}
  </>}
  {error && <p role="alert" style={{ color:"#a02038",marginTop:20 }}>{error}</p>}
  <small style={{ display:"block", marginTop:28, color:"#78676b" }}>Le numéro de ticket est bloqué après utilisation. Son authenticité ne peut pas être contrôlée automatiquement.</small>
  </div>
 </main>;
}
