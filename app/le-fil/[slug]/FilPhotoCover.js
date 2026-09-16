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
        .leFilCoverHero{position:relative;width:100%;max-width:760px;height:clamp(190px,36vw,260px);margin:0 auto;overflow:hidden;background:#2b241f}
        .leFilCoverHero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 42%;display:block}
        .leFilCoverShade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(18,14,12,.01) 20%,rgba(18,14,12,.58) 100%)}
        .leFilCoverText{position:absolute;left:18px;right:18px;bottom:14px;text-align:center;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.62)}
        .leFilCoverType{font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;margin-bottom:4px}
        .leFilCoverText h1{max-width:680px;margin:0 auto;font-family:Georgia,serif;font-style:italic;font-size:clamp(23px,4.5vw,34px);line-height:1.02}
        .leFilCoverText p{max-width:650px;margin:6px auto 0;font-family:Georgia,serif;font-style:italic;font-weight:600;font-size:clamp(15px,2.8vw,21px);line-height:1.12}
        .leFilCoverDate{margin-top:6px;font-size:9px;letter-spacing:.08em;text-transform:uppercase}
        @media (min-width:700px){.leFilCoverHero{height:245px}}
      `}</style>
    </section>
  );
}
