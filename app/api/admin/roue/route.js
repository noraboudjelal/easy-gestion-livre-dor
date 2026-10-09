import { NextResponse } from "next/server";
import { requestHasAdminSession, requestHasValidOrigin } from "../../../../lib/admin/adminSession";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export const dynamic = "force-dynamic";
const unauthorized = () => NextResponse.json({ error: "Connexion administrateur requise" }, { status: 401 });

export async function GET(request) {
 if (!requestHasAdminSession(request)) return unauthorized();
 const { data, error } = await getSupabaseAdmin().from("marketing_wheels").select("*").order("created_at", { ascending: false });
 return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ wheels: data });
}
export async function POST(request) {
 if (!requestHasValidOrigin(request)) return NextResponse.json({ error: "Origine refusée" }, { status: 403 });
 if (!requestHasAdminSession(request)) return unauthorized();
 try {
  const b = await request.json();
  const name = String(b.name || "").trim(), slug = String(b.slug || "").trim().toLowerCase();
  const prize = String(b.prize || "").trim();
  const min_purchase = Number(b.min_purchase), win_denominator = Number(b.win_denominator), max_winners = Number(b.max_winners);
  if (!name || name.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80 || !prize || prize.length > 120 ||
   !Number.isFinite(min_purchase) || min_purchase < 0 || min_purchase > 100000 ||
   !Number.isInteger(win_denominator) || win_denominator < 2 || win_denominator > 1000 ||
   !Number.isInteger(max_winners) || max_winners < 0 || max_winners > 100000) {
   return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
  }
  const { data, error } = await getSupabaseAdmin().from("marketing_wheels")
   .insert({ name, slug, prize, min_purchase, win_denominator, max_winners }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "23505" ? 409 : 400 });
  return NextResponse.json({ wheel: data }, { status: 201 });
 } catch { return NextResponse.json({ error: "Requête invalide." }, { status: 400 }); }
}
export async function PATCH(request) {
 if (!requestHasValidOrigin(request)) return NextResponse.json({ error: "Origine refusée" }, { status: 403 });
 if (!requestHasAdminSession(request)) return unauthorized();
 try {
  const b = await request.json();
  if (typeof b.id !== "string") throw new Error("ID manquant");
  const changes = {};
  if (typeof b.active === "boolean") changes.active = b.active;
  if (b.max_winners !== undefined && Number.isInteger(Number(b.max_winners)) && Number(b.max_winners) >= 0) changes.max_winners = Number(b.max_winners);
  if (b.win_denominator !== undefined && Number.isInteger(Number(b.win_denominator)) && Number(b.win_denominator) >= 2 && Number(b.win_denominator) <= 1000) changes.win_denominator = Number(b.win_denominator);
  if (Object.keys(changes).length === 0) throw new Error("Modification invalide");
  const { data, error } = await getSupabaseAdmin().from("marketing_wheels").update(changes).eq("id", b.id).select("*").single();
  if (error) throw error;
  return NextResponse.json({ wheel: data });
 } catch (e) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
