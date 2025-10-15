import { NextResponse } from "next/server";
import { Client, Account } from "node-appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const apiKey = process.env.APPWRITE_API_KEY!; // precisa de permissão para criar sessão

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ success: false, error: "Email e senha são obrigatórios" }, { status: 400 });
  }

  try {
  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const account = new Account(client);

  // Criar sessão (server-side)
  const session = await account.createSession(email, password);

    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
