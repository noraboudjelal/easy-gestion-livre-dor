"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import IdleCover from "../le-fil/[slug]/IdleCover";
import { PublicEventCoverContext } from "../../lib/publicEventCover";

export default function PublicEventTemplate({ children }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug;
  const openedFromAdmin = searchParams?.get("from") === "admin";
  const [cover, setCover] = useState("");
  const [eventTitle, setEventTitle] = useState("");

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      if (!supabase || !slug) return;
      const { data: event } = await supabase
        .from("events")
        .select("id,event_title,cover_photo_url,fil_cover_url")
        .eq("slug", slug)
        .maybeSingle();
      if (!event?.id || !active) return;
      setEventTitle((event.event_title || "").trim());
      const { data: settings } = await supabase
        .from("event_fil_settings")
        .select("cover_image_url")
        .eq("event_id", event.id)
        .maybeSingle();
      if (active) setCover(settings?.cover_image_url || event.fil_cover_url || event.cover_photo_url || "");
    };
    const refreshVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    refresh();
    const timer = setInterval(refreshVisible, 15000);
    window.addEventListener("focus", refreshVisible);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", refreshVisible);
    };
  }, [slug]);

  useEffect(() => {
    if (!cover) return;

    const applyCover = () => {
      const card = document.querySelector(".event-header-card");
      if (!card) return false;
      const mobile = window.innerWidth <= 600;

      card.style.setProperty("background-image", `linear-gradient(180deg,rgba(15,20,30,.08) 18%,rgba(15,20,30,.62) 100%),url("${cover}")`, "important");
      card.style.setProperty("background-size", "cover", "important");
      card.style.setProperty("background-position", "center", "important");
      card.style.setProperty("background-repeat", "no-repeat", "important");
      card.style.setProperty("min-height", mobile ? "420px" : "520px", "important");
      card.style.setProperty("padding-top", "28px", "important");
      card.style.setProperty("padding-bottom", "18px", "important");
      card.style.setProperty("display", "grid", "important");
      card.style.setProperty("grid-template-rows", "1fr auto 1fr", "important");
      card.style.setProperty("row-gap", "20px", "important");

      const header = card.querySelector(".event-header");
      const nav = card.querySelector(".event-nav");
      if (header) {
        header.style.setProperty("grid-row", "2", "important");
        header.style.setProperty("margin", "0", "important");
        header.style.setProperty("padding", "0", "important");
        header.style.setProperty("text-align", "center", "important");
        header.style.setProperty("min-width", "0", "important");
      }
      if (nav) {
        nav.style.setProperty("grid-row", "3", "important");
        nav.style.setProperty("align-self", "end", "important");
        nav.style.setProperty("min-width", "0", "important");
        nav.style.setProperty("max-width", "100%", "important");
      }

      const context = card.querySelector(".event-title-context");
      const title = card.querySelector(".event-title-names");
      const date = card.querySelector(".event-date");
      if (context) context.style.setProperty("display", "none", "important");
      if (title) {
        title.style.setProperty("font-size", mobile ? "clamp(2.75rem, 12vw, 4.75rem)" : "clamp(4.5rem, 8vw, 6.75rem)", "important");
        title.style.setProperty("line-height", mobile ? ".98" : ".96", "important");
        title.style.setProperty("white-space", "normal", "important");
        title.style.setProperty("overflow-wrap", "anywhere", "important");
        title.style.setProperty("max-width", "100%", "important");
      }
      if (date) date.style.setProperty("font-size", mobile ? ".95rem" : "1.1rem", "important");

      card.querySelectorAll(".event-title-context,.event-title-names,.event-date,.lehnova-welcome-message").forEach((node) => {
        node.style.setProperty("color", "#fff", "important");
        node.style.setProperty("text-shadow", "0 2px 12px rgba(0,0,0,.72)", "important");
      });
      return true;
    };

    const handleResize = () => applyCover();
    let observer;
    if (!applyCover()) {
      observer = new MutationObserver(() => {
        if (applyCover()) observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
    window.addEventListener("resize", handleResize);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [cover, eventTitle]);

  return (
    <PublicEventCoverContext.Provider value={{ cover, eventTitle }}>
      <IdleCover />
      {openedFromAdmin && (
        <a href="/admin" style={{ position: "fixed", top: 10, left: 10, zIndex: 1000001, padding: "8px 12px", borderRadius: 999, background: "rgba(20,20,20,.72)", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 700, backdropFilter: "blur(6px)" }}>
          ← Admin
        </a>
      )}
      {children}
    </PublicEventCoverContext.Provider>
  );
}
