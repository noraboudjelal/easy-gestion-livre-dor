import { NextResponse } from "next/server";
import { requestHasAdminSession, requestHasValidOrigin } from "../../../../../lib/admin/adminSession";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";

export async function POST(request) {
 if (!requestHasAdminSession(request)) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
 if (!requestHasValidOrigin(request)) return NextResponse.json({ error: "Origine refusée" }, { status: 403 });
 try {
  const { id, purchaseAmount } = await request.json();
  const admin = getSupabaseAdmin();
  const { data: wheel, error: wheelError } = await admin.from("marketing_wheels").select("*").eq("id", id).single();
  if (wheelError || !wheel || !wheel.active) return NextResponse.json({ error: "Roue non disponible" }, { status: 404 });
  if (!Number.isFinite(Number(purchaseAmount)) || Number(purchaseAmount) < Number(wheel.min_purchase)) {
   return NextResponse.json({ error: "Montant d'achat insuffisant" }, { status: 400 });
  }
  if (wheel.winners_count >= wheel.max_winners) return NextResponse.json({ error: "Tous les cadeaux ont été distribués" }, { status: 409 });
  // Each approved purchase gets one server-side single-use token.
  const { data: ticket, error } = await admin.from("marketing_wheel_tickets").insert({ wheel_id: id }).select("token").single();
  if (error) throw error;
  return NextResponse.json({ url: new URL("/roue/" + wheel.slug + "?token=" + ticket.token, request.url).origin + "/roue/" + wheel.slug + "?token=" + ticket.token });
 } catch { return NextResponse.json({ error: "Création impossible" }, { status: 400 }); }
}
