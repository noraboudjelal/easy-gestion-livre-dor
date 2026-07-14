"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

const THEMES = {
  "Mariage": {
    ink: "#12172A",
    surface: "#1B2238",
    surface2: "#242C46",
    accent: "#C9A24B",
    accentSoft: "rgba(201,162,75,0.3)",
    accentText: "#20180A",
    ivory: "#EEF1F8",
    muted: "#9AA3BE",
    avatarPalette: ["#3E4E7A", "#C9A24B", "#5C6FA0", "#8797C4"],
  },
  "Anniversaire": {
    ink: "#241220",
    surface: "#34182C",
    surface2: "#402039",
    accent: "#E8B44D",
    accentSoft: "rgba(232,180,77,0.3)",
    accentText: "#2B1C08",
    ivory: "#F7EFE0",
    muted: "#C2A8BA",
    avatarPalette: ["#E8B44D", "#E2705A", "#8FAE8B", "#A68BC9"],
  },
  "Baby Shower": {
    ink: "#161B26",
    surface: "#202838",
    surface2: "#2A3448",
    accent: "#E8A3C0",
    accentSoft: "rgba(232,163,192,0.3)",
    accentText: "#2A1420",
    ivory: "#F0F3F8",
    muted: "#9CA8BE",
    avatarPalette: ["#7FA8D9", "#E8A3C0", "#9CC2DE", "#F0B8CE"],
  },
  "Baptême": {
    ink: "#1A1C22",
    surface: "#24272F",
    surface2: "#2D313B",
    accent: "#B9C7DD",
    accentSoft: "rgba(185,199,221,0.3)",
    accentText: "#1A1C22",
    ivory: "#F5F3EC",
    muted: "#A7ABB5",
    avatarPalette: ["#B9C7DD", "#D9B98A", "#9FB4CC", "#E3D2A8"],
  },
  "Départ en retraite": {
    ink: "#102019",
    surface: "#182B22",
    surface2: "#20362B",
    accent: "#C9A24B",
    accentSoft: "rgba(201,162,75,0.3)",
    accentText: "#20180A",
    ivory: "#EEF3EE",
    muted: "#9DB0A2",
    avatarPalette: ["#4E7A5E", "#C9A24B", "#6FA083", "#8FBF9F"],
  },
  "Pot de départ": {
    ink: "#12232A",
    surface: "#1B323A",
    surface2: "#243F48",
    accent: "#C9A24B",
    accentSoft: "rgba(201,162,75,0.3)",
    accentText: "#20180A",
    ivory: "#EEF3F3",
    muted: "#9DB3B8",
    avatarPalette: ["#3E6B75", "#C9A24B", "#5C8993", "#7FADB5"],
  },
  "Autre": {
    ink: "#14131C",
    surface: "#1F1E2B",
    surface2: "#2A2836",
    accent: "#C9A24B",
    accentSoft: "rgba(201,162,75,0.3)",
    accentText: "#20180A",
    ivory: "#F4EFE4",
    muted: "#A9A4B8",
    avatarPalette: ["#1E2A3A", "#8B3A2B", "#355E3B", "#5B4636"],
  },
};

function randomRotation() {
  return +(Math.random() * 6 - 3).toFixed(2);
}
function randomInk(palette) {
  return palette[Math.floor(Math.random() * palette.length)];
}
function formatDate(ts) {
  try {
    return new Date(ts).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function GuestbookPage() {
  const params = useParams();
  const slug = params?.slug;

  const [event, setEvent] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [justSent, setJustSent] = useState(false);
  const [pollQuestions, setPollQuestions] = useState([]);
  const [votedIds, setVotedIds] = useState({});
  const [votingId, setVotingId] = useState(null);
  const audioMimeTypeRef = useRef("");

  const theme = THEMES[event?.event_type] || THEMES.Autre;
  const styles = getStyles(theme);

  const loadAll = useCallback(async () => {
    if (!supabase || !slug) return;
    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .single();

    if (evErr || !ev) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setEvent(ev);

    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("event_id", ev.id)
      .order("created_at", { ascending: true });

    setMessages(msgs || []);

    const { data: polls } = await supabase
      .from("poll_questions")
      .select("*")
      .eq("event_id", ev.id)
      .order("position", { ascending: true });

    setPollQuestions(polls || []);
    if (typeof window !== "undefined") {
      setVotedIds((prev) => {
        const next = { ...prev };
        (polls || []).forEach((q) => {
          if (window.localStorage.getItem(`poll-voted-${q.id}`) === "1") next[q.id] = true;
        });
        return next;
      });
    }

    setLoading(false);
  }, [slug]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 4000);
    return () => clearInterval(interval);
  }, [loadAll]);

  async function handleVote(questionId, optionIndex) {
    if (votedIds[questionId] || votingId || !supabase) return;
    setVotingId(questionId);
    const { error: voteError } = await supabase.rpc("increment_poll_question_vote", {
      p_question_id: questionId,
      p_option_index: optionIndex,
    });
    if (!voteError) {
      window.localStorage.setItem(`poll-voted-${questionId}`, "1");
      setVotedIds((prev) => ({ ...prev, [questionId]: true }));
      loadAll();
    }
    setVotingId(null);
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function removePhoto() {
    setPhoto(null);
    setPhotoPreview(null);
  }

  function handleVideoChange(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setVideo(null);
      setVideoPreview(null);
      return;
    }
    setVideo(file);
    setVideoPreview(URL.createObjectURL(file));
  }

  function removeVideo() {
    setVideo(null);
    setVideoPreview(null);
  }

  async function startRecording() {
  setError("");

  if (
    !navigator.mediaDevices?.getUserMedia ||
    typeof MediaRecorder === "undefined"
  ) {
    setError("L'enregistrement vocal n'est pas disponible sur ce navigateur.");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    streamRef.current = stream;
    audioChunksRef.current = [];

    const supportedTypes = [
      "audio/mp4;codecs=mp4a.40.2",
      "audio/mp4",
      "audio/webm;codecs=opus",
      "audio/webm",
    ];

    const mimeType =
      supportedTypes.find((type) =>
        MediaRecorder.isTypeSupported(type)
      ) || "";

    audioMimeTypeRef.current = mimeType;

    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };

    recorder.onerror = () => {
      setError("Une erreur est survenue pendant l'enregistrement.");
      setRecording(false);
      clearInterval(recordIntervalRef.current);
      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.onstop = () => {
      clearInterval(recordIntervalRef.current);

      const finalMimeType =
        recorder.mimeType ||
        audioMimeTypeRef.current ||
        audioChunksRef.current[0]?.type ||
        "audio/mp4";

      const blob = new Blob(audioChunksRef.current, {
        type: finalMimeType,
      });

      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      if (!blob || blob.size === 0) {
        setError("Le message vocal est vide. Recommence l'enregistrement.");
        return;
      }

      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }

      setAudioBlob(blob);
      setAudioPreviewUrl(URL.createObjectURL(blob));
    };

    recorder.start(250);
    setRecording(true);
    setRecordSeconds(0);

    recordIntervalRef.current = setInterval(() => {
      setRecordSeconds((seconds) => seconds + 1);
    }, 1000);
  } catch (err) {
    console.error("Erreur micro :", err);
    setError(
      "Impossible d'accéder au micro. Vérifie que l'accès au micro est autorisé."
    );
  }
}
  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    clearInterval(recordIntervalRef.current);
  }

  function removeAudio() {
    setAudioBlob(null);
    setAudioPreviewUrl(null);
    setRecordSeconds(0);
  }

  function formatTimer(s) {
    const m = Math.floor(s / 60);
    const sec = String(s % 60).padStart(2, "0");
    return `${m}:${sec}`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!event) return;
    if (!text.trim() && !audioBlob) {
      setError("Écris un petit mot ou enregistre un message vocal avant d'envoyer.");
      return;
    }
    setError("");
    setSending(true);

    let photoUrl = null;
    if (photo && supabase) {
      const ext = photo.name.split(".").pop() || "jpg";
      const path = `${event.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("guestbook-photos")
        .upload(path, photo);
      if (!uploadError) {
        const { data: pub } = supabase.storage.from("guestbook-photos").getPublicUrl(path);
        photoUrl = pub?.publicUrl || null;
      }
    }

    let videoUrl = null;
    if (video && supabase) {
      const ext = video.name.split(".").pop() || "mp4";
      const path = `${event.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("guestbook-media")
        .upload(path, video);
      if (!uploadError) {
        const { data: pub } = supabase.storage.from("guestbook-media").getPublicUrl(path);
        videoUrl = pub?.publicUrl || null;
      }
    }

    
let audioUrl = null;

if (audioBlob && supabase) {
  const mimeType =
    audioBlob.type ||
    audioMimeTypeRef.current ||
    "audio/mp4";

  let extension = "m4a";

  if (mimeType.includes("webm")) {
    extension = "webm";
  } else if (mimeType.includes("mp4")) {
    extension = "m4a";
  } else if (mimeType.includes("ogg")) {
    extension = "ogg";
  }

  const path = `${event.id}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("guestbook-media")
    .upload(path, audioBlob, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error("Erreur upload audio :", uploadError);
    setError(
      "Le message vocal n'a pas pu être envoyé : " +
        uploadError.message
    );
    setSending(false);
    return;
  }

  const { data: pub } = supabase.storage
    .from("guestbook-media")
    .getPublicUrl(path);

  audioUrl = pub?.publicUrl || null;
}

    const optimisticEntry = {
      id: "temp-" + Date.now(),
      name: name.trim() || "Anonyme",
      message: text.trim().slice(0, 400),
      photo_url: photoUrl || photoPreview,
      video_url: videoUrl || videoPreview,
      audio_url: audioUrl || audioPreviewUrl,
      ink: randomInk(theme.avatarPalette),
      rotation: randomRotation(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticEntry]);
    setText("");
    setPhoto(null);
    setPhotoPreview(null);
    setVideo(null);
    setVideoPreview(null);
    setAudioBlob(null);
    setAudioPreviewUrl(null);
    setRecordSeconds(0);
    setJustSent(true);
    setTimeout(() => setJustSent(false), 2500);

    const { error: insertError } = await supabase.from("messages").insert({
      event_id: event.id,
      name: optimisticEntry.name,
      message: optimisticEntry.message,
      photo_url: photoUrl,
      video_url: videoUrl,
      audio_url: audioUrl,
      ink: optimisticEntry.ink,
      rotation: optimisticEntry.rotation,
    });

    if (insertError) {
      setError("Le message est affiché ici mais n'a pas pu être sauvegardé : " + insertError.message);
    } else {
      loadAll();
    }
    setSending(false);
  }

  if (notFound) {
    return (
      <div style={{ ...styles.page, alignItems: "center", justifyContent: "center", display: "flex" }}>
        <p style={{ color: "#F4EFE4", fontFamily: "Inter, system-ui, sans-serif" }}>
          Ce livre d'or n'existe pas ou plus.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .ld-entry { transition: transform 0.15s ease, background 0.15s ease; animation: ldFadeIn 0.5s ease both; }
        .ld-entry:hover { transform: translateY(-2px); background: ${theme.surface2}; }
        @keyframes ldFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ldBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        textarea:focus, input:focus, button:focus-visible { outline: 2px solid ${theme.accent}; outline-offset: 2px; }
        ::placeholder { color: ${theme.muted}; }
      `}</style>

      <div style={styles.content}>
        <header style={styles.header}>
          <p style={styles.eyebrow}>LE FIL</p>
          <h1 style={styles.title}>{loading ? "…" : event?.event_title}</h1>
          <p style={styles.sub}>
            Laissez un petit mot qui restera gravé dans nos souvenirs.
          </p>
        </header>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Ton prénom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            style={styles.input}
          />
          <textarea
            placeholder="Ton message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={400}
            rows={3}
            style={styles.textarea}
          />

          {photoPreview ? (
            <div style={styles.photoPreviewWrap}>
              <img src={photoPreview} alt="Aperçu" style={styles.photoPreview} />
              <button type="button" onClick={removePhoto} style={styles.removePhotoButton}>
                ✕ retirer la photo
              </button>
            </div>
          ) : (
            <label style={styles.photoLabel}>
              📷 Ajouter une photo (optionnel)
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: "none" }}
              />
            </label>
          )}

          {videoPreview ? (
            <div style={styles.photoPreviewWrap}>
              <video src={videoPreview} controls style={styles.photoPreview} />
              <button type="button" onClick={removeVideo} style={styles.removePhotoButton}>
                ✕ retirer la vidéo
              </button>
            </div>
          ) : (
            <label style={styles.photoLabel}>
              🎥 Ajouter une vidéo (optionnel)
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                style={{ display: "none" }}
              />
            </label>
          )}

          {audioPreviewUrl ? (
            <div style={styles.photoPreviewWrap}>
              <audio src={audioPreviewUrl} controls style={{ width: "100%" }} />
              <button type="button" onClick={removeAudio} style={styles.removePhotoButton}>
                ✕ retirer le message vocal
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              style={{
                ...styles.photoLabel,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                borderStyle: recording ? "solid" : "dashed",
              }}
            >
              {recording ? (
                <>🔴 Arrêter l'enregistrement · {formatTimer(recordSeconds)}</>
              ) : (
                <>🎙️ Enregistrer un message vocal (optionnel)</>
              )}
            </button>
          )}

          <div style={styles.formRow}>
            <span style={styles.counter}>{text.length}/400</span>
            <button type="submit" disabled={sending || !event} style={styles.button}>
              {sending ? "Envoi…" : "Laisser mon mot"}
            </button>
          </div>
          {error && <p style={styles.errorText}>{error}</p>}
          {justSent && <p style={styles.successText}>Merci, ton message a été ajouté ✓</p>}
        </form>

        {pollQuestions.map((q) => {
          const voted = !!votedIds[q.id];
          const total = (q.votes || []).reduce((a, b) => a + b, 0);
          return (
            <div style={styles.pollCard} key={q.id}>
              <p style={styles.pollQuestion}>🎉 {q.question}</p>
              <div style={styles.pollOptions}>
                {(q.options || []).map((opt, i) => {
                  const votes = q.votes?.[i] || 0;
                  const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleVote(q.id, i)}
                      disabled={voted || votingId === q.id}
                      style={styles.pollOption}
                    >
                      <span style={{ ...styles.pollOptionFill, width: `${pct}%` }} />
                      <span style={styles.pollOptionRow}>
                        <span>{opt}</span>
                        <strong style={{ color: theme.accent }}>{pct}%</strong>
                      </span>
                    </button>
                  );
                })}
              </div>
              <p style={styles.pollNote}>
                {total === 0 ? "Soyez le premier·ère à voter !" : `${total} invité${total > 1 ? "s ont" : " a"} voté`}
                {voted ? " · merci pour ton vote ✓" : ""}
              </p>
            </div>
          );
        })}

        {event?.cagnotte_url && (
          <a
            href={event.cagnotte_url}
            target="_blank"
            rel="noreferrer"
            style={styles.cagnotteCard}
          >
            <span style={styles.cagnotteIcon}>💛</span>
            <span>
              <span style={styles.cagnotteTitle}>Participer à la cagnotte</span>
              <span style={styles.cagnotteSub}>Un geste qui fera plaisir ↗</span>
            </span>
          </a>
        )}

        <div style={styles.dividerRow}>
          <span style={styles.liveDot} />
          <span style={styles.dividerLabel}>Le Fil</span>
          <span style={styles.dividerCount}>
            {loading ? "Chargement…" : messages.length === 0 ? "Aucun message pour l'instant" : `${messages.length} message${messages.length > 1 ? "s" : ""}`}
          </span>
        </div>

        <div style={styles.entries}>
          {!loading && messages.length === 0 && (
            <div style={styles.empty}>
              <p style={{ fontSize: "1.1rem" }}>La première page est blanche.</p>
              <p style={{ opacity: 0.7 }}>Sois le ou la premier·ère à écrire un mot !</p>
            </div>
          )}

          {!loading &&
            [...messages].reverse().map((m) => (
              <article className="ld-entry" key={m.id} style={styles.entry}>
                <div style={styles.entryHead}>
                  <span style={{ ...styles.entryAvatar, background: m.ink }}>
                    {(m.name || "?")[0].toUpperCase()}
                  </span>
                  <span style={styles.entryName}>{m.name}</span>
                  <span style={styles.entryDate}>{formatDate(m.created_at)}</span>
                </div>
                {m.photo_url && (
                  <img src={m.photo_url} alt="" style={styles.entryPhoto} />
                )}
                {m.video_url && (
                  <video src={m.video_url} controls style={styles.entryPhoto} />
                )}
                <p style={styles.entryText}>{m.message}</p>
                {m.audio_url && (
                  <audio src={m.audio_url} controls style={styles.entryAudio} />
                )}
              </article>
            ))}
        </div>
      </div>
    </div>
  );
}

function getStyles(t) {
  return {
    page: { minHeight: "100vh", background: t.ink, backgroundImage: `radial-gradient(circle at 15% 0%, ${t.accentSoft}, transparent 40%), radial-gradient(circle at 85% 100%, ${t.accentSoft}, transparent 45%)`, display: "flex", justifyContent: "center", padding: "40px 14px", fontFamily: "Inter, system-ui, sans-serif" },
    content: { width: "100%", maxWidth: "560px", background: t.surface, border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px", padding: "32px 26px", boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6)" },
    header: { borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "18px", marginBottom: "22px", textAlign: "center" },
    eyebrow: { fontSize: "0.7rem", letterSpacing: "0.18em", color: t.accent, margin: "0 0 10px 0" },
    title: { fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400, fontSize: "2.4rem", color: t.ivory, margin: 0, lineHeight: 1.1 },
    sub: { fontSize: "0.85rem", color: t.muted, marginTop: "10px", lineHeight: 1.4 },
    form: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" },
    input: { fontFamily: "Inter, sans-serif", fontSize: "0.9rem", padding: "12px 14px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", background: t.surface2, color: t.ivory },
    textarea: { fontFamily: "Inter, sans-serif", fontSize: "0.9rem", padding: "12px 14px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", background: t.surface2, color: t.ivory, resize: "vertical" },
    photoLabel: { fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: t.muted, border: `1.5px dashed ${t.accentSoft}`, borderRadius: "12px", padding: "12px 14px", textAlign: "center", cursor: "pointer", background: "transparent" },
    photoPreviewWrap: { position: "relative", display: "flex", flexDirection: "column", gap: "6px" },
    photoPreview: { width: "100%", maxHeight: "220px", objectFit: "cover", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" },
    removePhotoButton: { alignSelf: "flex-start", fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "#D98C7F", background: "none", border: "none", padding: 0, cursor: "pointer" },
    formRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    counter: { fontSize: "0.7rem", color: t.muted },
    button: { fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.85rem", padding: "11px 20px", background: t.accent, color: t.accentText, border: "none", borderRadius: "12px" },
    errorText: { color: "#D98C7F", fontSize: "0.8rem", margin: 0 },
    successText: { color: "#6FAE7F", fontSize: "0.8rem", margin: 0 },
    pollCard: {
      background: t.surface2,
      border: `1px dashed ${t.accentSoft}`,
      borderRadius: "14px",
      padding: "18px",
      marginBottom: "22px",
    },
    pollQuestion: {
      fontFamily: "'Instrument Serif', serif",
      fontStyle: "italic",
      fontSize: "1.3rem",
      color: t.ivory,
      margin: "0 0 14px 0",
    },
    pollOptions: { display: "flex", flexDirection: "column", gap: "9px" },
    pollOption: {
      position: "relative",
      overflow: "hidden",
      textAlign: "left",
      fontFamily: "Inter, sans-serif",
      fontSize: "0.85rem",
      fontWeight: 500,
      color: t.ivory,
      background: t.surface,
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "12px",
      padding: "12px 14px",
    },
    pollOptionFill: {
      position: "absolute",
      top: 0, left: 0, bottom: 0,
      background: t.accentSoft,
      transition: "width 0.5s ease",
      zIndex: 0,
    },
    pollOptionRow: {
      position: "relative",
      zIndex: 1,
      display: "flex",
      justifyContent: "space-between",
    },
    pollNote: { fontSize: "0.75rem", color: t.muted, textAlign: "center", margin: "10px 0 0 0" },
    cagnotteCard: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      background: t.surface2,
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "14px",
      padding: "14px 16px",
      marginBottom: "22px",
      textDecoration: "none",
      color: t.ivory,
    },
    cagnotteIcon: { fontSize: "1.3rem", flex: "none" },
    cagnotteTitle: { display: "block", fontSize: "0.88rem", fontWeight: 600, color: t.ivory },
    cagnotteSub: { display: "block", fontSize: "0.75rem", color: t.muted, marginTop: "2px" },
    divider: { textAlign: "center", margin: "10px 0 20px 0", borderTop: "1px solid rgba(255,255,255,0.08)", position: "relative" },
    dividerText: { fontSize: "0.7rem", letterSpacing: "0.1em", color: t.accent, background: t.surface, padding: "0 12px", position: "relative", top: "-9px" },
    dividerRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", margin: "10px 0 18px 0" },
    liveDot: { width: "7px", height: "7px", borderRadius: "50%", background: "#6FAE7F", flex: "none", animation: "ldBlink 1.6s infinite" },
    dividerLabel: { fontSize: "0.78rem", fontWeight: 700, color: t.ivory, fontFamily: "'Instrument Serif', serif", fontStyle: "italic" },
    dividerCount: { fontSize: "0.72rem", color: t.muted },
    entries: { display: "flex", flexDirection: "column", gap: "12px" },
    empty: { textAlign: "center", color: t.muted, fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.2rem", padding: "20px 0" },
    entry: { background: t.surface, border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "14px 16px" },
    entryHead: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" },
    entryAvatar: { width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, color: t.ivory, flex: "none" },
    entryName: { fontSize: "0.85rem", fontWeight: 600, color: t.ivory, flex: 1 },
    entryDate: { fontSize: "0.68rem", color: t.muted },
    entryPhoto: { width: "100%", maxHeight: "260px", objectFit: "cover", borderRadius: "10px", marginBottom: "10px" },
    entryAudio: { width: "100%", marginTop: "8px", height: "36px" },
    entryText: { fontSize: "0.88rem", lineHeight: 1.5, color: t.ivory, margin: 0, opacity: 0.9 },
  };
}
