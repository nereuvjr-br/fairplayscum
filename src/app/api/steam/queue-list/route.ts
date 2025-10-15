import { NextResponse } from "next/server";
import { Client, Databases, Query } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";
  const limit = parseInt(searchParams.get("limit") || "100");

  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    const queries = [
      Query.orderDesc("scheduledFor"),
      Query.limit(limit),
    ];

    if (status !== "all") {
      queries.push(Query.equal("status", status));
    }

    const response = await databases.listDocuments(
      databaseId,
      "steamQueue",
      queries
    );

    return NextResponse.json({
      success: true,
      items: response.documents,
      total: response.total,
    });
  } catch (error: any) {
    console.error("Error listing queue:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
