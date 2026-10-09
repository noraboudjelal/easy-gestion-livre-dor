import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requestHasValidOrigin } from "../../../../lib/admin/adminSession";

export const dynamic = "force-dynamic";
export async function GET(request, { params }) {
 const { data, error } = await getSupabaseAdmin().from("marketing_wheels")
 .select("name,slug,min_purchase,win_denominator,active").eq("slug", params.slug).maybeSingle();
 if (error || !data || !data.active) return NextResponse.json({ error: "Roue indisponible" }, { status: 404 });
 return NextResponse.json({ wheel: data });
}
export async function POST(request, { params }) {
 if (!requestHasValidOrigin(request)) return NextResponse.json({ error: "Origine refusée" }, { status: 403 });
 try {
  const { token, receipt } = await request.json();
  const admin = getSupabaseAdmin();
  if (typeof receipt === "string") {
    const cleaned = receipt.trim().toUpperCase();
    if (!/^[A-Z0-9/_-]{3,64}$/.test(cleaned)) return NextResponse.json({ error: "Numéro de ticket invalide" }, { status: 400 });
    const { data, error } = await admin.rpc("marketing_wheel_play_receipt", { p_slug: params.slug, p_receipt: cleaned });
    if (error || !data?.length) return NextResponse.json({ error: error?.message || "Participation refusée" }, { status: 409 });
    return NextResponse.json({ won: data[0].won, prize: data[0].prize, play_day: data[0].play_day });
  }
  if (!/^[0-9a-f-]{36}$/i.test(String(token || ""))) return NextResponse.json({ error: "Participation invalide" }, { status: 400 });
  const { data, error } = await admin.rpc("marketing_wheel_play", { p_slug: params.slug, p_token: token });
  if (error || !data?.length) return NextResponse.json({ error: "Participation invalide ou déjà utilisée" }, { status: 409 });
  return NextResponse.json({ won: data[0].won, prize: data[0].prize });
 } catch { return NextResponse.json({ error: "Participation impossible" }, { status: 400 }); }
}
