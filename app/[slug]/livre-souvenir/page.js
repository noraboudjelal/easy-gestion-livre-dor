"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

function formatDateLong(ts) {
  try {
    return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}
function formatDateShort(ts) {
  try {
    return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

const THEMES = {
  elegant: {
    label: "Élégant",
    emoji: "✦",
    sheetBg: "#FFFDF8",
    pageBg: "#EAE3D3",
    accent: "#B5402D",
    text: "#2A241D",
    muted: "#8A7F66",
    titleFont: "'Playfair Display', serif",
    textItalic: true,
    frame: "elegant",
  },
  floral: {
    label: "Floral",
    emoji: "🌸",
    sheetBg: "#FFF9F7",
    pageBg: "#F3E6E0",
    accent: "#C9718A",
    text: "#5A3A3F",
    muted: "#B08A93",
    titleFont: "'Caveat', cursive",
    textItalic: false,
    frame: "floral",
  },
  moderne: {
    label: "Moderne",
    emoji: "◻",
    sheetBg: "#FFFFFF",
    pageBg: "#EDEDED",
    accent: "#111111",
    text: "#111111",
    muted: "#777777",
    titleFont: "'Inter', sans-serif",
    textItalic: false,
    frame: "square",
  },
  enfant: {
    label: "Enfant",
    emoji: "🎈",
    sheetBg: "#FFFCF2",
    pageBg: "#FFF1D6",
    accent: "#3E8FB0",
    text: "#3A3A3A",
    muted: "#8C8C8C",
    titleFont: "'Caveat', cursive",
    textItalic: false,
    frame: "polaroid",
  },
  luxe: {
    label: "Luxe",
    emoji: "◆",
    sheetBg: "#14110F",
    pageBg: "#0B0A09",
    accent: "#C9A24B",
    text: "#F3EFE6",
    muted: "#B8A98A",
    titleFont: "'Playfair Display', serif",
    textItalic: true,
    frame: "gold",
  },
};

function paginateMessages(messages) {
  const pages = [];
  let current = [];
  let weight = 0;
  for (const m of messages) {
    const textLen = (m.message || "").length;
    const hasPhoto = !!m.photo_url;
    const itemWeight = (hasPhoto ? 1.3 : 0.9) + textLen / 200;
    if (current.length >= 4 || (current.length >= 2 && weight + itemWeight > 3.3)) {
      pages.push(current);
      current = [];
      weight = 0;
    }
    current.push(m);
    weight += itemWeight;
  }
  if (current.length) pages.push(current);
  if (pages.length > 1 && pages[pages.length - 1].length < 2) {
    const last = pages.pop();
    const prev = pages[pages.length - 1];
    if (prev.length + last.length <= 4) prev.push(...last);
    else pages.push(last);
  }
  return pages;
}

function seededRotation(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 1000;
  return ((hash % 60) - 30) / 10; // -3 à +3 degrés
}

function PhotoFrame({ url, frame, accent, id }) {
  if (!url) return null;
  const rotation = frame === "polaroid" ? seededRotation(id || "x") : 0;

  const base = { width: "76px", height: "76px", objectFit: "cover", flexShrink: 0, display: "block" };

  if (frame === "floral") {
    return (
      <div style={{ position: "relative", flexShrink: 0 }}>
        <img
          src={url}
          alt=""
          style={{ ...base, borderRadius: "50%", border: `3px solid ${accent}55` }}
        />
        <span style={{ position: "absolute", bottom: -6, right: -6, fontSize: "1rem" }}>🌸</span>
      </div>
    );
  }
  if (frame === "square") {
    return <img src={url} alt="" style={{ ...base, borderRadius: 0, border: "2px solid #111" }} />;
  }
  if (frame === "polaroid") {
    return (
      <div
        style={{
          background: "#fff",
          padding: "6px 6px 14px 6px",
          boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
          transform: `rotate(${rotation}deg)`,
          flexShrink: 0,
        }}
      >
        <img src={url} alt="" style={{ ...base, width: "70px", height: "70px" }} />
      </div>
    );
  }
  if (frame === "gold") {
    return (
      <img
        src={url}
        alt=""
        style={{ ...base, borderRadius: "6px", border: `2px solid ${accent}`, boxShadow: `0 0 0 3px ${accent}22` }}
      />
    );
  }
  // elegant (par défaut)
  return <img src={url} alt="" style={{ ...base, borderRadius: "8px", border: "1px solid #E6DCC2" }} />;
}

export default function LivreSouvenirPage() {
  const params = useParams();
  const slug = params?.slug;

  const [event, setEvent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step, setStep] = useState("setup"); // "setup" | "book"
  const [themeKey, setThemeKey] = useState("elegant");
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !slug) return;
    const { data: ev, error: evErr } = await supabase.from("events").select("*").eq("slug", slug).single();
    if (evErr || !ev) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setEvent(ev);
    if (ev.book_theme && THEMES[ev.book_theme]) setThemeKey(ev.book_theme);
    if (ev.cover_photo_url) setExistingCoverUrl(ev.cover_photo_url);

    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("event_id", ev.id)
      .order("created_at", { ascending: true });

    setMessages(msgs || []);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  function handleCoverChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverPhoto(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handleGenerate() {
    if (!supabase || !event) {
      setStep("book");
      return;
    }
    setSaving(true);
    let coverUrl = existingCoverUrl;
    if (coverPhoto) {
      const ext = coverPhoto.name.split(".").pop() || "jpg";
      const path = `${event.id}/cover-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("guestbook-photos").upload(path, coverPhoto);
      if (!uploadError) {
        const { data: pub } = supabase.storage.from("guestbook-photos").getPublicUrl(path);
        coverUrl = pub?.publicUrl || coverUrl;
      }
    }
    await supabase.from("events").update({ book_theme: themeKey, cover_photo_url: coverUrl }).eq("id", event.id);
    setExistingCoverUrl(coverUrl);
    setSaving(false);
    setStep("book");
  }

  if (notFound) {
    return <p style={{ padding: "40px", fontFamily: "system-ui" }}>Ce livre d'or n'existe pas.</p>;
  }
  if (loading) {
    return <p style={{ padding: "40px", fontFamily: "system-ui" }}>Chargement…</p>;
  }

  const theme = THEMES[themeKey];
  const pages = paginateMessages(messages);
  const firstDate = messages[0]?.created_at;
  const lastDate = messages[messages.length - 1]?.created_at;
  const coverPhotoToShow = coverPreview || existingCoverUrl;

  if (step === "setup") {
    return (
      <div style={setupStyles.page}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Caveat:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; }
        `}</style>
        <div style={setupStyles.shell}>
          <p style={setupStyles.eyebrow}>LIVRE SOUVENIR</p>
          <h1 style={setupStyles.title}>{event?.event_title}</h1>
          <p style={setupStyles.sub}>Choisis un thème et, si tu veux, une photo de couverture.</p>

          <div style={setupStyles.themeGrid}>
            {Object.entries(THEMES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setThemeKey(key)}
                style={{
                  ...setupStyles.themeCard,
                  background: t.sheetBg,
                  color: t.text,
                  outline: themeKey === key ? `3px solid ${t.accent}` : "1px solid #D8CCAB",
                }}
              >
                <span style={{ fontSize: "1.4rem" }}>{t.emoji}</span>
                <span style={{ fontFamily: t.titleFont, fontSize: "1.1rem", fontWeight: 700 }}>{t.label}</span>
              </button>
            ))}
          </div>

          <label style={setupStyles.uploadLabel}>
            {coverPhotoToShow ? (
              <img src={coverPhotoToShow} alt="" style={setupStyles.uploadPreview} />
            ) : (
              <span>📷 Ajouter une photo de couverture (optionnel)</span>
            )}
            <input type="file" accept="image/*" onChange={handleCoverChange} style={{ display: "none" }} />
          </label>

          <button style={setupStyles.generateButton} onClick={handleGenerate} disabled={saving}>
            {saving ? "Préparation…" : "Créer mon livre souvenir"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...bookStyles.wrapper, background: theme.pageBg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Caveat:wght@600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        @page { size: A4; margin: 0; }
        @media print {
          .no-print { display: none !important; }
          .book-page { box-shadow: none !important; margin: 0 auto !important; page-break-after: always; }
          .book-page:last-child { page-break-after: auto; }
          .msg-row { break-inside: avoid; }
        }
      `}</style>

      <div className="no-print" style={bookStyles.toolbar}>
        <button style={bookStyles.backButton} onClick={() => setStep("setup")}>
          ← changer de thème
        </button>
        <button style={{ ...bookStyles.printButton, background: theme.accent }} onClick={() => window.print()}>
          Créer mon livre (PDF)
        </button>
      </div>

      {/* Couverture */}
      <section
        className="book-page"
        style={{ ...bookStyles.coverPage, background: theme.sheetBg, color: theme.text }}
      >
        {coverPhotoToShow && (
          <div style={{ marginBottom: "26px" }}>
            <PhotoFrameCover url={coverPhotoToShow} frame={theme.frame} accent={theme.accent} />
          </div>
        )}
        <div style={{ color: theme.accent, fontSize: "1.2rem", marginBottom: "18px" }}>{theme.emoji}</div>
        <p style={{ ...bookStyles.coverEyebrow, color: theme.muted }}>LIVRE SOUVENIR</p>
        <h1 style={{ ...bookStyles.coverTitle, fontFamily: theme.titleFont, color: theme.text }}>
          {event?.event_title}
        </h1>
        <div style={{ ...bookStyles.coverRule, background: theme.accent }} />
        <p style={{ ...bookStyles.coverSub, color: theme.muted }}>
          {messages.length} mot{messages.length > 1 ? "s" : ""} partagé{messages.length > 1 ? "s" : ""} par nos invités
        </p>
        {firstDate && (
          <p style={{ ...bookStyles.coverDate, color: theme.muted }}>
            {formatDateLong(firstDate)}
            {lastDate && lastDate !== firstDate ? ` — ${formatDateLong(lastDate)}` : ""}
          </p>
        )}
        <div style={{ color: theme.accent, fontSize: "1.2rem", marginTop: "18px" }}>{theme.emoji}</div>
        <p style={{ ...bookStyles.coverBrand, color: theme.muted }}>Easy Gestion Toulouse</p>
      </section>

      {/* Pages de messages */}
      {pages.map((group, gi) => (
        <section
          className="book-page"
          style={{ ...bookStyles.contentPage, background: theme.sheetBg, color: theme.text }}
          key={gi}
        >
          <p style={{ ...bookStyles.pageHeader, color: theme.muted, borderBottomColor: theme.muted + "33" }}>
            {event?.event_title}
          </p>
          <div style={bookStyles.messagesColumn}>
            {group.map((m) => (
              <div className="msg-row" style={bookStyles.msgRow} key={m.id}>
                <PhotoFrame url={m.photo_url} frame={theme.frame} accent={theme.accent} id={m.id} />
                <div style={bookStyles.msgContent}>
                  <p
                    style={{
                      ...bookStyles.msgText,
                      fontFamily: theme.titleFont,
                      fontStyle: theme.textItalic ? "italic" : "normal",
                      color: theme.text,
                    }}
                  >
                    {m.message}
                  </p>
                  <p style={{ ...bookStyles.msgSignature, color: theme.accent }}>
                    {m.name}{" "}
                    <span style={{ fontWeight: 400, color: theme.muted }}>· {formatDateShort(m.created_at)}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p style={{ ...bookStyles.pageNumber, color: theme.muted }}>{gi + 1}</p>
        </section>
      ))}

      {/* Remerciement */}
      <section
        className="book-page"
        style={{ ...bookStyles.thanksPage, background: theme.sheetBg, color: theme.text }}
      >
        <div style={{ color: theme.accent, fontSize: "1.2rem", marginBottom: "18px" }}>{theme.emoji}</div>
        <h2 style={{ ...bookStyles.thanksTitle, fontFamily: theme.titleFont, color: theme.text }}>Merci</h2>
        <p style={{ ...bookStyles.thanksText, color: theme.muted }}>
          À chacun de vous, merci d'avoir pris le temps de laisser une trace de ce moment.
          <br />
          Ces mots resteront précieusement gardés, comme un instant que l'on garde tout près du cœur.
        </p>
        <div style={{ ...bookStyles.coverRule, background: theme.accent }} />
        <p style={{ ...bookStyles.coverBrand, color: theme.muted }}>Livre souvenir réalisé par Easy Gestion Toulouse</p>
      </section>
    </div>
  );
}

function PhotoFrameCover({ url, frame, accent }) {
  const base = { width: "160px", height: "160px", objectFit: "cover", display: "block" };
  if (frame === "floral") return <img src={url} alt="" style={{ ...base, borderRadius: "50%", border: `4px solid ${accent}55` }} />;
  if (frame === "square") return <img src={url} alt="" style={{ ...base, border: "3px solid #111" }} />;
  if (frame === "polaroid")
    return (
      <div style={{ background: "#fff", padding: "10px 10px 24px 10px", boxShadow: "0 6px 16px rgba(0,0,0,0.18)" }}>
        <img src={url} alt="" style={{ ...base, width: "150px", height: "150px" }} />
      </div>
    );
  if (frame === "gold")
    return <img src={url} alt="" style={{ ...base, borderRadius: "10px", border: `3px solid ${accent}`, boxShadow: `0 0 0 5px ${accent}22` }} />;
  return <img src={url} alt="" style={{ ...base, borderRadius: "10px", border: "1px solid #E6DCC2" }} />;
}

const PAGE_WIDTH = "210mm";
const PAGE_MIN_HEIGHT = "297mm";

const setupStyles = {
  page: { minHeight: "100vh", background: "#EAE3D3", display: "flex", justifyContent: "center", padding: "32px 16px", fontFamily: "'Inter', sans-serif" },
  shell: { width: "100%", maxWidth: "560px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "8px" },
  eyebrow: { fontSize: "0.7rem", letterSpacing: "0.2em", color: "#A6792B", fontWeight: 600, margin: 0 },
  title: { fontFamily: "'Playfair Display', serif", fontSize: "2rem", color: "#1E2A3A", margin: "6px 0" },
  sub: { color: "#5B4636", fontSize: "0.9rem", marginBottom: "20px" },
  themeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "12px", width: "100%" },
  themeCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", padding: "18px 10px", borderRadius: "10px", border: "none", cursor: "pointer" },
  uploadLabel: {
    marginTop: "24px",
    width: "100%",
    border: "1px dashed #C9BD9C",
    borderRadius: "10px",
    padding: "16px",
    fontSize: "0.85rem",
    color: "#5B4636",
    background: "#FCFAF2",
    cursor: "pointer",
  },
  uploadPreview: { width: "120px", height: "120px", objectFit: "cover", borderRadius: "8px" },
  generateButton: {
    marginTop: "24px",
    fontFamily: "'Inter', sans-serif",
    fontWeight: 700,
    fontSize: "0.95rem",
    padding: "14px 28px",
    background: "#B5402D",
    color: "#FCFAF2",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

const bookStyles = {
  wrapper: { minHeight: "100vh", padding: "24px 12px 60px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" },
  toolbar: { width: "100%", maxWidth: PAGE_WIDTH, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" },
  backButton: { fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", background: "none", border: "none", color: "#5B4636", cursor: "pointer", textDecoration: "underline" },
  printButton: { fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "0.85rem", padding: "10px 18px", color: "#FCFAF2", border: "none", borderRadius: "6px", cursor: "pointer" },
  coverPage: {
    width: "100%",
    maxWidth: PAGE_WIDTH,
    minHeight: PAGE_MIN_HEIGHT,
    boxShadow: "0 14px 36px rgba(30,20,10,0.16)",
    padding: "70px 60px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  coverEyebrow: { fontSize: "0.75rem", letterSpacing: "0.3em", margin: "0 0 22px 0", fontWeight: 600 },
  coverTitle: { fontSize: "2.8rem", fontWeight: 600, margin: 0, lineHeight: 1.25, maxWidth: "480px" },
  coverRule: { width: "70px", height: "2px", margin: "26px 0" },
  coverSub: { fontSize: "1rem", margin: "0 0 6px 0" },
  coverDate: { fontSize: "0.85rem", margin: 0, letterSpacing: "0.02em" },
  coverBrand: { fontSize: "0.7rem", letterSpacing: "0.08em", marginTop: "10px" },
  contentPage: {
    width: "100%",
    maxWidth: PAGE_WIDTH,
    minHeight: PAGE_MIN_HEIGHT,
    boxShadow: "0 14px 36px rgba(30,20,10,0.16)",
    padding: "56px 64px",
    display: "flex",
    flexDirection: "column",
  },
  pageHeader: { fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", borderBottom: "1px solid", paddingBottom: "14px", marginBottom: "40px" },
  messagesColumn: { flex: 1, display: "flex", flexDirection: "column", gap: "44px", justifyContent: "center" },
  msgRow: { display: "flex", gap: "20px", alignItems: "flex-start" },
  msgContent: { flex: 1 },
  msgText: { fontSize: "1.15rem", lineHeight: 1.55, margin: "0 0 10px 0" },
  msgSignature: { fontSize: "0.8rem", fontWeight: 600, margin: 0 },
  pageNumber: { textAlign: "center", fontSize: "0.7rem", marginTop: "24px" },
  thanksPage: {
    width: "100%",
    maxWidth: PAGE_WIDTH,
    minHeight: PAGE_MIN_HEIGHT,
    boxShadow: "0 14px 36px rgba(30,20,10,0.16)",
    padding: "70px 60px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  thanksTitle: { fontSize: "2.4rem", fontWeight: 600, margin: "0 0 22px 0" },
  thanksText: { fontSize: "1rem", lineHeight: 1.8, maxWidth: "440px", margin: 0 },
};
