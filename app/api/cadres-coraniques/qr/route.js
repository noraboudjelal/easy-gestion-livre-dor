import { NextResponse } from "next/server";
export async function GET(request){
 const data=new URL(request.url).searchParams.get("data")||"";
 if(!data.startsWith("https://lehnova.fr/")&&!data.startsWith("https://www.lehnova.fr/"))return NextResponse.json({error:"Invalid URL"},{status:400});
 try{
  const remote=await fetch("https://api.qrserver.com/v1/create-qr-code/?size=800x800&margin=12&data="+encodeURIComponent(data),{cache:"no-store"});
  if(!remote.ok)throw new Error("QR provider unavailable");
  return new NextResponse(await remote.arrayBuffer(),{headers:{"Content-Type":"image/png","Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"QR generation unavailable"},{status:502});}
}