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
        .leFilCoverHero{position:relative;width:100%;max-width:760px;height:clamp(320px,72vw,500px);margin:0 auto;overflow:hidden;background:#2b241f}
        .leFilCoverHero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
        .leFilCoverShade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(18,14,12,.05) 25%,rgba(18,14,12,.72) 100%)}
        .leFilCoverText{position:absolute;left:22px;right:22px;bottom:32px;text-align:center;color:#fff;text-shadow:0 2px 16px rgba(0,0,0,.55)}
        .leFilCoverType{font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;margin-bottom:9px}
        .leFilCoverText h1{margin:0;font-family:Georgia,serif;font-style:italic;font-size:clamp(30px,8vw,48px);line-height:1.05}
        .leFilCoverText p{max-width:580px;margin:10px auto 0;font-family:Georgia,serif;font-style:italic;font-size:14px;line-height:1.45}
        .leFilCoverDate{margin-top:11px;font-size:11px;letter-spacing:.1em;text-transform:uppercase}
      `}</style>
    </section>
  );
}
