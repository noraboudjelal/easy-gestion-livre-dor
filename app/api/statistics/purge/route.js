import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
export const dynamic = 'force-dynamic';
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${secret || ''}`);
  if (!secret || secret.length < 32 || actual.length !== expected.length || !timingSafeEqual(actual,expected)) return new NextResponse(null,{status:401});
  try {
    const { data, error } = await getSupabaseAdmin().rpc('purge_catalog_statistics');
    if (error) throw error;
    return NextResponse.json({ removed: data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return new NextResponse(null,{status:503}); }
}
