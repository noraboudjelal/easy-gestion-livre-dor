import IdleCover from "./IdleCover";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function LeFilEventLayout({ children, params }) {
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams?.slug || "");
  let cover = "";

  if (slug) {
    try {
      const supabase = getSupabaseAdmin();
      const { data: event } = await supabase
        .from("events")
        .select("id,cover_photo_url,fil_cover_url")
        .eq("slug", slug)
        .maybeSingle();

      if (event?.id) {
        const { data: settings } = await supabase
          .from("event_fil_settings")
          .select("cover_image_url")
          .eq("event_id", event.id)
          .maybeSingle();
        cover = settings?.cover_image_url || event.fil_cover_url || event.cover_photo_url || "";
      }
    } catch (error) {
      console.error("Le Fil cover load error", error);
    }
  }

  return (
    <>
      {cover ? (
        <style dangerouslySetInnerHTML={{ __html: `
          .page .header{
            position:relative !important;
            top:auto !important;
            min-height:390px !important;
            display:flex !important;
            flex-direction:column !important;
            justify-content:flex-end !important;
            padding:120px 18px 18px !important;
            background-image:linear-gradient(180deg,rgba(8,12,18,.06) 25%,rgba(8,12,18,.68) 100%),url("${cover}") !important;
            background-size:cover !important;
            background-position:center !important;
            border-bottom:0 !important;
            box-shadow:none !important;
            backdrop-filter:none !important;
          }
          .page .header .names,.page .header .date,.page .header .type{
            color:#fff !important;
            text-shadow:0 2px 14px rgba(0,0,0,.65) !important;
          }
          .page .header .names{font-size:clamp(28px,8vw,44px) !important;}
          .page .header .quick{margin-top:16px !important;}
          .page .header .quick a{
            background:rgba(255,255,255,.90) !important;
            border-color:rgba(255,255,255,.9) !important;
            color:#332820 !important;
            text-shadow:none !important;
          }
        ` }} />
      ) : null}
      {children}
      <IdleCover timeoutMs={30000} />
    </>
  );
}
