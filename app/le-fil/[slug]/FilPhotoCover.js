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
      const { data: event } = await supabase
        .from("events")
        .select("id,event_title,event_type,event_date,cover_photo_url,fil_cover_url")
        .eq("slug", decodeURIComponent(slug))
        .maybeSingle();
      if (!event?.id || !active) return;
      const { data: settings } = await supabase
        .from("event_fil_settings")
        .select("cover_image_url,welcome_message")
        .eq("event_id", event.id)
        .maybeSingle();
      if (!active) return;
      const cover = settings?.cover_image_url || event.fil_cover_url || event.cover_photo_url || "";
      setData(cover ? { ...event, cover, welcome_message: settings?.welcome_message || "" } : null);
    }
    loadCover();
    return () => { active = false; };
  }, [slug]);

  if (!data?.cover) return null;
  const date = data.event_date ? new Date(`${data.event_date}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";

  return (
    <section className="leFilCoverHero">
      <img src={data.cover} alt={`Couverture ${data.event_title || "de l’événement"}`} />
      <div className="leFilCoverShade" />
      <div className="leFilCoverText">
        {data.event_type && <div className="leFilCoverType">{data.event_type}</div>}
        <h1>{data.event_title}</h1>
        {data.welcome_message && <p>{data.welcome_message}</p>}
        {date && <div className="leFilCoverDate">{date}</div>}
      </div>
      <style>{`
        .leFilCoverHero{position:relative;width:100%;max-width:760px;height:clamp(155px,29vw,205px);margin:0 auto;overflow:hidden;background:#2b241f}
        .leFilCoverHero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 42%;display:block}
        .leFilCoverShade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(18,14,12,.01) 18%,rgba(18,14,12,.58) 100%)}
        .leFilCoverText{position:absolute;left:16px;right:16px;bottom:10px;text-align:center;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.62)}
        .leFilCoverType{font-size:8px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;margin-bottom:3px}
        .leFilCoverText h1{max-width:680px;margin:0 auto;font-family:Georgia,serif;font-style:italic;font-size:clamp(20px,3.8vw,29px);line-height:1.02}
        .leFilCoverText p{max-width:650px;margin:4px auto 0;font-family:Georgia,serif;font-style:italic;font-weight:600;font-size:clamp(13px,2.3vw,18px);line-height:1.1}
        .leFilCoverDate{margin-top:4px;font-size:8px;letter-spacing:.08em;text-transform:uppercase}
        @media (min-width:700px){.leFilCoverHero{height:190px}}
      `}</style>
    </section>
  );
}
