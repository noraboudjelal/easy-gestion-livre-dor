import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { merchantBusinessIdFromRequest } from '../../../../../lib/ticket/merchantSession';
import { statisticsDate } from '../../../../../lib/ticket/publicSettings.mjs';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export async function GET(request) {
  const reply=(body,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
  try {
    const id=merchantBusinessIdFromRequest(request);
    if (!id) return reply({error:'Session commerçant requise.'},401);
    const admin=getSupabaseAdmin();
    const {data,error}=await admin.from('ticket_businesses').select('id,ticket_queues(queue_mode)').eq('id',id).eq('is_active',true).maybeSingle();
    if (error) throw error;
    const queue=Array.isArray(data?.ticket_queues)?data.ticket_queues[0]:data?.ticket_queues;
    if (!data || queue?.queue_mode !== 'tickets') return reply({error:'Accès refusé.'},403);
    const search=new URL(request.url).searchParams;
    const day=search.get('day'), period=search.get('period');
    if (!statisticsDate(day) || !['day','week','month'].includes(period)) return reply({error:'Période invalide.'},400);
    // The tenant comes exclusively from the signed cookie, never the URL/body.
    const result=await admin.rpc('ticket_server_affluence',{p_business_id:id,p_day:day,p_period:period});
    if(result.error) throw result.error;
    return reply(result.data);
  } catch { return reply({error:'Statistiques temporairement indisponibles.'},503); }
}
