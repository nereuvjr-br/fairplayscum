import { NextResponse } from "next/server";
import { Client, Account } from "node-appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const apiKey = process.env.APPWRITE_API_KEY!;

export async function POST(request: Request) {
  try {
    const client = new Client();
    client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    const account = new Account(client);

    // Tentar excluir sessões no Appwrite (se aplicável)
    try { await account.deleteSessions(); } catch (e) { /* non-fatal */ }

    const res = NextResponse.json({ success: true });
    // limpar cookie
    res.headers.set('Set-Cookie', `scum_auth=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
    return res;
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
