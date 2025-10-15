import { Client, Databases } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

async function updateVotesCollection() {
  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  console.log("🔧 Atualizando collection playerVotes...\n");

  try {
    // Adicionar campo voterIp
    await databases.createStringAttribute(
      databaseId,
      "playerVotes",
      "voterIp",
      255,
      false
    );
    console.log("✅ Campo voterIp adicionado");

    // Adicionar campo reason
    await databases.createStringAttribute(
      databaseId,
      "playerVotes",
      "reason",
      1000,
      true // Required
    );
    console.log("✅ Campo reason adicionado");

    // Aguardar alguns segundos para os atributos serem processados
    console.log("\n⏳ Aguardando processamento dos atributos...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Criar índice para voterIp
    await databases.createIndex(
      databaseId,
      "playerVotes",
      "idx_voter_ip",
      "key" as any,
      ["steamid", "voterIp"],
      ["ASC", "ASC"]
    );
    console.log("✅ Índice idx_voter_ip criado");

    console.log("\n✅ Collection atualizada com sucesso!");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("⚠️ Campos já existem. Collection já está atualizada.");
    } else {
      console.error("❌ Erro ao atualizar collection:", error.message);
      throw error;
    }
  }
}

updateVotesCollection();
