import { NextResponse } from "next/server";
import { requestHasAdminSession, requestHasValidOrigin } from "../../../../lib/admin/adminSession";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";
import { decryptAccessCode, encryptAccessCode, generateAccessCode, hashAccessCode } from "../../../../lib/ticket/merchantSession";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Session administrateur requise." }, { status: 401 });
}

function normalizeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function serializeBusiness(row) {
  const queue = Array.isArray(row.ticket_queues) ? row.ticket_queues[0] : row.ticket_queues;
  return {
    id: row.id,
    owner_id: row.owner_id,
    name: row.name,
    slug: row.slug,
    is_active: row.is_active,
    created_at: row.created_at,
    access_code: decryptAccessCode(row.access_code_encrypted),
    queue: queue
      ? {
          id: queue.id,
          is_open: queue.is_open,
          current_number: queue.current_number,
          last_issued_number: queue.last_issued_number,
        }
      : null,
  };
}

async function provisionAccessCode(admin, business) {
  if (business.access_code_hash && business.access_code_encrypted) return business;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const accessCode = generateAccessCode();
    const { data, error } = await admin
      .from("ticket_businesses")
      .update({ access_code_hash: hashAccessCode(accessCode), access_code_encrypted: encryptAccessCode(accessCode), updated_at: new Date().toISOString() })
      .eq("id", business.id)
      .select("id, owner_id, name, slug, is_active, created_at, access_code_hash, access_code_encrypted, ticket_queues(id, is_open, current_number, last_issued_number)")
      .single();
    if (!error) return data;
    if (error.code !== "23505") throw error;
  }
  throw new Error("Impossible de générer un code d’accès unique.");
}

export async function GET(request) {
  if (!requestHasAdminSession(request)) return unauthorized();

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("ticket_businesses")
      .select("id, owner_id, name, slug, is_active, created_at, access_code_hash, access_code_encrypted, ticket_queues(id, is_open, current_number, last_issued_number)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const businesses = await Promise.all((data || []).map((business) => provisionAccessCode(admin, business)));
    return NextResponse.json({ businesses: businesses.map(serializeBusiness) });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Chargement impossible." }, { status: 500 });
  }
}

export async function POST(request) {
  if (!requestHasValidOrigin(request)) {
    return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  }
  if (!requestHasAdminSession(request)) return unauthorized();

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const slug = normalizeSlug(body.slug || name);

    if (!name || name.length > 100) throw new Error("Le nom du commerce est invalide.");
    if (!slug || slug.length > 80) throw new Error("Le slug est invalide.");

    const admin = getSupabaseAdmin();
    const { data: existing } = await admin.from("ticket_businesses").select("id").eq("slug", slug).maybeSingle();
    if (existing) return NextResponse.json({ error: "Ce slug est déjà utilisé." }, { status: 409 });

    const accessCode = generateAccessCode();
    const { data: business, error: businessError } = await admin
      .from("ticket_businesses")
      .insert({ name, slug, is_active: true, access_code_hash: hashAccessCode(accessCode), access_code_encrypted: encryptAccessCode(accessCode) })
      .select("id, owner_id, name, slug, is_active, created_at, access_code_hash, access_code_encrypted")
      .single();
    if (businessError) throw businessError;

    const { data: queue, error: queueError } = await admin
      .from("ticket_queues")
      .insert({ business_id: business.id })
      .select("id, is_open, current_number, last_issued_number")
      .single();
    if (queueError) throw queueError;

    return NextResponse.json({ business: serializeBusiness({ ...business, ticket_queues: [queue] }) }, { status: 201 });
  } catch (error) {
    const status = /already|registered|exists/i.test(error.message || "") ? 409 : 400;
    return NextResponse.json({ error: error.message || "Création impossible." }, { status });
  }
}
