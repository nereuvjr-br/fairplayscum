import { NextResponse } from "next/server";
import { Client, Databases, Query } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

export async function GET() {
  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    const [pending, processing, completed, errors] = await Promise.all([
      databases.listDocuments(databaseId, "steamQueue", [Query.equal("status", "pending"), Query.limit(1)]),
      databases.listDocuments(databaseId, "steamQueue", [Query.equal("status", "processing"), Query.limit(1)]),
      databases.listDocuments(databaseId, "steamQueue", [Query.equal("status", "completed"), Query.limit(1)]),
      databases.listDocuments(databaseId, "steamQueue", [Query.equal("status", "error"), Query.limit(1)]),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        pending: pending.total,
        processing: processing.total,
        completed: completed.total,
        errors: errors.total,
      },
    });
  } catch (error: any) {
    console.error("Error fetching queue stats:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
