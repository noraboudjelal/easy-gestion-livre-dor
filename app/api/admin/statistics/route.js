import { NextResponse } from 'next/server';
import { requestHasAdminSession } from '../../../../lib/admin/adminSession';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { UUID, validRange } from '../../../../lib/statistics/model.mjs';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request) {
  try {
    if (!requestHasAdminSession(request)) return NextResponse.json({ error: 'Connexion administrateur requise.' }, { status: 401, headers });
    const q = new URL(request.url).searchParams;
    const catalogId=q.get('catalogId'), from=q.get('from'), to=q.get('to'), bucket=q.get('bucket');
    if (!UUID.test(catalogId || '') || !validRange(from,to,bucket)) return NextResponse.json({ error: 'Période invalide (13 mois d’historique, 366 jours maximum).' }, { status: 400, headers });
    const db = getSupabaseAdmin();
    const { data: catalog, error: catalogError } = await db.from('catalogs').select('id,client,catalog_title,catalog_kind').eq('id', catalogId).maybeSingle();
    if (catalogError) throw catalogError;
    if (!catalog) return NextResponse.json({ error: 'Catalogue introuvable.' }, { status: 404, headers });
    // A future merchant endpoint must verify a Supabase Auth user against
    // catalog_statistics_members BEFORE calling this service-role-only RPC.
    const { data, error } = await db.rpc('catalog_statistics_report', { p_catalog_id: catalogId, p_from: from, p_to: to, p_bucket: bucket });
    if (error) throw error;
    return NextResponse.json({ catalog, ...data }, { headers });
  } catch { return NextResponse.json({ error: 'Statistiques indisponibles. Vérifiez la configuration et la migration Supabase.' }, { status: 503, headers }); }
}
