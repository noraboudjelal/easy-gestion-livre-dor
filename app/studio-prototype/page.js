"use client";
import { useEffect, useRef, useState } from "react";

const W = 540, H = 960;
export default function StudioPage() {
  const canvas = useRef(null);
  const imagesRef = useRef([]);
  const [files, setFiles] = useState([]);
  const [business, setBusiness] = useState("Burger 31");
  const [offer, setOffer] = useState("Menu à 9,90 €");
  const [cta, setCta] = useState("Commandez maintenant !");
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Ajoutez 3 à 5 photos pour commencer.");
  const [style, setStyle] = useState("impact");
  useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f));
    let alive = true;
    Promise.all(urls.map(url => new Promise(resolve => {
      const img = new Image(); img.onload = () => resolve(img); img.onerror = () => resolve(null); img.src = url;
    }))).then(imgs => { if (alive) imagesRef.current = imgs.filter(Boolean); });
    return () => { alive = false; urls.forEach(URL.revokeObjectURL); };
  }, [files]);
  const draw = (elapsed) => {
    const c = canvas.current, ctx = c?.getContext("2d");
    if (!ctx) return;
    const imgs = imagesRef.current;
    const sec = Math.min(14.99, elapsed / 1000);
    const idx = Math.min(Math.floor(sec / 3), 4);
    ctx.fillStyle = "#111"; ctx.fillRect(0,0,W,H);
    if (imgs.length) {
      const img = imgs[idx % imgs.length];
      const scale = Math.max(W / img.width, H / img.height) * (1.07 + (sec % 3) * .025);
      const dw = img.width * scale, dh = img.height * scale;
      const shift = Math.sin(sec * 1.2) * 12;
      ctx.drawImage(img,(W-dw)/2 + shift,(H-dh)/2,dw,dh);
    }
    const shade = ctx.createLinearGradient(0,400,0,H);
    shade.addColorStop(0,"rgba(0,0,0,0)"); shade.addColorStop(1,"rgba(0,0,0,.94)");
    ctx.fillStyle = shade; ctx.fillRect(0,350,W,610);
    ctx.textAlign = "center";
    ctx.fillStyle = style === "impact" ? "#ffba37" : "#f5d7b4";
    ctx.font = "bold 32px Arial"; ctx.fillText(business.slice(0,28).toUpperCase(),W/2,710);
    ctx.fillStyle = "#fff"; ctx.font = "bold 43px Arial";
    const lines = (idx === 0 ? "UNE ENVIE DE DÉCOUVRIR ?" : idx === 4 ? cta : offer).match(/.{1,20}(?:\\s|$)/g) || [offer];
    lines.slice(0,3).forEach((line,i) => ctx.fillText(line.trim(),W/2,775+i*52));
    ctx.fillStyle = "#ffba37"; ctx.fillRect(0,0,W*(sec/15),7);
    ctx.textAlign = "left";
  };
  const run = async (record) => {
    if (!imagesRef.current.length || busy) { setMessage("Importez au moins une photo valide."); return; }
    if (record && (!window.MediaRecorder || !canvas.current.captureStream)) {
      setMessage("L'export n'est pas pris en charge par ce navigateur."); return;
    }
    setBusy(true); setPlaying(true); setMessage(record ? "Export en cours (15 secondes)…" : "Aperçu en cours…");
    let recorder, chunks = [], stream;
    if (record) {
      stream = canvas.current.captureStream(30);
      const mime = ["video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm"].find(x => MediaRecorder.isTypeSupported(x));
      if (!mime) { setMessage("Export WebM indisponible sur ce navigateur."); setBusy(false); setPlaying(false); stream.getTracks().forEach(t=>t.stop()); return; }
      recorder = new MediaRecorder(stream,{mimeType:mime});
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks,{type:mime});
        const url = URL.createObjectURL(blob), a = document.createElement("a");
        a.href = url; a.download = "lehnova-studio-demo.webm"; a.click();
        setTimeout(()=>URL.revokeObjectURL(url),30000);
        stream.getTracks().forEach(t=>t.stop());
        setMessage("Vidéo WebM téléchargée. Prototype sans son.");
      };
      recorder.start();
    }
    const start = performance.now();
    await new Promise(resolve => {
      const frame = now => {
        const elapsed = now-start; draw(elapsed);
        if (elapsed < 15000) requestAnimationFrame(frame); else resolve();
      };
      requestAnimationFrame(frame);
    });
    if (recorder?.state === "recording") recorder.stop();
    if (!record) setMessage("Aperçu terminé.");
    setBusy(false); setPlaying(false);
  };
  return <main style={{minHeight:"100vh",background:"#f7f2ed",color:"#241d1c",fontFamily:"Arial,sans-serif",padding:"28px 16px"}}>
    <div style={{maxWidth:1000,margin:"auto"}}>
      <h1 style={{marginBottom:4}}>Lehnova Studio <span style={{fontSize:14,color:"#925c5c"}}>Prototype privé à sécuriser</span></h1>
      <p>Créez une publicité verticale animée à partir de photos. Aucun fichier n'est envoyé à un serveur dans cette version.</p>
      <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
        <section style={{flex:"1 1 320px",background:"white",borderRadius:18,padding:22,display:"grid",gap:14,alignContent:"start"}}>
          <label>Photos du commerce (JPG, PNG, WebP)<input type="file" accept="image/*" multiple onChange={e=>setFiles(Array.from(e.target.files||[]).slice(0,5))} style={{display:"block",marginTop:8}} /></label>
          <label>Nom du commerce<input value={business} onChange={e=>setBusiness(e.target.value)} style={field}/></label>
          <label>Offre ou promotion<input value={offer} onChange={e=>setOffer(e.target.value)} style={field}/></label>
          <label>Appel à l'action<input value={cta} onChange={e=>setCta(e.target.value)} style={field}/></label>
          <label>Style<select value={style} onChange={e=>setStyle(e.target.value)} style={field}><option value="impact">TikTok dynamique</option><option value="premium">Premium</option></select></label>
          <button disabled={busy} onClick={()=>run(false)} style={button}>Voir l'aperçu (15 s)</button>
          <button disabled={busy} onClick={()=>run(true)} style={{...button,background:"#9c5765"}}>Exporter la vidéo WebM</button>
          <p role="status" style={{fontSize:13}}>{message}</p>
          <small>Version de démonstration : zooms, séquences et textes automatiques. Pas encore de musique, de MP4, d'IA vidéo ou d'authentification. Ne pas publier sans sécurisation.</small>
        </section>
        <section style={{flex:"1 1 300px",display:"flex",justifyContent:"center",alignItems:"start"}}>
          <canvas ref={canvas} width={W} height={H} style={{width:"min(100%,330px)",aspectRatio:"9/16",background:"#181818",borderRadius:20,boxShadow:"0 16px 45px #0003"}} />
        </section>
      </div>
    </div>
  </main>;
}
const field={display:"block",width:"100%",padding:12,marginTop:7,border:"1px solid #ddd",borderRadius:9,boxSizing:"border-box"};
const button={padding:14,border:0,borderRadius:10,color:"white",background:"#241d1c",fontWeight:"bold",cursor:"pointer"};
