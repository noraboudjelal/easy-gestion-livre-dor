"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

const THEMES = {
  "Mariage": {
    ink: "#12172A", surface: "#1B2238", surface2: "#242C46",
    accent: "#C9A24B", accentSoft: "rgba(201,162,75,0.3)", accentText: "#20180A",
    ivory: "#EEF1F8", muted: "#9AA3BE",
  },
  "Anniversaire": {
    ink: "#241220", surface: "#34182C", surface2: "#402039",
    accent: "#E8B44D", accentSoft: "rgba(232,180,77,0.3)", accentText: "#2B1C08",
    ivory: "#F7EFE0", muted: "#C2A8BA",
  },
  "Baby Shower": {
    ink: "#161B26", surface: "#202838", surface2: "#2A3448",
    accent: "#E8A3C0", accentSoft: "rgba(232,163,192,0.3)", accentText: "#2A1420",
    ivory: "#F0F3F8", muted: "#9CA8BE",
  },
  "Baptême": {
    ink: "#1A1C22", surface: "#24272F", surface2: "#2D313B",
    accent: "#B9C7DD", accentSoft: "rgba(185,199,221,0.3)", accentText: "#1A1C22",
    ivory: "#F5F3EC", muted: "#A7ABB5",
  },
  "Départ en retraite": {
    ink: "#102019", surface: "#182B22", surface2: "#20362B",
    accent: "#C9A24B", accentSoft: "rgba(201,162,75,0.3)", accentText: "#20180A",
    ivory: "#EEF3EE", muted: "#9DB0A2",
  },
  "Pot de départ": {
    ink: "#12232A", surface: "#1B323A", surface2: "#243F48",
    accent: "#C9A24B", accentSoft: "rgba(201,162,75,0.3)", accentText: "#20180A",
    ivory: "#EEF3F3", muted: "#9DB3B8",
  },
  "Henné": {
    ink: "#152016", surface: "#1E2E20", surface2: "#283C2B",
    accent: "#C9A24B", accentSoft: "rgba(201,162,75,0.3)", accentText: "#20180A",
    ivory: "#EFF3EA", muted: "#9FB29E",
  },
  "Circoncision": {
    ink: "#0F2A38", surface: "#173A4B", surface2: "#1F4A5E",
    accent: "#8FCFEA", accentSoft: "rgba(143,207,234,0.3)", accentText: "#0F2A38",
    ivory: "#EAF6FB", muted: "#9FC3D4",
  },
  "Fiançailles": {
    ink: "#241A1E", surface: "#332428", surface2: "#402F34",
    accent: "#D4A574", accentSoft: "rgba(212,165,116,0.3)", accentText: "#241A1E",
    ivory: "#F7EFEA", muted: "#B8A39D",
  },
  "Inauguration": {
    ink: "#1C1A16", surface: "#28251F", surface2: "#332F27",
    accent: "#D4AF37", accentSoft: "rgba(212,175,55,0.3)", accentText: "#1C1A16",
    ivory: "#F5F1E6", muted: "#A69C8A",
  },
  "Lancement de produit": {
    ink: "#151833", surface: "#1F2447", surface2: "#2A3059",
    accent: "#4FB8A8", accentSoft: "rgba(79,184,168,0.3)", accentText: "#0F1F1C",
    ivory: "#EAF6F3", muted: "#9DB8B2",
  },
  "Fête d'entreprise": {
    ink: "#17181C", surface: "#212327", surface2: "#2B2E33",
    accent: "#B7B9C0", accentSoft: "rgba(183,185,192,0.3)", accentText: "#17181C",
    ivory: "#F2F2F4", muted: "#9A9CA6",
  },
  "Vos avis": {
    ink: "#151515", surface: "#1F1F1F", surface2: "#292929",
    accent: "#D9C9A3", accentSoft: "rgba(217,201,163,0.28)", accentText: "#151515",
    ivory: "#F2F0EC", muted: "#9C9A94",
  },
  "Autre": {
    ink: "#14131C", surface: "#1F1E2B", surface2: "#2A2836",
    accent: "#C9A24B", accentSoft: "rgba(201,162,75,0.3)", accentText: "#20180A",
    ivory: "#F4EFE4", muted: "#A9A4B8",
  },
};

function formatDate(ts) {
  try {
    return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function EspaceMariesPage() {
  const params = useParams();
  const slug = params?.slug;

  const [event, setEvent] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [authError, setAuthError] = useState("");

  const [messages, setMessages] = useState([]);
  const [pollQuestions, setPollQuestions] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [newGiftName, setNewGiftName] = useState("");
  const [newGiftLink, setNewGiftLink] = useState("");
  const [newGiftPrice, setNewGiftPrice] = useState("");
  const [addingGift, setAddingGift] = useState(false);
  const [giftFormError, setGiftFormError] = useState("");
  const [tab, setTab] = useState("tout");

  const theme = THEMES[event?.event_type] || THEMES.Autre;
  const isReview = event?.event_type === "Vos avis";

  const loadEvent = useCallback(async () => {
    if (!supabase || !slug) return;
    const { data: ev, error } = await supabase.from("events").select("*").eq("slug", slug).single();
    if (error || !ev) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setEvent(ev);
    setLoading(false);
    if (typeof window !== "undefined" && sessionStorage.getItem(`event-client-auth-${ev.id}`) === "1") {
      setAuthed(true);
    }
  }, [slug]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const loadContent = useCallback(async () => {
    if (!supabase || !event) return;
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("event_id", event.id)
      .order("created_at", { ascending: false });
    setMessages(msgs || []);
    const { data: polls } = await supabase
      .from("poll_questions")
      .select("*")
      .eq("event_id", event.id)
      .order("position", { ascending: true });
    setPollQuestions(polls || []);
    const { data: rsvpData } = await supabase
      .from("rsvps")
      .select("*")
      .eq("event_id", event.id)
      .order("created_at", { ascending: false });
    setRsvps(rsvpData || []);
    const { data: giftData } = await supabase
      .from("gift_items")
      .select("*")
      .eq("event_id", event.id)
      .order("position", { ascending: true });
    setGifts(giftData || []);
  }, [event]);

  useEffect(() => {
    if (authed && event) loadContent();
  }, [authed, event, loadContent]);

  function handleLogin(e) {
    e.preventDefault();
    if (!event?.client_password) {
      setAuthError("L'accès n'est pas encore configuré. Contacte Easy Gestion Toulouse.");
      return;
    }
    if (pwd.trim().toUpperCase() === event.client_password.toUpperCase()) {
      sessionStorage.setItem(`event-client-auth-${event.id}`, "1");
      setAuthed(true);
      setAuthError("");
    } else {
      setAuthError("Code incorrect.");
    }
  }

  async function handleAddGift(e) {
    e.preventDefault();
    if (!newGiftName.trim() || !event || !supabase) {
      setGiftFormError("Indique au moins un nom pour le cadeau.");
      return;
    }
    setGiftFormError("");
    setAddingGift(true);
    const { error } = await supabase.from("gift_items").insert({
      event_id: event.id,
      name: newGiftName.trim(),
      link: newGiftLink.trim() || null,
      price: newGiftPrice.trim() || null,
      position: gifts.length,
    });
    setAddingGift(false);
    if (error) {
      setGiftFormError("Une erreur est survenue, réessaie.");
      return;
    }
    setNewGiftName("");
    setNewGiftLink("");
    setNewGiftPrice("");
    loadContent();
  }

  async function handleDeleteGift(giftId) {
    if (!supabase) return;
    await supabase.from("gift_items").delete().eq("id", giftId);
    loadContent();
  }

  const photos = messages.filter((m) => m.photo_url);
  const videos = messages.filter((m) => m.video_url);
  const totalVotes = pollQuestions.reduce((sum, q) => sum + (q.votes || []).reduce((a, b) => a + b, 0), 0);
  const rsvpYes = rsvps.filter((r) => r.attending);
  const rsvpNo = rsvps.filter((r) => !r.attending);
  const rsvpHeadcount = rsvpYes.reduce((sum, r) => sum + 1 + (r.guests_count || 0), 0);

  if (loading) {
    return (
      <div style={{ ...styles.page(theme), alignItems: "center", justifyContent: "center", display: "flex" }}>
        <p style={{ color: "#A9A4B8" }}>Chargement…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ ...styles.page(theme), alignItems: "center", justifyContent: "center", display: "flex" }}>
        <p style={{ color: "#F4EFE4" }}>Cet espace n'existe pas ou plus.</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div style={{ ...styles.page(theme), alignItems: "center", justifyContent: "center", display: "flex" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap');`}</style>
        <form style={styles.gateCard(theme)} onSubmit={handleLogin}>
          <p style={styles.gateEyebrow(theme)}>Le Fil</p>
          <h1 style={styles.gateTitle(theme)}>{event.event_title}</h1>
          <p style={styles.gateSub(theme)}>Entrez le code reçu par Easy Gestion Toulouse.</p>
          <input
            style={styles.gateInput(theme)}
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="Code d'accès"
            autoFocus
          />
          <button type="submit" style={styles.gateButton(theme)}>
            Accéder à mon espace
          </button>
          {authError && <p style={{ color: "#D98C7F", fontSize: "0.8rem" }}>{authError}</p>}
        </form>
      </div>
    );
  }

  return (
    <div style={styles.page(theme)}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        button { cursor: pointer; font-family: inherit; }
      `}</style>

      <div style={styles.shell(theme)}>
        <header style={styles.header}>
          <p style={styles.eyebrow(theme)}>Le Fil</p>
          <h1 style={styles.title(theme)}>{event.event_title}</h1>
        </header>

        <div style={styles.statsRow}>
          <div style={styles.statCard(theme)}>
            <span style={styles.statNumber(theme)}>{photos.length}</span>
            <span style={styles.statLabel(theme)}>photos</span>
          </div>
          <div style={styles.statCard(theme)}>
            <span style={styles.statNumber(theme)}>{videos.length}</span>
            <span style={styles.statLabel(theme)}>vidéos</span>
          </div>
          <div style={styles.statCard(theme)}>
            <span style={styles.statNumber(theme)}>{messages.length}</span>
            <span style={styles.statLabel(theme)}>messages</span>
          </div>
          <div style={styles.statCard(theme)}>
            <span style={styles.statNumber(theme)}>{totalVotes}</span>
            <span style={styles.statLabel(theme)}>votes sondage</span>
          </div>
        </div>

        {!isReview && (
          <a href={`/${slug}/livre-souvenir`} target="_blank" rel="noreferrer" style={styles.bookCard(theme)}>
            <div>
              <p style={styles.bookTitle(theme)}>Livre Souvenir</p>
              <p style={styles.bookSub(theme)}>Générer et télécharger le PDF de tous vos souvenirs</p>
            </div>
            <span style={styles.bookArrow(theme)}>↗</span>
          </a>
        )}

        {event.cagnotte_url && (
          <a href={event.cagnotte_url} target="_blank" rel="noreferrer" style={styles.cagnotteCard(theme)}>
            💛 Voir la cagnotte
          </a>
        )}

        <div style={styles.tabs(theme)}>
          {["tout", "photos", "videos", "messages", "sondages", ...(isReview ? [] : ["invites", "cadeaux"])].map((t) => (
            <button
              key={t}
              style={{ ...styles.tab(theme), ...(tab === t ? styles.tabActive(theme) : {}) }}
              onClick={() => setTab(t)}
            >
              {t === "tout" ? "Tout" : t === "photos" ? "Photos" : t === "videos" ? "Vidéos" : t === "messages" ? "Messages" : t === "sondages" ? "Sondages" : t === "invites" ? "Invités" : "Cadeaux"}
            </button>
          ))}
        </div>

        {(tab === "photos") && photos.length > 0 && (
          <div style={styles.grid}>
            {photos.map((m) => (
              <div key={m.id} style={styles.gridItem}>
                <img src={m.photo_url} alt="" style={styles.gridImg} />
                <span style={styles.gridCaption(theme)}>{m.name}</span>
                <a
                  href={m.photo_url}
                  download={`photo-${m.name || "invite"}.jpg`}
                  style={styles.downloadBtn}
                  title="Télécharger"
                >
                  ⬇
                </a>
              </div>
            ))}
          </div>
        )}

        {(tab === "videos") && videos.length > 0 && (
          <div style={styles.grid}>
            {videos.map((m) => (
              <div key={m.id} style={styles.gridItem}>
                <video src={m.video_url} controls style={styles.gridImg} />
                <span style={styles.gridCaption(theme)}>{m.name}</span>
                <a
                  href={m.video_url}
                  download={`video-${m.name || "invite"}.mp4`}
                  style={styles.downloadBtn}
                  title="Télécharger"
                >
                  ⬇
                </a>
              </div>
            ))}
          </div>
        )}

        {(tab === "tout" || tab === "messages") && (
          <div style={styles.msgList}>
            {messages.length === 0 && <p style={{ color: theme.muted, fontSize: "0.85rem" }}>Aucun message pour l'instant.</p>}
            {messages.map((m) => (
              <div key={m.id} style={styles.msgCard(theme)}>
                <div style={styles.msgHead}>
                  <span style={{ ...styles.msgAvatar(theme), background: m.ink || theme.accent }}>
                    {(m.name || "?")[0].toUpperCase()}
                  </span>
                  <span style={styles.msgName(theme)}>{m.name}</span>
                  <span style={styles.msgDate(theme)}>{formatDate(m.created_at)}</span>
                </div>
                {m.photo_url && (
                  <div style={{ position: "relative" }}>
                    <img src={m.photo_url} alt="" style={styles.msgMedia} />
                    <a href={m.photo_url} download={`photo-${m.name || "invite"}.jpg`} style={styles.downloadBtn} title="Télécharger">⬇</a>
                  </div>
                )}
                {m.video_url && (
                  <div style={{ position: "relative" }}>
                    <video src={m.video_url} controls style={styles.msgMedia} />
                    <a href={m.video_url} download={`video-${m.name || "invite"}.mp4`} style={styles.downloadBtn} title="Télécharger">⬇</a>
                  </div>
                )}
                {m.message && <p style={styles.msgText(theme)}>{m.message}</p>}
                {m.audio_url && (
                  <>
                    <audio src={m.audio_url} controls style={{ width: "100%", marginTop: "6px" }} />
                    <a href={m.audio_url} download={`vocal-${m.name || "invite"}.webm`} style={styles.audioDownload(theme)}>
                      ⬇ Télécharger le vocal
                    </a>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {(tab === "tout" || tab === "sondages") && (
          <div style={styles.msgList}>
            {pollQuestions.length === 0 && <p style={{ color: theme.muted, fontSize: "0.85rem" }}>Aucun sondage pour l'instant.</p>}
            {pollQuestions.map((q) => {
              const total = (q.votes || []).reduce((a, b) => a + b, 0);
              return (
                <div key={q.id} style={styles.msgCard(theme)}>
                  <p style={styles.pollQuestion(theme)}>{q.question}</p>
                  {(q.options || []).map((opt, i) => {
                    const votes = q.votes?.[i] || 0;
                    const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
                    return (
                      <div key={i} style={styles.pollRow}>
                        <span style={styles.pollLabel(theme)}>{opt}</span>
                        <span style={styles.pollPct(theme)}>{pct}% ({votes})</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {tab === "invites" && (
          <>
            <div style={styles.statsRow}>
              <div style={styles.statCard(theme)}>
                <span style={styles.statNumber(theme)}>{rsvpYes.length}</span>
                <span style={styles.statLabel(theme)}>confirmés</span>
              </div>
              <div style={styles.statCard(theme)}>
                <span style={styles.statNumber(theme)}>{rsvpNo.length}</span>
                <span style={styles.statLabel(theme)}>déclinés</span>
              </div>
              <div style={styles.statCard(theme)}>
                <span style={styles.statNumber(theme)}>{rsvpHeadcount}</span>
                <span style={styles.statLabel(theme)}>personnes au total</span>
              </div>
            </div>
            <div style={styles.msgList}>
              {rsvps.length === 0 && <p style={{ color: theme.muted, fontSize: "0.85rem" }}>Aucune réponse pour l'instant.</p>}
              {rsvps.map((r) => (
                <div key={r.id} style={styles.msgCard(theme)}>
                  <div style={styles.msgHead}>
                    <span style={{ ...styles.msgAvatar(theme), background: r.attending ? "#6FAE7F" : "#D98C7F" }}>
                      {(r.name || "?")[0].toUpperCase()}
                    </span>
                    <span style={styles.msgName(theme)}>{r.name}</span>
                    <span style={styles.msgDate(theme)}>{r.attending ? `✅ +${r.guests_count || 0}` : "❌"}</span>
                  </div>
                  {r.note && <p style={styles.msgText(theme)}>{r.note}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "cadeaux" && (
          <>
            <div style={styles.statsRow}>
              <div style={styles.statCard(theme)}>
                <span style={styles.statNumber(theme)}>{gifts.length}</span>
                <span style={styles.statLabel(theme)}>cadeaux dans la liste</span>
              </div>
              <div style={styles.statCard(theme)}>
                <span style={styles.statNumber(theme)}>{gifts.filter((g) => g.reserved_by).length}</span>
                <span style={styles.statLabel(theme)}>déjà réservés</span>
              </div>
            </div>

            <form onSubmit={handleAddGift} style={styles.giftAddForm(theme)}>
              <p style={styles.giftAddTitle(theme)}>Ajouter un cadeau</p>
              <input
                type="text"
                placeholder="Nom du cadeau"
                value={newGiftName}
                onChange={(e) => setNewGiftName(e.target.value)}
                style={styles.gateInput(theme)}
              />
              <input
                type="text"
                placeholder="Lien vers le produit (optionnel)"
                value={newGiftLink}
                onChange={(e) => setNewGiftLink(e.target.value)}
                style={{ ...styles.gateInput(theme), marginTop: "8px" }}
              />
              <input
                type="text"
                placeholder="Prix indicatif (optionnel)"
                value={newGiftPrice}
                onChange={(e) => setNewGiftPrice(e.target.value)}
                style={{ ...styles.gateInput(theme), marginTop: "8px" }}
              />
              {giftFormError && <p style={{ color: "#D98C7F", fontSize: "0.76rem", margin: "8px 0 0" }}>{giftFormError}</p>}
              <button type="submit" disabled={addingGift} style={{ ...styles.gateButton(theme), marginTop: "10px" }}>
                {addingGift ? "Ajout…" : "+ Ajouter à la liste"}
              </button>
            </form>

            <div style={styles.msgList}>
              {gifts.length === 0 && <p style={{ color: theme.muted, fontSize: "0.85rem" }}>Aucun cadeau dans la liste pour l'instant.</p>}
              {gifts.map((g) => (
                <div key={g.id} style={styles.msgCard(theme)}>
                  <div style={styles.msgHead}>
                    <span style={styles.msgName(theme)}>{g.name}</span>
                    <span style={styles.msgDate(theme)}>{g.reserved_by ? `✅ ${g.reserved_by}` : "Disponible"}</span>
                  </div>
                  {g.price && <p style={styles.msgText(theme)}>{g.price}</p>}
                  {g.link && (
                    <a href={g.link} target="_blank" rel="noreferrer" style={{ fontSize: "0.76rem", color: theme.accent }}>
                      Voir le produit ↗
                    </a>
                  )}
                  <button type="button" style={styles.giftDeleteBtn(theme)} onClick={() => handleDeleteGift(g.id)}>
                    Retirer de la liste
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <p style={styles.footerMark(theme)}>Easy Gestion Toulouse</p>
      </div>
    </div>
  );
}

const styles = {
  page: (t) => ({
    minHeight: "100vh",
    background: t.ink,
    fontFamily: "Inter, system-ui, sans-serif",
    padding: "0 0 40px",
  }),
  gateCard: (t) => ({
    width: "100%",
    maxWidth: "340px",
    background: t.surface,
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "20px",
    padding: "30px 26px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    textAlign: "center",
    margin: "0 16px",
  }),
  gateEyebrow: (t) => ({ fontSize: "0.68rem", letterSpacing: "0.16em", color: t.accent, margin: 0, textTransform: "uppercase" }),
  gateTitle: (t) => ({ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400, fontSize: "1.7rem", color: t.ivory, margin: "4px 0" }),
  gateSub: (t) => ({ fontSize: "0.82rem", color: t.muted, margin: "0 0 10px" }),
  gateInput: (t) => ({ width: "100%", textAlign: "center", fontSize: "1rem", letterSpacing: "0.15em", padding: "12px 14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", background: t.surface2, color: t.ivory }),
  gateButton: (t) => ({ width: "100%", padding: "13px 0", borderRadius: "12px", border: "none", background: t.accent, color: t.accentText, fontWeight: 700, fontSize: "0.88rem" }),

  shell: (t) => ({ width: "100%", maxWidth: "620px", margin: "0 auto", padding: "40px 18px 0" }),
  header: { textAlign: "center", marginBottom: "20px" },
  eyebrow: (t) => ({ fontSize: "0.68rem", letterSpacing: "0.16em", color: t.accent, textTransform: "uppercase", margin: "0 0 8px" }),
  title: (t) => ({ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400, fontSize: "2rem", color: t.ivory, margin: 0 }),

  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "18px" },
  statCard: (t) => ({ background: t.surface, border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "12px 6px", textAlign: "center" }),
  statNumber: (t) => ({ display: "block", fontSize: "1.3rem", fontWeight: 800, color: t.ivory }),
  statLabel: (t) => ({ display: "block", fontSize: "0.65rem", color: t.muted, marginTop: "2px" }),

  bookCard: (t) => ({ display: "flex", justifyContent: "space-between", alignItems: "center", background: `linear-gradient(135deg, ${t.surface}, ${t.surface2})`, border: `1px solid ${t.accentSoft}`, borderRadius: "16px", padding: "16px 18px", marginBottom: "12px", textDecoration: "none" }),
  bookTitle: (t) => ({ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.15rem", color: t.ivory, margin: "0 0 3px" }),
  bookSub: (t) => ({ fontSize: "0.75rem", color: t.muted, margin: 0 }),
  bookArrow: (t) => ({ fontSize: "1.3rem", color: t.accent }),

  cagnotteCard: (t) => ({ display: "block", textAlign: "center", background: t.surface2, border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "12px", marginBottom: "20px", color: t.ivory, textDecoration: "none", fontSize: "0.88rem", fontWeight: 600 }),

  tabs: (t) => ({ display: "flex", gap: "4px", background: t.surface2, borderRadius: "12px", padding: "4px", marginBottom: "16px", overflowX: "auto" }),
  tab: (t) => ({ flex: "none", background: "none", border: "none", borderRadius: "9px", padding: "8px 14px", fontSize: "0.78rem", fontWeight: 600, color: t.muted }),
  tabActive: (t) => ({ background: t.accent, color: t.accentText }),

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "8px", marginBottom: "16px" },
  gridItem: { position: "relative", borderRadius: "10px", overflow: "hidden" },
  gridImg: { width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "10px", display: "block" },
  gridCaption: (t) => ({ position: "absolute", left: "6px", bottom: "6px", fontSize: "0.65rem", fontWeight: 600, color: "#fff", background: "rgba(0,0,0,0.45)", padding: "2px 7px", borderRadius: "20px" }),
  downloadBtn: {
    position: "absolute",
    top: "6px",
    right: "6px",
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    textDecoration: "none",
  },
  audioDownload: (t) => ({
    display: "inline-block",
    marginTop: "6px",
    fontSize: "0.72rem",
    color: t.accent,
    textDecoration: "underline",
  }),

  msgList: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" },
  msgCard: (t) => ({ background: t.surface, border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "13px 15px" }),
  msgHead: { display: "flex", alignItems: "center", gap: "9px", marginBottom: "6px" },
  msgAvatar: (t) => ({ width: "26px", height: "26px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 700, color: t.ivory, flex: "none" }),
  msgName: (t) => ({ fontSize: "0.82rem", fontWeight: 600, color: t.ivory, flex: 1 }),
  msgDate: (t) => ({ fontSize: "0.65rem", color: t.muted }),
  msgMedia: { width: "100%", maxHeight: "260px", objectFit: "cover", borderRadius: "10px", marginBottom: "8px" },
  msgText: (t) => ({ fontSize: "0.85rem", color: t.ivory, opacity: 0.9, margin: 0, lineHeight: 1.5 }),

  pollQuestion: (t) => ({ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1rem", color: t.ivory, margin: "0 0 8px" }),
  pollRow: { display: "flex", justifyContent: "space-between", fontSize: "0.8rem", padding: "4px 0" },
  pollLabel: (t) => ({ color: t.ivory, opacity: 0.9 }),
  pollPct: (t) => ({ color: t.accent, fontWeight: 700 }),

  footerMark: (t) => ({ textAlign: "center", fontSize: "0.68rem", color: t.muted, opacity: 0.6, marginTop: "10px" }),
  giftAddForm: (t) => ({
    background: t.surface,
    border: `1px dashed ${t.accentSoft}`,
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "16px",
  }),
  giftAddTitle: (t) => ({ fontSize: "0.82rem", fontWeight: 700, color: t.ivory, margin: "0 0 10px" }),
  giftDeleteBtn: (t) => ({
    marginTop: "8px",
    fontSize: "0.72rem",
    color: "#D98C7F",
    background: "none",
    border: "none",
    textDecoration: "underline",
    padding: 0,
  }),
};
