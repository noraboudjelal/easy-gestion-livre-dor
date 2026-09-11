import IdleCover from "./IdleCover";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function LeFilEventLayout({ children, params }) {
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams?.slug || "");
  let event = null;
  let cover = "";
  let welcomeMessage = "";

  if (slug) {
    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from("events")
        .select("id,event_title,event_type,event_date,cover_photo_url,fil_cover_url")
        .eq("slug", slug)
        .maybeSingle();
      event = data;

      if (event?.id) {
        const { data: settings } = await supabase
          .from("event_fil_settings")
          .select("cover_image_url,welcome_message")
          .eq("event_id", event.id)
          .maybeSingle();
        cover = settings?.cover_image_url || event.fil_cover_url || event.cover_photo_url || "";
        welcomeMessage = settings?.welcome_message || "";
      }
    } catch (error) {
      console.error("Le Fil cover load error", error);
    }
  }

  const date = event?.event_date
    ? new Date(`${event.event_date}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <>
      {cover ? (
        <section style={{ position: "relative", width: "100%", maxWidth: 760, height: "clamp(320px,72vw,500px)", margin: "0 auto", overflow: "hidden", background: "#2b241f" }}>
          <img src={cover} alt={`Couverture ${event?.event_title || "de l’événement"}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(18,14,12,.05) 25%,rgba(18,14,12,.72) 100%)" }} />
          <div style={{ position: "absolute", left: 22, right: 22, bottom: 32, textAlign: "center", color: "white", textShadow: "0 2px 16px rgba(0,0,0,.55)" }}>
            {event?.event_type ? <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 9 }}>{event.event_type}</div> : null}
            <h1 style={{ margin: 0, fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: "clamp(30px,8vw,48px)", lineHeight: 1.05 }}>{event?.event_title}</h1>
            {welcomeMessage ? <p style={{ maxWidth: 580, margin: "10px auto 0", fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 14, lineHeight: 1.45 }}>{welcomeMessage}</p> : null}
            {date ? <div style={{ marginTop: 11, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase" }}>{date}</div> : null}
          </div>
        </section>
      ) : null}
      {children}
      <IdleCover timeoutMs={30000} />
    </>
  );
}
