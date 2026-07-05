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

function svgUrl(svg) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function linenPatternUrl(color) {
  return svgUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9"><path d="M0 0 L9 9 M9 0 L0 9" stroke="${color}" stroke-width="0.7" opacity="0.4"/></svg>`
  );
}

function floralPatternUrl(color) {
  return svgUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><g fill="none" stroke="${color}" stroke-width="1.4" opacity="0.22"><path d="M18 130 C30 112 34 96 22 80 C10 96 4 108 18 130Z"/><path d="M80 18 C96 6 112 12 106 30 C92 22 80 14 80 18Z"/><path d="M130 108 C144 94 140 78 124 76 C126 90 116 100 130 108Z"/><path d="M50 60 C62 48 76 52 72 66 C60 60 52 54 50 60Z"/><path d="M100 130 C108 120 118 120 120 130" /></g></svg>`
  );
}

function leatherGrainUrl(color) {
  const dots = [
    [10, 10], [38, 22], [62, 8], [88, 28], [14, 46], [46, 56], [78, 48],
    [104, 16], [24, 72], [58, 82], [92, 68], [112, 92], [18, 102], [66, 108], [100, 112],
  ];
  const circles = dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${color}" opacity="0.06"/>`).join("");
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">${circles}</svg>`);
}

function goldVeinPatternUrl(color) {
  return svgUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><g fill="none" stroke="${color}" stroke-width="1" opacity="0.3"><path d="M0 45 C 45 33, 65 66, 110 55 C 154 44, 176 77, 220 66"/><path d="M0 132 C 55 121, 77 154, 132 143 C 165 137, 187 165, 220 154"/><path d="M22 0 C 33 44, 11 77, 33 121 C 50 154, 27 187, 44 220"/></g></svg>`
  );
}

const THEMES = {
  elegant: {
    label: "Élégant",
    emoji: "✦",
    sheetBg: "#FFFDF8",
    pageBg: "#EAE3D3",
    accent: "#B5402D",
    frameColor: "#C9A24B",
    text: "#2A241D",
    muted: "#8A7F66",
    titleFont: "'Playfair Display', serif",
    textItalic: true,
    frame: "elegant",
    tagline: "Des souvenirs qui resteront à jamais.",
    coverBg: {
      color: "#FFFDF8",
      image: `${linenPatternUrl("#5A3A1E")}, radial-gradient(circle at 16% 10%, rgba(201,162,75,0.24), transparent 44%), radial-gradient(circle at 88% 85%, rgba(181,64,45,0.13), transparent 48%)`,
      size: "9px 9px, auto, auto",
      repeat: "repeat, no-repeat, no-repeat",
    },
  },
  floral: {
    label: "Floral",
    emoji: "🌸",
    sheetBg: "#FFF9F7",
    pageBg: "#F3E6E0",
    accent: "#C9718A",
    frameColor: "#E3B8C4",
    text: "#5A3A3F",
    muted: "#B08A93",
    titleFont: "'Caveat', cursive",
    textItalic: false,
    frame: "floral",
    tagline: "Les plus belles fleurs de ce jour, cueillies en mots.",
    coverBg: {
      color: "#FFF9F7",
      image: `${floralPatternUrl("#C9718A")}, radial-gradient(ellipse at 14% 10%, rgba(233,168,187,0.42), transparent 48%), radial-gradient(ellipse at 88% 85%, rgba(201,113,138,0.32), transparent 46%)`,
      size: "150px 150px, auto, auto",
      repeat: "repeat, no-repeat, no-repeat",
    },
  },
  moderne: {
    label: "Moderne",
    emoji: "◻",
    sheetBg: "#FFFFFF",
    pageBg: "#EDEDED",
    accent: "#111111",
    frameColor: "#2B2B2B",
    text: "#111111",
    muted: "#6B6B6B",
    titleFont: "'Inter', sans-serif",
    textItalic: false,
    frame: "square",
    tagline: "Un instant. Des mots. Pour toujours.",
    coverBg: {
      color: "#DCD3C4",
      image: `${leatherGrainUrl("#2B241C")}, radial-gradient(circle at 50% 0%, rgba(0,0,0,0.08), transparent 60%)`,
      size: "120px 120px, auto",
      repeat: "repeat, no-repeat",
    },
  },
  enfant: {
    label: "Enfant",
    emoji: "🎈",
    sheetBg: "#FFFCF2",
    pageBg: "#FFF1D6",
    accent: "#3E8FB0",
    frameColor: "#A7D8CF",
    text: "#3A3A3A",
    muted: "#8C8C8C",
    titleFont: "'Caveat', cursive",
    textItalic: false,
    frame: "polaroid",
    tagline: "Plein de rires à garder pour toujours.",
    coverBg: {
      color: "#FFFCF2",
      image: `${leatherGrainUrl("#8C8C8C")}, radial-gradient(circle at 18% 18%, rgba(159,216,208,0.42), transparent 46%), radial-gradient(circle at 82% 25%, rgba(255,214,153,0.42), transparent 46%), radial-gradient(circle at 30% 90%, rgba(255,182,193,0.28), transparent 48%)`,
      size: "100px 100px, auto, auto, auto",
      repeat: "repeat, no-repeat, no-repeat, no-repeat",
    },
  },
  luxe: {
    label: "Luxe",
    emoji: "◆",
    sheetBg: "#14110F",
    pageBg: "#0B0A09",
    accent: "#C9A24B",
    frameColor: "#C9A24B",
    text: "#F3EFE6",
    muted: "#B8A98A",
    titleFont: "'Playfair Display', serif",
    textItalic: true,
    frame: "gold",
    tagline: "Les plus beaux souvenirs, réunis dans un seul livre.",
    coverBg: {
      color: "#14110F",
      image: `${goldVeinPatternUrl("#C9A24B")}, linear-gradient(135deg, rgba(201,162,75,0.25) 0%, transparent 30%, rgba(201,162,75,0.14) 55%, transparent 80%), radial-gradient(circle at 85% 15%, rgba(201,162,75,0.30), transparent 48%)`,
      size: "220px 220px, auto, auto",
      repeat: "repeat, no-repeat, no-repeat",
    },
  },
};

const COVER_STYLES = [
  { value: "floral", label: "Floral" },
  { value: "feuillage", label: "Feuillage" },
  { value: "cadre", label: "Cadre raffiné" },
];

function CoverOrnamentTop({ style, accent }) {
  if (style === "feuillage") {
    return (
      <svg width="220" height="34" viewBox="0 0 220 34" fill="none" style={{ margin: "0 auto 14px", display: "block" }}>
        <g stroke={accent} strokeWidth="1.3" fill="none" opacity="0.85">
          <path d="M110 30 C 95 26, 80 24, 60 18 C 45 13, 30 10, 14 4" />
          <path d="M70 20 C 66 16, 64 12, 66 6" />
          <path d="M50 15 C 46 11, 45 7, 47 2" />
          <path d="M30 8 C 27 5, 27 2, 30 0" />
          <path d="M110 30 C 125 26, 140 24, 160 18 C 175 13, 190 10, 206 4" />
          <path d="M150 20 C 154 16, 156 12, 154 6" />
          <path d="M170 15 C 174 11, 175 7, 173 2" />
          <path d="M190 8 C 193 5, 193 2, 190 0" />
        </g>
      </svg>
    );
  }
  if (style === "cadre") {
    return (
      <svg width="140" height="26" viewBox="0 0 140 26" fill="none" style={{ margin: "0 auto 16px", display: "block" }}>
        <g stroke={accent} strokeWidth="1.2" fill="none">
          <path d="M2 2 L2 12 M2 2 L18 2" />
          <path d="M138 2 L138 12 M138 2 L122 2" />
          <circle cx="70" cy="13" r="2.5" fill={accent} stroke="none" />
          <path d="M50 13 H62 M78 13 H90" />
        </g>
      </svg>
    );
  }
  // floral (par défaut)
  return (
    <svg width="90" height="46" viewBox="0 0 90 46" fill="none" style={{ margin: "0 auto 12px", display: "block" }}>
      <g stroke={accent} fill="none" strokeWidth="1.3" opacity="0.9">
        <path d="M45 44 C 45 30, 45 20, 45 6" />
        <ellipse cx="45" cy="10" rx="6" ry="9" transform="rotate(-20 45 10)" />
        <ellipse cx="45" cy="10" rx="6" ry="9" transform="rotate(20 45 10)" />
        <ellipse cx="45" cy="6" rx="6" ry="9" />
        <path d="M45 26 C 38 24, 32 24, 26 28" />
        <path d="M45 34 C 52 32, 58 32, 64 36" />
      </g>
    </svg>
  );
}

function CoverOrnamentBottom({ style, accent }) {
  if (style === "cadre") {
    return (
      <svg width="140" height="26" viewBox="0 0 140 26" fill="none" style={{ margin: "16px auto 0", display: "block" }}>
        <g stroke={accent} strokeWidth="1.2" fill="none">
          <path d="M2 24 L2 14 M2 24 L18 24" />
          <path d="M138 24 L138 14 M138 24 L122 24" />
          <circle cx="70" cy="13" r="2.5" fill={accent} stroke="none" />
          <path d="M50 13 H62 M78 13 H90" />
        </g>
      </svg>
    );
  }
  if (style === "feuillage") return null;
  return (
    <svg width="60" height="26" viewBox="0 0 60 26" fill="none" style={{ margin: "14px auto 0", display: "block" }}>
      <g stroke={accent} fill="none" strokeWidth="1.2" opacity="0.85">
        <path d="M30 2 C 30 10, 30 16, 30 24" />
        <path d="M30 12 C 25 10, 20 10, 15 13" />
        <path d="M30 16 C 35 14, 40 14, 45 17" />
      </g>
    </svg>
  );
}

function CoverCornerMotifs({ accent }) {
  const corner = (rotate) => (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" style={{ transform: `rotate(${rotate}deg)` }}>
      <g stroke={accent} strokeWidth="1.1" fill="none" opacity="0.75">
        <path d="M2 2 C 2 12, 8 18, 20 18" />
        <path d="M2 2 C 12 2, 18 8, 18 20" />
        <circle cx="4" cy="4" r="1.6" fill={accent} stroke="none" />
      </g>
    </svg>
  );
  return (
    <>
      <div style={{ position: "absolute", top: "14px", left: "14px" }}>{corner(0)}</div>
      <div style={{ position: "absolute", top: "14px", right: "14px" }}>{corner(90)}</div>
      <div style={{ position: "absolute", bottom: "14px", right: "14px" }}>{corner(180)}</div>
      <div style={{ position: "absolute", bottom: "14px", left: "14px" }}>{corner(270)}</div>
    </>
  );
}

function CoverFrame({ accent, sheetBg, children }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxShadow: `inset 0 0 0 3px ${sheetBg}CC, inset 0 0 0 4px ${accent}77, inset 0 0 0 9px ${sheetBg}CC, inset 0 0 0 10px ${accent}33`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      {children}
    </div>
  );
}

function paginateMessages(messages) {
  const pages = [];
  for (let i = 0; i < messages.length; i += 3) {
    pages.push(messages.slice(i, i + 3));
  }
  return pages;
}

function seededRotation(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 1000;
  return ((hash % 60) - 30) / 10; // -3 à +3 degrés
}

function AlbumPhoto({ url, frame, accent, id }) {
  if (!url) return null;
  const rotation = frame === "polaroid" || frame === "floral" ? seededRotation(id || "x") * (frame === "floral" ? 0.4 : 0.8) : 0;
  const base = { width: "92px", height: "92px", objectFit: "cover", display: "block", flexShrink: 0 };

  if (frame === "floral") {
    return (
      <div style={{ transform: `rotate(${rotation}deg)`, flexShrink: 0 }}>
        <img src={url} alt="" style={{ ...base, borderRadius: "50%", border: `3px solid ${accent}55` }} />
      </div>
    );
  }
  if (frame === "square") {
    return <img src={url} alt="" style={{ ...base, borderRadius: 0, border: "2px solid #111" }} />;
  }
  if (frame === "polaroid") {
    return (
      <div style={{ background: "#fff", padding: "6px 6px 16px 6px", boxShadow: "0 4px 10px rgba(0,0,0,0.15)", transform: `rotate(${rotation}deg)`, flexShrink: 0 }}>
        <img src={url} alt="" style={{ ...base, width: "80px", height: "80px" }} />
      </div>
    );
  }
  if (frame === "gold") {
    return (
      <img
        src={url}
        alt=""
        style={{ ...base, borderRadius: "8px", border: `2px solid ${accent}`, boxShadow: `0 0 0 3px ${accent}22` }}
      />
    );
  }
  return <img src={url} alt="" style={{ ...base, borderRadius: "10px", border: `2px solid ${accent}` }} />;
}

function PhotoFrame({ url, frame, accent, id, size = 96 }) {
  if (!url) return null;
  const rotation = frame === "polaroid" || frame === "floral" ? seededRotation(id || "x") * (frame === "floral" ? 0.5 : 1) : 0;

  const base = { width: `${size}px`, height: `${size}px`, objectFit: "cover", flexShrink: 0, display: "block" };

  if (frame === "floral") {
    return (
      <div style={{ position: "relative", flexShrink: 0, transform: `rotate(${rotation}deg)` }}>
        <img
          src={url}
          alt=""
          style={{ ...base, borderRadius: "50%", border: `3px solid ${accent}55` }}
        />
        <span style={{ position: "absolute", bottom: -6, right: -6, fontSize: "1.1rem" }}>🌸</span>
      </div>
    );
  }
  if (frame === "square") {
    return <img src={url} alt="" style={{ ...base, borderRadius: 0, border: "2px solid #111" }} />;
  }
  if (frame === "polaroid") {
    const inner = size - 6;
    return (
      <div
        style={{
          background: "#fff",
          padding: "6px 6px 18px 6px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.16)",
          transform: `rotate(${rotation}deg)`,
          flexShrink: 0,
        }}
      >
        <img src={url} alt="" style={{ ...base, width: `${inner}px`, height: `${inner}px` }} />
      </div>
    );
  }
  if (frame === "gold") {
    return (
      <img
        src={url}
        alt=""
        style={{ ...base, borderRadius: "8px", border: `2px solid ${accent}`, boxShadow: `0 0 0 4px ${accent}22` }}
      />
    );
  }
  return <img src={url} alt="" style={{ ...base, borderRadius: "10px", border: "1px solid #E6DCC2" }} />;
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
  const [coverStyle, setCoverStyle] = useState("floral");
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
    if (ev.book_cover_style) setCoverStyle(ev.book_cover_style);
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
    await supabase.from("events").update({ book_theme: themeKey, book_cover_style: coverStyle, cover_photo_url: coverUrl }).eq("id", event.id);
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
  const firstDateLabel = firstDate ? formatDateLong(firstDate) : "";
  const lastDateLabel = lastDate ? formatDateLong(lastDate) : "";
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
        .msg-row + .msg-row { border-top: 1px solid var(--sep-color); padding-top: 20px; }
        @page { size: A4; margin: 0; }
        @media print {
          .no-print { display: none !important; }
          .print-page { min-height: 297mm; box-shadow: none !important; margin: 0 auto !important; page-break-after: always; }
          .print-page:last-of-type { page-break-after: auto; }
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
        className="book-page print-page"
        style={{
          ...bookStyles.coverPage,
          backgroundColor: theme.coverBg.color,
          backgroundImage: theme.coverBg.image,
          backgroundSize: theme.coverBg.size,
          backgroundRepeat: theme.coverBg.repeat,
          color: theme.text,
          position: "relative",
        }}
      >
        <CoverFrame accent={theme.frameColor} sheetBg={theme.sheetBg}>
          {coverPhotoToShow && (
            <div style={{ marginBottom: "24px" }}>
              <PhotoFrameCover url={coverPhotoToShow} frame={theme.frame} accent={theme.frameColor} large />
            </div>
          )}
          <p style={{ ...bookStyles.coverEyebrow, color: theme.muted }}>LIVRE SOUVENIR</p>
          <h1 style={{ ...bookStyles.coverTitle, fontFamily: theme.titleFont, color: theme.text }}>
            {event?.event_title}
          </h1>
          <p style={{ ...bookStyles.coverTagline, fontFamily: theme.titleFont, color: theme.accent }}>
            {theme.tagline}
          </p>
          <div style={{ ...bookStyles.coverRule, background: theme.accent }} />
          {firstDateLabel && (
            <p style={{ ...bookStyles.coverDate, color: theme.muted }}>
              {firstDateLabel}
              {lastDateLabel && lastDateLabel !== firstDateLabel ? ` — ${lastDateLabel}` : ""}
            </p>
          )}
        </CoverFrame>
      </section>

      {/* Pages de messages */}
      {pages.map((group, gi) => (
        <section
          className="book-page print-page"
          style={{ ...bookStyles.contentPage, background: theme.sheetBg, color: theme.text }}
          key={gi}
        >
          <div style={{ ...bookStyles.messagesColumn, "--sep-color": theme.muted + "30" }}>
            {group.map((m) => (
              <div className="msg-row" style={bookStyles.msgRow} key={m.id}>
                <AlbumPhoto url={m.photo_url} frame={theme.frame} accent={theme.frameColor} id={m.id} />
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
                    {m.name} <span style={{ fontWeight: 400, color: theme.muted }}>· {formatDateShort(m.created_at)}</span>
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
        className="book-page print-page"
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

function PhotoFrameCover({ url, frame, accent, large }) {
  const size = large
    ? { width: "100%", maxWidth: "440px", aspectRatio: "4 / 3", margin: "0 auto" }
    : { width: "160px", height: "160px" };
  const base = { ...size, objectFit: "cover", display: "block" };
  if (frame === "floral")
    return (
      <img
        src={url}
        alt=""
        style={{
          ...base,
          borderRadius: large ? "18px" : "50%",
          border: `3px solid ${accent}`,
          boxShadow: `0 0 0 6px #fff, 0 0 0 7px ${accent}55, 0 14px 30px rgba(90,40,50,0.22)`,
        }}
      />
    );
  if (frame === "square")
    return (
      <img
        src={url}
        alt=""
        style={{ ...base, border: "3px solid #111", boxShadow: "0 0 0 6px #fff, 0 0 0 7px #111, 0 14px 30px rgba(0,0,0,0.22)" }}
      />
    );
  if (frame === "polaroid")
    return (
      <div style={{ background: "#fff", padding: large ? "14px 14px 30px 14px" : "10px 10px 24px 10px", boxShadow: "0 12px 26px rgba(0,0,0,0.20)", maxWidth: large ? "440px" : "none", margin: "0 auto" }}>
        <img src={url} alt="" style={{ ...base, width: "100%", maxWidth: "none" }} />
      </div>
    );
  if (frame === "gold")
    return (
      <img
        src={url}
        alt=""
        style={{
          ...base,
          borderRadius: "12px",
          border: `3px solid ${accent}`,
          boxShadow: `0 0 0 5px #14110F, 0 0 0 7px ${accent}, 0 16px 34px rgba(0,0,0,0.45)`,
        }}
      />
    );
  return (
    <img
      src={url}
      alt=""
      style={{
        ...base,
        borderRadius: "16px",
        border: `3px solid ${accent}`,
        boxShadow: `0 0 0 6px #fff, 0 0 0 7px ${accent}, 0 14px 30px rgba(30,20,10,0.20)`,
      }}
    />
  );
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
  coverStyleGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", width: "100%" },
  coverStyleCard: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: "6px", padding: "14px 8px", borderRadius: "10px", border: "none", cursor: "pointer", background: "#FCFAF2", minHeight: "90px" },
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
    boxShadow: "0 14px 36px rgba(30,20,10,0.16)",
    padding: "48px 32px 40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  coverEyebrow: { fontSize: "0.75rem", letterSpacing: "0.3em", margin: "0 0 18px 0", fontWeight: 600 },
  coverTitle: { fontSize: "2.4rem", fontWeight: 600, margin: 0, lineHeight: 1.25, maxWidth: "480px" },
  coverTagline: { fontSize: "1.3rem", fontStyle: "italic", margin: "18px 0 0 0", maxWidth: "420px", lineHeight: 1.4 },
  coverRule: { width: "70px", height: "2px", margin: "26px 0" },
  coverDate: { fontSize: "0.85rem", margin: "0 0 6px 0", letterSpacing: "0.02em" },
  coverBrand: { fontSize: "0.7rem", letterSpacing: "0.08em", marginTop: "10px" },
  contentPage: {
    width: "100%",
    maxWidth: PAGE_WIDTH,
    boxShadow: "0 14px 36px rgba(30,20,10,0.16)",
    padding: "40px 32px",
    display: "flex",
    flexDirection: "column",
  },
  messagesColumn: { display: "flex", flexDirection: "column", gap: "22px" },
  msgRow: { display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "16px", textAlign: "left" },
  msgContent: { flex: 1, minWidth: 0 },
  msgText: { fontSize: "0.95rem", lineHeight: 1.5, margin: "0 0 6px 0" },
  msgSignature: { fontSize: "0.78rem", fontWeight: 600, margin: 0 },
  pageNumber: { textAlign: "center", fontSize: "0.7rem", marginTop: "24px" },
  thanksPage: {
    width: "100%",
    maxWidth: PAGE_WIDTH,
    boxShadow: "0 14px 36px rgba(30,20,10,0.16)",
    padding: "56px 32px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  thanksTitle: { fontSize: "2.4rem", fontWeight: 600, margin: "0 0 22px 0" },
  thanksText: { fontSize: "1rem", lineHeight: 1.8, maxWidth: "440px", margin: 0 },
};
