"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

function fitCanvasText(context, text, maxWidth, initialSize, minimumSize, font) {
  let size = initialSize;
  context.font = font(size);
  while (context.measureText(text).width > maxWidth && size > minimumSize) {
    size -= 2;
    context.font = font(size);
  }
  return size;
}

function eventDisplayName(title, eventType) {
  const original = String(title || "").trim();
  if (!original) return "";
  const escapedType = String(eventType || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const knownPrefixes = [
    /^mariage(?:\s+de)?\s+/i,
    /^baby\s*shower(?:\s+de)?\s+/i,
    /^anniversaire(?:\s+de)?\s+/i,
    /^baptême(?:\s+de)?\s+/i,
    /^fiançailles(?:\s+de)?\s+/i,
    /^pot\s+de\s+départ(?:\s+de)?\s+/i,
    /^départ\s+en\s+retraite(?:\s+de)?\s+/i,
    /^(?:cérémonie\s+du\s+)?henné(?:\s+de)?\s+/i,
    /^circoncision(?:\s+de)?\s+/i,
  ];
  if (escapedType) knownPrefixes.unshift(new RegExp(`^${escapedType}(?:\\s+(?:de|du|des|d['’]|de la))?\\s+`, "i"));
  for (const prefix of knownPrefixes) {
    const cleaned = original.replace(prefix, "").trim();
    if (cleaned !== original && cleaned) return cleaned;
  }
  return original;
}

export default function PublicEventLayout({ children }) {
  const params = useParams();
  const slug = params?.slug;
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [eventMeta, setEventMeta] = useState({ title: "", date: "" });
  const [cameraFacing, setCameraFacing] = useState("environment");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [shot, setShot] = useState("");
  const [shotFile, setShotFile] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [photoArea, setPhotoArea] = useState(null);
  const [cameraButtonStyle, setCameraButtonStyle] = useState({});
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!supabase || !slug) return;
      const { data: event } = await supabase
        .from("events")
        .select("id,event_title,event_type,event_date")
        .eq("slug", slug)
        .maybeSingle();
      if (!event?.id || !active) return;
      setEventMeta({ title: eventDisplayName(event.event_title, event.event_type), date: formatDate(event.event_date) });
      const { data: settings } = await supabase
        .from("event_fil_settings")
        .select("welcome_message")
        .eq("event_id", event.id)
        .maybeSingle();
      if (active) setWelcomeMessage((settings?.welcome_message || "").trim());
    })();
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    const header = document.querySelector(".event-header");
    if (!header) return;
    let node = header.querySelector("[data-lehnova-welcome='true']");
    if (!welcomeMessage) {
      node?.remove();
      return;
    }
    if (!node) {
      node = document.createElement("p");
      node.dataset.lehnovaWelcome = "true";
      node.className = "lehnova-welcome-message";
      const title = header.querySelector(".event-title-names");
      if (title) title.insertAdjacentElement("afterend", node);
      else header.prepend(node);
    }
    node.textContent = welcomeMessage;
  }, [welcomeMessage]);

  useEffect(() => {
    if (!cameraOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [cameraOpen]);

  useEffect(() => {
    let cancelled = false;
    let mount = null;
    const findPublishButton = () => {
      const form = document.querySelector(".memory-section form");
      const publishButton = form?.querySelector('button[type="submit"]');
      const publishRow = publishButton?.parentElement;
      if (!publishButton || !publishRow || cancelled) return false;
      mount = form.querySelector("[data-lehnova-camera-mount='true']");
      if (!mount) {
        mount = document.createElement("div");
        mount.dataset.lehnovaCameraMount = "true";
        mount.className = "lehnova-camera-mount";
        publishRow.insertAdjacentElement("afterend", mount);
      }
      const computed = window.getComputedStyle(publishButton);
      setCameraButtonStyle({
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        color: computed.color,
        border: computed.border,
        borderRadius: computed.borderRadius,
        padding: computed.padding,
        background: computed.background,
        height: computed.height,
      });
      setPhotoArea(mount);
      return true;
    };
    if (findPublishButton()) return () => { cancelled = true; mount?.remove(); };
    const observer = new MutationObserver(() => { if (findPublishButton()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { cancelled = true; observer.disconnect(); mount?.remove(); };
  }, []);

  function cameraConstraints(facing) {
    const portrait = window.innerHeight >= window.innerWidth;
    return {
      facingMode: { ideal: facing },
      width: { ideal: portrait ? 1080 : 1920 },
      height: { ideal: portrait ? 1920 : 1080 },
      aspectRatio: { ideal: portrait ? 9 / 16 : 16 / 9 },
    };
  }

  async function startCamera(facing) {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    const stream = await navigator.mediaDevices.getUserMedia({ video: cameraConstraints(facing), audio: false });
    streamRef.current = stream;
    setCameraFacing(facing);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    }, 0);
  }

  async function openCamera() {
    setCameraOpen(true);
    setShot("");
    setShotFile(null);
    setCameraError("");
    try {
      await startCamera("environment");
      setTimeout(() => modalRef.current?.requestFullscreen?.().catch(() => {}), 0);
    } catch {
      setCameraError("Impossible d’ouvrir la caméra. Autorisez l’accès à la caméra dans votre navigateur.");
    }
  }

  async function flipCamera() {
    try {
      await startCamera(cameraFacing === "environment" ? "user" : "environment");
    } catch {
      setCameraError("Impossible de changer de caméra sur cet appareil.");
    }
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
    setShot("");
    setShotFile(null);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }

  function capture() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const overlayHeight = Math.max(150, canvas.height * 0.25);
    const gradient = context.createLinearGradient(0, canvas.height - overlayHeight, 0, canvas.height);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,.7)");
    context.fillStyle = gradient;
    context.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight);
    context.textAlign = "center";
    context.fillStyle = "#fff";
    context.shadowColor = "rgba(0,0,0,.65)";
    context.shadowBlur = Math.max(4, canvas.width * 0.006);

    const title = eventMeta.title;
    const ornamentY = canvas.height - Math.max(125, canvas.height * 0.145);
    context.strokeStyle = "rgba(255,255,255,.95)";
    context.lineWidth = Math.max(1, canvas.width * 0.0015);
    context.beginPath();
    context.moveTo(canvas.width / 2 - canvas.width * 0.075, ornamentY);
    context.lineTo(canvas.width / 2 - canvas.width * 0.015, ornamentY);
    context.moveTo(canvas.width / 2 + canvas.width * 0.015, ornamentY);
    context.lineTo(canvas.width / 2 + canvas.width * 0.075, ornamentY);
    context.stroke();
    context.beginPath();
    context.arc(canvas.width / 2, ornamentY, Math.max(3, canvas.width * 0.006), 0, Math.PI * 2);
    context.stroke();
    if (title) {
      fitCanvasText(
        context,
        title,
        canvas.width * 0.88,
        Math.max(36, Math.round(canvas.width * 0.06)),
        Math.max(22, Math.round(canvas.width * 0.032)),
        (size) => `italic 700 ${size}px Georgia`
      );
      context.fillText(title, canvas.width / 2, canvas.height - Math.max(68, canvas.height * 0.082));
    }
    if (eventMeta.date) {
      context.font = `600 ${Math.max(17, Math.round(canvas.width * 0.024))}px Arial`;
      context.letterSpacing = `${Math.max(2, canvas.width * 0.004)}px`;
      context.fillText(eventMeta.date.toUpperCase(), canvas.width / 2, canvas.height - Math.max(30, canvas.height * 0.038));
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `le-fil-${Date.now()}.jpg`, { type: "image/jpeg" });
      setShotFile(file);
      setShot(URL.createObjectURL(blob));
      streamRef.current?.getTracks().forEach((track) => track.stop());
    }, "image/jpeg", 0.95);
  }

  async function retake() {
    setShot("");
    setShotFile(null);
    setCameraError("");
    try {
      await startCamera(cameraFacing);
    } catch {
      setCameraError("Impossible de rouvrir la caméra.");
    }
  }

  function useShot() {
    if (!shotFile) return;
    const inputs = [...document.querySelectorAll('input[type="file"]')];
    const input = inputs.find((item) => (item.accept || "").includes("image")) || inputs[0];
    if (!input) {
      setCameraError("Le formulaire photo est introuvable.");
      return;
    }
    const transfer = new DataTransfer();
    transfer.items.add(shotFile);
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    closeCamera();
    input.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return <>
    <style jsx global>{`
      .event-header-card{box-sizing:border-box!important;min-height:265px!important;padding:20px 26px 8px!important;display:flex!important;flex-direction:column!important;justify-content:flex-start!important}.event-header{width:100%!important;flex:1 1 auto!important;display:flex!important;flex-direction:column!important;justify-content:center!important}.event-title-context{font-size:1.35rem!important;font-weight:800!important;margin-bottom:7px!important;letter-spacing:.15em!important}.event-title-names{font-size:clamp(3.6rem,7vw,5.5rem)!important;line-height:.98!important}.lehnova-welcome-message{max-width:720px;margin:22px auto 0!important;padding:0 8px;text-align:center;font-family:'Libre Baskerville',Georgia,serif;font-style:italic;font-size:.9rem;line-height:1.4;opacity:.82}.event-nav{margin-top:auto!important;margin-bottom:0!important;padding-top:4px!important;padding-bottom:0!important;align-self:stretch!important}
      .lehnova-camera-mount{width:100%;display:flex;margin-top:8px}.lehnova-camera-button{width:100%;display:flex;align-items:center;justify-content:center;text-align:center;cursor:pointer}.lehnova-camera-modal{position:fixed;inset:0;z-index:9999;background:#000;color:white;overflow:hidden;width:100vw;height:100dvh}.lehnova-camera-stage{position:absolute;inset:0;width:100%;height:100%;overflow:hidden;background:#000}.lehnova-camera-stage video,.lehnova-camera-stage img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}.lehnova-camera-stage video.is-front{transform:scaleX(-1)}.lehnova-live-filter{position:absolute;z-index:2;left:0;right:0;bottom:0;padding:90px 20px max(128px,calc(env(safe-area-inset-bottom) + 112px));text-align:center;background:linear-gradient(to top,rgba(0,0,0,.72),rgba(0,0,0,0));text-shadow:0 2px 8px #000;pointer-events:none}.lehnova-live-ornament{display:flex;align-items:center;justify-content:center;gap:7px;width:90px;margin:0 auto 10px}.lehnova-live-ornament:before,.lehnova-live-ornament:after{content:'';height:1px;background:#fff;flex:1}.lehnova-live-ornament span{width:6px;height:6px;border:1px solid #fff;border-radius:50%}.lehnova-live-title{font:italic 700 clamp(28px,8vw,46px) Georgia,serif;line-height:1.08}.lehnova-live-date{margin-top:8px;font:600 clamp(12px,3.4vw,16px) Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase}.lehnova-camera-topbar{position:absolute;z-index:5;top:max(12px,env(safe-area-inset-top));left:0;right:0;display:flex;justify-content:space-between;padding:12px 18px}.lehnova-camera-icon{width:46px;height:46px;border:1px solid rgba(255,255,255,.55);border-radius:50%;background:rgba(0,0,0,.38);color:#fff;font-size:22px;display:grid;place-items:center;backdrop-filter:blur(8px)}.lehnova-camera-actions{position:absolute;z-index:4;left:0;right:0;bottom:max(18px,env(safe-area-inset-bottom));display:flex;gap:12px;padding:12px 16px;justify-content:center;align-items:center}.lehnova-shutter{width:76px!important;height:76px!important;border:5px solid #fff!important;border-radius:50%!important;padding:0!important;background:rgba(255,255,255,.18)!important;box-shadow:inset 0 0 0 4px #000,0 2px 12px rgba(0,0,0,.35)}.lehnova-camera-actions .review{border:1px solid rgba(255,255,255,.7);border-radius:999px;padding:13px 18px;background:#fff;color:#241d18;font-weight:800}.lehnova-camera-actions .review.secondary{background:rgba(0,0,0,.38);color:#fff;backdrop-filter:blur(8px)}.lehnova-camera-error{position:absolute;z-index:5;inset:0;display:grid;place-items:center;padding:28px;text-align:center;background:#111}.lehnova-camera-error+.lehnova-camera-actions{z-index:6}
      @media(max-width:599px){.event-header-card{min-height:265px!important;padding:14px 12px 6px!important}.event-title-context{font-size:1.12rem!important;margin-bottom:5px!important}.event-title-names{font-size:clamp(2.85rem,13.8vw,4rem)!important;letter-spacing:-.055em!important}.lehnova-welcome-message{margin-top:18px!important;font-size:.82rem}.event-nav{margin-top:auto!important;padding-top:3px!important}}
    `}</style>
    {children}
    {photoArea && createPortal(
      <button type="button" className="lehnova-camera-button" style={cameraButtonStyle} onClick={openCamera}>
        📸 Prendre une photo avec un filtre
      </button>,
      photoArea
    )}
    {cameraOpen && <div className="lehnova-camera-modal" ref={modalRef}>
      <div className="lehnova-camera-stage">
        {!shot && <video ref={videoRef} className={cameraFacing === "user" ? "is-front" : ""} playsInline muted />}
        {shot && <img src={shot} alt="Aperçu" />}
        {!shot && eventMeta.title && <div className="lehnova-live-filter">
          <div className="lehnova-live-ornament"><span /></div>
          <div className="lehnova-live-title">{eventMeta.title}</div>
          {eventMeta.date && <div className="lehnova-live-date">{eventMeta.date}</div>}
        </div>}
      </div>
      {cameraError && <div className="lehnova-camera-error">{cameraError}</div>}
      {!shot && <div className="lehnova-camera-topbar">
        <button type="button" className="lehnova-camera-icon" onClick={closeCamera} aria-label="Fermer">✕</button>
        <button type="button" className="lehnova-camera-icon" onClick={flipCamera} aria-label="Retourner la caméra">↻</button>
      </div>}
      <div className="lehnova-camera-actions">
        {!shot && !cameraError && <button type="button" className="lehnova-shutter" onClick={capture} aria-label="Prendre la photo" />}
        {shot && <><button type="button" className="review secondary" onClick={retake}>Reprendre</button><button type="button" className="review" onClick={useShot}>Utiliser cette photo</button></>}
        {shot && <button type="button" className="review secondary" onClick={closeCamera}>Fermer</button>}
      </div>
    </div>}
  </>;
}

