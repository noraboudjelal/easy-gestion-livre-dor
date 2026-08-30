import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { createMerchantSessionToken, hashAccessCode, merchantBusinessIdFromRequest, merchantCookieOptions, normalizeAccessCode, TICKET_MERCHANT_COOKIE } from "../../../../../lib/ticket/merchantSession";
import { requestHasValidOrigin } from "../../../../../lib/admin/adminSession";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const businessId = merchantBusinessIdFromRequest(request);
  if (!businessId) return NextResponse.json({ authenticated: false });
  const { data } = await getSupabaseAdmin().from("ticket_businesses").select("id").eq("id", businessId).eq("is_active", true).maybeSingle();
  return NextResponse.json({ authenticated: Boolean(data) });
}

export async function POST(request) {
  if (!requestHasValidOrigin(request)) return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  const { code } = await request.json();
  const normalized = normalizeAccessCode(code);
  if (normalized.length < 6 || normalized.length > 32) return NextResponse.json({ error: "Code d’accès incorrect." }, { status: 401 });

  const { data } = await getSupabaseAdmin().from("ticket_businesses").select("id").eq("access_code_hash", hashAccessCode(normalized)).eq("is_active", true).maybeSingle();
  if (!data) return NextResponse.json({ error: "Code d’accès incorrect." }, { status: 401 });

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(TICKET_MERCHANT_COOKIE, createMerchantSessionToken(data.id), merchantCookieOptions());
  return response;
}

export async function DELETE(request) {
  if (!requestHasValidOrigin(request)) return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(TICKET_MERCHANT_COOKIE, "", { ...merchantCookieOptions(), maxAge: 0 });
  return response;
}
