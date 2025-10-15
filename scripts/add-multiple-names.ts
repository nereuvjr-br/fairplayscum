import { Client, Databases, Query } from "node-appwrite";
import * as dotenv from "dotenv";

dotenv.config();

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

async function addMultipleNames() {
  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    console.log("🔄 Adicionando múltiplos nomes históricos...\n");

    // Pegar alguns jogadores
    const players = await databases.listDocuments(
      databaseId,
      "players",
      [Query.limit(5)]
    );

    for (const player of players.documents) {
      const p = player as any;
      
      // Criar um histórico fictício de 3-5 nomes
      const numNames = Math.floor(Math.random() * 3) + 3; // 3 a 5 nomes
      const names = [p.currentName];
      
      for (let i = 1; i < numNames; i++) {
        names.push(`${p.currentName}_v${i}`);
      }

      console.log(`👤 ${p.currentName} (${p.steamid})`);
      console.log(`   Adicionando ${names.length} nomes: ${names.join(", ")}`);

      await databases.updateDocument(
        databaseId,
        "players",
        p.$id,
        {
          nameHistory: names,
        }
      );
    }

    console.log("\n✅ Históricos de nomes adicionados com sucesso!");
    console.log("💡 Acesse /players para ver os históricos!");

  } catch (error: any) {
    console.error("❌ Erro:", error.message);
  }
}

addMultipleNames();
