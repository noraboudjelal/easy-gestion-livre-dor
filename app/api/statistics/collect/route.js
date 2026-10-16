import { createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { validateEvent } from '../../../../lib/statistics/model.mjs';

export const runtime = 'nodejs';
export async function POST(request) {
  // Require a same-origin browser POST; never accept cross-site beacons.
  if (request.headers.get('origin') !== new URL(request.url).origin ||
      request.headers.get('sec-fetch-site') === 'cross-site') return new NextResponse(null, { status: 403 });
  if (!request.headers.get('content-type')?.startsWith('application/json')) return new NextResponse(null, { status: 415 });
  if (/bot|crawler|spider|headless/i.test(request.headers.get('user-agent') || '')) return new NextResponse(null, { status: 204 });
  try {
    const reader = request.body?.getReader();
    if (!reader) return new NextResponse(null, { status: 400 });
    const chunks = []; let size = 0;
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 2048) { await reader.cancel(); return new NextResponse(null, { status: 413 }); }
      chunks.push(Buffer.from(value));
    }
    let body;
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { return new NextResponse(null, { status: 400 }); }
    if (!validateEvent(body)) return new NextResponse(null, { status: 400 });
    const secret = process.env.STATISTICS_HASH_SECRET;
    if (!secret || secret.length < 32) return new NextResponse(null, { status: 503 });
    const hash = createHmac('sha256', secret).update(`${body.catalogId}:${body.visitorId}`).digest('hex');
    const { error } = await getSupabaseAdmin().rpc('record_catalog_statistic', {
      p_event_id: body.eventId, p_catalog_id: body.catalogId, p_product_id: body.productId || null,
      p_kind: body.kind, p_visitor_hash: hash, p_session_id: body.sessionId,
    });
    if (error) return new NextResponse(null, { status: 503 });
    return new NextResponse(null, { status: 204 });
  } catch { return new NextResponse(null, { status: 503 }); }
}
