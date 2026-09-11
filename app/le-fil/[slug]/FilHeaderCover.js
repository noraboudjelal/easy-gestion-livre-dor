"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function FilHeaderCover({ cover: serverCover }) {
  const { slug } = useParams();

  useEffect(() => {
    let active = true;
    let observer;
    let timer;

    const applyCover = (cover) => {
      if (!cover || !active) return false;
      const header = document.querySelector(".page .header");
      if (!header) return false;

      header.style.setProperty("background", `linear-gradient(180deg,rgba(8,12,18,.04) 20%,rgba(8,12,18,.68) 100%), url("${cover}") center / cover no-repeat`, "important");
      header.style.setProperty("min-height", "390px", "important");
      header.style.setProperty("position", "relative", "important");
      header.style.setProperty("display", "flex", "important");
      header.style.setProperty("flex-direction", "column", "important");
      header.style.setProperty("justify-content", "flex-end", "important");
      header.style.setProperty("padding", "120px 18px 18px", "important");
      header.style.setProperty("backdrop-filter", "none", "important");
      header.style.setProperty("border-bottom", "0", "important");
      header.style.setProperty("box-shadow", "none", "important");

      const names = header.querySelector(".names");
      const date = header.querySelector(".date");
      const type = header.querySelector(".type");
      if (names) names.style.setProperty("color", "#fff", "important");
      if (date) date.style.setProperty("color", "rgba(255,255,255,.9)", "important");
      if (type) type.style.setProperty("color", "#fff", "important");
      return true;
    };

    const waitForHeader = (cover) => {
      if (applyCover(cover)) return;
      observer = new MutationObserver(() => {
        if (applyCover(cover)) observer?.disconnect();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      timer = setTimeout(() => observer?.disconnect(), 15000);
    };

    async function loadCover() {
      let cover = serverCover || "";
      try {
        if (supabase && slug) {
          const { data: event } = await supabase
            .from("events")
            .select("id,fil_cover_url,cover_photo_url")
            .eq("slug", decodeURIComponent(String(slug)))
            .maybeSingle();

          if (event?.id) {
            const { data: settings } = await supabase
              .from("event_fil_settings")
              .select("cover_image_url")
              .eq("event_id", event.id)
              .maybeSingle();
            cover = settings?.cover_image_url || event.fil_cover_url || event.cover_photo_url || cover;
          }
        }
      } catch (error) {
        console.error("Le Fil client cover load error", error);
      }
      waitForHeader(cover);
    }

    loadCover();
    return () => {
      active = false;
      observer?.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [serverCover, slug]);

  return null;
}
