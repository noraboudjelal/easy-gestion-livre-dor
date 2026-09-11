"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import IdleCover from "../le-fil/[slug]/IdleCover";

export default function PublicEventTemplate({ children }) {
  const params = useParams();
  const slug = params?.slug;
  const [cover, setCover] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      if (!supabase || !slug) return;
      const { data: event } = await supabase
        .from("events")
        .select("id,cover_photo_url,fil_cover_url")
        .eq("slug", slug)
        .maybeSingle();
      if (!event?.id || !active) return;
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

      card.style.setProperty(
        "background-image",
        `linear-gradient(180deg,rgba(15,20,30,.08) 18%,rgba(15,20,30,.62) 100%),url("${cover}")`,
        "important"
      );
      card.style.setProperty("background-size", "cover", "important");
      card.style.setProperty("background-position", "center", "important");
      card.style.setProperty("background-repeat", "no-repeat", "important");
      card.style.setProperty("min-height", "390px", "important");
      card.style.setProperty("padding-top", "100px", "important");

      card.querySelectorAll(".event-title-context,.event-title-names,.event-date,.lehnova-welcome-message").forEach((node) => {
        node.style.setProperty("color", "#fff", "important");
        node.style.setProperty("text-shadow", "0 2px 12px rgba(0,0,0,.72)", "important");
      });
      return true;
    };

    if (applyCover()) return;
    const observer = new MutationObserver(() => {
      if (applyCover()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [cover]);

  return <><IdleCover />{children}</>;
}
