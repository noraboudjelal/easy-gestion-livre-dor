"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

const THEMES = {
  "Mariage": {
    ink: "#F7F1E4",
    surface: "#FFFFFF",
    surface2: "#F3E9D0",
    accent: "#C9A24B",
    accentSoft: "rgba(201,162,75,0.18)",
    accentText: "#2A1F0A",
    ivory: "#241F14",
    muted: "#9B8F72",
    avatarPalette: ["#C9A24B", "#8797C4", "#B79C6B", "#D9C08A"],
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
    ink: "#332A22", surface: "#3D3226", surface2: "#4A3C2C",
    accent: "#E07856", accentSoft: "rgba(224,120,86,0.3)", accentText: "#2A1A10",
    ivory: "#FBF3EA", muted: "#C9B49C",
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
  const [giftItems, setGiftItems] = useState([]);
  const [reservedByMe, setReservedByMe] = useState({});
  const [reservingId, setReservingId] = useState(null);
  const [giftNamePrompt, setGiftNamePrompt] = useState(null);
  const [giftNameInput, setGiftNameInput] = useState("");

  // --- Notre Journal ---
  const [wallRefs, setWallRefs] = useState([]);
  const [eventDates, setEventDates] = useState([]);
  const [likedIds, setLikedIds] = useState({});
  const [newRefText, setNewRefText] = useState("");
  const [newRefAuthor, setNewRefAuthor] = useState("");
  const [addingRef, setAddingRef] = useState(false);
  const [newDateTitle, setNewDateTitle] = useState("");
  const [newDateValue, setNewDateValue] = useState("");
  const [addingDate, setAddingDate] = useState(false);
  const [showNewPollForm, setShowNewPollForm] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState("");
  const [newPollOptions, setNewPollOptions] = useState(["", ""]);
  const [addingPoll, setAddingPoll] = useState(false);

  // --- La Roue ---
  const [wheelPlayerInput, setWheelPlayerInput] = useState("");
  const [wheelPlayers, setWheelPlayers] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [wheelDisplay, setWheelDisplay] = useState(null);
  const [wheelResult, setWheelResult] = useState(null);
  const wheelIntervalRef = useRef(null);

  const theme = THEMES[event?.event_type] || THEMES.Autre;
  const isReview = event?.event_type === "Vos avis";
  const isJournal = event?.event_type === "Notre Journal";
  const canAnyoneStartPoll = isJournal && event?.polls_open_to_all;
  const isBeforeEvent = (() => {
    if (!event?.event_date) return false;
    const eventDay = new Date(event.event_date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDay.getTime() > today.getTime();
  })();

  const [rsvpName, setRsvpName] = useState("");
  const [rsvpAttending, setRsvpAttending] = useState(null);
  const [rsvpGuests, setRsvpGuests] = useState(0);
  const [rsvpNote, setRsvpNote] = useState("");
  const [rsvpSending, setRsvpSending] = useState(false);
  const [rsvpDone, setRsvpDone] = useState(false);
  const [rsvpError, setRsvpError] = useState("");
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
    if (typeof window !== "undefined") {
      setLikedIds((prev) => {
        const next = { ...prev };
        (msgs || []).forEach((m) => {
          if (window.localStorage.getItem(`msg-liked-${m.id}`) === "1") next[m.id] = true;
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
    return () => clearInterval(wheelIntervalRef.current);
  }, []);

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
    let ticks = 0;
    const maxTicks = 18;
    wheelIntervalRef.current = setInterval(() => {
      const randomQuestion = event.wheel_pool[Math.floor(Math.random() * event.wheel_pool.length)];
      setWheelDisplay(randomQuestion);
      ticks += 1;
      if (ticks >= maxTicks) {
        clearInterval(wheelIntervalRef.current);
        const finalQuestion = event.wheel_pool[Math.floor(Math.random() * event.wheel_pool.length)];
        setWheelDisplay(finalQuestion);
        const result = { question: finalQuestion, timestamp: new Date().toISOString() };
        setWheelResult(result);
        setSpinning(false);
        if (supabase) {
          supabase.from("events").update({ wheel_last_result: result }).eq("id", event.id);
        }
      }
    }, 90);
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
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("L'enregistrement vocal n'est pas disponible sur ce navigateur.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
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
      const path = `${event.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("guestbook-media")
        .upload(path, audioBlob);
      if (!uploadError) {
        const { data: pub } = supabase.storage.from("guestbook-media").getPublicUrl(path);
        audioUrl = pub?.publicUrl || null;
      }
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
          <header style={styles.header}>
            <p style={styles.eyebrow}>LE FIL</p>
            <h1 style={styles.title}>{event?.event_title}</h1>
            <p style={styles.sub}>On a hâte de vous voir !</p>
          </header>

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
            {isReview
              ? "Partagez votre avis, ça nous aide à nous améliorer."
              : "Laissez un petit mot qui restera gravé dans nos souvenirs."}
          </p>
        </header>

        <form onSubmit={handleSubmit} style={styles.form}>
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
              {sending ? "Envoi…" : isReview ? "Envoyer" : "Publier"}
            </button>
          </div>
          {error && <p style={styles.errorText}>{error}</p>}
          {justSent && <p style={styles.successText}>Merci, votre message a été publié ✓</p>}
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
                {voted ? " · merci pour votre vote ✓" : ""}
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

        {renderGiftList()}

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
          <form onSubmit={handleAddDate} style={{ ...styles.form, marginBottom: "22px" }}>
            <div style={styles.dividerRow}>
              <span style={styles.dividerLabel}>Ajouter une date</span>
            </div>
            <input style={styles.input} type="text" placeholder="ex. Anniv de Léa" value={newDateTitle} onChange={(e) => setNewDateTitle(e.target.value)} />
            <div style={styles.formRow}>
              <input style={{ ...styles.input, flex: 1, marginRight: "8px" }} type="date" value={newDateValue} onChange={(e) => setNewDateValue(e.target.value)} />
              <button type="submit" style={styles.button} disabled={addingDate}>
                {addingDate ? "…" : "Ajouter"}
              </button>
            </div>
          </form>
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

        {isJournal && (
          <div style={styles.wheelCard}>
            <p style={styles.wheelTitle}>🎡 La Roue</p>
            <p style={styles.wheelSub}>Ajoutez les joueurs présents, puis lancez la roue</p>

            <form onSubmit={handleAddWheelPlayer} style={styles.wheelInputRow}>
              <input
                type="text"
                placeholder="Prénom du joueur"
                value={wheelPlayerInput}
                onChange={(e) => setWheelPlayerInput(e.target.value)}
                maxLength={20}
                style={{ ...styles.input, flex: 1 }}
              />
              <button type="submit" style={styles.wheelAddBtn}>Ajouter</button>
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

            <button
              type="button"
              onClick={handleSpinWheel}
              disabled={spinning || wheelPlayers.length < 2}
              style={{ ...styles.button, width: "100%", marginTop: "12px", opacity: wheelPlayers.length < 2 ? 0.4 : 1 }}
            >
              {spinning ? "La roue tourne…" : "🎲 Lancer la roue"}
            </button>

            {(spinning || wheelResult) && (
              <div style={styles.wheelResultBox}>
                <p style={styles.wheelResultLabel}>{spinning ? "…" : "La roue a désigné"}</p>
                <p style={styles.wheelResultText}>{spinning ? wheelDisplay : wheelResult?.question}</p>
              </div>
            )}
          </div>
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
                {isJournal && (
                  <button
                    onClick={() => handleLikeMessage(m.id)}
                    disabled={!!likedIds[m.id]}
                    style={{
                      marginTop: "8px",
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
                    }}
                  >
                    <span style={{ fontSize: "1.1rem" }}>{likedIds[m.id] ? "♥" : "♡"}</span>
                    {m.likes_count || 0}
                  </button>
                )}
              </article>
            ))}
        </div>

        {isJournal && (
          <div style={{ marginTop: "26px" }}>
            <div style={styles.dividerRow}>
              <span style={styles.liveDot} />
              <span style={styles.dividerLabel}>Nos refs</span>
            </div>
            <form onSubmit={handleAddRef} style={{ ...styles.form, marginBottom: "14px" }}>
              <input
                style={styles.input}
                type="text"
                placeholder="Une private joke à ajouter au mur…"
                value={newRefText}
                onChange={(e) => setNewRefText(e.target.value)}
              />
              <div style={styles.formRow}>
                <input
                  style={{ ...styles.input, flex: 1, marginRight: "8px" }}
                  type="text"
                  placeholder="Ton prénom (optionnel)"
                  value={newRefAuthor}
                  onChange={(e) => setNewRefAuthor(e.target.value)}
                />
                <button type="submit" style={styles.button} disabled={addingRef}>
                  {addingRef ? "…" : "Ajouter"}
                </button>
              </div>
            </form>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {wallRefs.map((r) => (
                <div
                  key={r.id}
                  style={{
                    flex: "1 1 130px",
                    background: theme.surface2,
                    border: `1px solid ${theme.accentSoft}`,
                    borderRadius: "10px",
                    padding: "12px 14px",
                    fontFamily: "'Instrument Serif', serif",
                    fontStyle: "italic",
                    fontSize: "1.05rem",
                    color: theme.ivory,
                    lineHeight: 1.3,
                  }}
                >
                  {r.text}
                  {r.author_name && (
                    <div style={{ fontFamily: "Inter, sans-serif", fontStyle: "normal", fontSize: "0.65rem", fontWeight: 700, opacity: 0.5, marginTop: "6px", textTransform: "uppercase" }}>
                      ajouté par {r.author_name}
                    </div>
                  )}
                </div>
              ))}
              {wallRefs.length === 0 && <p style={{ fontSize: "0.8rem", color: theme.muted }}>Rien pour l'instant — à vous d'écrire la première !</p>}
            </div>
          </div>
        )}
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
    wheelCard: { background: t.surface2, border: `1px dashed ${t.accentSoft}`, borderRadius: "14px", padding: "18px", marginBottom: "22px" },
    wheelTitle: { fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.3rem", color: t.ivory, margin: "0 0 4px" },
    wheelSub: { fontSize: "0.78rem", color: t.muted, margin: "0 0 14px" },
    wheelInputRow: { display: "flex", gap: "8px", marginBottom: "10px" },
    wheelAddBtn: { fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.8rem", padding: "0 16px", background: t.accent, color: t.accentText, border: "none", borderRadius: "10px" },
    wheelPlayersList: { display: "flex", flexWrap: "wrap", gap: "8px" },
    wheelChip: { display: "flex", alignItems: "center", gap: "6px", background: t.surface, border: `1px solid ${t.accentSoft}`, borderRadius: "999px", padding: "6px 6px 6px 12px", fontSize: "0.78rem", fontWeight: 600, color: t.accent },
    wheelChipRemove: { background: "none", border: "none", color: t.accent, opacity: 0.6, fontSize: "0.8rem", cursor: "pointer", padding: "2px 4px" },
    wheelResultBox: { marginTop: "14px", textAlign: "center", background: t.surface, border: `1px solid ${t.accentSoft}`, borderRadius: "12px", padding: "16px" },
    wheelResultLabel: { fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em", color: t.muted, margin: "0 0 6px" },
    wheelResultText: { fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.1rem", color: t.accent, margin: 0, lineHeight: 1.4 },
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
      borderRadius: "16px",
      padding: "18px",
      marginBottom: "22px",
    },
    giftCardTitle: { fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.1rem", color: t.ivory, margin: "0 0 4px" },
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
