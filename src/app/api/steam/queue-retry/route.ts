import { NextResponse } from "next/server";
import { Client, Databases } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

export async function POST(request: Request) {
  const { documentId } = await request.json();

  if (!documentId) {
    return NextResponse.json(
      { success: false, error: "Document ID is required" },
      { status: 400 }
    );
  }

  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    const now = new Date();
    const scheduledTime = new Date(now.getTime() + 5000); // 5 segundos

    await databases.updateDocument(
      databaseId,
      "steamQueue",
      documentId,
      {
        status: "pending",
        scheduledFor: scheduledTime.toISOString(),
        error: null,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Item reagendado para processamento",
    });
  } catch (error: any) {
    console.error("Error retrying queue item:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
