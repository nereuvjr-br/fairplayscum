import { Client, Databases } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

async function addClipsField() {
  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  console.log("🔧 Adicionando campo clips à collection playerVotes...\n");

  try {
    // Adicionar campo clips (JSON array)
    await databases.createStringAttribute(
      databaseId,
      "playerVotes",
      "clips",
      10000, // Permitir URLs longas (JSON array)
      false // Não obrigatório
    );
    console.log("✅ Campo clips adicionado");

    console.log("\n✅ Collection atualizada com sucesso!");
    console.log("\n💡 O campo clips pode armazenar um array JSON de objetos:");
    console.log("   [{ type: 'youtube', url: '...' }, { type: 'medal', url: '...' }]");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("⚠️ Campo clips já existe. Collection já está atualizada.");
    } else {
      console.error("❌ Erro ao atualizar collection:", error.message);
      throw error;
    }
  }
}

addClipsField();
