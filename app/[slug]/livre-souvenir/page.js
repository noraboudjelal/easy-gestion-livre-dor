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

const ACCENT = "#B5942A";
const INK = "#221D18";
const MUTED = "#8A7F66";
const RULE = "#E7DCC0";

function PhotoBlock({ url, size = 96 }) {
  if (!url) return null;
  return (
    <img
      src={url}
      alt=""
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "cover",
        borderRadius: "6px",
        border: `1px solid ${RULE}`,
        display: "block",
        flexShrink: 0,
      }}
    />
  );
}

export default function LivreSouvenirPage() {
  const params = useParams();
  const slug = params?.slug;

  const [event, setEvent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step, setStep] = useState("setup"); // "setup" | "book"
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
    await supabase.from("events").update({ cover_photo_url: coverUrl }).eq("id", event.id);
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

  const firstDate = messages[0]?.created_at;
  const lastDate = messages[messages.length - 1]?.created_at;
  const firstDateLabel = firstDate ? formatDateLong(firstDate) : "";
  const lastDateLabel = lastDate ? formatDateLong(lastDate) : "";
  const coverPhotoToShow = coverPreview || existingCoverUrl;
  const printableMessages = messages.filter((m) => (m.message && m.message.trim()) || m.photo_url);

  if (step === "setup") {
    return (
      <div style={setupStyles.page}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,500&family=Inter:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; }
        `}</style>
        <div style={setupStyles.shell}>
          <p style={setupStyles.eyebrow}>LIVRE SOUVENIR</p>
          <h1 style={setupStyles.title}>{event?.event_title}</h1>
          <p style={setupStyles.sub}>Blanc et doré, épuré — prêt à imprimer ou à garder en PDF.</p>

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
    <div style={bookStyles.wrapper}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,500&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .msg-row { break-inside: avoid; page-break-inside: avoid; }
        @page { size: A4; margin: 20mm 18mm; }
        @media print {
          .no-print { display: none !important; }
          .page-break { page-break-before: always; break-before: page; }
          body { background: #fff !important; }
        }
      `}</style>

      <div className="no-print" style={bookStyles.toolbar}>
        <button style={bookStyles.backButton} onClick={() => setStep("setup")}>
          ← retour
        </button>
        <button style={bookStyles.printButton} onClick={() => window.print()}>
          Créer mon livre (PDF)
        </button>
      </div>

      {/* Couverture */}
      <section className="book-page" style={bookStyles.coverPage}>
        {coverPhotoToShow && (
          <div style={{ marginBottom: "26px" }}>
            <img src={coverPhotoToShow} alt="" style={bookStyles.coverPhoto} />
          </div>
        )}
        <p style={bookStyles.coverEyebrow}>LIVRE SOUVENIR</p>
        <div style={bookStyles.coverRuleTop} />
        <h1 style={bookStyles.coverTitle}>{event?.event_title}</h1>
        <div style={bookStyles.coverRuleBottom} />
        {firstDateLabel && (
          <p style={bookStyles.coverDate}>
            {firstDateLabel}
            {lastDateLabel && lastDateLabel !== firstDateLabel ? ` — ${lastDateLabel}` : ""}
          </p>
        )}
      </section>

      {/* Souvenirs */}
      <section className="book-page page-break" style={bookStyles.contentPage}>
        <p style={bookStyles.sectionKicker}>Vos souvenirs</p>
        <div style={bookStyles.messagesColumn}>
          {printableMessages.map((m) => (
            <div className="msg-row" style={bookStyles.msgRow} key={m.id}>
              <PhotoBlock url={m.photo_url} />
              <div style={bookStyles.msgContent}>
                <p style={bookStyles.msgText}>{m.message}</p>
                <p style={bookStyles.msgSignature}>
                  {m.name} <span style={bookStyles.msgSignatureDate}>· {formatDateShort(m.created_at)}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Remerciement */}
      <section className="book-page page-break" style={bookStyles.thanksPage}>
        <div style={bookStyles.coverRuleTop} />
        <h2 style={bookStyles.thanksTitle}>Merci</h2>
        <p style={bookStyles.thanksText}>
          À chacun de vous, merci d'avoir pris le temps de laisser une trace de ce moment.
          <br />
          Ces mots resteront précieusement gardés, comme un instant que l'on garde tout près du cœur.
        </p>
        <div style={bookStyles.coverRuleBottom} />
        <p style={bookStyles.coverBrand}>Livre souvenir réalisé par Easy Gestion Toulouse</p>
      </section>
    </div>
  );
}

const PAGE_WIDTH = "210mm";

const setupStyles = {
  page: { minHeight: "100vh", background: "#FAF8F3", display: "flex", justifyContent: "center", padding: "32px 16px", fontFamily: "'Inter', sans-serif" },
  shell: { width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "8px" },
  eyebrow: { fontSize: "0.7rem", letterSpacing: "0.2em", color: ACCENT, fontWeight: 700, margin: 0 },
  title: { fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "2rem", color: INK, margin: "6px 0" },
  sub: { color: MUTED, fontSize: "0.9rem", marginBottom: "22px" },
  uploadLabel: {
    marginTop: "6px",
    width: "100%",
    border: `1.5px dashed ${RULE}`,
    borderRadius: "10px",
    padding: "18px",
    fontSize: "0.85rem",
    color: MUTED,
    background: "#fff",
    cursor: "pointer",
  },
  uploadPreview: { width: "120px", height: "120px", objectFit: "cover", borderRadius: "8px" },
  generateButton: {
    marginTop: "26px",
    fontFamily: "'Inter', sans-serif",
    fontWeight: 700,
    fontSize: "0.95rem",
    padding: "14px 30px",
    background: ACCENT,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

const bookStyles = {
  wrapper: { minHeight: "100vh", background: "#EDEAE1", padding: "24px 12px 60px", display: "flex", flexDirection: "column", alignItems: "center", gap: "22px", fontFamily: "'Inter', sans-serif" },
  toolbar: { width: "100%", maxWidth: PAGE_WIDTH, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" },
  backButton: { fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", background: "none", border: "none", color: MUTED, cursor: "pointer", textDecoration: "underline" },
  printButton: { fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "0.85rem", padding: "11px 20px", color: "#fff", background: ACCENT, border: "none", borderRadius: "8px", cursor: "pointer" },

  coverPage: {
    width: "100%",
    maxWidth: PAGE_WIDTH,
    minHeight: "297mm",
    background: "#FFFFFF",
    boxShadow: "0 10px 30px rgba(30,20,10,0.10)",
    padding: "60px 40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  coverPhoto: { width: "100%", maxWidth: "380px", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: "6px", border: `1px solid ${RULE}` },
  coverEyebrow: { fontSize: "0.72rem", letterSpacing: "0.32em", color: ACCENT, fontWeight: 700, margin: "0 0 20px 0" },
  coverRuleTop: { width: "48px", height: "2px", background: ACCENT, margin: "0 0 22px 0" },
  coverRuleBottom: { width: "48px", height: "2px", background: ACCENT, margin: "22px 0" },
  coverTitle: { fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "2.3rem", color: INK, margin: 0, lineHeight: 1.25, maxWidth: "480px" },
  coverDate: { fontSize: "0.85rem", color: MUTED, margin: 0, letterSpacing: "0.03em" },
  coverBrand: { fontSize: "0.7rem", letterSpacing: "0.08em", color: MUTED, marginTop: "10px" },

  contentPage: {
    width: "100%",
    maxWidth: PAGE_WIDTH,
    background: "#FFFFFF",
    boxShadow: "0 10px 30px rgba(30,20,10,0.10)",
    padding: "50px 40px",
    display: "flex",
    flexDirection: "column",
  },
  sectionKicker: { fontSize: "0.7rem", letterSpacing: "0.2em", color: ACCENT, fontWeight: 700, margin: "0 0 26px 0", textAlign: "center" },
  messagesColumn: { display: "flex", flexDirection: "column", gap: "22px" },
  msgRow: { display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "16px", textAlign: "left", borderBottom: `1px solid ${RULE}`, paddingBottom: "20px" },
  msgContent: { flex: 1, minWidth: 0 },
  msgText: { fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 500, fontSize: "1rem", lineHeight: 1.55, color: INK, margin: "0 0 8px 0" },
  msgSignature: { fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", fontWeight: 700, color: ACCENT, margin: 0 },
  msgSignatureDate: { fontWeight: 400, color: MUTED },

  thanksPage: {
    width: "100%",
    maxWidth: PAGE_WIDTH,
    minHeight: "297mm",
    background: "#FFFFFF",
    boxShadow: "0 10px 30px rgba(30,20,10,0.10)",
    padding: "60px 40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  thanksTitle: { fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "2.3rem", color: INK, margin: 0 },
  thanksText: { fontFamily: "'Inter', sans-serif", fontSize: "0.95rem", lineHeight: 1.8, color: MUTED, maxWidth: "420px", margin: 0 },
};
