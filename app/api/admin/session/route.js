import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  adminCookieOptions,
  createAdminSessionToken,
  requestHasAdminSession,
  requestHasValidOrigin,
  verifyAdminPassword,
} from "../../../../lib/admin/adminSession";

export const dynamic = "force-dynamic";

export async function GET(request) {
  return NextResponse.json({ authenticated: requestHasAdminSession(request) });
}

export async function POST(request) {
  if (!requestHasValidOrigin(request)) {
    return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  }

  try {
    const { password } = await request.json();
    if (!verifyAdminPassword(typeof password === "string" ? password : "")) {
      return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
    }

    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(ADMIN_COOKIE_NAME, createAdminSessionToken(), adminCookieOptions());
    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message || "Connexion impossible." }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!requestHasValidOrigin(request)) {
    return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  }
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(ADMIN_COOKIE_NAME, "", { ...adminCookieOptions(), maxAge: 0 });
  return response;
}

