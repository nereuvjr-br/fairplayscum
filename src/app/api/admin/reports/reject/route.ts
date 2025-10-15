import { NextResponse } from "next/server";
import { Client, Databases } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

export async function POST(request: Request) {
  const { reportId } = await request.json();

  if (!reportId) {
    return NextResponse.json(
      { success: false, error: "reportId é obrigatório" },
      { status: 400 }
    );
  }

  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    // Deletar denúncia
    await databases.deleteDocument(
      databaseId,
      "playerVotes",
      reportId
    );

    return NextResponse.json({
      success: true,
      message: "Denúncia rejeitada e removida com sucesso",
    });
  } catch (error: unknown) {
    console.error("Error rejecting report:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
