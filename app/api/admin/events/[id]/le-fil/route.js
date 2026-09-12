import { NextResponse } from "next/server";
import { requestHasAdminSession, requestHasValidOrigin } from "../../../../../../lib/admin/adminSession";
import { getSupabaseAdmin } from "../../../../../../lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Session administrateur requise." }, { status: 401 });
}

export async function GET(request, { params }) {
  if (!requestHasAdminSession(request)) return unauthorized();
  try {
    const supabase = getSupabaseAdmin();
    const [{ data: event, error: eventError }, { data: settings, error: settingsError }, { data: tables, error: tablesError }] = await Promise.all([
      supabase.from("events").select("id, client, event_title, event_type, event_date, slug, playlist_enabled").eq("id", params.id).single(),
      supabase.from("event_fil_settings").select("welcome_message,cover_image_url").eq("event_id", params.id).maybeSingle(),
      supabase.from("event_table_cards").select("*").eq("event_id", params.id).order("position").order("created_at"),
    ]);
    if (eventError) return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
    if (settingsError || tablesError) throw settingsError || tablesError;
    return NextResponse.json({ event, welcome_message: settings?.welcome_message || "", cover_image_url: settings?.cover_image_url || "", tables: tables || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Chargement impossible." }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  if (!requestHasAdminSession(request)) return unauthorized();
  if (!requestHasValidOrigin(request)) return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  try {
    const body = await request.json();
    const supabase = getSupabaseAdmin();

    let eventTitle;
    if (Object.prototype.hasOwnProperty.call(body, "event_title")) {
      eventTitle = typeof body.event_title === "string" ? body.event_title.trim() : "";
      if (!eventTitle) return NextResponse.json({ error: "Le titre ne peut pas être vide." }, { status: 400 });
      if (eventTitle.length > 120) return NextResponse.json({ error: "Le titre ne peut pas dépasser 120 caractères." }, { status: 400 });
      const { data: updatedEvent, error: eventUpdateError } = await supabase
        .from("events")
        .update({ event_title: eventTitle })
        .eq("id", params.id)
        .select("event_title")
        .single();
      if (eventUpdateError) throw eventUpdateError;
      eventTitle = updatedEvent.event_title;
    }

    const { data: existing, error: existingError } = await supabase.from("event_fil_settings").select("welcome_message,cover_image_url").eq("event_id", params.id).maybeSingle();
    if (existingError) throw existingError;

    const welcomeMessage = Object.prototype.hasOwnProperty.call(body, "welcome_message")
      ? (typeof body.welcome_message === "string" ? body.welcome_message.trim() : "")
      : (existing?.welcome_message || "");
    const coverImageUrl = Object.prototype.hasOwnProperty.call(body, "cover_image_url")
      ? (typeof body.cover_image_url === "string" ? body.cover_image_url.trim() : "")
      : (existing?.cover_image_url || "");

    if (welcomeMessage.length > 500) return NextResponse.json({ error: "La phrase d’accueil ne peut pas dépasser 500 caractères." }, { status: 400 });
    if (coverImageUrl.length > 2000) return NextResponse.json({ error: "L’adresse de la couverture est trop longue." }, { status: 400 });

    if (!welcomeMessage && !coverImageUrl) {
      const { error } = await supabase.from("event_fil_settings").delete().eq("event_id", params.id);
      if (error) throw error;
      return NextResponse.json({ welcome_message: "", cover_image_url: "", ...(eventTitle ? { event_title: eventTitle } : {}) });
    }

    const { data, error } = await supabase.from("event_fil_settings")
      .upsert({ event_id: params.id, welcome_message: welcomeMessage || null, cover_image_url: coverImageUrl || null, updated_at: new Date().toISOString() })
      .select("welcome_message,cover_image_url").single();
    if (error) throw error;
    return NextResponse.json({ welcome_message: data.welcome_message || "", cover_image_url: data.cover_image_url || "", ...(eventTitle ? { event_title: eventTitle } : {}) });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Enregistrement impossible." }, { status: 500 });
  }
}
