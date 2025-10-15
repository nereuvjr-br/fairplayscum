import { NextResponse } from "next/server";
import { Client, Databases } from "appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "68ef2d40000e144b455c";
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const databaseId = "68ef2ed6000fa358405c";
const collectionId = "listplayer";

const client = new Client();
client.setEndpoint(endpoint).setProject(projectId);
const databases = new Databases(client);

export async function POST(request: Request) {
  const { steamid, player, server } = await request.json();
  try {
    const doc = await databases.createDocument(
      databaseId,
      collectionId,
      "unique()",
      { steamid, player, server }
    );
    return NextResponse.json({ success: true, doc });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
