import { NextResponse } from "next/server";
import qrcode from "../../../../lib/qrcode-generator.cjs";

export const runtime = "nodejs";

export async function GET(request) {
  const data = new URL(request.url).searchParams.get("data") || "";
  let parsed;
  try { parsed = new URL(data); } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  if (parsed.protocol !== "https:" || !["lehnova.fr", "www.lehnova.fr", "easy-gestion-toulouse.vercel.app"].includes(parsed.hostname)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  try {
    const qr = qrcode(0, "M");
    qr.addData(data);
    qr.make();
    const svg = qr.createSvgTag({ cellSize: 12, margin: 48 });
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Local QR generation failed", error);
    return NextResponse.json({ error: "QR generation unavailable" }, { status: 500 });
  }
}
