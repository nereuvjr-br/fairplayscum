import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.AUTH_JWT_SECRET || "please_set_a_secret";

export async function GET(request: Request) {
  try {
    const cookie = request.headers.get('cookie') || '';
    const match = cookie.split(';').map(s=>s.trim()).find(s => s.startsWith('scum_auth='));
    if (!match) return NextResponse.json({ success: false, error: 'No session' }, { status: 401 });
    const token = match.split('=')[1];
  const payload = jwt.verify(token, JWT_SECRET) as any;
  console.log('[API/auth/session] JWT payload:', payload);
  return NextResponse.json({ success: true, user: payload });
  } catch (error: any) {
  console.error("[API/auth/session] Session check error:", error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 401 });
  }
}
