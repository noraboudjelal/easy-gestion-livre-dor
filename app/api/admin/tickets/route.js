import { NextResponse } from "next/server";
import { requestHasAdminSession, requestHasValidOrigin } from "../../../../lib/admin/adminSession";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

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

export async function GET(request) {
  if (!requestHasAdminSession(request)) return unauthorized();

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("ticket_businesses")
      .select("id, owner_id, name, slug, is_active, created_at, ticket_queues(id, is_open, current_number, last_issued_number)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ businesses: (data || []).map(serializeBusiness) });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Chargement impossible." }, { status: 500 });
  }
}

export async function POST(request) {
  if (!requestHasValidOrigin(request)) {
    return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  }
  if (!requestHasAdminSession(request)) return unauthorized();

  let createdUserId = null;
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const slug = normalizeSlug(body.slug || name);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!name || name.length > 100) throw new Error("Le nom du commerce est invalide.");
    if (!slug || slug.length > 80) throw new Error("Le slug est invalide.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("L'adresse e-mail est invalide.");
    if (password.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères.");

    const admin = getSupabaseAdmin();
    const { data: existing } = await admin.from("ticket_businesses").select("id").eq("slug", slug).maybeSingle();
    if (existing) return NextResponse.json({ error: "Ce slug est déjà utilisé." }, { status: 409 });

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { lehnova_service: "ticket", merchant: true },
    });
    if (authError) throw authError;
    createdUserId = authData.user.id;

    const { data: business, error: businessError } = await admin
      .from("ticket_businesses")
      .insert({ owner_id: createdUserId, name, slug, is_active: true })
      .select("id, owner_id, name, slug, is_active, created_at")
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
    if (createdUserId) {
      await getSupabaseAdmin().auth.admin.deleteUser(createdUserId).catch(() => {});
    }
    const status = /already|registered|exists/i.test(error.message || "") ? 409 : 400;
    return NextResponse.json({ error: error.message || "Création impossible." }, { status });
  }
}

