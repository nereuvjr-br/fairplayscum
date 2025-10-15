import { Client, Databases, Query } from "node-appwrite";
import * as dotenv from "dotenv";

dotenv.config();

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

async function checkQueue() {
  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    console.log("🔍 Verificando fila de consultas...\n");

    // Buscar todos os itens da fila
    const queue = await databases.listDocuments(
      databaseId,
      "steamQueue",
      [Query.limit(100), Query.orderDesc("$createdAt")]
    );

    console.log(`Total de itens na fila: ${queue.total}\n`);

    queue.documents.forEach((doc: any) => {
      const scheduledDate = new Date(doc.scheduledFor);
      const now = new Date();
      const isReady = scheduledDate <= now;
      
      console.log(`📋 ${doc.steamid} - ${doc.queryType}`);
      console.log(`   Status: ${doc.status}`);
      console.log(`   Tentativas: ${doc.attempts}`);
      console.log(`   Agendado: ${doc.scheduledFor}`);
      console.log(`   ${isReady ? '✅ PRONTO' : '⏳ AGUARDANDO'} para processar`);
      if (doc.error) {
        console.log(`   ❌ Erro: ${doc.error}`);
      }
      console.log("");
    });

    // Verificar quantos estão prontos para processar
    const now = new Date().toISOString();
    const readyToProcess = await databases.listDocuments(
      databaseId,
      "steamQueue",
      [
        Query.equal("status", "pending"),
        Query.lessThanEqual("scheduledFor", now),
      ]
    );

    console.log(`\n🚀 ${readyToProcess.documents.length} consultas prontas para processar agora`);

  } catch (error: any) {
    console.error("❌ Erro:", error.message);
  }
}

checkQueue();
