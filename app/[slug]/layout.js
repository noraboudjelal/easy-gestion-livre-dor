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

export default function PublicEventLayout({ children }) {
  const params = useParams();
  const slug = params?.slug;
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [eventMeta, setEventMeta] = useState({ title: "", date: "" });
  const [cameraOpen, setCameraOpen] = useState(false);
  const [shot, setShot] = useState("");
  const [shotFile, setShotFile] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [photoArea, setPhotoArea] = useState(null);
  const [cameraButtonStyle, setCameraButtonStyle] = useState({});
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!supabase || !slug) return;
      const { data: event } = await supabase
        .from("events")
        .select("id,event_title,event_date")
        .eq("slug", slug)
        .maybeSingle();
      if (!event?.id || !active) return;
      setEventMeta({ title: (event.event_title || "").trim(), date: formatDate(event.event_date) });
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
    let cancelled = false;
    const findPhotoArea = () => {
      const inputs = [...document.querySelectorAll('input[type="file"]')];
      const input = inputs.find((item) => (item.accept || "").includes("image"));
      const label = input?.closest("label");
      if (!input || !label || cancelled) return false;
      const computed = window.getComputedStyle(label);
      setCameraButtonStyle({
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        color: computed.color,
        border: computed.border,
        borderRadius: computed.borderRadius,
        padding: computed.padding,
        background: computed.background,
        minHeight: computed.height,
      });
      setPhotoArea(label.parentElement);
      return true;
    };
    if (findPhotoArea()) return () => { cancelled = true; };
    const observer = new MutationObserver(() => { if (findPhotoArea()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { cancelled = true; observer.disconnect(); };
  }, []);

  async function openCamera() {
    setCameraOpen(true);
    setShot("");
    setShotFile(null);
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 0);
    } catch {
      setCameraError("Impossible d’ouvrir la caméra. Autorisez l’accès à la caméra dans votre navigateur.");
    }
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
    setShot("");
    setShotFile(null);
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

  function retake() {
    setShot("");
    setShotFile(null);
    openCamera();
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
      .lehnova-camera-button{width:100%;margin-top:8px;display:flex;align-items:center;justify-content:center;text-align:center;cursor:pointer;box-shadow:none}.lehnova-camera-modal{position:fixed;inset:0;z-index:9999;background:#000;color:white;overflow:hidden}.lehnova-camera-stage{position:absolute;inset:0;width:100vw;height:100dvh;overflow:hidden;background:#000}.lehnova-camera-stage video,.lehnova-camera-stage img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}.lehnova-live-filter{position:absolute;z-index:2;left:0;right:0;bottom:0;padding:90px 20px max(125px,calc(env(safe-area-inset-bottom) + 110px));text-align:center;background:linear-gradient(to top,rgba(0,0,0,.72),rgba(0,0,0,0));text-shadow:0 2px 8px #000;pointer-events:none}.lehnova-live-ornament{display:flex;align-items:center;justify-content:center;gap:7px;width:90px;margin:0 auto 10px}.lehnova-live-ornament:before,.lehnova-live-ornament:after{content:'';height:1px;background:#fff;flex:1}.lehnova-live-ornament span{width:6px;height:6px;border:1px solid #fff;border-radius:50%}.lehnova-live-title{font:italic 700 clamp(28px,8vw,46px) Georgia,serif;line-height:1.08}.lehnova-live-date{margin-top:8px;font:600 clamp(12px,3.4vw,16px) Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase}.lehnova-camera-actions{position:absolute;z-index:4;left:0;right:0;bottom:max(14px,env(safe-area-inset-bottom));display:flex;gap:10px;padding:12px 16px;flex-wrap:wrap;justify-content:center}.lehnova-camera-actions button{border:1px solid rgba(255,255,255,.65);border-radius:999px;padding:12px 18px;background:white;color:#241d18;font-weight:800}.lehnova-camera-actions .secondary{background:rgba(0,0,0,.35);color:white;backdrop-filter:blur(8px)}.lehnova-camera-error{position:absolute;z-index:5;inset:0;display:grid;place-items:center;padding:28px;text-align:center;background:#111}.lehnova-camera-error+.lehnova-camera-actions{z-index:6}
      @media(max-width:599px){.event-header-card{min-height:265px!important;padding:14px 12px 6px!important}.event-title-context{font-size:1.12rem!important;margin-bottom:5px!important}.event-title-names{font-size:clamp(2.85rem,13.8vw,4rem)!important;letter-spacing:-.055em!important}.lehnova-welcome-message{margin-top:18px!important;font-size:.82rem}.event-nav{margin-top:auto!important;padding-top:3px!important}}
    `}</style>
    {children}
    {photoArea && createPortal(
      <button type="button" className="lehnova-camera-button" style={cameraButtonStyle} onClick={openCamera}>
        📸 Prendre une photo avec un filtre
      </button>,
      photoArea
    )}
    {cameraOpen && <div className="lehnova-camera-modal">
      <div className="lehnova-camera-stage">
        {!shot && <video ref={videoRef} playsInline muted />}
        {shot && <img src={shot} alt="Aperçu" />}
        {!shot && eventMeta.title && <div className="lehnova-live-filter">
          <div className="lehnova-live-ornament"><span /></div>
          <div className="lehnova-live-title">{eventMeta.title}</div>
          {eventMeta.date && <div className="lehnova-live-date">{eventMeta.date}</div>}
        </div>}
      </div>
      {cameraError && <div className="lehnova-camera-error">{cameraError}</div>}
      <div className="lehnova-camera-actions">
        {!shot && !cameraError && <button type="button" onClick={capture}>● Prendre la photo</button>}
        {shot && <><button type="button" className="secondary" onClick={retake}>↻ Reprendre</button><button type="button" onClick={useShot}>✓ Utiliser cette photo</button></>}
        <button type="button" className="secondary" onClick={closeCamera}>Fermer</button>
      </div>
    </div>}
  </>;
}

