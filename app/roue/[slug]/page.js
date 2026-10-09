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
 const [spinning, setSpinning] = useState(false);
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
     setPlayed(true);
     const lots = Array.isArray(wheel.lots) ? wheel.lots : [];
     const isLosing = value => /^(perdu|pas gagn[eé]|retentez|aucun gain|dommage)/i.test(String(value || "").trim());
     const candidates = lots.map((value,index)=>({value,index})).filter(item => data.won ? item.value === data.prize : isLosing(item.value));
     const chosen = candidates.length ? candidates[Math.floor(Math.random()*candidates.length)] : null;
     const center = chosen ? chosen.index * 45 + 22.5 : 22.5;
     setAngle(previous => previous + 1800 + (((360 - center - (previous % 360)) % 360 + 360) % 360));
     setSpinning(true);
     window.setTimeout(() => { setResult(data); setSpinning(false); }, 3100);
   } catch (e) { setError(e.message); } finally { setLoading(false); }
 }
 const blocked = played && !result;
 return <main style={{ minHeight:"100vh", background:"#fbf1ee", color:"#463237", padding:"36px 16px", textAlign:"center", fontFamily:"system-ui" }}>
  <div style={{ maxWidth:520, margin:"0 auto" }}>
  <p style={{ letterSpacing:3, color:"#98774e" }}>LEHNOVA · ANIMATION MARKETING</p>
  <h1>{wheel?.name || "La Roue"}</h1>
  {wheel && <>
   <p>Réservée aux clients ayant effectué un achat de {wheel.min_purchase} € minimum.</p>
   <p>Une participation par jour et par navigateur.</p>
   <div style={{ position:"relative",width:"min(80vw,300px)",height:"min(80vw,300px)",margin:"28px auto" }}>
   <span aria-hidden="true" style={{position:"absolute",top:-15,left:"50%",transform:"translateX(-50%)",zIndex:2,color:"#795126",fontSize:26}}>▼</span>
   <div aria-label="Roue à huit lots" style={{position:"absolute",inset:0,border:"9px solid #b99560",borderRadius:"50%",background:"conic-gradient(#f6b7c4 0deg 45deg,#fff3dc 45deg 90deg,#f6b7c4 90deg 135deg,#fff3dc 135deg 180deg,#f6b7c4 180deg 225deg,#fff3dc 225deg 270deg,#f6b7c4 270deg 315deg,#fff3dc 315deg)",boxShadow:"0 8px 18px #e0c9c2",transform:`rotate(${angle}deg)`,transition:"transform 3s cubic-bezier(0.13,0.75,0.22,1)"}}>
     {Array.isArray(wheel.lots) && wheel.lots.slice(0,8).map((lot,i)=><span key={i} title={lot} style={{position:"absolute",left:"50%",top:"50%",width:95,textAlign:"center",fontSize:10,fontWeight:700,color:"#57433d",transform:`rotate(${i*45+22.5}deg) translateY(-94px) rotate(-${i*45+22.5}deg) translateX(-50%)`,transformOrigin:"0 0"}}>{lot.length>18?lot.slice(0,17)+"…":lot}</span>)}
   </div>
   <span aria-hidden="true" style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",borderRadius:50,background:"#fff",padding:13,boxShadow:"0 1px 5px #cba",fontSize:24}}>🎁</span>
   </div>
   {result ? <h2 role="status">{result.won ? "🎉 Félicitations ! " + result.prize : "Pas gagné cette fois. Merci pour votre visite !"}</h2>
    : spinning ? <p role="status">La roue tourne…</p>
    : blocked ? <h2 role="status">Vous avez déjà joué aujourd'hui ! Revenez demain.</h2>
    : <form onSubmit={spin} style={{ display:"grid", gap:12, maxWidth:350, margin:"0 auto" }}>
      <label htmlFor="receipt">Numéro du ticket de caisse</label>
      <input id="receipt" required minLength={3} maxLength={64} autoComplete="off" placeholder="Ex. 000124" value={receipt} onChange={e=>setReceipt(e.target.value)} style={{ fontSize:18,padding:13,borderRadius:10,border:"1px solid #b99560" }} />
      <button disabled={loading} type="submit" style={{ background:"#b99560",border:0,padding:15,borderRadius:12,fontWeight:700,cursor:"pointer" }}>{loading ? "Tirage en cours…" : "Faire tourner la roue"}</button>
    </form>}
  </>}
  {error && <p role="alert" style={{ color:"#a02038",marginTop:20 }}>{error}</p>}
  <small style={{ display:"block", marginTop:28, color:"#78676b" }}>Un tour par jour et par navigateur. Ticket de caisse requis.</small>
  </div>
 </main>;
}
