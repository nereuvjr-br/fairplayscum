import { NextResponse } from "next/server";
import { Client, Account, Users } from "node-appwrite";
import { SignJWT } from "jose";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const apiKey = process.env.APPWRITE_API_KEY!;
const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_JWT_SECRET || "please_set_a_secret"
);
const JWT_EXPIRES_IN = "7d";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ success: false, error: "Email e senha são obrigatórios" }, { status: 400 });
  }

  try {
    const client = new Client();
    client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    const account = new Account(client);
    const users = new Users(client);

    console.log("Tentando criar sessão com:", { email, password });

    // Corrigir chamada para criar sessão no Appwrite
    const session = await account.createEmailPasswordSession(email, password);

    // Obter detalhes do usuário
    const user = await users.get(session.userId);

    // Gerar JWT
    const payload = {
      $id: user.$id,
      email: user.email,
      name: user.name || null,
    };
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(JWT_SECRET);

    // Definir cookie HttpOnly com SameSite=Lax
    const response = NextResponse.json({ success: true });
    response.headers.set(
      "Set-Cookie",
      `scum_auth=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Expires=${new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toUTCString()}`
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ success: false, error: "Credenciais inválidas" }, { status: 401 });
  }
}
