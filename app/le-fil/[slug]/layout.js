import IdleCover from "./IdleCover";
import FilHeaderCover from "./FilHeaderCover";
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
      <FilHeaderCover cover={cover} />
      {children}
      <IdleCover timeoutMs={30000} />
    </>
  );
}
