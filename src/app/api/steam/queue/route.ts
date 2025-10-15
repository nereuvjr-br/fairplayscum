import { NextResponse } from "next/server";
import { Client, Databases, ID } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

export async function POST(request: Request) {
  const { steamids, queryTypes } = await request.json();

  if (!steamids || !Array.isArray(steamids) || steamids.length === 0) {
    return NextResponse.json(
      { success: false, error: "steamids array is required" },
      { status: 400 }
    );
  }

  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    const queuedItems = [];
    const now = new Date();

    for (let i = 0; i < steamids.length; i++) {
      const steamid = steamids[i];
      
      // Adicionar consulta de summary se solicitado
      if (queryTypes.includes("summary")) {
        const scheduledTime = new Date(now.getTime() + (i * 35000) + Math.random() * 5000); // 30-40s por item
        
        const summaryQueue = await databases.createDocument(
          databaseId,
          "steamQueue",
          ID.unique(),
          {
            steamid,
            queryType: "summary",
            status: "pending",
            priority: 1,
            scheduledFor: scheduledTime.toISOString(),
            attempts: 0,
          }
        );
        queuedItems.push(summaryQueue);
      }

      // Adicionar consulta de bans se solicitado
      if (queryTypes.includes("bans")) {
        const scheduledTime = new Date(now.getTime() + (i * 35000) + Math.random() * 5000 + 15000);
        
        const bansQueue = await databases.createDocument(
          databaseId,
          "steamQueue",
          ID.unique(),
          {
            steamid,
            queryType: "bans",
            status: "pending",
            priority: 1,
            scheduledFor: scheduledTime.toISOString(),
            attempts: 0,
          }
        );
        queuedItems.push(bansQueue);
      }
    }

    return NextResponse.json({
      success: true,
      queued: queuedItems.length,
      message: `${queuedItems.length} consultas adicionadas à fila`,
    });
  } catch (error: any) {
    console.error("Error queuing steam queries:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
