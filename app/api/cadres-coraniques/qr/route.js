import { NextResponse } from "next/server";

export async function GET(request) {
  const data = new URL(request.url).searchParams.get("data") || "";
  if (!data.startsWith("https://lehnova.fr/") && !data.startsWith("https://www.lehnova.fr/")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Use a backup QR provider when the primary provider is unavailable.
  const providers = [
    "https://api.qrserver.com/v1/create-qr-code/?size=800x800&margin=12&data=" + encodeURIComponent(data),
    "https://quickchart.io/qr?size=800&margin=12&text=" + encodeURIComponent(data),
  ];

  for (const url of providers) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok || !(response.headers.get("content-type") || "").includes("image/")) continue;
      const bytes = await response.arrayBuffer();
      if (!bytes.byteLength) continue;
      return new NextResponse(bytes, {
        headers: {
          "Content-Type": response.headers.get("content-type") || "image/png",
          "Cache-Control": "no-store",
        },
      });
    } catch {
      // Try the next provider.
    }
  }
  return NextResponse.json({ error: "QR generation unavailable" }, { status: 502 });
}
