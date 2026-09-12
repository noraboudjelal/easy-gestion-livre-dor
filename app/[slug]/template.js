"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import IdleCover from "../le-fil/[slug]/IdleCover";

export default function PublicEventTemplate({ children }) {
  const params = useParams();
  const slug = params?.slug;
  const [cover, setCover] = useState("");
  const [eventTitle, setEventTitle] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
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
    })();
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (!cover) return;

    const applyCover = () => {
      const card = document.querySelector(".event-header-card");
      if (!card) return false;
      const mobile = window.innerWidth <= 600;

      card.style.setProperty(
        "background-image",
        `linear-gradient(180deg,rgba(15,20,30,.08) 18%,rgba(15,20,30,.62) 100%),url("${cover}")`,
        "important"
      );
      card.style.setProperty("background-size", "cover", "important");
      card.style.setProperty("background-position", "center", "important");
      card.style.setProperty("background-repeat", "no-repeat", "important");
      card.style.setProperty("min-height", mobile ? "330px" : "390px", "important");
      card.style.setProperty("padding-top", mobile ? "62px" : "100px", "important");

      const context = card.querySelector(".event-title-context");
      const title = card.querySelector(".event-title-names");
      const date = card.querySelector(".event-date");

      // Never leave a fixed “Mariage de” label on another kind of event.
      // The editable event title is the source of truth for the cover.
      if (context) {
        const normalizedTitle = eventTitle.toLocaleLowerCase("fr-FR");
        const normalizedContext = (context.textContent || "").toLocaleLowerCase("fr-FR");
        const titleAlreadyDescribesEvent = /baby\s*shower|anniversaire|bapt[eê]me|fian[cç]ailles|retraite|henn[eé]|circoncision|inauguration|lancement|f[eê]te|d[eé]mo/.test(normalizedTitle);
        const wrongMarriageLabel = normalizedContext.includes("mariage") && !normalizedTitle.includes("mariage");
        if (titleAlreadyDescribesEvent || wrongMarriageLabel) {
          context.style.setProperty("display", "none", "important");
        } else {
          context.style.removeProperty("display");
          context.style.setProperty("font-size", mobile ? "1.45rem" : "1.7rem", "important");
          context.style.setProperty("line-height", "1.05", "important");
        }
      }
      if (title) {
        title.style.setProperty("font-size", mobile ? "clamp(2.25rem, 10vw, 4.1rem)" : "clamp(4rem, 7vw, 6rem)", "important");
        title.style.setProperty("line-height", mobile ? ".98" : ".96", "important");
        title.style.setProperty("white-space", "normal", "important");
        title.style.setProperty("overflow-wrap", "anywhere", "important");
        title.style.setProperty("max-width", "100%", "important");
      }
      if (date) {
        date.style.setProperty("font-size", mobile ? ".95rem" : "1.1rem", "important");
      }

      card.querySelectorAll(".event-title-context,.event-title-names,.event-date,.lehnova-welcome-message").forEach((node) => {
        node.style.setProperty("color", "#fff", "important");
        node.style.setProperty("text-shadow", "0 2px 12px rgba(0,0,0,.72)", "important");
      });
      return true;
    };

    const handleResize = () => applyCover();
    if (!applyCover()) {
      const observer = new MutationObserver(() => {
        if (applyCover()) observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [cover, eventTitle]);

  return <><IdleCover />{children}</>;
}
