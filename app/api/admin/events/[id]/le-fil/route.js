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
    const [{ data: event, error: eventError }, { data: settings, error: settingsError }, { data: tables, error: tablesError }] =
      await Promise.all([
        supabase.from("events").select("id, client, event_title, event_type, event_date, slug, playlist_enabled").eq("id", params.id).single(),
        supabase.from("event_fil_settings").select("welcome_message").eq("event_id", params.id).maybeSingle(),
        supabase.from("event_table_cards").select("*").eq("event_id", params.id).order("position").order("created_at"),
      ]);

    if (eventError) return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
    if (settingsError || tablesError) throw settingsError || tablesError;

    return NextResponse.json({
      event,
      welcome_message: settings?.welcome_message || "",
      tables: tables || [],
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Chargement impossible." }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  if (!requestHasAdminSession(request)) return unauthorized();
  if (!requestHasValidOrigin(request)) return NextResponse.json({ error: "Origine refusée." }, { status: 403 });

  try {
    const body = await request.json();
    const welcomeMessage = typeof body.welcome_message === "string" ? body.welcome_message.trim() : "";
    if (welcomeMessage.length > 500) {
      return NextResponse.json({ error: "La phrase d’accueil ne peut pas dépasser 500 caractères." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!welcomeMessage) {
      const { error } = await supabase.from("event_fil_settings").delete().eq("event_id", params.id);
      if (error) throw error;
      return NextResponse.json({ welcome_message: "" });
    }

    const { data, error } = await supabase
      .from("event_fil_settings")
      .upsert({ event_id: params.id, welcome_message: welcomeMessage, updated_at: new Date().toISOString() })
      .select("welcome_message")
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message || "Enregistrement impossible." }, { status: 500 });
  }
}

