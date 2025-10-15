import { Client, Databases } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

async function addApprovalFields() {
  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  console.log("🔧 Adicionando campos de aprovação à collection playerVotes...\n");

  try {
    // Adicionar campo approved (boolean)
    await databases.createBooleanAttribute(
      databaseId,
      "playerVotes",
      "approved",
      false, // Não obrigatório (null = pendente)
      false  // Valor padrão: false
    );
    console.log("✅ Campo approved adicionado");

    // Adicionar campo approvedBy (quem aprovou)
    await databases.createStringAttribute(
      databaseId,
      "playerVotes",
      "approvedBy",
      255,
      false // Não obrigatório
    );
    console.log("✅ Campo approvedBy adicionado");

    // Adicionar campo approvedAt (quando foi aprovado)
    await databases.createStringAttribute(
      databaseId,
      "playerVotes",
      "approvedAt",
      255,
      false // Não obrigatório
    );
    console.log("✅ Campo approvedAt adicionado");

    // Aguardar processamento
    console.log("\n⏳ Aguardando processamento dos atributos...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Criar índice para approved
    await databases.createIndex(
      databaseId,
      "playerVotes",
      "idx_approved",
      "key" as any,
      ["approved"],
      ["ASC"]
    );
    console.log("✅ Índice idx_approved criado");

    console.log("\n✅ Collection atualizada com sucesso!");
    console.log("\n💡 Sistema de aprovação:");
    console.log("   - approved: false = pendente aprovação");
    console.log("   - approved: true = denúncia aprovada");
    console.log("   - approvedBy: ID/nome do admin que aprovou");
    console.log("   - approvedAt: Data/hora da aprovação");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("⚠️ Campos já existem. Collection já está atualizada.");
    } else {
      console.error("❌ Erro ao atualizar collection:", error.message);
      throw error;
    }
  }
}

addApprovalFields();
