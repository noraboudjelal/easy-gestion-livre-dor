import {NextResponse} from "next/server";
import {getSupabaseAdmin} from "../../../../../../lib/supabaseAdmin";
import {requestHasValidOrigin} from "../../../../../../lib/admin/adminSession";
export const dynamic="force-dynamic";
const valid=t=>/^[0-9a-f-]{36}$/i.test(t||"");
const types={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/heic":"heic","image/heif":"heif"};
export async function POST(req,{params}){
 if(!requestHasValidOrigin(req))return NextResponse.json({error:"Origine refusée"},{status:403});
 if(!valid(params.token))return NextResponse.json({error:"Lien invalide"},{status:404});
 try{
 const {mime,size}=await req.json();
 if(!types[mime]||!Number.isInteger(size)||size<1||size>8*1024*1024)throw Error("Photo non acceptée (8 Mo maximum)");
 const db=getSupabaseAdmin();
 const {data:row}=await db.from("lehnova_souvenirs").select("id,status").eq("edit_token",params.token).single();
 if(!row||row.status!=="draft")throw Error("Ce lien n'est plus disponible");
 const path=row.id+"/photos/"+crypto.randomUUID()+"."+types[mime];
 const {data,error}=await db.storage.from("lehnova-souvenirs").createSignedUploadUrl(path);
 if(error)throw error;
 return NextResponse.json({path,token:data.token,mime});
 }catch(e){return NextResponse.json({error:e.message},{status:400})}
}
export async function PATCH(req,{params}){
 if(!requestHasValidOrigin(req))return NextResponse.json({error:"Origine refusée"},{status:403});
 if(!valid(params.token))return NextResponse.json({error:"Lien invalide"},{status:404});
 try{
 const {paths}=await req.json();
 if(!Array.isArray(paths)||paths.length>5||new Set(paths).size!==paths.length||paths.some(p=>typeof p!=="string"))throw Error("Cinq photos maximum");
 const db=getSupabaseAdmin();
 const {data:row}=await db.from("lehnova_souvenirs").select("id,status").eq("edit_token",params.token).single();
 if(!row||row.status!=="draft")throw Error("Ce lien n'est plus disponible");
 if(paths.some(p=>!new RegExp("^"+row.id+"/photos/[0-9a-f-]{36}\\.(jpg|png|webp|heic|heif)$","i").test(p)))throw Error("Photo invalide");
 for(const path of paths){const {data,error}=await db.storage.from("lehnova-souvenirs").info(path);if(error||!data)throw Error("Photo non reçue")}
 const {error}=await db.from("lehnova_souvenirs").update({photo_paths:paths,updated_at:new Date().toISOString()}).eq("id",row.id).eq("status","draft");
 if(error)throw error;
 return NextResponse.json({ok:true});
 }catch(e){return NextResponse.json({error:e.message},{status:400})}
}