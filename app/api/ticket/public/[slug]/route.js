import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { offersUrl, offerPreviews } from '../../../../../lib/ticket/publicSettings.mjs';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export async function GET(request, { params }) {
  const reply = (body, status=200) => NextResponse.json(body, {status, headers:{'Cache-Control':'no-store'}});
  try {
    const admin = getSupabaseAdmin();
    const {data:business,error} = await admin.from('ticket_businesses')
      .select('id,name,slug,offers_url,offer_previews,public_screen_enabled').eq('slug',params.slug).eq('is_active',true).maybeSingle();
    if (error) throw error;
    if (!business) return reply({error:'Commerce introuvable.'},404);
    let offers = null;
    let previews = [];
    try { previews = offerPreviews(business.offer_previews); } catch {}
    try { offers = offersUrl(business.offers_url); } catch {}
    // This endpoint never accepts a device token or exposes a merchant code.
    const base = {business_id:business.id,business_name:business.name,slug:business.slug,offers_url:offers,offer_previews:previews,public_screen_enabled:business.public_screen_enabled};
    if (new URL(request.url).searchParams.get('screen') !== '1') return reply(base);
    if (!business.public_screen_enabled) return reply({error:'Écran public désactivé.'},404);
    const {data:queue,error:queueError} = await admin.from('ticket_queues').select('is_open,queue_mode,estimated_minutes_per_client').eq('business_id',business.id).maybeSingle();
    if (queueError) throw queueError;
    if (!queue || queue.queue_mode !== 'tickets') return reply({error:'Écran Ticket indisponible.'},404);
    const [waiting,called] = await Promise.all([
      admin.from('ticket_entries').select('number',{count:'exact'}).eq('business_id',business.id).eq('status','waiting').order('number').limit(5),
      admin.from('ticket_entries').select('number').eq('business_id',business.id).eq('status','called').order('number').limit(1),
    ]);
    if (waiting.error || called.error) throw waiting.error || called.error;
    return reply({...base,is_open:queue.is_open,current_number:called.data[0]?.number ?? null,
      next_numbers:waiting.data.map(t=>t.number),waiting_count:waiting.count,
      estimated_wait:queue.estimated_minutes_per_client > 0 ? waiting.count * queue.estimated_minutes_per_client : null});
  } catch { return reply({error:'La file est temporairement indisponible.'},503); }
}
