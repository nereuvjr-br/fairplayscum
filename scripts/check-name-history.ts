import { Client, Databases, Query } from "node-appwrite";
import * as dotenv from "dotenv";

dotenv.config();

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

async function checkNameHistory() {
  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    console.log("🔍 Verificando histórico de nomes dos jogadores...\n");

    const players = await databases.listDocuments(
      databaseId,
      "players",
      [Query.limit(100)]
    );

    console.log(`Total de jogadores: ${players.total}\n`);

    let withMultipleNames = 0;
    let withSingleName = 0;

    players.documents.forEach((player: any) => {
      const nameCount = player.nameHistory?.length || 0;
      
      if (nameCount > 1) {
        withMultipleNames++;
        console.log(`👤 ${player.currentName} (${player.steamid})`);
        console.log(`   Total de nomes: ${nameCount}`);
        console.log(`   Nomes:`);
        player.nameHistory.forEach((name: string, idx: number) => {
          console.log(`   ${idx + 1}. ${name}`);
        });
        console.log("");
      } else {
        withSingleName++;
      }
    });

    console.log("\n📊 Resumo:");
    console.log(`   Com múltiplos nomes: ${withMultipleNames}`);
    console.log(`   Com nome único: ${withSingleName}`);

  } catch (error: any) {
    console.error("❌ Erro:", error.message);
  }
}

checkNameHistory();
