import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.AUTH_JWT_SECRET || "please_set_a_secret";

export async function GET(request: Request) {
  try {
    const cookie = request.headers.get('cookie') || '';
    const match = cookie.split(';').map(s=>s.trim()).find(s => s.startsWith('scum_auth='));
    if (!match) return NextResponse.json({ success: false, error: 'No session' }, { status: 401 });
    const token = match.split('=')[1];
  const payload = jwt.verify(token, JWT_SECRET) as { id: string; name: string; };
  console.log('[API/auth/session] JWT payload:', payload);
  return NextResponse.json({ success: true, user: payload });
  } catch (error: unknown) {
  console.error("[API/auth/session] Session check error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 401 });
  }
}
