"use client";

import { useState } from "react";

const photos = [
  "https://images.pexels.com/photos/35204098/pexels-photo-35204098.jpeg?cs=srgb&fm=jpg",
  "https://images.pexels.com/photos/35204091/pexels-photo-35204091.jpeg?cs=srgb&fm=jpg",
  "https://images.pexels.com/photos/35204096/pexels-photo-35204096.jpeg?cs=srgb&fm=jpg",
  "https://images.pexels.com/photos/31308883/pexels-photo-31308883.jpeg?cs=srgb&fm=jpg",
  "https://images.pexels.com/photos/35204087/pexels-photo-35204087.jpeg?cs=srgb&fm=jpg",
  "https://images.pexels.com/photos/35204084/pexels-photo-35204084.jpeg?cs=srgb&fm=jpg",
];

const messages = [
  { name: "Inès", text: "Une journée tellement douce. J'ai déjà hâte de rencontrer ce petit bébé 🤍", photo: photos[1], likes: 18 },
  { name: "Sofia", text: "Des rires, des surprises et énormément d'amour autour de vous. Quel beau souvenir !", photo: photos[4], likes: 24 },
  { name: "Nadia", text: "Que cette nouvelle aventure soit remplie de bonheur, de santé et de nuits pas trop courtes 😄", photo: photos[2], likes: 15 },
  { name: "Mélissa", text: "Cette décoration était incroyable ! Un moment qu'on n'oubliera pas.", photo: photos[0], likes: 21 },
  { name: "Sarah", text: "Je laisse ce petit mot ici pour que bébé puisse le relire un jour 💕", photo: photos[5], likes: 30 },
  { name: "Lina", text: "Merci d'avoir été là pour nous. Vous avez rendu cette journée encore plus belle.", photo: photos[3], likes: 27 },
];

export default function DemoBabyShower() {
  const [choice, setChoice] = useState(null);
  const [word, setWord] = useState("");
  const [cloud, setCloud] = useState(["amour", "douceur", "famille", "bonheur", "tendresse", "rires", "bébé", "souvenirs"]);

  function addWord(e) {
    e.preventDefault();
    const clean = word.trim();
    if (!clean) return;
    setCloud((c) => [clean, ...c].slice(0, 14));
    setWord("");
  }

  return (
    <main className="page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;1,600&display=swap');
        *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0}.page{min-height:100vh;background:#f6f1ee;color:#4d3e3b;font-family:'DM Sans',sans-serif}.app{max-width:780px;margin:auto;background:#fffaf8;min-height:100vh;padding-bottom:60px}.hero{position:relative;height:470px;overflow:hidden}.hero img{width:100%;height:100%;object-fit:cover;display:block}.veil{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(38,27,28,.12),rgba(38,27,28,.62))}.heroText{position:absolute;left:24px;right:24px;bottom:28px;color:white}.kicker{font-size:11px;font-weight:800;letter-spacing:.24em;text-transform:uppercase;opacity:.9}.hero h1{font-family:'Playfair Display',serif;font-style:italic;font-size:50px;line-height:.96;margin:8px 0 9px}.hero p{margin:0;font-size:14px}.nav{position:sticky;top:0;z-index:20;display:flex;gap:8px;overflow:auto;padding:12px;background:rgba(255,250,248,.96);backdrop-filter:blur(14px);border-bottom:1px solid #eadbd6}.nav a{flex:none;background:white;border:1px solid #ead8d2;border-radius:999px;padding:8px 12px;font-size:11px;font-weight:700;color:#7d605b;text-decoration:none}.content{display:grid;gap:17px;padding:17px 12px}.section{scroll-margin-top:70px;background:linear-gradient(160deg,#fff,#fff7f5);border:1px solid #ead7d3;border-radius:28px;padding:24px 16px;box-shadow:0 10px 35px rgba(92,63,61,.06)}.title{text-align:center;font-family:'Playfair Display',serif;font-style:italic;font-size:32px;margin:0;color:#5a4540}.sub{text-align:center;color:#b28287;font-size:13px;margin:6px 0 19px}.gallery{display:grid;grid-template-columns:1.2fr .8fr;gap:7px}.gallery img{width:100%;height:170px;object-fit:cover;border-radius:16px}.gallery img:first-child{grid-row:span 2;height:347px}.gallery img:nth-child(4),.gallery img:nth-child(5),.gallery img:nth-child(6){height:145px}.card{background:#fff;border:1px solid #eddeda;border-radius:20px;overflow:hidden}.card img{width:100%;height:300px;object-fit:cover;display:block}.body{padding:14px}.meta{display:flex;justify-content:space-between;font-size:11px;color:#8b7772}.msg{font-family:'Playfair Display',serif;font-style:italic;font-size:18px;line-height:1.45;margin:10px 0 0}.feed{display:grid;gap:12px}.box{background:#fff;border:1px solid #ead9d4;border-radius:18px;padding:15px}.label{font-size:11px;font-weight:800;margin:8px 0 6px}.input,.textarea{width:100%;border:1px solid #ddc9c4;background:#fffdfc;border-radius:14px;padding:12px;font:inherit}.textarea{min-height:95px;resize:vertical}.stack{display:grid;gap:9px}.btn{border:0;border-radius:14px;background:#6f5350;color:white;padding:13px 16px;font-weight:800}.soft{border:1px dashed #d9b7b5;background:#fff6f5;color:#8d6667;border-radius:14px;padding:14px;font-weight:700}.poll{display:grid;grid-template-columns:1fr 1fr;gap:10px}.poll button{border:1px solid #e4ceca;border-radius:18px;padding:18px 10px;background:white;font-weight:800;color:#725b58}.poll button.active{background:#f4dde1;border-color:#c9929d}.cloud{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center;min-height:160px;padding:18px;border-radius:20px;background:linear-gradient(135deg,#f8e5e8,#edf2f5)}.cloud span{font-family:'Playfair Display',serif;font-style:italic;color:#765d61}.inline{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:10px}.reveal{display:grid;place-items:center;min-height:230px;border-radius:22px;background:linear-gradient(135deg,#f6dce4,#dcebf3);text-align:center;padding:22px}.reveal strong{display:block;font-family:'Playfair Display',serif;font-style:italic;font-size:38px;color:#634f54}.mini{font-size:12px;color:#887275}.voice{display:flex;align-items:center;gap:10px;border:1px solid #e4cfca;background:white;border-radius:16px;padding:13px}.dot{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#f0dfe1}.bars{flex:1;height:30px;background:repeating-linear-gradient(90deg,#c89ca4 0 3px,transparent 3px 7px);opacity:.6}.footer{text-align:center;color:#a28d88;font-size:11px;padding:10px 20px 0}@media(min-width:620px){.content{padding:22px}.section{padding:28px 24px}.hero{height:530px}.hero h1{font-size:62px}.gallery{grid-template-columns:1.3fr .7fr .7fr}.gallery img:first-child{grid-row:span 2;height:347px}.gallery img{height:170px}}
      `}</style>
      <div className="app">
        <section className="hero">
          <img src={photos[0]} alt="Décoration baby shower" />
          <div className="veil" />
          <div className="heroText">
            <div className="kicker">Le Fil • Démo Baby Shower</div>
            <h1>Baby Shower de Lina</h1>
            <p>12 septembre 2026 · Une journée pleine de douceur</p>
          </div>
        </section>

        <nav className="nav">
          <a href="#galerie">Photos</a><a href="#souvenir">Laisser un souvenir</a><a href="#fil">Le Fil</a><a href="#prediction">Fille ou garçon ?</a><a href="#vocal">Vocal</a><a href="#mots">Nuage de mots</a>
        </nav>

        <div className="content">
          <section id="galerie" className="section">
            <h2 className="title">Les premiers souvenirs</h2>
            <div className="sub">Quelques instants de cette belle journée</div>
            <div className="gallery">
              {photos.map((p,i)=><img key={p} src={p} alt={`Souvenir baby shower ${i+1}`} />)}
            </div>
          </section>

          <section id="souvenir" className="section">
            <h2 className="title">Laissez votre souvenir 💌</h2>
            <div className="sub">Un mot, une photo, une vidéo ou votre voix</div>
            <div className="box stack">
              <input className="input" placeholder="Votre prénom" />
              <textarea className="textarea" placeholder="Un petit mot pour les futurs parents…" />
              <button className="soft">＋ Ajouter des photos ou une vidéo</button>
              <button className="soft">🎙️ Enregistrer un message vocal</button>
              <button className="btn">Envoyer mon souvenir</button>
            </div>
          </section>

          <section id="fil" className="section">
            <h2 className="title">Le Fil</h2>
            <div className="sub">Tous les souvenirs réunis au même endroit</div>
            <div className="feed">
              {messages.map((m)=><article className="card" key={m.name}>
                <img src={m.photo} alt="Souvenir partagé" />
                <div className="body"><div className="meta"><b>{m.name}</b><span>♡ {m.likes}</span></div><p className="msg">{m.text}</p></div>
              </article>)}
            </div>
          </section>

          <section id="prediction" className="section">
            <h2 className="title">Fille ou garçon ?</h2>
            <div className="sub">Faites votre pronostic avant la révélation</div>
            <div className="poll">
              <button onClick={()=>setChoice("fille")} className={choice==="fille"?"active":""}>🎀 Je vote fille</button>
              <button onClick={()=>setChoice("garçon")} className={choice==="garçon"?"active":""}>🩵 Je vote garçon</button>
            </div>
            {choice && <p className="mini" style={{textAlign:"center",marginTop:12}}>Votre vote est enregistré pour la démo ✨</p>}
            <div className="reveal" style={{marginTop:16}}><div><span className="mini">Révélation à 18h30</span><strong>Le secret arrive bientôt…</strong><span className="mini">Les invités pourront découvrir le résultat directement ici.</span></div></div>
          </section>

          <section id="vocal" className="section">
            <h2 className="title">Les voix de la journée</h2>
            <div className="sub">Des messages qu'on pourra réécouter longtemps</div>
            <div className="stack">
              <div className="voice"><div className="dot">▶</div><div className="bars"/><span className="mini">00:18</span></div>
              <div className="voice"><div className="dot">▶</div><div className="bars"/><span className="mini">00:31</span></div>
              <div className="voice"><div className="dot">▶</div><div className="bars"/><span className="mini">00:24</span></div>
            </div>
          </section>

          <section id="mots" className="section">
            <h2 className="title">Un mot pour bébé</h2>
            <div className="sub">Le nuage de mots des invités</div>
            <div className="cloud">{cloud.map((w,i)=><span key={`${w}-${i}`} style={{fontSize:18+(i%4)*4}}>{w}</span>)}</div>
            <form onSubmit={addWord} className="inline"><input className="input" value={word} onChange={e=>setWord(e.target.value)} placeholder="Ajouter un mot…"/><button className="btn">Ajouter</button></form>
          </section>
        </div>
        <div className="footer">Démo Lehnova • Le Fil événementiel</div>
      </div>
    </main>
  );
}
