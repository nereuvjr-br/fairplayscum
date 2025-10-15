import { NextResponse } from "next/server";
import { Client, Databases } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

export async function POST(request: Request) {
  const { reportId, adminName } = await request.json();

  if (!reportId || !adminName) {
    return NextResponse.json(
      { success: false, error: "reportId e adminName são obrigatórios" },
      { status: 400 }
    );
  }

  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    // Atualizar denúncia para aprovada
    await databases.updateDocument(
      databaseId,
      "playerVotes",
      reportId,
      {
        approved: true,
        approvedBy: adminName,
        approvedAt: new Date().toISOString(),
      }
    );

    return NextResponse.json({
      success: true,
      message: "Denúncia aprovada com sucesso",
    });
  } catch (error: any) {
    console.error("Error approving report:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
