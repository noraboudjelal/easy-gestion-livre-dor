"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

function formatFilterDate(value) {
  if (!value) return "";
  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function PublicEventLayout({ children }) {
  const params = useParams();
  const slug = params?.slug;
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [eventMeta, setEventMeta] = useState({ title: "", date: "" });

  useEffect(() => {
    let active = true;

    async function loadEventData() {
      if (!supabase || !slug) return;

      const { data: event } = await supabase
        .from("events")
        .select("id,title,event_date")
        .eq("slug", slug)
        .maybeSingle();

      if (!event?.id || !active) return;

      setEventMeta({
        title: (event.title || "").trim(),
        date: formatFilterDate(event.event_date),
      });

      const { data: settings } = await supabase
        .from("event_fil_settings")
        .select("welcome_message")
        .eq("event_id", event.id)
        .maybeSingle();

      if (active) setWelcomeMessage((settings?.welcome_message || "").trim());
    }

    loadEventData();
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
    if (!eventMeta.title && !eventMeta.date) return;

    const decoratePhotos = () => {
      document.querySelectorAll("img").forEach((img) => {
        const src = img.currentSrc || img.src || "";
        if (!src.includes("guestbook-photos")) return;
        if (img.dataset.lehnovaPhotoFilter === "true") return;

        const parent = img.parentElement;
        if (!parent) return;
        const computed = window.getComputedStyle(parent);
        if (computed.position === "static") parent.style.position = "relative";
        parent.classList.add("lehnova-filtered-photo");

        const overlay = document.createElement("div");
        overlay.className = "lehnova-photo-filter";
        overlay.dataset.lehnovaPhotoFilterOverlay = "true";

        const title = document.createElement("div");
        title.className = "lehnova-photo-filter-title";
        title.textContent = eventMeta.title;
        overlay.appendChild(title);

        if (eventMeta.date) {
          const date = document.createElement("div");
          date.className = "lehnova-photo-filter-date";
          date.textContent = eventMeta.date;
          overlay.appendChild(date);
        }

        parent.appendChild(overlay);
        img.dataset.lehnovaPhotoFilter = "true";
      });
    };

    decoratePhotos();
    const observer = new MutationObserver(decoratePhotos);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [eventMeta.title, eventMeta.date]);

  return <>
    <style jsx global>{`
      .event-header-card {
        box-sizing: border-box !important;
        min-height: 265px !important;
        padding: 20px 26px 8px !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-start !important;
      }
      .event-header {
        width: 100% !important;
        flex: 1 1 auto !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
      }
      .event-title-context {
        font-size: 1.35rem !important;
        font-weight: 800 !important;
        margin-bottom: 7px !important;
        letter-spacing: .15em !important;
      }
      .event-title-names {
        font-size: clamp(3.6rem, 7vw, 5.5rem) !important;
        line-height: .98 !important;
      }
      .lehnova-welcome-message {
        max-width: 720px;
        margin: 22px auto 0 !important;
        padding: 0 8px;
        text-align: center;
        font-family: 'Libre Baskerville', Georgia, serif;
        font-style: italic;
        font-size: 0.9rem;
        line-height: 1.4;
        opacity: 0.82;
      }
      .event-nav {
        margin-top: auto !important;
        margin-bottom: 0 !important;
        padding-top: 4px !important;
        padding-bottom: 0 !important;
        align-self: stretch !important;
      }
      .lehnova-filtered-photo {
        overflow: hidden;
      }
      .lehnova-photo-filter {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 4;
        pointer-events: none;
        padding: 30px 14px 11px;
        text-align: center;
        color: #fff;
        background: linear-gradient(to top, rgba(20,15,12,.72), rgba(20,15,12,.28) 55%, transparent);
        text-shadow: 0 1px 4px rgba(0,0,0,.55);
      }
      .lehnova-photo-filter-title {
        font-family: 'Libre Baskerville', Georgia, serif;
        font-style: italic;
        font-weight: 700;
        font-size: clamp(16px, 3.8vw, 25px);
        line-height: 1.15;
      }
      .lehnova-photo-filter-date {
        margin-top: 4px;
        font-family: 'DM Sans', Arial, sans-serif;
        font-size: clamp(9px, 2vw, 12px);
        font-weight: 600;
        letter-spacing: .12em;
        text-transform: uppercase;
      }
      @media (max-width: 599px) {
        .event-header-card {
          min-height: 265px !important;
          padding: 14px 12px 6px !important;
        }
        .event-title-context {
          font-size: 1.12rem !important;
          margin-bottom: 5px !important;
        }
        .event-title-names {
          font-size: clamp(2.85rem, 13.8vw, 4rem) !important;
          letter-spacing: -.055em !important;
        }
        .lehnova-welcome-message {
          margin-top: 18px !important;
          font-size: 0.82rem;
        }
        .event-nav {
          margin-top: auto !important;
          padding-top: 3px !important;
        }
        .lehnova-photo-filter {
          padding: 24px 10px 8px;
        }
      }
    `}</style>
    {children}
  </>;
}
