"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

const THEMES = {
  "Mariage": {
    ink: "#F5F0E6",
    surface: "#FFFDF9",
    surface2: "#F8F2E6",
    accent: "#C89A3C",
    accentSoft: "rgba(200,154,60,0.18)",
    accentText: "#2D241E",
    ivory: "#2D241E",
    muted: "#8C7A63",
    borderColor: "#D8B57A",
    cardGradient: "linear-gradient(160deg, #FFFFFF 0%, #FCFAF5 50%, #F8F2E6 100%)",
    avatarPalette: ["#C89A3C", "#6E5B8C", "#8C6E4E", "#8A7A9C"],
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
  "Henné": {
    ink: "#152016",
    surface: "#1E2E20",
    surface2: "#283C2B",
    accent: "#C9A24B",
    accentSoft: "rgba(201,162,75,0.3)",
    accentText: "#20180A",
    ivory: "#EFF3EA",
    muted: "#9FB29E",
    avatarPalette: ["#4E7A4F", "#C9A24B", "#6FA070", "#8FBF8F"],
  },
  "Circoncision": {
    ink: "#0F2A38",
    surface: "#173A4B",
    surface2: "#1F4A5E",
    accent: "#8FCFEA",
    accentSoft: "rgba(143,207,234,0.3)",
    accentText: "#0F2A38",
    ivory: "#EAF6FB",
    muted: "#9FC3D4",
    avatarPalette: ["#8FCFEA", "#C9A24B", "#6BAFCE", "#B8E2F2"],
  },
  "Fiançailles": {
    ink: "#241A1E",
    surface: "#332428",
    surface2: "#402F34",
    accent: "#D4A574",
    accentSoft: "rgba(212,165,116,0.3)",
    accentText: "#241A1E",
    ivory: "#F7EFEA",
    muted: "#B8A39D",
    avatarPalette: ["#D4A574", "#C9A24B", "#B88A63", "#E3C39D"],
  },
  "Inauguration": {
    ink: "#1C1A16",
    surface: "#28251F",
    surface2: "#332F27",
    accent: "#D4AF37",
    accentSoft: "rgba(212,175,55,0.3)",
    accentText: "#1C1A16",
    ivory: "#F5F1E6",
    muted: "#A69C8A",
    avatarPalette: ["#D4AF37", "#8A7B5C", "#C9A24B", "#B5A278"],
  },
  "Lancement de produit": {
    ink: "#151833",
    surface: "#1F2447",
    surface2: "#2A3059",
    accent: "#4FB8A8",
    accentSoft: "rgba(79,184,168,0.3)",
    accentText: "#0F1F1C",
    ivory: "#EAF6F3",
    muted: "#9DB8B2",
    avatarPalette: ["#4FB8A8", "#C9A24B", "#6FCFC0", "#8BD9CC"],
  },
  "Fête d'entreprise": {
    ink: "#17181C",
    surface: "#212327",
    surface2: "#2B2E33",
    accent: "#B7B9C0",
    accentSoft: "rgba(183,185,192,0.3)",
    accentText: "#17181C",
    ivory: "#F2F2F4",
    muted: "#9A9CA6",
    avatarPalette: ["#B7B9C0", "#C9A24B", "#8E9098", "#D3D4D9"],
  },
  "Vos avis": {
    ink: "#151515",
    surface: "#1F1F1F",
    surface2: "#292929",
    accent: "#D9C9A3",
    accentSoft: "rgba(217,201,163,0.28)",
    accentText: "#151515",
    ivory: "#F2F0EC",
    muted: "#9C9A94",
    avatarPalette: ["#D9C9A3", "#8C8A85", "#B7B4AC", "#6E6C67"],
  },
  "Notre Journal": {
    ink: "#241B3D", surface: "#32245A", surface2: "#3D2C6E",
    accent: "#FF6FB5", accentSoft: "rgba(255,111,181,0.28)", accentText: "#2A1230",
    ivory: "#FBF6FF", muted: "#C7B8E8",
    avatarPalette: ["#FF6FB5", "#8B7FD9", "#5FCBB8", "#FFC15E"],
  },
  "Entre Nous": {
    ink: "#241B3D", surface: "#32245A", surface2: "#3D2C6E",
    accent: "#FF6FB5", accentSoft: "rgba(255,111,181,0.28)", accentText: "#2A1230",
    ivory: "#FBF6FF", muted: "#C7B8E8",
    avatarPalette: ["#FF6FB5", "#8B7FD9", "#5FCBB8", "#FFC15E"],
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

const WHEEL_COLORS = ["#FF6B6B", "#4ECDC4", "#FFD93D", "#A78BFA", "#FF9F45", "#6BCB77", "#FF6FB5", "#5EC8F2"];

function randomRotation() {
  return +(Math.random() * 6 - 3).toFixed(2);
}
function randomInk(palette) {
  const safePalette = Array.isArray(palette) && palette.length > 0 ? palette : ["#1E2A3A", "#8B3A2B", "#355E3B", "#5B4636"];
  return safePalette[Math.floor(Math.random() * safePalette.length)];
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
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function wheelPolarToCartesian(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function describeWheelSlice(cx, cy, r, startAngle, endAngle) {
  const start = wheelPolarToCartesian(cx, cy, r, endAngle);
  const end = wheelPolarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function EggReveal({ revealAt, revealGender, theme }) {
  const target = new Date(revealAt).getTime();
  const [now, setNow] = useState(Date.now());
  const [shake, setShake] = useState(false);
  const [showPatience, setShowPatience] = useState(false);
  const [cracks, setCracks] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const maxCracks = 5;

  useEffect(() => {
    try {
      if (sessionStorage.getItem(`egg-revealed-${revealAt}`) === "1") setRevealed(true);
    } catch {}
  }, [revealAt]);

  useEffect(() => {
    if (revealed) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [revealed]);

  const isReady = now >= target;
  const diff = Math.max(target - now, 0);
  const hh = String(Math.floor(diff / 3600000)).padStart(2, "0");
  const mm = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  const ss = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");

  function handleLockedTap() {
    setShake(true);
    setShowPatience(true);
    setTimeout(() => setShake(false), 400);
    setTimeout(() => setShowPatience(false), 1600);
  }

  function handleCrackTap() {
    const next = cracks + 1;
    if (next >= maxCracks) {
      launchConfetti();
      setTimeout(() => {
        setRevealed(true);
        try {
          sessionStorage.setItem(`egg-revealed-${revealAt}`, "1");
        } catch {}
      }, 400);
    } else {
      setCracks(next);
    }
  }

  function launchConfetti() {
    const colors =
      revealGender === "garcon" ? ["#7EB8E8", "#A8D0F0", "#F4EEF6"] : ["#E8A3C0", "#F5C6DA", "#F4EEF6"];
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: 2 + Math.random() * 1.5,
      delay: Math.random() * 0.4,
    }));
    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 4000);
  }

  const genderLabel = revealGender === "garcon" ? "C'est un garçon !" : "C'est une fille !";
  const genderColor = revealGender === "garcon" ? "#7EB8E8" : theme.accent;

  return (
    <div style={{ textAlign: "center", padding: "20px 0 28px" }}>
      {confetti.map((c) => (
        <span
          key={c.id}
          style={{
            position: "fixed",
            top: "-10px",
            left: `${c.left}vw`,
            width: "8px",
            height: "14px",
            background: c.color,
            opacity: 0.9,
            pointerEvents: "none",
            animation: `confettiFall ${c.duration}s linear forwards`,
            animationDelay: `${c.delay}s`,
            zIndex: 999,
          }}
        />
      ))}

      {revealed ? (
        <div>
          <div style={{ fontSize: "2.6rem", marginBottom: "6px" }}>🎈</div>
          <p
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "2rem",
              color: genderColor,
              margin: 0,
            }}
          >
            {genderLabel}
          </p>
        </div>
      ) : !isReady ? (
        <div>
          <p style={{ fontSize: "0.9rem", color: theme.muted, marginBottom: "18px" }}>
            Révélation dans{" "}
            <strong style={{ color: theme.accent, fontVariantNumeric: "tabular-nums" }}>
              {hh}:{mm}:{ss}
            </strong>
          </p>
          <div style={{ position: "relative", display: "inline-block" }}>
            <div
              onClick={handleLockedTap}
              style={{
                fontSize: "100px",
                cursor: "pointer",
                userSelect: "none",
                animation: shake ? "eggShake 0.4s ease" : "none",
              }}
            >
              🥚
            </div>
            <div
              style={{
                position: "absolute",
                bottom: "-22px",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "0.82rem",
                color: theme.accent,
                opacity: showPatience ? 1 : 0,
                transition: "opacity 0.25s ease",
                whiteSpace: "nowrap",
              }}
            >
              Encore un peu de patience… 🥚
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: "0.85rem", color: theme.muted, marginBottom: "10px" }}>
            Tape sur l'œuf pour le faire éclore
          </p>
          <div
            onClick={handleCrackTap}
            style={{
              fontSize: "100px",
              cursor: "pointer",
              userSelect: "none",
              display: "inline-block",
              transform: cracks > 0 ? `scale(${1 + cracks * 0.02}) rotate(${cracks % 2 === 0 ? 1 : -1}deg)` : "none",
              filter: cracks > 0 ? `drop-shadow(0 10px ${16 + cracks * 4}px ${theme.accentSoft}) brightness(${1 + cracks * 0.03})` : "none",
              transition: "transform 0.15s ease, filter 0.3s ease",
            }}
          >
            🥚
          </div>
        </div>
      )}
    </div>
  );
}

function PlaylistRequest({ eventId, theme }) {
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!supabase || !songTitle.trim()) return;
    setSending(true);
    const { error } = await supabase.from("playlist_requests").insert({
      event_id: eventId,
      song_title: songTitle.trim(),
      artist: artist.trim() || null,
      requester_name: requesterName.trim() || null,
    });
    setSending(false);
    if (!error) {
      setSongTitle("");
      setArtist("");
      setRequesterName("");
      setSent(true);
      setTimeout(() => setSent(false), 2200);
    }
  }

  return (
    <div
      style={{
        width: "calc(100% + 18px)",
        maxWidth: "none",
        marginLeft: "-9px",
        marginRight: "-9px",
        background: `linear-gradient(180deg, ${theme.surface2} 0%, ${theme.surface} 100%)`,
        border: `1px solid ${theme.borderColor || theme.accent}`,
        borderRadius: "20px",
        padding: "28px 30px",
        marginBottom: "26px",
        boxShadow: "0 12px 28px rgba(60,42,20,0.08)",
      }}
    >
      <p style={{ fontSize: "1rem", fontWeight: 700, color: theme.ivory, margin: "0 0 4px" }}>🎵 Demande une chanson</p>
      <p style={{ fontSize: "0.82rem", color: theme.muted, margin: "0 0 14px" }}>
        Le DJ verra toutes les demandes en direct !
      </p>
      <input
        value={songTitle}
        onChange={(e) => setSongTitle(e.target.value)}
        placeholder="Titre de la chanson"
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "8px",
          border: `1px solid ${theme.accentSoft}`,
          marginBottom: "8px",
          fontSize: "0.88rem",
          background: theme.surface,
          color: theme.ivory,
        }}
      />
      <input
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
        placeholder="Artiste"
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "8px",
          border: `1px solid ${theme.accentSoft}`,
          marginBottom: "8px",
          fontSize: "0.88rem",
          background: theme.surface,
          color: theme.ivory,
        }}
      />
      <input
        value={requesterName}
        onChange={(e) => setRequesterName(e.target.value)}
        placeholder="Ton prénom (optionnel)"
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "8px",
          border: `1px solid ${theme.accentSoft}`,
          marginBottom: "12px",
          fontSize: "0.88rem",
          background: theme.surface,
          color: theme.ivory,
        }}
      />
      <button
        onClick={handleSend}
        disabled={sending || !songTitle.trim()}
        style={{
          width: "100%",
          background: theme.accent,
          color: theme.ink,
          border: "none",
          borderRadius: "8px",
          padding: "11px",
          fontWeight: 700,
          fontSize: "0.88rem",
          cursor: "pointer",
        }}
      >
        {sending ? "Envoi…" : sent ? "✓ Envoyée !" : "Envoyer ma demande"}
      </button>
    </div>
  );
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
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
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
  const [giftItems, setGiftItems] = useState([]);
  const [reservedByMe, setReservedByMe] = useState({});
  const [reservingId, setReservingId] = useState(null);
  const [giftNamePrompt, setGiftNamePrompt] = useState(null);
  const [giftNameInput, setGiftNameInput] = useState("");

  // --- Entre Nous ---
  const [wallRefs, setWallRefs] = useState([]);
  const [eventDates, setEventDates] = useState([]);
  const [likedIds, setLikedIds] = useState({});
  const [ownedMessageIds, setOwnedMessageIds] = useState({});
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [newRefText, setNewRefText] = useState("");
  const [newRefAuthor, setNewRefAuthor] = useState("");
  const [addingRef, setAddingRef] = useState(false);
  const [newDateTitle, setNewDateTitle] = useState("");
  const [newDateValue, setNewDateValue] = useState("");
  const [addingDate, setAddingDate] = useState(false);
  const [showNewDateForm, setShowNewDateForm] = useState(false);
  const [showNewPollForm, setShowNewPollForm] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState("");
  const [newPollOptions, setNewPollOptions] = useState(["", ""]);
  const [addingPoll, setAddingPoll] = useState(false);

  // --- Jeu du petit bac ---
  const [bacRound, setBacRound] = useState(null);
  const [bacAllRounds, setBacAllRounds] = useState([]);
  const [bacAllAnswers, setBacAllAnswers] = useState([]);
  const [bacAnswersAll, setBacAnswersAll] = useState([]);
  const [bacCategoryInput, setBacCategoryInput] = useState("");
  const [bacSetupCategories, setBacSetupCategories] = useState([]);
  const [bacCreating, setBacCreating] = useState(false);
  const [bacShowSetup, setBacShowSetup] = useState(false);
  const [bacPlayerName, setBacPlayerName] = useState("");
  const [bacAnswerValues, setBacAnswerValues] = useState({});
  const [bacSubmitting, setBacSubmitting] = useState(false);
  const [bacSubmitted, setBacSubmitted] = useState(false);
  const [bacJoined, setBacJoined] = useState(false);
  const [bacJoining, setBacJoining] = useState(false);
  const [bacElapsedSeconds, setBacElapsedSeconds] = useState(0);
  const [bacViewResults, setBacViewResults] = useState(false);
  const [bacError, setBacError] = useState("");
  useEffect(() => {
    setBacAnswerValues({});
    if (typeof window !== "undefined" && bacRound) {
      setBacSubmitted(window.localStorage.getItem(`bac-submitted-${bacRound.id}`) === "1");
      const wasJoined = window.localStorage.getItem(`bac-joined-${bacRound.id}`) === "1";
      setBacJoined(wasJoined);
      if (wasJoined) {
        const savedName = window.localStorage.getItem(`bac-name-${bacRound.id}`);
        if (savedName) setBacPlayerName(savedName);
      }
    } else {
      setBacSubmitted(false);
      setBacJoined(false);
    }
    setBacViewResults(false);
    setBacError("");
  }, [bacRound?.id]);

  // --- Jeu du petit bac : chrono qui défile depuis le lancement ---
  useEffect(() => {
    if (!bacRound || bacRound.status !== "playing") {
      setBacElapsedSeconds(0);
      return;
    }
    function tick() {
      const started = new Date(bacRound.started_at).getTime();
      setBacElapsedSeconds(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [bacRound?.id, bacRound?.status, bacRound?.started_at]);

  // --- Jeu du pendu ---
  const [hangmanGame, setHangmanGame] = useState(null);
  const [hangmanSetterName, setHangmanSetterName] = useState("");
  const [hangmanWordInput, setHangmanWordInput] = useState("");
  const [hangmanPlayerInput, setHangmanPlayerInput] = useState("");
  const [hangmanSetupPlayers, setHangmanSetupPlayers] = useState([]);
  const [hangmanCreating, setHangmanCreating] = useState(false);
  const [hangmanGuessingLetter, setHangmanGuessingLetter] = useState(null);
  const [hangmanShowSetup, setHangmanShowSetup] = useState(false);

  // --- La Roue ---
  const [wheelPlayerInput, setWheelPlayerInput] = useState("");
  const [wheelPlayers, setWheelPlayers] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wheelResult, setWheelResult] = useState(null);
  const wheelSpinTimeoutRef = useRef(null);

  // --- Look du jour ---
  const [dailyLooks, setDailyLooks] = useState([]);
  const [lookName, setLookName] = useState("");
  const [lookPhoto, setLookPhoto] = useState(null);
  const [lookPhotoPreview, setLookPhotoPreview] = useState(null);
  const [postingLook, setPostingLook] = useState(false);
  const [votedLookIds, setVotedLookIds] = useState({});
  const [votingLookId, setVotingLookId] = useState(null);
  const [ownedLookIds, setOwnedLookIds] = useState({});
  const [deletingLookId, setDeletingLookId] = useState(null);
  const [lightboxLookPhoto, setLightboxLookPhoto] = useState(null);
  const [hasPostedLookToday, setHasPostedLookToday] = useState(false);

  const theme = THEMES[event?.event_type] || THEMES.Autre;
  const isReview = event?.event_type === "Vos avis";
  const isJournal = event?.event_type === "Entre Nous" || event?.event_type === "Notre Journal";
  const canAnyoneStartPoll = isJournal && event?.polls_open_to_all;
  const isBeforeEvent = (() => {
    if (!event?.event_date) return false;
    const eventDay = new Date(event.event_date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDay.getTime() > today.getTime();
  })();

  const todaysLooks = dailyLooks.filter((l) => (l.created_at || "").slice(0, 10) === todayKey());
  const leaderLook = todaysLooks.length > 0 ? todaysLooks[0] : null;

  const [rsvpName, setRsvpName] = useState("");
  const [rsvpAttending, setRsvpAttending] = useState(null);
  const [rsvpGuests, setRsvpGuests] = useState(0);
  const [rsvpNote, setRsvpNote] = useState("");
  const [rsvpSending, setRsvpSending] = useState(false);
  const [rsvpDone, setRsvpDone] = useState(false);
  const [rsvpError, setRsvpError] = useState("");
  const styles = getStyles(theme, isJournal);

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
    if (typeof window !== "undefined") {
      setLikedIds((prev) => {
        const next = { ...prev };
        (msgs || []).forEach((m) => {
          if (window.localStorage.getItem(`msg-liked-${m.id}`) === "1") next[m.id] = true;
        });
        return next;
      });
      setOwnedMessageIds((prev) => {
        const next = { ...prev };
        (msgs || []).forEach((m) => {
          if (window.localStorage.getItem(`msg-owned-${m.id}`) === "1") next[m.id] = true;
        });
        return next;
      });
    }

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

    const { data: gifts } = await supabase
      .from("gift_items")
      .select("*")
      .eq("event_id", ev.id)
      .order("position", { ascending: true });

    setGiftItems(gifts || []);
    if (typeof window !== "undefined") {
      setReservedByMe((prev) => {
        const next = { ...prev };
        (gifts || []).forEach((g) => {
          if (window.localStorage.getItem(`gift-reserved-${g.id}`) === "1") next[g.id] = true;
        });
        return next;
      });
    }

    const { data: refsData } = await supabase
      .from("event_wall_refs")
      .select("*")
      .eq("event_id", ev.id)
      .order("created_at", { ascending: false });
    setWallRefs(refsData || []);

    const { data: datesData } = await supabase
      .from("event_dates")
      .select("*")
      .eq("event_id", ev.id)
      .order("event_date", { ascending: true });
    setEventDates(datesData || []);

    const { data: looksData } = await supabase
      .from("daily_looks")
      .select("*")
      .eq("event_id", ev.id)
      .order("votes", { ascending: false });
    setDailyLooks(looksData || []);
    if (typeof window !== "undefined") {
      setVotedLookIds((prev) => {
        const next = { ...prev };
        (looksData || []).forEach((l) => {
          if (window.localStorage.getItem(`look-voted-${l.id}`) === "1") next[l.id] = true;
        });
        return next;
      });
      setOwnedLookIds((prev) => {
        const next = { ...prev };
        (looksData || []).forEach((l) => {
          if (window.localStorage.getItem(`look-owned-${l.id}`) === "1") next[l.id] = true;
        });
        return next;
      });
    }

    const { data: hangmanData } = await supabase
      .from("hangman_games")
      .select("*")
      .eq("event_id", ev.id)
      .order("created_at", { ascending: false })
      .limit(1);
    setHangmanGame(hangmanData && hangmanData.length > 0 ? hangmanData[0] : null);

    const { data: bacRoundsData } = await supabase
      .from("petit_bac_rounds")
      .select("*")
      .eq("event_id", ev.id)
      .order("created_at", { ascending: true });
    const allRounds = bacRoundsData || [];
    setBacAllRounds(allRounds);
    const latestRound = allRounds.length > 0 ? allRounds[allRounds.length - 1] : null;
    setBacRound(latestRound);

    if (allRounds.length > 0) {
      const { data: bacAnswersData } = await supabase
        .from("petit_bac_answers")
        .select("*")
        .in(
          "round_id",
          allRounds.map((r) => r.id)
        );
      setBacAllAnswers(bacAnswersData || []);
      setBacAnswersAll((bacAnswersData || []).filter((a) => a.round_id === latestRound?.id));
      if (typeof window !== "undefined" && latestRound) {
        const already = window.localStorage.getItem(`bac-submitted-${latestRound.id}`);
        if (already) setBacSubmitted(true);
      }
    } else {
      setBacAllAnswers([]);
      setBacAnswersAll([]);
    }

    setLoading(false);
  }, [slug]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 4000);
    return () => clearInterval(interval);
  }, [loadAll]);

  useEffect(() => {
    if (event?.id && typeof window !== "undefined") {
      const saved = window.localStorage.getItem(`rsvp-done-${event.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setRsvpDone(true);
          setRsvpName(parsed.name || "");
          setRsvpAttending(parsed.attending);
          setRsvpGuests(parsed.guests || 0);
        } catch {}
      }
    }
  }, [event?.id]);

  // --- La Roue : hydrate + cleanup ---
  useEffect(() => {
    if (event?.wheel_players) setWheelPlayers(event.wheel_players);
    if (event?.wheel_last_result) setWheelResult(event.wheel_last_result);
  }, [event?.id]);

  useEffect(() => {
    return () => clearTimeout(wheelSpinTimeoutRef.current);
  }, []);

  // --- Jeu du petit bac ---
  const ALPHABET_BAC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  function addBacCategory() {
    const trimmed = bacCategoryInput.trim();
    if (!trimmed) return;
    setBacSetupCategories((prev) => [...prev, trimmed]);
    setBacCategoryInput("");
  }

  function removeBacCategory(index) {
    setBacSetupCategories((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreateBacRound(e) {
    e.preventDefault();
    if (bacSetupCategories.length < 1 || !supabase || !event) return;
    setBacCreating(true);
    const letter = ALPHABET_BAC[Math.floor(Math.random() * ALPHABET_BAC.length)];
    const { error: insertError } = await supabase.from("petit_bac_rounds").insert({
      event_id: event.id,
      letter,
      categories: bacSetupCategories,
      duration_seconds: 60,
      started_at: new Date().toISOString(),
    });
    setBacCreating(false);
    if (!insertError) {
      setBacSetupCategories([]);
      setBacCategoryInput("");
      setBacShowSetup(false);
      loadAll();
    }
  }

  function handleBacAnswerChange(category, value) {
    setBacAnswerValues((prev) => ({ ...prev, [category]: value }));
  }

  async function handleJoinBacRound(e) {
    e.preventDefault();
    if (!bacRound || !bacPlayerName.trim() || !supabase) return;
    setBacJoining(true);
    await supabase.from("petit_bac_answers").delete().eq("round_id", bacRound.id).eq("player_name", bacPlayerName.trim());
    const { error: insertError } = await supabase.from("petit_bac_answers").insert({
      round_id: bacRound.id,
      player_name: bacPlayerName.trim(),
      answers: {},
    });
    setBacJoining(false);
    if (!insertError) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(`bac-joined-${bacRound.id}`, "1");
        window.localStorage.setItem(`bac-name-${bacRound.id}`, bacPlayerName.trim());
      }
      setBacJoined(true);
      loadAll();
    }
  }

  async function handleSubmitBacAnswers(e) {
    e.preventDefault();
    if (!bacRound || !supabase) return;
    if (!bacPlayerName.trim()) {
      setBacError("Ton prénom semble manquant, retape-le puis rejoins à nouveau la manche.");
      setBacJoined(false);
      return;
    }
    const allFilled = bacRound.categories.every((cat) => (bacAnswerValues[cat] || "").trim());
    if (!allFilled) {
      setBacError("Remplis toutes les catégories avant de valider.");
      return;
    }
    setBacError("");
    setBacSubmitting(true);
    await supabase.from("petit_bac_answers").delete().eq("round_id", bacRound.id).eq("player_name", bacPlayerName.trim());
    const { error: insertError } = await supabase.from("petit_bac_answers").insert({
      round_id: bacRound.id,
      player_name: bacPlayerName.trim(),
      answers: bacAnswerValues,
    });

    if (!insertError) {
      // Le premier à valider complètement remporte la manche
      await supabase
        .from("petit_bac_rounds")
        .update({ status: "finished", winner_name: bacPlayerName.trim(), finished_at: new Date().toISOString() })
        .eq("id", bacRound.id)
        .eq("status", "playing");

      if (typeof window !== "undefined") {
        window.localStorage.setItem(`bac-submitted-${bacRound.id}`, "1");
      }
      setBacSubmitted(true);
      loadAll();
    }
    setBacSubmitting(false);
  }

  function computeBacScores(round, answers) {
    const scoresByCategory = {};
    const totals = {};
    (round?.categories || []).forEach((cat) => {
      const validEntries = answers
        .map((a) => ({ player: a.player_name, raw: (a.answers?.[cat] || "").trim() }))
        .map((e) => ({
          ...e,
          valid: !!e.raw && e.raw.toUpperCase().startsWith((round.letter || "").toUpperCase()),
          normalized: e.raw.toUpperCase(),
        }));

      const countByWord = {};
      validEntries.forEach((e) => {
        if (e.valid) countByWord[e.normalized] = (countByWord[e.normalized] || 0) + 1;
      });

      scoresByCategory[cat] = validEntries.map((e) => {
        let points = 0;
        if (e.valid) points = countByWord[e.normalized] > 1 ? 1 : 2;
        totals[e.player] = (totals[e.player] || 0) + points;
        return { player: e.player, raw: e.raw, valid: e.valid, points };
      });
    });
    return { scoresByCategory, totals };
  }

  function computeBacCumulativeScores(allRounds, allAnswers) {
    const grandTotals = {};
    allRounds
      .filter((r) => r.status === "finished")
      .forEach((round) => {
        const roundAnswers = allAnswers.filter((a) => a.round_id === round.id);
        const { totals } = computeBacScores(round, roundAnswers);
        Object.entries(totals).forEach(([player, pts]) => {
          grandTotals[player] = (grandTotals[player] || 0) + pts;
        });
      });
    return grandTotals;
  }

  // --- Jeu du pendu ---
  function normalizeHangmanWord(raw) {
    return raw
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function addHangmanPlayer() {
    const trimmed = hangmanPlayerInput.trim();
    if (!trimmed) return;
    setHangmanSetupPlayers((prev) => [...prev, trimmed]);
    setHangmanPlayerInput("");
  }

  function removeHangmanPlayer(index) {
    setHangmanSetupPlayers((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreateHangman(e) {
    e.preventDefault();
    const word = normalizeHangmanWord(hangmanWordInput.trim());
    if (!word || hangmanSetupPlayers.length < 1 || !supabase || !event) return;
    setHangmanCreating(true);
    const { error: insertError } = await supabase.from("hangman_games").insert({
      event_id: event.id,
      word,
      set_by: hangmanSetterName.trim() || "Quelqu'un",
      players: hangmanSetupPlayers,
      guessed_letters: [],
      wrong_count: 0,
      max_wrong: 6,
      status: "playing",
      current_turn_index: 0,
    });
    setHangmanCreating(false);
    if (!insertError) {
      setHangmanWordInput("");
      setHangmanSetterName("");
      setHangmanSetupPlayers([]);
      setHangmanShowSetup(false);
      loadAll();
    }
  }

  async function handleGuessHangmanLetter(letter) {
    if (!hangmanGame || hangmanGame.status !== "playing" || !supabase) return;
    if (hangmanGame.guessed_letters.includes(letter) || hangmanGuessingLetter) return;
    setHangmanGuessingLetter(letter);

    const newGuessed = [...hangmanGame.guessed_letters, letter];
    const isCorrect = hangmanGame.word.includes(letter);
    const newWrongCount = isCorrect ? hangmanGame.wrong_count : hangmanGame.wrong_count + 1;
    const players = hangmanGame.players || [];
    const newTurnIndex = isCorrect
      ? hangmanGame.current_turn_index
      : players.length > 0
      ? (hangmanGame.current_turn_index + 1) % players.length
      : 0;

    const wordLetters = [...new Set(hangmanGame.word.split(""))].filter((c) => /[A-Z]/.test(c));
    const won = wordLetters.every((l) => newGuessed.includes(l));
    const lost = newWrongCount >= hangmanGame.max_wrong;
    const newStatus = won ? "won" : lost ? "lost" : "playing";

    // mise à jour optimiste
    setHangmanGame((prev) => ({
      ...prev,
      guessed_letters: newGuessed,
      wrong_count: newWrongCount,
      current_turn_index: newTurnIndex,
      status: newStatus,
    }));

    await supabase
      .from("hangman_games")
      .update({
        guessed_letters: newGuessed,
        wrong_count: newWrongCount,
        current_turn_index: newTurnIndex,
        status: newStatus,
      })
      .eq("id", hangmanGame.id);

    setHangmanGuessingLetter(null);
    loadAll();
  }

  // --- Look du jour : hydrate "déjà posté aujourd'hui" ---
  useEffect(() => {
    if (event?.id && typeof window !== "undefined") {
      const key = `look-posted-${event.id}-${todayKey()}`;
      if (window.localStorage.getItem(key) === "1") setHasPostedLookToday(true);
    }
  }, [event?.id]);

  async function handleAddWheelPlayer(e) {
    e.preventDefault();
    const nameTrim = wheelPlayerInput.trim();
    if (!nameTrim || !event || !supabase) return;
    const updated = [...wheelPlayers, nameTrim];
    setWheelPlayers(updated);
    setWheelPlayerInput("");
    await supabase.from("events").update({ wheel_players: updated }).eq("id", event.id);
  }

  async function handleRemoveWheelPlayer(index) {
    if (!event || !supabase) return;
    const updated = wheelPlayers.filter((_, i) => i !== index);
    setWheelPlayers(updated);
    await supabase.from("events").update({ wheel_players: updated }).eq("id", event.id);
  }

  function handleSpinWheel() {
    if (spinning || wheelPlayers.length < 2 || !event?.wheel_pool?.length) return;
    setSpinning(true);
    setWheelResult(null);

    const n = wheelPlayers.length;
    const winnerIndex = Math.floor(Math.random() * n);
    const sliceAngle = 360 / n;
    const targetCenter = sliceAngle * winnerIndex + sliceAngle / 2;
    const currentMod = ((wheelRotation % 360) + 360) % 360;
    const extraSpins = 5 * 360;
    const finalRotation = wheelRotation - currentMod + extraSpins + (360 - targetCenter);

    setWheelRotation(finalRotation);

    wheelSpinTimeoutRef.current = setTimeout(() => {
      const winnerName = wheelPlayers[winnerIndex];
      const pool = event.wheel_pool;
      const question = pool[Math.floor(Math.random() * pool.length)];
      const result = { name: winnerName, question, timestamp: new Date().toISOString() };
      setWheelResult(result);
      setSpinning(false);
      if (supabase) {
        supabase.from("events").update({ wheel_last_result: result }).eq("id", event.id);
      }
    }, 4600);
  }

  function renderWheelSlices() {
    const n = wheelPlayers.length;
    if (n === 0) return null;
    const cx = 100, cy = 100, r = 98;
    return wheelPlayers.map((p, i) => {
      const startAngle = (360 / n) * i;
      const endAngle = (360 / n) * (i + 1);
      const path = describeWheelSlice(cx, cy, r, startAngle, endAngle);
      const mid = (startAngle + endAngle) / 2;
      const pos = wheelPolarToCartesian(cx, cy, r * 0.62, mid);
      const color = WHEEL_COLORS[i % WHEEL_COLORS.length];
      const label = p.length > 10 ? p.slice(0, 9) + "…" : p;
      return (
        <g key={i}>
          <path d={path} fill={color} stroke="#ffffff" strokeWidth="2" />
          <text
            x={pos.x}
            y={pos.y}
            fill="#241a15"
            fontSize="11"
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${mid + 90}, ${pos.x}, ${pos.y})`}
          >
            {label}
          </text>
        </g>
      );
    });
  }

  // --- Look du jour handlers ---
  function handleLookPhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setLookPhoto(null);
      setLookPhotoPreview(null);
      return;
    }
    setLookPhoto(file);
    setLookPhotoPreview(URL.createObjectURL(file));
  }

  function removeLookPhoto() {
    setLookPhoto(null);
    setLookPhotoPreview(null);
  }

  async function handlePostLook(e) {
    e.preventDefault();
    if (!lookPhoto || !event || !supabase) return;
    setPostingLook(true);

    const ext = lookPhoto.name.split(".").pop() || "jpg";
    const path = `${event.id}/looks/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("guestbook-photos").upload(path, lookPhoto);
    let photoUrl = null;
    if (!uploadError) {
      const { data: pub } = supabase.storage.from("guestbook-photos").getPublicUrl(path);
      photoUrl = pub?.publicUrl || null;
    }

    const { data: insertedLook, error: insertError } = await supabase
      .from("daily_looks")
      .insert({
        event_id: event.id,
        name: lookName.trim() || "Anonyme",
        photo_url: photoUrl,
      })
      .select()
      .single();

    setPostingLook(false);
    if (!insertError) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(`look-posted-${event.id}-${todayKey()}`, "1");
        if (insertedLook?.id) {
          window.localStorage.setItem(`look-owned-${insertedLook.id}`, "1");
          setOwnedLookIds((prev) => ({ ...prev, [insertedLook.id]: true }));
        }
      }
      setHasPostedLookToday(true);
      setLookPhoto(null);
      setLookPhotoPreview(null);
      loadAll();
    }
  }

  async function handleDeleteLook(lookId) {
    if (!supabase || deletingLookId) return;
    setDeletingLookId(lookId);
    const { error } = await supabase.from("daily_looks").delete().eq("id", lookId);
    if (!error) {
      window.localStorage.removeItem(`look-owned-${lookId}`);
      setDailyLooks((prev) => prev.filter((l) => l.id !== lookId));
    }
    setDeletingLookId(null);
  }

  async function handleVoteLook(lookId) {
    if (votedLookIds[lookId] || votingLookId || !supabase) return;
    setVotingLookId(lookId);
    const { error } = await supabase.rpc("increment_daily_look_votes", { p_look_id: lookId });
    if (!error) {
      window.localStorage.setItem(`look-voted-${lookId}`, "1");
      setVotedLookIds((prev) => ({ ...prev, [lookId]: true }));
      loadAll();
    }
    setVotingLookId(null);
  }

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

  async function handleLikeMessage(messageId) {
    if (likedIds[messageId] || !supabase) return;
    const { error } = await supabase.rpc("increment_message_likes", { p_message_id: messageId });
    if (!error) {
      window.localStorage.setItem(`msg-liked-${messageId}`, "1");
      setLikedIds((prev) => ({ ...prev, [messageId]: true }));
      loadAll();
    }
  }

  async function handleDeleteMessage(messageId) {
    if (!supabase || deletingMessageId) return;
    setDeletingMessageId(messageId);
    const { error } = await supabase.from("messages").delete().eq("id", messageId);
    if (!error) {
      window.localStorage.removeItem(`msg-owned-${messageId}`);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
    setDeletingMessageId(null);
  }

  async function handleAddRef(e) {
    e.preventDefault();
    if (!newRefText.trim() || !supabase || !event) return;
    setAddingRef(true);
    const { error } = await supabase.from("event_wall_refs").insert({
      event_id: event.id,
      text: newRefText.trim(),
      author_name: newRefAuthor.trim() || null,
    });
    setAddingRef(false);
    if (!error) {
      setNewRefText("");
      setNewRefAuthor("");
      loadAll();
    }
  }

  async function handleAddDate(e) {
    e.preventDefault();
    if (!newDateTitle.trim() || !newDateValue || !supabase || !event) return;
    setAddingDate(true);
    const { error } = await supabase.from("event_dates").insert({
      event_id: event.id,
      title: newDateTitle.trim(),
      event_date: newDateValue,
    });
    setAddingDate(false);
    if (!error) {
      setNewDateTitle("");
      setNewDateValue("");
      loadAll();
    }
  }

  function updatePollOption(index, value) {
    setNewPollOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  async function handleCreatePoll(e) {
    e.preventDefault();
    const cleanOptions = newPollOptions.map((o) => o.trim()).filter(Boolean);
    if (!newPollQuestion.trim() || cleanOptions.length < 2 || !supabase || !event) return;
    setAddingPoll(true);
    const { error } = await supabase.from("poll_questions").insert({
      event_id: event.id,
      question: newPollQuestion.trim(),
      options: cleanOptions,
      votes: cleanOptions.map(() => 0),
      position: pollQuestions.length,
    });
    setAddingPoll(false);
    if (!error) {
      setNewPollQuestion("");
      setNewPollOptions(["", ""]);
      setShowNewPollForm(false);
      loadAll();
    }
  }

  function openGiftNamePrompt(giftId) {
    setGiftNamePrompt(giftId);
    setGiftNameInput("");
  }

  async function confirmReserveGift() {
    if (!giftNamePrompt || !giftNameInput.trim() || reservingId || !supabase) return;
    setReservingId(giftNamePrompt);
    const { data: ok, error } = await supabase.rpc("reserve_gift", {
      p_gift_id: giftNamePrompt,
      p_name: giftNameInput.trim(),
    });
    if (!error && ok) {
      window.localStorage.setItem(`gift-reserved-${giftNamePrompt}`, "1");
      setReservedByMe((prev) => ({ ...prev, [giftNamePrompt]: true }));
      loadAll();
    }
    setReservingId(null);
    setGiftNamePrompt(null);
  }

  async function handleUnreserveGift(giftId, name) {
    if (!supabase) return;
    await supabase.rpc("unreserve_gift", { p_gift_id: giftId, p_name: name });
    window.localStorage.removeItem(`gift-reserved-${giftId}`);
    setReservedByMe((prev) => {
      const next = { ...prev };
      delete next[giftId];
      return next;
    });
    loadAll();
  }

  function handlePhotoChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setPhotos((prev) => [...prev, ...files]);
    setPhotoPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  }

  function removePhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
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
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("L'enregistrement vocal n'est pas disponible sur ce navigateur.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Safari (iPhone) ne supporte pas "audio/webm" — on détecte le bon format
      const candidates = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/aac"];
      const supportedType =
        candidates.find((type) => typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(type)) ||
        "";

      const recorder = supportedType ? new MediaRecorder(stream, { mimeType: supportedType }) : new MediaRecorder(stream);
      const actualType = recorder.mimeType || supportedType || "audio/mp4";
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: actualType });
        setAudioBlob(blob);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setRecording(true);
      setRecordSeconds(0);
      recordIntervalRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setError("Impossible d'accéder au micro. Vérifiez les autorisations de votre navigateur.");
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
      setError("Écrivez un petit mot ou enregistrez un message vocal avant d'envoyer.");
      return;
    }
    setError("");
    setSending(true);

    try {
      let photoUrls = [];
      if (photos.length > 0 && supabase) {
        for (const file of photos) {
          try {
            const ext = file.name.split(".").pop() || "jpg";
            const path = `${event.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const { error: uploadError } = await supabase.storage.from("guestbook-photos").upload(path, file);
            if (!uploadError) {
              const { data: pub } = supabase.storage.from("guestbook-photos").getPublicUrl(path);
              if (pub?.publicUrl) photoUrls.push(pub.publicUrl);
            }
          } catch {
            // on ignore l'échec d'une photo et on continue avec les autres
          }
        }
      }

      let videoUrl = null;
      if (video && supabase) {
        try {
          const ext = video.name.split(".").pop() || "mp4";
          const path = `${event.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const { error: uploadError } = await supabase.storage.from("guestbook-media").upload(path, video);
          if (!uploadError) {
            const { data: pub } = supabase.storage.from("guestbook-media").getPublicUrl(path);
            videoUrl = pub?.publicUrl || null;
          }
        } catch {
          // on ignore l'échec de la vidéo, le message texte part quand même
        }
      }

      let audioUrl = null;
      if (audioBlob && supabase) {
        try {
          const audioType = audioBlob.type || "audio/mp4";
          const audioExt = audioType.includes("mp4") ? "m4a" : audioType.includes("aac") ? "aac" : "webm";
          const path = `${event.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${audioExt}`;
          const { error: uploadError } = await supabase.storage
            .from("guestbook-media")
            .upload(path, audioBlob, { contentType: audioType });
          if (!uploadError) {
            const { data: pub } = supabase.storage.from("guestbook-media").getPublicUrl(path);
            audioUrl = pub?.publicUrl || null;
          }
        } catch {
          // on ignore l'échec de l'audio, le message texte part quand même
        }
      }

      const optimisticEntry = {
        id: "temp-" + Date.now(),
        name: name.trim() || "Anonyme",
        message: text.trim().slice(0, 400),
        photo_urls: photoUrls.length > 0 ? photoUrls : photoPreviews,
        video_url: videoUrl || videoPreview,
        audio_url: audioUrl || audioPreviewUrl,
        ink: randomInk(theme.avatarPalette),
        rotation: randomRotation(),
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticEntry]);
      setText("");
      setPhotos([]);
      setPhotoPreviews([]);
      setVideo(null);
      setVideoPreview(null);
      setAudioBlob(null);
      setAudioPreviewUrl(null);
      setRecordSeconds(0);
      setJustSent(true);
      setTimeout(() => setJustSent(false), 2500);

      const { data: insertedMsg, error: insertError } = await supabase
        .from("messages")
        .insert({
          event_id: event.id,
          name: optimisticEntry.name,
          message: optimisticEntry.message,
          photo_url: photoUrls[0] || null,
          photo_urls: photoUrls,
          video_url: videoUrl,
          audio_url: audioUrl,
          ink: optimisticEntry.ink,
          rotation: optimisticEntry.rotation,
        })
        .select()
        .single();

      if (insertError) {
        setError("Le message est affiché ici mais n'a pas pu être sauvegardé : " + insertError.message);
      } else {
        if (insertedMsg?.id && typeof window !== "undefined") {
          window.localStorage.setItem(`msg-owned-${insertedMsg.id}`, "1");
          setOwnedMessageIds((prev) => ({ ...prev, [insertedMsg.id]: true }));
        }
        loadAll();
      }
    } catch (err) {
      setError("Une erreur inattendue est survenue : " + (err?.message || "réessayez."));
    } finally {
      setSending(false);
    }
  }

  function renderGiftList() {
    if (giftItems.length === 0) return null;
    return (
      <div style={styles.giftCard}>
        <p style={styles.giftCardTitle}>🎁 Liste de cadeaux</p>
        <p style={styles.giftCardSub}>Réservez un cadeau pour éviter les doublons.</p>
        <div style={styles.giftList}>
          {giftItems.map((g) => {
            const takenByMe = !!reservedByMe[g.id];
            const taken = !!g.reserved_by;
            return (
              <div key={g.id} style={styles.giftItem}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={styles.giftName}>{g.name}</p>
                  {g.price && <span style={styles.giftPrice}>{g.price}</span>}
                  {g.link && (
                    <a href={g.link} target="_blank" rel="noreferrer" style={styles.giftLink}>
                      Voir le produit ↗
                    </a>
                  )}
                </div>
                {taken ? (
                  takenByMe ? (
                    <button
                      type="button"
                      style={styles.giftUnreserveBtn}
                      onClick={() => handleUnreserveGift(g.id, g.reserved_by)}
                    >
                      Annuler
                    </button>
                  ) : (
                    <span style={styles.giftTakenBadge}>Réservé</span>
                  )
                ) : (
                  <button
                    type="button"
                    style={styles.giftReserveBtn}
                    disabled={reservingId === g.id}
                    onClick={() => openGiftNamePrompt(g.id)}
                  >
                    Réserver
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {giftNamePrompt && (
          <div style={styles.giftPromptOverlay} onClick={() => setGiftNamePrompt(null)}>
            <div style={styles.giftPromptBox} onClick={(e) => e.stopPropagation()}>
              <p style={styles.giftCardTitle}>Votre prénom</p>
              <input
                type="text"
                autoFocus
                value={giftNameInput}
                onChange={(e) => setGiftNameInput(e.target.value)}
                placeholder="Pour identifier votre réservation"
                style={styles.input}
              />
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <button type="button" style={styles.rsvpToggleBtn} onClick={() => setGiftNamePrompt(null)}>
                  Annuler
                </button>
                <button
                  type="button"
                  style={{ ...styles.button, flex: 1 }}
                  disabled={!giftNameInput.trim() || reservingId === giftNamePrompt}
                  onClick={confirmReserveGift}
                >
                  {reservingId === giftNamePrompt ? "…" : "Confirmer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
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

  if (isBeforeEvent) {
    return (
      <div style={styles.page}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; }
          textarea:focus, input:focus, button:focus-visible { outline: 2px solid ${theme.accent}; outline-offset: 2px; }
          ::placeholder { color: ${theme.muted}; }
        `}</style>
        <div style={styles.content}>
          <div style={styles.headerCard}>
            <header style={styles.header}>
              <p style={styles.eyebrow}>{isJournal ? "ENTRE NOUS" : "LE FIL"}</p>
              <h1 style={styles.title}>{event?.event_title}</h1>
              <hr style={styles.titleRule} />
              <p style={styles.sub}>On a hâte de vous voir !</p>
            </header>
          </div>

          {rsvpDone ? (
            <div style={styles.rsvpConfirmedCard}>
              <div style={{ fontSize: "1.6rem", marginBottom: "6px" }}>🎉</div>
              <p style={styles.rsvpConfirmedTitle}>Merci {rsvpName} !</p>
              <p style={styles.rsvpConfirmedSub}>
                {rsvpAttending
                  ? `Votre présence${rsvpGuests > 0 ? ` (+${rsvpGuests} accompagnant${rsvpGuests > 1 ? "s" : ""})` : ""} est bien notée.`
                  : "C'est noté, merci de nous avoir prévenus."}
              </p>
              <button type="button" style={styles.rsvpEditLink} onClick={handleRsvpEdit}>
                Modifier ma réponse
              </button>
            </div>
          ) : (
            <form onSubmit={handleRsvpSubmit} style={styles.rsvpCard}>
              <p style={styles.rsvpCardTitle}>Serez-vous présent·e ?</p>
              <input
                type="text"
                placeholder="Votre prénom"
                value={rsvpName}
                onChange={(e) => setRsvpName(e.target.value)}
                style={styles.input}
              />
              <div style={styles.rsvpToggleRow}>
                <button
                  type="button"
                  onClick={() => setRsvpAttending(true)}
                  style={{
                    ...styles.rsvpToggleBtn,
                    ...(rsvpAttending === true ? styles.rsvpToggleYesActive : {}),
                  }}
                >
                  ✅ Je viens
                </button>
                <button
                  type="button"
                  onClick={() => setRsvpAttending(false)}
                  style={{
                    ...styles.rsvpToggleBtn,
                    ...(rsvpAttending === false ? styles.rsvpToggleNoActive : {}),
                  }}
                >
                  ❌ Je ne peux pas
                </button>
              </div>

              {rsvpAttending === true && (
                <div style={styles.rsvpStepperRow}>
                  <span style={styles.rsvpStepperLabel}>Accompagnants</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button
                      type="button"
                      style={styles.rsvpStepperBtn}
                      onClick={() => setRsvpGuests((g) => Math.max(0, g - 1))}
                    >
                      −
                    </button>
                    <span style={styles.rsvpStepperCount}>{rsvpGuests}</span>
                    <button
                      type="button"
                      style={styles.rsvpStepperBtn}
                      onClick={() => setRsvpGuests((g) => Math.min(10, g + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <textarea
                placeholder="Un mot pour les mariés (optionnel)"
                value={rsvpNote}
                onChange={(e) => setRsvpNote(e.target.value)}
                rows={2}
                style={styles.textarea}
              />

              {rsvpError && <p style={styles.errorText}>{rsvpError}</p>}
              <button type="submit" disabled={rsvpSending} style={styles.button}>
                {rsvpSending ? "Envoi…" : "Confirmer ma présence"}
              </button>
            </form>
          )}

          {renderGiftList()}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Fredoka:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .ld-entry { transition: transform 0.15s ease, background 0.15s ease; animation: ldFadeIn 0.5s ease both; }
        .ld-entry:hover { transform: translateY(-2px); background: ${theme.surface2}; }
        @keyframes ldFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ldBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes funPop { 0% { transform: scale(0.9); opacity: 0; } 60% { transform: scale(1.03); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes funWiggle { 0%, 100% { transform: rotate(-1.5deg); } 50% { transform: rotate(1.5deg); } }
        @keyframes eggShake { 0%, 100% { transform: translateX(0) rotate(0); } 20% { transform: translateX(-6px) rotate(-4deg); } 40% { transform: translateX(6px) rotate(4deg); } 60% { transform: translateX(-5px) rotate(-3deg); } 80% { transform: translateX(5px) rotate(3deg); } }
        @keyframes confettiFall { to { transform: translateY(110vh) rotate(400deg); opacity: 0.3; } }
        .fun-spin-btn:active { transform: scale(0.94); }
        .fun-spin-btn:not(:disabled):hover { transform: translateY(-2px) rotate(-1deg); }
        .fun-card { animation: funPop 0.4s ease both; }
        textarea:focus, input:focus, button:focus-visible { outline: 2px solid ${theme.accent}; outline-offset: 2px; }
        ::placeholder { color: ${theme.muted}; }
      `}</style>

      <div style={styles.content}>
        <div style={styles.headerCard}>
          <header style={styles.header}>
            <p style={styles.eyebrow}>{isJournal ? "ENTRE NOUS" : "LE FIL"}</p>
            <h1 style={styles.title}>{loading ? "…" : event?.event_title}</h1>
            <hr style={styles.titleRule} />
            {isReview && (
              <p style={styles.sub}>Partagez votre avis, ça nous aide à nous améliorer.</p>
            )}
          </header>
        </div>

        {isJournal && (
          <div className="fun-card" style={styles.wheelCard}>
            <p style={styles.wheelTitle}>🎡 La Roue Folle</p>
            <p style={styles.wheelSub}>Ajoute les joueurs présents et lance la roue !</p>

            <form onSubmit={handleAddWheelPlayer} style={styles.wheelInputRow}>
              <input
                type="text"
                placeholder="Prénom du joueur"
                value={wheelPlayerInput}
                onChange={(e) => setWheelPlayerInput(e.target.value)}
                maxLength={20}
                style={{ ...styles.input, flex: 1, borderRadius: "16px" }}
              />
              <button type="submit" style={styles.wheelAddBtn}>+ Ajouter</button>
            </form>

            <div style={styles.wheelPlayersList}>
              {wheelPlayers.map((p, i) => (
                <span key={i} style={styles.wheelChip}>
                  {p}
                  <button type="button" onClick={() => handleRemoveWheelPlayer(i)} style={styles.wheelChipRemove}>✕</button>
                </span>
              ))}
              {wheelPlayers.length === 0 && (
                <p style={{ fontSize: "0.78rem", color: theme.muted, margin: 0 }}>Ajoutez au moins 2 joueurs</p>
              )}
            </div>

            {wheelPlayers.length >= 2 && (
              <div style={styles.wheelStage}>
                <div style={styles.wheelWrap}>
                  <div style={styles.wheelPointer} />
                  <svg
                    viewBox="0 0 200 200"
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                      transform: `rotate(${wheelRotation}deg)`,
                      transition: spinning ? "transform 4.5s cubic-bezier(0.17,0.89,0.32,1.13)" : "none",
                    }}
                  >
                    {renderWheelSlices()}
                  </svg>
                  <div style={styles.wheelHub}>🎉</div>
                </div>
              </div>
            )}

            <button
              type="button"
              className="fun-spin-btn"
              onClick={handleSpinWheel}
              disabled={spinning || wheelPlayers.length < 2}
              style={{ ...styles.wheelSpinBtn, opacity: wheelPlayers.length < 2 ? 0.4 : 1 }}
            >
              {spinning ? "🎡 Ça tourne…" : "🚀 GO, ON LANCE !"}
            </button>

            {wheelResult && !spinning && (
              <div className="fun-card" style={styles.wheelResultBox}>
                <p style={styles.wheelResultLabel}>🎯 La roue a parlé</p>
                <p style={styles.wheelResultName}>{wheelResult.name} !</p>
                <p style={styles.wheelResultText}>{wheelResult.question}</p>
              </div>
            )}
          </div>
        )}

        {isJournal && (
          <div className="fun-card" style={styles.wheelCard}>
            <p style={styles.wheelTitle}>🔤 Petit Bac</p>

            {bacRound && bacRound.status === "playing" ? (
              <>
                <p style={styles.hangmanSetBy}>
                  {bacRound.status === "finished" ? (
                    <>🏁 {bacRound.winner_name} a déjà fini — tu peux quand même valider tes réponses !</>
                  ) : (
                    <>
                      🔴 En cours depuis {bacElapsedSeconds}s · Lettre : <strong style={{ fontSize: "1.2rem" }}>{bacRound.letter}</strong> · Premier·ère qui finit gagne !
                    </>
                  )}
                </p>

                <div style={{ marginBottom: "12px" }}>
                  <p style={{ ...styles.bacResultCategoryTitle, marginBottom: "6px" }}>
                    👥 {bacAnswersAll.length === 0 ? "Personne n'a encore rejoint" : "Ont rejoint la partie"}
                  </p>
                  {bacAnswersAll.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {bacAnswersAll.map((a) => (
                        <span
                          key={a.id}
                          style={{
                            background: "rgba(255,255,255,0.2)",
                            color: "#fff",
                            padding: "5px 12px",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontFamily: "'Fredoka', sans-serif",
                            fontWeight: 600,
                          }}
                        >
                          {a.player_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {!bacJoined ? (
                  <form onSubmit={handleJoinBacRound} style={{ display: "flex", gap: "8px" }}>
                    <input
                      style={{ ...styles.input, flex: 1 }}
                      type="text"
                      placeholder="Ton prénom"
                      value={bacPlayerName}
                      onChange={(e) => setBacPlayerName(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={bacJoining || !bacPlayerName.trim()}
                      style={{ ...styles.button, opacity: !bacPlayerName.trim() ? 0.5 : 1 }}
                    >
                      {bacJoining ? "…" : "Rejoindre"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSubmitBacAnswers} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {bacRound.categories.map((cat) => (
                      <input
                        key={cat}
                        style={styles.input}
                        type="text"
                        placeholder={`${cat} en ${bacRound.letter}...`}
                        value={bacAnswerValues[cat] || ""}
                        onChange={(e) => handleBacAnswerChange(cat, e.target.value)}
                      />
                    ))}
                    <button type="submit" disabled={bacSubmitting} style={styles.button}>
                      {bacSubmitting ? "…" : "Valider mes réponses"}
                    </button>
                    {bacError && (
                      <p style={{ ...styles.hangmanStatus, color: "#FFD9D0", margin: "4px 0 0" }}>{bacError}</p>
                    )}
                  </form>
                )}
              </>
            ) : bacRound && bacRound.status === "finished" && !bacShowSetup ? (
              (() => {
                const { scoresByCategory, totals } = computeBacScores(bacRound, bacAnswersAll);
                const ranking = Object.entries(totals).sort((a, b) => b[1] - a[1]);
                const grandTotals = computeBacCumulativeScores(bacAllRounds, bacAllAnswers);
                const grandRanking = Object.entries(grandTotals).sort((a, b) => b[1] - a[1]);
                const finishedRoundsCount = bacAllRounds.filter((r) => r.status === "finished").length;
                return (
                  <>
                    <p style={styles.hangmanSetBy}>
                      🏁 {bacRound.winner_name} a fini en premier ! Lettre : <strong>{bacRound.letter}</strong>
                    </p>

                    {grandRanking.length > 0 && finishedRoundsCount > 1 && (
                      <div style={{ ...styles.bacResultCategory, marginBottom: "12px", background: "rgba(255,255,255,0.2)" }}>
                        <p style={styles.bacResultCategoryTitle}>
                          🏆 Classement général ({finishedRoundsCount} manche{finishedRoundsCount > 1 ? "s" : ""})
                        </p>
                        {grandRanking.map(([player, pts], i) => (
                          <p key={player} style={styles.bacResultLine}>
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "•"} <strong>{player}</strong> — {pts} pt{pts > 1 ? "s" : ""}
                          </p>
                        ))}
                      </div>
                    )}

                    {ranking.length > 0 && (
                      <div style={{ ...styles.bacResultCategory, marginBottom: "12px" }}>
                        <p style={styles.bacResultCategoryTitle}>Cette manche</p>
                        {ranking.map(([player, pts], i) => (
                          <p key={player} style={styles.bacResultLine}>
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "•"} <strong>{player}</strong> — {pts} pt{pts > 1 ? "s" : ""}
                          </p>
                        ))}
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
                      {bacRound.categories.map((cat) => (
                        <div key={cat} style={styles.bacResultCategory}>
                          <p style={styles.bacResultCategoryTitle}>{cat}</p>
                          {(scoresByCategory[cat] || []).length === 0 && (
                            <p style={styles.bacResultEmpty}>Personne n'a répondu.</p>
                          )}
                          {(scoresByCategory[cat] || []).map((entry, i) => (
                            <p key={i} style={styles.bacResultLine}>
                              <strong>{entry.player}</strong> — {entry.raw || <em>(vide)</em>}{" "}
                              <span style={{ opacity: 0.85 }}>
                                ({entry.points} pt{entry.points !== 1 ? "s" : ""})
                              </span>
                            </p>
                          ))}
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => setBacShowSetup(true)} style={{ ...styles.button, width: "100%" }}>
                      🔄 Nouvelle manche
                    </button>
                  </>
                );
              })()
            ) : (
              <form onSubmit={handleCreateBacRound} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <p style={styles.hangmanSetBy}>Ajoutez vos catégories (ex. Prénom, Animal, Pays…), une lettre sera tirée au sort.</p>
                <div style={styles.formRow}>
                  <input
                    style={{ ...styles.input, flex: 1, marginRight: "8px" }}
                    type="text"
                    placeholder="Une catégorie"
                    value={bacCategoryInput}
                    onChange={(e) => setBacCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addBacCategory();
                      }
                    }}
                  />
                  <button type="button" onClick={addBacCategory} style={styles.button}>
                    Ajouter
                  </button>
                </div>
                {bacSetupCategories.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {bacSetupCategories.map((c, i) => (
                      <span
                        key={i}
                        onClick={() => removeBacCategory(i)}
                        style={{
                          background: theme.surface2,
                          color: theme.ivory,
                          padding: "6px 12px",
                          borderRadius: "999px",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                        }}
                      >
                        {c} ✕
                      </span>
                    ))}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={bacCreating || bacSetupCategories.length < 1}
                  style={{ ...styles.button, opacity: bacSetupCategories.length < 1 ? 0.5 : 1 }}
                >
                  {bacCreating ? "…" : "🚀 Lancer la manche"}
                </button>
                {bacShowSetup && bacRound && (
                  <button type="button" onClick={() => setBacShowSetup(false)} style={styles.rsvpToggleBtn}>
                    Annuler
                  </button>
                )}
              </form>
            )}
          </div>
        )}

        {isJournal && (
          <div className="fun-card" style={styles.wheelCard}>
            <p style={styles.wheelTitle}>🎯 Jeu du pendu</p>

            {hangmanGame && hangmanGame.status === "playing" && !hangmanShowSetup ? (
              <>
                <p style={styles.hangmanSetBy}>Mot défini par {hangmanGame.set_by}</p>
                <div style={styles.hangmanSvgWrap}>
                  <svg width="140" height="140" viewBox="0 0 160 160">
                    <line x1="20" y1="150" x2="100" y2="150" stroke={theme.muted} strokeWidth="4" strokeLinecap="round" />
                    <line x1="40" y1="150" x2="40" y2="20" stroke={theme.muted} strokeWidth="4" strokeLinecap="round" />
                    <line x1="40" y1="20" x2="110" y2="20" stroke={theme.muted} strokeWidth="4" strokeLinecap="round" />
                    <line x1="110" y1="20" x2="110" y2="38" stroke={theme.muted} strokeWidth="4" strokeLinecap="round" />
                    {hangmanGame.wrong_count >= 1 && (
                      <circle cx="110" cy="52" r="14" stroke={theme.accent} strokeWidth="4" fill="none" />
                    )}
                    {hangmanGame.wrong_count >= 2 && (
                      <line x1="110" y1="66" x2="110" y2="105" stroke={theme.accent} strokeWidth="4" strokeLinecap="round" />
                    )}
                    {hangmanGame.wrong_count >= 3 && (
                      <line x1="110" y1="78" x2="92" y2="95" stroke={theme.accent} strokeWidth="4" strokeLinecap="round" />
                    )}
                    {hangmanGame.wrong_count >= 4 && (
                      <line x1="110" y1="78" x2="128" y2="95" stroke={theme.accent} strokeWidth="4" strokeLinecap="round" />
                    )}
                    {hangmanGame.wrong_count >= 5 && (
                      <line x1="110" y1="105" x2="94" y2="132" stroke={theme.accent} strokeWidth="4" strokeLinecap="round" />
                    )}
                    {hangmanGame.wrong_count >= 6 && (
                      <line x1="110" y1="105" x2="126" y2="132" stroke={theme.accent} strokeWidth="4" strokeLinecap="round" />
                    )}
                  </svg>
                </div>

                <div style={styles.hangmanWordRow}>
                  {hangmanGame.word.split("").map((letter, i) =>
                    letter === " " ? (
                      <div key={i} style={{ width: "14px" }} />
                    ) : (
                      <div key={i} style={styles.hangmanLetterSlot}>
                        {hangmanGame.guessed_letters.includes(letter) ? letter : ""}
                      </div>
                    )
                  )}
                </div>

                <p style={styles.hangmanStatus}>
                  {hangmanGame.wrong_count}/{hangmanGame.max_wrong} erreur{hangmanGame.wrong_count > 1 ? "s" : ""} ·{" "}
                  <strong>Tour de {hangmanGame.players?.[hangmanGame.current_turn_index] || "?"}</strong>
                </p>

                <div style={styles.hangmanKeyboard}>
                  {"AZERTYUIOPQSDFGHJKLMWXCVBN".split("").map((letter) => {
                    const isGuessed = hangmanGame.guessed_letters.includes(letter);
                    const isCorrect = isGuessed && hangmanGame.word.includes(letter);
                    return (
                      <button
                        key={letter}
                        type="button"
                        disabled={isGuessed || !!hangmanGuessingLetter}
                        onClick={() => handleGuessHangmanLetter(letter)}
                        style={{
                          ...styles.hangmanKey,
                          background: isGuessed ? (isCorrect ? "#5FCBB8" : "#E2705A") : theme.surface2,
                          opacity: isGuessed ? 0.7 : 1,
                        }}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : hangmanGame && (hangmanGame.status === "won" || hangmanGame.status === "lost") && !hangmanShowSetup ? (
              <>
                <p style={styles.hangmanStatus}>
                  {hangmanGame.status === "won" ? "🎉 Le mot a été trouvé !" : "😅 Perdu !"} Le mot était{" "}
                  <strong>{hangmanGame.word}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => setHangmanShowSetup(true)}
                  style={{ ...styles.button, width: "100%", marginTop: "10px" }}
                >
                  🔄 Lancer un nouveau mot
                </button>
              </>
            ) : (
              <form onSubmit={handleCreateHangman} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <p style={styles.hangmanSetBy}>Choisis un mot secret, et ajoute les joueurs qui vont deviner.</p>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="Ton prénom (qui choisit le mot)"
                  value={hangmanSetterName}
                  onChange={(e) => setHangmanSetterName(e.target.value)}
                />
                <input
                  style={styles.input}
                  type="text"
                  placeholder="Le mot secret"
                  value={hangmanWordInput}
                  onChange={(e) => setHangmanWordInput(e.target.value)}
                />
                <div style={styles.formRow}>
                  <input
                    style={{ ...styles.input, flex: 1, marginRight: "8px" }}
                    type="text"
                    placeholder="Prénom d'un joueur"
                    value={hangmanPlayerInput}
                    onChange={(e) => setHangmanPlayerInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addHangmanPlayer();
                      }
                    }}
                  />
                  <button type="button" onClick={addHangmanPlayer} style={styles.button}>
                    Ajouter
                  </button>
                </div>
                {hangmanSetupPlayers.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {hangmanSetupPlayers.map((p, i) => (
                      <span
                        key={i}
                        onClick={() => removeHangmanPlayer(i)}
                        style={{
                          background: theme.surface2,
                          color: theme.ivory,
                          padding: "6px 12px",
                          borderRadius: "999px",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                        }}
                      >
                        {p} ✕
                      </span>
                    ))}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={hangmanCreating || !hangmanWordInput.trim() || hangmanSetupPlayers.length < 1}
                  style={{
                    ...styles.button,
                    opacity: !hangmanWordInput.trim() || hangmanSetupPlayers.length < 1 ? 0.5 : 1,
                  }}
                >
                  {hangmanCreating ? "…" : "🚀 Lancer la partie"}
                </button>
                {hangmanShowSetup && hangmanGame && (
                  <button
                    type="button"
                    onClick={() => setHangmanShowSetup(false)}
                    style={{ ...styles.rsvpToggleBtn }}
                  >
                    Annuler
                  </button>
                )}
              </form>
            )}
          </div>
        )}

        {isJournal && (
          <div className="fun-card" style={styles.lookCard}>
            <p style={styles.lookTitle}>✨ Look du Jour ✨</p>
            <p style={styles.lookSub}>Poste ta tenue et vote pour tes préférées !</p>

            {leaderLook && (
              <div style={styles.lookLeaderBanner}>
                <span style={{ fontSize: "1.5rem" }}>👑</span>
                <span>
                  <span style={styles.lookLeaderLabel}>Le boss du jour</span>
                  <span style={styles.lookLeaderName}>
                    {leaderLook.name} — {leaderLook.votes || 0} vote{(leaderLook.votes || 0) > 1 ? "s" : ""}
                  </span>
                </span>
              </div>
            )}

            {hasPostedLookToday ? (
              <div style={styles.lookPostedBox}>
                <p style={{ margin: 0, fontSize: "0.85rem", color: theme.accent, fontWeight: 700 }}>
                  ✅ Tu as déjà posté ton look aujourd'hui
                </p>
              </div>
            ) : (
              <form onSubmit={handlePostLook} style={styles.form}>
                <input
                  type="text"
                  placeholder="Ton prénom"
                  value={lookName}
                  onChange={(e) => setLookName(e.target.value)}
                  maxLength={40}
                  style={styles.input}
                />
                {lookPhotoPreview ? (
                  <div style={styles.photoPreviewWrap}>
                    <img src={lookPhotoPreview} alt="Aperçu" style={styles.photoPreview} />
                    <button type="button" onClick={removeLookPhoto} style={styles.removePhotoButton}>
                      ✕ retirer la photo
                    </button>
                  </div>
                ) : (
                  <label style={styles.photoLabel}>
                    📸 Ajouter une photo de ta tenue
                    <input type="file" accept="image/*" onChange={handleLookPhotoChange} style={{ display: "none" }} />
                  </label>
                )}
                <button type="submit" className="fun-spin-btn" disabled={postingLook || !lookPhoto} style={styles.lookPostBtn}>
                  {postingLook ? "Envoi…" : "📸 Je poste ma tenue"}
                </button>
              </form>
            )}

            {todaysLooks.length > 0 && (
              <div style={styles.lookGrid}>
                {todaysLooks.map((l, i) => {
                  const voted = !!votedLookIds[l.id];
                  const owned = !!ownedLookIds[l.id];
                  return (
                    <div key={l.id} style={{ ...styles.lookItem, ...(i === 0 ? styles.lookItemTop : {}) }}>
                      {i === 0 && <span style={styles.lookCrown}>👑</span>}
                      {owned && (
                        <button
                          type="button"
                          onClick={() => handleDeleteLook(l.id)}
                          disabled={deletingLookId === l.id}
                          style={styles.lookDeleteBtn}
                          aria-label="Supprimer ce look"
                        >
                          {deletingLookId === l.id ? "…" : "🗑️"}
                        </button>
                      )}
                      {l.photo_url ? (
                        <img
                          src={l.photo_url}
                          alt={l.name}
                          style={{ ...styles.lookPhoto, cursor: "pointer" }}
                          onClick={() => setLightboxLookPhoto(l.photo_url)}
                        />
                      ) : (
                        <div style={{ ...styles.lookPhoto, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", color: theme.ivory }}>
                          {(l.name || "?")[0].toUpperCase()}
                        </div>
                      )}
                      <div style={styles.lookItemInfo}>
                        <p style={styles.lookItemName}>{l.name}</p>
                        <div style={styles.lookVoteRow}>
                          <span style={{ fontSize: "0.7rem", color: theme.muted }}>
                            {l.votes || 0} vote{(l.votes || 0) > 1 ? "s" : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleVoteLook(l.id)}
                            disabled={voted || votingLookId === l.id}
                            style={{ ...styles.lookVoteBtn, ...(voted ? styles.lookVoteBtnActive : {}) }}
                          >
                            {voted ? "✓" : "🤍"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {lightboxLookPhoto && (
          <div
            onClick={() => setLightboxLookPhoto(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(20,15,10,0.92)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "16px",
            }}
          >
            <button
              onClick={() => setLightboxLookPhoto(null)}
              aria-label="Fermer"
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
            <img
              src={lightboxLookPhoto}
              alt=""
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: "10px" }}
            />
          </div>
        )}

        {pollQuestions.length > 0 && (
          <section style={styles.sectionCard}>
            <div style={styles.sectionHeading}>
              <h2 style={styles.quizSectionTitle}>Petit quiz 🎉</h2>
              <p style={styles.sectionSubtitle}>À vous de jouer !</p>
            </div>

            {pollQuestions.map((q) => {
              const voted = !!votedIds[q.id];
              const total = (q.votes || []).reduce((a, b) => a + b, 0);
              return (
                <div style={styles.pollCard} key={q.id}>
                  <p style={styles.pollQuestion}>{q.question}</p>
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
                    {voted ? " · merci pour votre vote ✓" : ""}
                  </p>
                </div>
              );
            })}
          </section>
        )}

        {event?.event_type === "Baby Shower" && event?.reveal_at && (
          <EggReveal revealAt={event.reveal_at} revealGender={event.reveal_gender || "fille"} theme={theme} />
        )}

        {event?.playlist_enabled && <PlaylistRequest eventId={event.id} theme={theme} />}

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



        {isJournal && eventDates.length > 0 && (
          <div style={{ marginBottom: "22px" }}>
            <div style={styles.dividerRow}>
              <span style={styles.liveDot} />
              <span style={styles.dividerLabel}>À venir</span>
            </div>
            <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "6px" }}>
              {eventDates.map((d) => {
                const dt = new Date(d.event_date + "T00:00:00");
                return (
                  <div
                    key={d.id}
                    style={{
                      flex: "0 0 auto",
                      width: "110px",
                      background: theme.surface2,
                      borderRadius: "12px",
                      padding: "12px",
                      border: `1px solid ${theme.accentSoft}`,
                    }}
                  >
                    <div style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.5rem", color: theme.accent, lineHeight: 1 }}>
                      {dt.getDate()}
                    </div>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", opacity: 0.5, marginBottom: "6px" }}>
                      {dt.toLocaleDateString("fr-FR", { month: "short" })}
                    </div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: theme.ivory, lineHeight: 1.3 }}>{d.title}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isJournal && (
          <div style={{ marginBottom: "22px" }}>
            <button
              type="button"
              onClick={() => setShowNewDateForm((v) => !v)}
              style={{ ...styles.button, background: "transparent", border: `1px solid ${theme.accent}`, color: theme.accent, width: "100%" }}
            >
              + Ajouter une date
            </button>
            {showNewDateForm && (
              <form
                onSubmit={(e) => {
                  handleAddDate(e);
                  setShowNewDateForm(false);
                }}
                style={{ ...styles.form, marginTop: "10px" }}
              >
                <input style={styles.input} type="text" placeholder="ex. Anniv de Léa" value={newDateTitle} onChange={(e) => setNewDateTitle(e.target.value)} />
                <div style={styles.formRow}>
                  <input style={{ ...styles.input, flex: 1, marginRight: "8px" }} type="date" value={newDateValue} onChange={(e) => setNewDateValue(e.target.value)} />
                  <button type="submit" style={styles.button} disabled={addingDate}>
                    {addingDate ? "…" : "Ajouter"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {canAnyoneStartPoll && (
          <div style={{ marginBottom: "22px" }}>
            <button
              type="button"
              onClick={() => setShowNewPollForm((v) => !v)}
              style={{ ...styles.button, background: "transparent", border: `1px solid ${theme.accent}`, color: theme.accent, width: "100%" }}
            >
              + Lancer un sondage
            </button>
            {showNewPollForm && (
              <form onSubmit={handleCreatePoll} style={{ ...styles.form, marginTop: "10px" }}>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="Pose ta question au groupe…"
                  value={newPollQuestion}
                  onChange={(e) => setNewPollQuestion(e.target.value)}
                />
                {newPollOptions.map((opt, i) => (
                  <input
                    key={i}
                    style={styles.input}
                    type="text"
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => updatePollOption(i, e.target.value)}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setNewPollOptions((prev) => [...prev, ""])}
                  style={{ ...styles.button, background: "transparent", border: `1px solid ${theme.accentSoft}`, color: theme.muted, fontSize: "0.75rem" }}
                >
                  + option
                </button>
                <button type="submit" style={styles.button} disabled={addingPoll}>
                  {addingPoll ? "…" : "Publier le sondage"}
                </button>
              </form>
            )}
          </div>
        )}

        <section style={styles.sectionCard}>
          <div style={styles.sectionHeading}>
            <h2 style={styles.memorySectionTitle}>Laissez un mot, un souvenir 💌</h2>
          </div>

          <form onSubmit={handleSubmit} style={{ ...styles.form, marginBottom: 0 }}>
          <input
            type="text"
            placeholder="Votre prénom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            style={styles.input}
          />
          <textarea
            placeholder="Votre message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={400}
            rows={3}
            style={styles.textarea}
          />

          {photoPreviews.length > 0 && (
            <div style={styles.multiPhotoGrid}>
              {photoPreviews.map((src, i) => (
                <div key={i} style={styles.multiPhotoThumbWrap}>
                  <img src={src} alt="Aperçu" style={styles.multiPhotoThumb} />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    style={styles.multiPhotoRemove}
                    aria-label="Retirer cette photo"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <label style={styles.photoLabel}>
            📷 {photoPreviews.length > 0 ? "Ajouter d'autres photos" : "Ajouter une ou plusieurs photos (optionnel)"}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              style={{ display: "none" }}
            />
          </label>

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
              {sending ? "Envoi…" : isReview ? "Envoyer" : "Publier"}
            </button>
          </div>
            {error && <p style={styles.errorText}>{error}</p>}
            {justSent && <p style={styles.successText}>Merci, votre message a été publié ✓</p>}
          </form>
        </section>

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
                {(() => {
                  const photos = m.photo_urls?.length > 0 ? m.photo_urls : m.photo_url ? [m.photo_url] : [];
                  if (photos.length === 0) return null;
                  if (photos.length === 1) {
                    return <img src={photos[0]} alt="" style={styles.entryPhoto} />;
                  }
                  return (
                    <div style={styles.entryPhotoGrid}>
                      {photos.map((url, i) => (
                        <img key={i} src={url} alt="" style={styles.entryPhotoGridItem} />
                      ))}
                    </div>
                  );
                })()}
                {m.video_url && (
                  <video src={m.video_url} controls style={styles.entryPhoto} />
                )}
                <p style={styles.entryText}>{m.message}</p>
                {m.audio_url && (
                  <audio src={m.audio_url} controls style={styles.entryAudio} />
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
                  {isJournal ? (
                    <button
                      onClick={() => handleLikeMessage(m.id)}
                      disabled={!!likedIds[m.id]}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: likedIds[m.id] ? "default" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontFamily: "Inter, sans-serif",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: likedIds[m.id] ? theme.accent : theme.muted,
                        padding: 0,
                      }}
                    >
                      <span style={{ fontSize: "1.1rem" }}>{likedIds[m.id] ? "♥" : "♡"}</span>
                      {m.likes_count || 0}
                    </button>
                  ) : (
                    <span />
                  )}
                  {ownedMessageIds[m.id] && (
                    <button
                      onClick={() => handleDeleteMessage(m.id)}
                      disabled={deletingMessageId === m.id}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "Inter, sans-serif",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#D98C7F",
                        padding: 0,
                      }}
                    >
                      {deletingMessageId === m.id ? "…" : "🗑️ Supprimer"}
                    </button>
                  )}
                </div>
              </article>
            ))}
        </div>
      </div>
    </div>
  );
}

function getStyles(t, isFun) {
  const headFont = isFun ? "'Fredoka', sans-serif" : "'Instrument Serif', serif";
  const headWeight = isFun ? 700 : 400;
  const headStyle = isFun ? "normal" : "italic";
  return {
    page: { minHeight: "100vh", background: t.ink, display: "flex", justifyContent: "center", padding: "40px 14px", fontFamily: "Inter, system-ui, sans-serif" },
    content: { width: "100%", maxWidth: "560px", background: t.cardGradient || t.surface2, border: `1px solid ${t.borderColor || "rgba(255,255,255,0.06)"}`, borderRadius: isFun ? "28px" : "20px", padding: "32px 26px", boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6)" },
    headerCard: { background: "none", padding: 0, boxShadow: "none" },
    header: { borderBottom: `1px solid ${t.accentSoft}`, paddingBottom: "26px", marginBottom: "28px", textAlign: "center" },
    eyebrow: { fontSize: "0.7rem", letterSpacing: "0.18em", color: t.accent, margin: "0 0 10px 0", fontWeight: 700, textTransform: "uppercase" },
    title: {
      fontFamily: headFont,
      fontStyle: headStyle,
      fontWeight: isFun ? 700 : 400,
      fontSize: "2.6rem",
      color: t.ivory,
      margin: "0 auto",
      lineHeight: 1.15,
      width: "100%",
      maxWidth: "440px",
      textAlign: "center",
      overflowWrap: "break-word",
    },
    titleRule: { width: "56px", height: "2px", background: t.accent, margin: "18px auto 0", border: "none" },
    sub: {
      fontSize: "0.85rem",
      color: t.muted,
      margin: "10px auto 0",
      lineHeight: 1.4,
      width: "100%",
      maxWidth: "420px",
      textAlign: "center",
    },
    form: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" },
    sectionCard: {
      width: "calc(100% + 18px)",
      marginLeft: "-9px",
      marginRight: "-9px",
      background: `linear-gradient(180deg, ${t.surface2} 0%, ${t.surface} 100%)`,
      border: `1px solid ${t.borderColor || t.accent}`,
      borderRadius: isFun ? "26px" : "20px",
      padding: "28px 30px",
      marginBottom: "26px",
      boxShadow: "0 12px 28px rgba(60,42,20,0.08)",
    },
    sectionHeading: {
      textAlign: "center",
      marginBottom: "24px",
    },
    quizSectionTitle: {
      fontFamily: headFont,
      fontStyle: headStyle,
      fontWeight: isFun ? 700 : 400,
      fontSize: "1.8rem",
      lineHeight: 1.15,
      color: t.ivory,
      margin: 0,
    },
    memorySectionTitle: {
      fontFamily: headFont,
      fontStyle: headStyle,
      fontWeight: isFun ? 700 : 500,
      fontSize: "2.75rem",
      lineHeight: 1.02,
      color: t.ivory,
      margin: 0,
      letterSpacing: "-0.025em",
      textAlign: "center",
    },
    sectionSubtitle: {
      fontFamily: headFont,
      fontStyle: headStyle,
      fontWeight: isFun ? 600 : 400,
      fontSize: "1.15rem",
      color: t.accent,
      margin: "6px 0 0",
    },
    input: { fontFamily: "Inter, sans-serif", fontSize: "0.9rem", padding: "12px 14px", border: `1px solid ${t.borderColor || t.muted}`, borderRadius: isFun ? "18px" : "12px", background: t.surface, color: t.ivory },
    textarea: { fontFamily: "Inter, sans-serif", fontSize: "0.9rem", padding: "12px 14px", border: `1px solid ${t.borderColor || t.muted}`, borderRadius: isFun ? "18px" : "12px", background: t.surface, color: t.ivory, resize: "vertical" },
    photoLabel: { fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: t.muted, border: `1.5px dashed ${t.accentSoft}`, borderRadius: isFun ? "18px" : "12px", padding: "12px 14px", textAlign: "center", cursor: "pointer", background: "transparent" },
    photoPreviewWrap: { position: "relative", display: "flex", flexDirection: "column", gap: "6px" },
    photoPreview: { width: "100%", maxHeight: "220px", objectFit: "cover", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" },
    removePhotoButton: { alignSelf: "flex-start", fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "#D98C7F", background: "none", border: "none", padding: 0, cursor: "pointer" },
    multiPhotoGrid: { display: "flex", flexWrap: "wrap", gap: "8px" },
    multiPhotoThumbWrap: { position: "relative", width: "72px", height: "72px" },
    multiPhotoThumb: { width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px", border: `1px solid ${t.muted}` },
    multiPhotoRemove: { position: "absolute", top: "-6px", right: "-6px", width: "20px", height: "20px", borderRadius: "50%", border: "none", background: "#D98C7F", color: "#fff", fontSize: "0.62rem", cursor: "pointer", lineHeight: 1 },
    entryPhotoGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px", marginBottom: "10px" },
    entryPhotoGridItem: { width: "100%", height: "120px", objectFit: "cover", borderRadius: "8px" },
    formRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    counter: { fontSize: "0.7rem", color: t.muted },
    button: isFun
      ? { fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "0.9rem", padding: "13px 22px", background: t.accent, color: "#fff", border: "none", borderRadius: "999px", boxShadow: "0 5px 0 rgba(0,0,0,0.2)", cursor: "pointer" }
      : { fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.85rem", padding: "11px 20px", background: t.accent, color: t.accentText, border: "none", borderRadius: "12px" },
    errorText: { color: "#D98C7F", fontSize: "0.8rem", margin: 0 },
    successText: { color: "#6FAE7F", fontSize: "0.8rem", margin: 0 },
    pollCard: {
      background: t.surface,
      border: `1px solid ${t.accentSoft}`,
      borderRadius: isFun ? "18px" : "14px",
      padding: "22px",
      marginBottom: "14px",
      overflow: "hidden",
    },
    pollQuestion: {
      fontFamily: headFont,
      fontStyle: headStyle,
      fontWeight: isFun ? 700 : 400,
      fontSize: "1.3rem",
      color: t.ivory,
      margin: "0 0 14px 0",
    },
    pollOptions: { display: "flex", flexDirection: "column", gap: "9px" },
    pollOption: {
      position: "relative",
      overflow: "hidden",
      width: "100%",
      minHeight: "56px",
      border: `1.5px solid ${t.borderColor || t.accent}`,
      borderRadius: "12px",
      background: "#FFFFFF",
      padding: "0",
      cursor: "pointer",
      textAlign: "left",
      color: t.accentText,
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
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
      alignItems: "center",
      justifyContent: "space-between",
      gap: "14px",
      width: "100%",
      padding: "16px 20px",
      lineHeight: 1.35,
    },
    pollNote: { fontSize: "0.75rem", color: t.muted, textAlign: "center", margin: "10px 0 0 0" },
    wheelCard: {
      background: "linear-gradient(150deg, #FF6B6B 0%, #A78BFA 55%, #4ECDC4 100%)",
      border: "none",
      borderRadius: "26px",
      padding: "20px",
      marginBottom: "22px",
      boxShadow: "0 14px 30px -12px rgba(167,139,250,0.5)",
    },
    wheelTitle: { fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#fff", margin: "0 0 4px", textShadow: "0 2px 0 rgba(0,0,0,0.12)" },
    hangmanSetBy: { fontFamily: "'Fredoka', sans-serif", fontSize: "0.82rem", color: "rgba(255,255,255,0.92)", margin: "0 0 12px", fontWeight: 500 },
    hangmanSvgWrap: { display: "flex", justifyContent: "center", marginBottom: "10px" },
    hangmanWordRow: { display: "flex", justifyContent: "center", gap: "6px", flexWrap: "wrap", marginBottom: "12px" },
    hangmanLetterSlot: {
      width: "26px",
      height: "34px",
      borderBottom: "3px solid #fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.2rem",
      fontWeight: 700,
      color: "#fff",
      fontFamily: "'Fredoka', sans-serif",
    },
    hangmanStatus: {
      textAlign: "center",
      fontFamily: "'Fredoka', sans-serif",
      fontSize: "0.85rem",
      color: "#fff",
      fontWeight: 600,
      margin: "0 0 14px",
    },
    hangmanKeyboard: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" },
    hangmanKey: {
      border: "none",
      color: "#fff",
      fontFamily: "'Fredoka', sans-serif",
      fontWeight: 700,
      fontSize: "0.85rem",
      padding: "9px 0",
      borderRadius: "8px",
    },
    bacResultCategory: { background: "rgba(255,255,255,0.12)", borderRadius: "12px", padding: "10px 12px" },
    bacResultCategoryTitle: { fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#fff", margin: "0 0 6px" },
    bacResultLine: { fontFamily: "'Fredoka', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.92)", margin: "2px 0" },
    bacResultEmpty: { fontFamily: "'Fredoka', sans-serif", fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", margin: 0, fontStyle: "italic" },
    wheelSub: { fontFamily: "'Fredoka', sans-serif", fontSize: "0.82rem", color: "rgba(255,255,255,0.92)", margin: "0 0 14px", fontWeight: 500 },
    wheelInputRow: { display: "flex", gap: "8px", marginBottom: "10px" },
    wheelAddBtn: { fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "0.85rem", padding: "0 18px", background: "#241a15", color: "#FFD93D", border: "none", borderRadius: "16px" },
    wheelPlayersList: { display: "flex", flexWrap: "wrap", gap: "8px" },
    wheelChip: { display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.94)", border: "none", borderRadius: "999px", padding: "7px 7px 7px 14px", fontSize: "0.8rem", fontWeight: 700, fontFamily: "'Fredoka', sans-serif", color: "#5B4636" },
    wheelChipRemove: { background: "none", border: "none", color: "#B85A3A", opacity: 0.7, fontSize: "0.85rem", cursor: "pointer", padding: "2px 4px" },
    wheelStage: { display: "flex", justifyContent: "center", padding: "14px 0 4px" },
    wheelWrap: { position: "relative", width: "220px", height: "220px" },
    wheelPointer: {
      position: "absolute",
      top: "-8px",
      left: "50%",
      transform: "translateX(-50%)",
      width: 0,
      height: 0,
      borderLeft: "11px solid transparent",
      borderRight: "11px solid transparent",
      borderTop: "18px solid #FFD93D",
      zIndex: 3,
      filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))",
    },
    wheelHub: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%,-50%)",
      width: "46px",
      height: "46px",
      borderRadius: "50%",
      background: "#fff",
      border: "3px solid #FFD93D",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      zIndex: 2,
      boxShadow: "0 3px 8px rgba(0,0,0,0.3)",
    },
    wheelSpinBtn: {
      width: "100%",
      marginTop: "12px",
      fontFamily: "'Fredoka', sans-serif",
      fontWeight: 700,
      fontSize: "1rem",
      padding: "15px 20px",
      background: "#FFD93D",
      color: "#241a15",
      border: "none",
      borderRadius: "999px",
      cursor: "pointer",
      boxShadow: "0 6px 0 #C9A22E, 0 10px 18px -6px rgba(0,0,0,0.35)",
      transition: "transform 0.12s ease",
      letterSpacing: "0.02em",
    },
    wheelResultBox: { marginTop: "14px", textAlign: "center", background: "rgba(255,255,255,0.96)", border: "none", borderRadius: "18px", padding: "18px" },
    wheelResultLabel: { fontFamily: "'Fredoka', sans-serif", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#B85A3A", margin: "0 0 6px", fontWeight: 700 },
    wheelResultName: { fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#5B4636", margin: "0 0 6px" },
    wheelResultText: { fontSize: "0.88rem", color: "#5B4636", margin: 0, lineHeight: 1.4, fontWeight: 500 },
    lookCard: {
      background: "linear-gradient(150deg, #FF9F45 0%, #FF6FB5 55%, #A78BFA 100%)",
      border: "none",
      borderRadius: "26px",
      padding: "20px",
      marginBottom: "22px",
      boxShadow: "0 14px 30px -12px rgba(255,111,181,0.5)",
    },
    lookTitle: { fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#fff", margin: "0 0 4px", textShadow: "0 2px 0 rgba(0,0,0,0.12)" },
    lookSub: { fontFamily: "'Fredoka', sans-serif", fontSize: "0.82rem", color: "rgba(255,255,255,0.92)", margin: "0 0 14px", fontWeight: 500 },
    lookLeaderBanner: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      background: "rgba(255,255,255,0.94)",
      border: "none",
      borderRadius: "16px",
      padding: "10px 14px",
      marginBottom: "14px",
    },
    lookLeaderLabel: { display: "block", fontFamily: "'Fredoka', sans-serif", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#B85A3A", fontWeight: 700 },
    lookLeaderName: { display: "block", fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#5B4636", marginTop: "2px" },
    lookPostedBox: { background: "rgba(255,255,255,0.94)", border: "none", borderRadius: "16px", padding: "14px", textAlign: "center", marginBottom: "14px" },
    lookPostBtn: {
      fontFamily: "'Fredoka', sans-serif",
      fontWeight: 700,
      fontSize: "0.95rem",
      padding: "14px 20px",
      background: "#241a15",
      color: "#FFD93D",
      border: "none",
      borderRadius: "999px",
      cursor: "pointer",
      boxShadow: "0 5px 0 #000, 0 9px 16px -6px rgba(0,0,0,0.35)",
      transition: "transform 0.12s ease",
    },
    lookGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "14px" },
    lookItem: { background: "rgba(255,255,255,0.94)", border: "none", borderRadius: "18px", overflow: "hidden", position: "relative" },
    lookItemTop: { boxShadow: "0 0 0 3px #FFD93D" },
    lookCrown: { position: "absolute", top: "6px", left: "6px", background: "#FFD93D", color: "#241a15", fontSize: "0.68rem", fontWeight: 700, fontFamily: "'Fredoka', sans-serif", borderRadius: "999px", padding: "3px 9px", zIndex: 2 },
    lookDeleteBtn: {
      position: "absolute",
      top: "6px",
      right: "6px",
      background: "rgba(0,0,0,0.5)",
      color: "#fff",
      border: "none",
      borderRadius: "50%",
      width: "26px",
      height: "26px",
      fontSize: "0.75rem",
      cursor: "pointer",
      zIndex: 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    lookPhoto: { width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block", background: "#f0e9df" },
    lookItemInfo: { padding: "8px 10px 10px" },
    lookItemName: { fontFamily: "'Fredoka', sans-serif", fontSize: "0.8rem", fontWeight: 700, color: "#5B4636", margin: "0 0 4px" },
    lookVoteRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
    lookVoteBtn: {
      background: "rgba(0,0,0,0.05)",
      border: "none",
      borderRadius: "999px",
      padding: "4px 9px",
      fontSize: "0.8rem",
      cursor: "pointer",
      color: "#5B4636",
    },
    lookVoteBtnActive: { background: "#FF6FB5", color: "#fff" },
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
    giftCard: {
      background: t.surface2,
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: isFun ? "22px" : "16px",
      padding: "18px",
      marginBottom: "22px",
    },
    giftCardTitle: { fontFamily: headFont, fontStyle: headStyle, fontWeight: isFun ? 700 : 400, fontSize: "1.1rem", color: t.ivory, margin: "0 0 4px" },
    giftCardSub: { fontSize: "0.76rem", color: t.muted, margin: "0 0 14px" },
    giftList: { display: "flex", flexDirection: "column", gap: "10px" },
    giftItem: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      background: t.surface,
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "12px",
      padding: "12px 14px",
    },
    giftName: { fontSize: "0.85rem", fontWeight: 600, color: t.ivory, margin: "0 0 2px" },
    giftPrice: { fontSize: "0.72rem", color: t.accent, fontWeight: 700, marginRight: "8px" },
    giftLink: { fontSize: "0.72rem", color: t.muted, textDecoration: "underline" },
    giftReserveBtn: {
      flex: "none",
      background: t.accent,
      color: t.accentText,
      border: "none",
      borderRadius: "10px",
      padding: "9px 14px",
      fontWeight: 700,
      fontSize: "0.75rem",
      fontFamily: "Inter, sans-serif",
    },
    giftUnreserveBtn: {
      flex: "none",
      background: "none",
      color: "#D98C7F",
      border: "1px solid rgba(217,140,127,0.4)",
      borderRadius: "10px",
      padding: "8px 12px",
      fontWeight: 600,
      fontSize: "0.72rem",
      fontFamily: "Inter, sans-serif",
    },
    giftTakenBadge: { flex: "none", fontSize: "0.72rem", color: "#6FAE7F", fontWeight: 700 },
    giftPromptOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      zIndex: 30,
    },
    giftPromptBox: {
      width: "100%",
      maxWidth: "320px",
      background: t.surface,
      borderRadius: "16px",
      padding: "18px",
      border: "1px solid rgba(255,255,255,0.08)",
    },
    divider: { textAlign: "center", margin: "10px 0 20px 0", borderTop: "1px solid rgba(255,255,255,0.08)", position: "relative" },
    dividerText: { fontSize: "0.7rem", letterSpacing: "0.1em", color: t.accent, background: t.surface, padding: "0 12px", position: "relative", top: "-9px" },
    dividerRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", margin: "10px 0 18px 0" },
    liveDot: { width: "7px", height: "7px", borderRadius: "50%", background: "#6FAE7F", flex: "none", animation: "ldBlink 1.6s infinite" },
    dividerLabel: { fontSize: "0.78rem", fontWeight: 700, color: t.ivory, fontFamily: headFont, fontStyle: headStyle },
    dividerCount: { fontSize: "0.72rem", color: t.muted },
    entries: { display: "flex", flexDirection: "column", gap: "12px" },
    empty: { textAlign: "center", color: t.muted, fontFamily: headFont, fontStyle: headStyle, fontSize: "1.2rem", padding: "20px 0" },
    entry: { background: t.surface, border: `1px solid ${t.borderColor || t.muted}`, borderRadius: isFun ? "20px" : "14px", padding: "14px 16px", boxShadow: "0 12px 24px -12px rgba(0,0,0,0.2)" },
    entryHead: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" },
    entryAvatar: { width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, color: t.ivory, flex: "none" },
    entryName: { fontSize: "0.85rem", fontWeight: 700, color: t.accent, flex: 1 },
    entryDate: { fontSize: "0.68rem", color: t.muted },
    entryPhoto: { width: "100%", maxHeight: "260px", objectFit: "cover", borderRadius: "10px", marginBottom: "10px" },
    entryAudio: { width: "100%", marginTop: "8px", height: "36px" },
    entryText: { fontSize: "0.88rem", lineHeight: 1.5, color: t.ivory, margin: 0, opacity: 0.9 },
    rsvpCard: {
      background: t.surface,
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "16px",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
    rsvpCardTitle: {
      fontFamily: "'Instrument Serif', serif",
      fontStyle: "italic",
      fontSize: "1.2rem",
      color: t.ivory,
      margin: "0 0 4px",
    },
    rsvpToggleRow: { display: "flex", gap: "10px" },
    rsvpToggleBtn: {
      flex: 1,
      padding: "13px 0",
      borderRadius: "12px",
      border: "1.5px solid rgba(255,255,255,0.1)",
      background: t.surface2,
      color: t.ivory,
      fontWeight: 700,
      fontSize: "0.85rem",
      fontFamily: "Inter, sans-serif",
    },
    rsvpToggleYesActive: { background: "rgba(111,174,127,0.18)", borderColor: "#6FAE7F", color: "#6FAE7F" },
    rsvpToggleNoActive: { background: "rgba(217,140,127,0.15)", borderColor: "#D98C7F", color: "#D98C7F" },
    rsvpStepperRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    rsvpStepperLabel: { fontSize: "0.82rem", color: t.muted, fontWeight: 600 },
    rsvpStepperBtn: {
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      background: t.surface2,
      border: "1px solid rgba(255,255,255,0.1)",
      color: t.accent,
      fontSize: "1.1rem",
      fontWeight: 700,
      fontFamily: "Inter, sans-serif",
    },
    rsvpStepperCount: { fontSize: "1rem", fontWeight: 700, color: t.ivory, minWidth: "18px", textAlign: "center" },
    rsvpConfirmedCard: {
      background: "rgba(111,174,127,0.1)",
      border: "1px solid rgba(111,174,127,0.35)",
      borderRadius: "16px",
      padding: "22px",
      textAlign: "center",
    },
    rsvpConfirmedTitle: { fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.2rem", color: t.ivory, margin: "0 0 4px" },
    rsvpConfirmedSub: { fontSize: "0.82rem", color: t.muted, margin: "0 0 14px" },
    rsvpEditLink: { fontSize: "0.78rem", color: t.accent, textDecoration: "underline", background: "none", border: "none", fontFamily: "Inter, sans-serif" },
  };
}
