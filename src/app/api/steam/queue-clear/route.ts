import { NextResponse } from "next/server";
import { Client, Databases, Query } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

export async function POST(request: Request) {
  const { status } = await request.json();

  if (!status) {
    return NextResponse.json(
      { success: false, error: "Status is required (completed, failed, or all)" },
      { status: 400 }
    );
  }

  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    let deleted = 0;
    let hasMore = true;

    while (hasMore) {
      const queries = [Query.limit(100)];
      
      if (status !== "all") {
        queries.push(Query.equal("status", status));
      }

      const response = await databases.listDocuments(
        databaseId,
        "steamQueue",
        queries
      );

      if (response.documents.length === 0) {
        hasMore = false;
        break;
      }

      for (const doc of response.documents) {
        await databases.deleteDocument(databaseId, "steamQueue", doc.$id);
        deleted++;
      }

      if (response.documents.length < 100) {
        hasMore = false;
      }
    }

    return NextResponse.json({
      success: true,
      deleted,
      message: `${deleted} itens removidos da fila`,
    });
  } catch (error: any) {
    console.error("Error clearing queue:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
