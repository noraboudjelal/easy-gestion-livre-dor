import {NextResponse} from "next/server";
import {getSupabaseAdmin} from "../../../lib/supabaseAdmin";
export const dynamic="force-dynamic";
export async function GET(request,{params}){const code=params.code;if(!/^[A-Za-z0-9_-]{12,24}$/.test(code||""))return new Response("Lien introuvable",{status:404});const {data}=await getSupabaseAdmin().from("lehnova_souvenirs").select("edit_token").eq("edit_code",code).single();if(!data)return new Response("Lien introuvable",{status:404});return NextResponse.redirect(new URL("/events/preparer/"+data.edit_token,request.url),{status:307,headers:{"Cache-Control":"no-store","Referrer-Policy":"no-referrer"}});}
