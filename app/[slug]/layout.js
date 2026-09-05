"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function PublicEventLayout({ children }) {
  const params = useParams();
  const slug = params?.slug;
  const [welcomeMessage, setWelcomeMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadWelcomeMessage() {
      if (!supabase || !slug) return;

      const { data: event } = await supabase
        .from("events")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!event?.id || !active) return;

      const { data: settings } = await supabase
        .from("event_fil_settings")
        .select("welcome_message")
        .eq("event_id", event.id)
        .maybeSingle();

      if (active) setWelcomeMessage((settings?.welcome_message || "").trim());
    }

    loadWelcomeMessage();
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
      }
    `}</style>
    {children}
  </>;
}
