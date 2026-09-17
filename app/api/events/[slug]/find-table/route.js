import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export async function POST(request, { params }) {
  try {
    const slug = decodeURIComponent(String(params?.slug || "")).trim();
    const body = await request.json();
    const query = normalizeName(body?.name);

    if (!slug || slug.length > 120) {
      return NextResponse.json({ error: "Événement invalide." }, { status: 400 });
    }
    if (query.length < 3 || query.length > 120) {
      return NextResponse.json({ error: "Saisissez votre prénom et votre nom." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (eventError) throw eventError;
    if (!event?.id) {
      return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
    }

    const { data: tables, error: tablesError } = await supabase
      .from("event_table_cards")
      .select("table_number,table_name,guest_names")
      .eq("event_id", event.id);

    if (tablesError) throw tablesError;

    const matches = (tables || []).filter((table) =>
      (table.guest_names || []).some((guest) => normalizeName(guest) === query)
    );

    if (matches.length === 0) {
      return NextResponse.json({ found: false });
    }

    if (matches.length > 1) {
      return NextResponse.json({ found: false, ambiguous: true });
    }

    return NextResponse.json({
      found: true,
      table: {
        number: matches[0].table_number,
        name: matches[0].table_name || null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Recherche impossible." },
      { status: 500 }
    );
  }
}
