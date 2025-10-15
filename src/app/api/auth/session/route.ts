import { NextResponse } from "next/server";
import { Client, Account } from "node-appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const apiKey = process.env.APPWRITE_API_KEY!;

export async function GET(request: Request) {
  try {
    const client = new Client();
    client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    const account = new Account(client);

    const user = await account.get();
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Session check error:", error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 401 });
  }
}
