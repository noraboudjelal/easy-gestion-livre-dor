import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requestHasValidOrigin } from "../../../../lib/admin/adminSession";

export const dynamic = "force-dynamic";
export async function GET(request, { params }) {
 const { data, error } = await getSupabaseAdmin().from("marketing_wheels")
 .select("name,slug,min_purchase,active").eq("slug", params.slug).maybeSingle();
 if (error || !data || !data.active) return NextResponse.json({ error: "Roue indisponible" }, { status: 404 });
 return NextResponse.json({ wheel: data });
}
export async function POST(request, { params }) {
 if (!requestHasValidOrigin(request)) return NextResponse.json({ error: "Origine refusée" }, { status: 403 });
 try {
  const { token } = await request.json();
  if (!/^[0-9a-f-]{36}$/i.test(String(token || ""))) return NextResponse.json({ error: "Participation invalide" }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().rpc("marketing_wheel_play", { p_slug: params.slug, p_token: token });
  if (error || !data?.length) return NextResponse.json({ error: "Participation invalide ou déjà utilisée" }, { status: 409 });
  return NextResponse.json({ won: data[0].won, prize: data[0].prize });
 } catch { return NextResponse.json({ error: "Participation impossible" }, { status: 400 }); }
}
