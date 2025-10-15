import { NextResponse } from "next/server";
import { Client, Databases, ID } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";
const collectionId = "listplayer";

export async function POST(request: Request) {
  const { steamid, player, server } = await request.json();
  
  const client = new Client();
  client
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);
  
  const databases = new Databases(client);
  
  try {
    const doc = await databases.createDocument(
      databaseId,
      collectionId,
      ID.unique(),
      { steamid, player, server }
    );
    return NextResponse.json({ success: true, doc });
  } catch (error: unknown) {
    console.error("Appwrite error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ 
      success: false, 
      error: errorMessage
    }, { status: 500 });
  }
}
