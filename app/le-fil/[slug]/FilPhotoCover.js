"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function FilPhotoCover() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadCover() {
      if (!supabase || !slug) return;

      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("id,event_title,event_type,event_date,cover_photo_url,fil_cover_url")
        .eq("slug", decodeURIComponent(slug))
        .maybeSingle();

      if (eventError || !event?.id || !active) return;

      const { data: settings } = await supabase
        .from("event_fil_settings")
        .select("cover_image_url")
        .eq("event_id", event.id)
        .maybeSingle();

      if (!active) return;

      const cover = settings?.cover_image_url || event.fil_cover_url || event.cover_photo_url || "";
      setData(cover ? { ...event, cover } : null);
    }

    loadCover();
    return () => { active = false; };
  }, [slug]);

  if (!data?.cover) return null;

  const date = data.event_date
    ? new Date(`${data.event_date}T00:00:00`).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 760,
        height: "clamp(280px, 58vw, 430px)",
        margin: "0 auto",
        overflow: "hidden",
        background: "#2b241f",
      }}
    >
      <img
        key={data.cover}
        src={data.cover}
        alt={`Couverture ${data.event_title || "de l’événement"}`}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(20,15,12,.12),rgba(20,15,12,.68))" }} />
      <div style={{ position: "absolute", left: 24, right: 24, bottom: 30, color: "white", textAlign: "center", textShadow: "0 2px 16px rgba(0,0,0,.5)" }}>
        {data.event_type && <div style={{ fontSize: 12, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 10 }}>{data.event_type}</div>}
        <h1 style={{ margin: 0, fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: "clamp(32px,8vw,52px)", lineHeight: 1.05 }}>{data.event_title}</h1>
        {date && <div style={{ marginTop: 12, fontSize: 12, letterSpacing: ".08em" }}>{date}</div>}
      </div>
    </section>
  );
}
