import {randomBytes} from "node:crypto";
import {NextResponse} from "next/server";
import {requestHasAdminSession,requestHasValidOrigin} from "../../../../lib/admin/adminSession";
import {getSupabaseAdmin} from "../../../../lib/supabaseAdmin";
export const dynamic="force-dynamic";
const deny=()=>NextResponse.json({error:"Connexion administrateur requise"},{status:401});
export async function GET(req){if(!requestHasAdminSession(req))return deny();const {data,error}=await getSupabaseAdmin().from("lehnova_souvenirs").select("*").order("created_at",{ascending:false});return error?NextResponse.json({error:error.message},{status:500}):NextResponse.json({items:data});}
export async function POST(req){if(!requestHasValidOrigin(req))return NextResponse.json({error:"Origine refusée"},{status:403});if(!requestHasAdminSession(req))return deny();const body=await req.json().catch(()=>({}));const language=body.language==="ar"?"ar":"fr";const {data,error}=await getSupabaseAdmin().from("lehnova_souvenirs").insert({language,edit_code:randomBytes(12).toString("base64url"),view_code:randomBytes(12).toString("base64url")}).select("*").single();return error?NextResponse.json({error:error.message},{status:500}):NextResponse.json({item:data},{status:201});}
export async function PATCH(req){if(!requestHasValidOrigin(req))return NextResponse.json({error:"Origine refusée"},{status:403});if(!requestHasAdminSession(req))return deny();try{const {id,approved,arabic_message}=await req.json();if(typeof id!=="string"||!/^[0-9a-f-]{36}$/i.test(id))throw Error("Paramètres invalides");if(typeof arabic_message==="string"){if(arabic_message.length>8000)throw Error("Texte trop long");const {data,error}=await getSupabaseAdmin().from("lehnova_souvenirs").update({arabic_message,updated_at:new Date().toISOString()}).eq("id",id).eq("language","ar").select("*").single();if(error)throw error;return NextResponse.json({item:data});}if(typeof approved!=="boolean")throw Error("Paramètres invalides");const db=getSupabaseAdmin();const {data:current}=await db.from("lehnova_souvenirs").select("status,language,arabic_message").eq("id",id).single();if(!current||(current.status==="draft"&&!(current.language==="ar"&&current.arabic_message?.trim())))throw Error("Le client n'a pas encore envoyé son message");const {data,error}=await db.from("lehnova_souvenirs").update({status:approved?"approved":"submitted",updated_at:new Date().toISOString()}).eq("id",id).select("*").single();if(error)throw error;return NextResponse.json({item:data});}catch(e){return NextResponse.json({error:e.message},{status:400});}}

export async function DELETE(req){
 if(!requestHasValidOrigin(req))return NextResponse.json({error:"Origine refusée"},{status:403});
 if(!requestHasAdminSession(req))return deny();
 try{
  const {id}=await req.json();
  if(typeof id!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return NextResponse.json({error:"Identifiant invalide"},{status:400});
  const db=getSupabaseAdmin();
  const {data:row,error:lookupError}=await db.from("lehnova_souvenirs").select("id,media_path").eq("id",id).single();
  if(lookupError||!row)return NextResponse.json({error:"Souvenir introuvable"},{status:404});
  if(row.media_path){
   const {error:storageError}=await db.storage.from("lehnova-souvenirs").remove([row.media_path]);
   if(storageError)return NextResponse.json({error:"Impossible de supprimer le fichier audio ou vidéo : "+storageError.message},{status:500});
  }
  const {error}=await db.from("lehnova_souvenirs").delete().eq("id",id);
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Suppression impossible"},{status:400});}
}
