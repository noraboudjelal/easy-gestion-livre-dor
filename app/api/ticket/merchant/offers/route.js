import {NextResponse} from 'next/server';
import {getSupabaseAdmin} from '../../../../../lib/supabaseAdmin';
import {merchantBusinessIdFromRequest} from '../../../../../lib/ticket/merchantSession';
import {requestHasValidOrigin} from '../../../../../lib/admin/adminSession';
import {offersUrl,offerPreviews} from '../../../../../lib/ticket/publicSettings.mjs';

export const dynamic='force-dynamic';
export const fetchCache='force-no-store';
async function business(request) {
  const id=merchantBusinessIdFromRequest(request);
  if(!id) return null;
  const {data,error}=await getSupabaseAdmin().from('ticket_businesses').select('id,offers_url,offer_previews').eq('id',id).eq('is_active',true).maybeSingle();
  if(error) throw error;
  return data;
}
export async function GET(request) {
  try {
    const data=await business(request);
    return data?NextResponse.json(data,{headers:{'Cache-Control':'no-store'}}):NextResponse.json({error:'Session commerçant requise.'},{status:401});
  }catch {return NextResponse.json({error:'Offres indisponibles.'},{status:503});}
}
export async function PATCH(request) {
  if(!requestHasValidOrigin(request)) return NextResponse.json({error:'Origine refusée.'},{status:403});
  try {
    const data=await business(request);
    if(!data) return NextResponse.json({error:'Session commerçant requise.'},{status:401});
    const body=await request.json();
    const changes={offers_url:offersUrl(body.offers_url),offer_previews:offerPreviews(body.offer_previews),updated_at:new Date().toISOString()};
    if(changes.offer_previews.some(o=>!o.url&&!changes.offers_url)) throw new Error('Indiquez le lien des offres ou un lien pour chaque carte.');
    const {error}=await getSupabaseAdmin().from('ticket_businesses').update(changes).eq('id',data.id);
    if(error) throw error;
    return NextResponse.json({success:true});
  }catch(error){return NextResponse.json({error:error.message||'Enregistrement impossible.'},{status:400});}
}
