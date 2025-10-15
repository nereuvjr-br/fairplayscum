import { Client, Databases, Query } from "node-appwrite";
import * as dotenv from "dotenv";

dotenv.config();

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

async function checkCollections() {
  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    console.log("🔍 Verificando collections...\n");

    // Verificar steamData
    const steamData = await databases.listDocuments(
      databaseId,
      "steamData",
      [Query.limit(5)]
    );
    console.log(`✅ steamData: ${steamData.total} documentos`);
    if (steamData.documents.length > 0) {
      console.log("   Exemplo:", JSON.stringify(steamData.documents[0], null, 2));
    }

    // Verificar steamBans
    const steamBans = await databases.listDocuments(
      databaseId,
      "steamBans",
      [Query.limit(5)]
    );
    console.log(`\n✅ steamBans: ${steamBans.total} documentos`);
    if (steamBans.documents.length > 0) {
      console.log("   Exemplo:", JSON.stringify(steamBans.documents[0], null, 2));
    }

    // Verificar steamQueue
    const steamQueue = await databases.listDocuments(
      databaseId,
      "steamQueue",
      [Query.limit(10), Query.orderDesc("$createdAt")]
    );
    console.log(`\n✅ steamQueue: ${steamQueue.total} documentos`);
    
    const statusCount = {
      pending: 0,
      processing: 0,
      completed: 0,
      error: 0
    };
    
    steamQueue.documents.forEach((doc: any) => {
      if (doc.status in statusCount) {
        statusCount[doc.status as keyof typeof statusCount]++;
      }
    });
    
    console.log("   Status:");
    console.log(`   - Pending: ${statusCount.pending}`);
    console.log(`   - Processing: ${statusCount.processing}`);
    console.log(`   - Completed: ${statusCount.completed}`);
    console.log(`   - Error: ${statusCount.error}`);

    // Verificar players
    const players = await databases.listDocuments(
      databaseId,
      "players",
      [Query.limit(5)]
    );
    console.log(`\n✅ players: ${players.total} documentos`);

  } catch (error: any) {
    console.error("❌ Erro:", error.message);
  }
}

checkCollections();
