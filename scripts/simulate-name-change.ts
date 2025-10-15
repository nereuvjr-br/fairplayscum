import { Client, Databases, Query } from "node-appwrite";
import * as dotenv from "dotenv";

dotenv.config();

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

async function simulateNameChange() {
  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    console.log("🔄 Simulando mudança de nome para teste...\n");

    // Pegar o primeiro jogador
    const players = await databases.listDocuments(
      databaseId,
      "players",
      [Query.limit(1)]
    );

    if (players.documents.length === 0) {
      console.log("❌ Nenhum jogador encontrado");
      return;
    }

    const player = players.documents[0] as any;
    console.log(`👤 Jogador selecionado: ${player.currentName} (${player.steamid})`);
    console.log(`   Histórico atual:`, player.nameHistory);
    
    // Adicionar um novo nome simulado
    const newName = `${player.currentName}_New`;
    
    // Garantir que o histórico sempre contenha todos os nomes
    let updatedHistory = player.nameHistory || [player.currentName];
    
    // Se o nome atual ainda não está no histórico, adicionar
    if (!updatedHistory.includes(player.currentName)) {
      updatedHistory = [player.currentName, ...updatedHistory];
    }
    
    // Adicionar o novo nome no início
    if (!updatedHistory.includes(newName)) {
      updatedHistory = [newName, ...updatedHistory];
    }

    console.log(`\n📝 Atualizando para:`);
    console.log(`   Nome atual: ${newName}`);
    console.log(`   Histórico completo:`, updatedHistory);

    await databases.updateDocument(
      databaseId,
      "players",
      player.$id,
      {
        currentName: newName,
        nameHistory: updatedHistory,
      }
    );

    console.log("\n✅ Nome atualizado com sucesso!");
    console.log("\n💡 Acesse /players para ver o histórico de nomes em ação!");

  } catch (error: any) {
    console.error("❌ Erro:", error.message);
  }
}

simulateNameChange();
