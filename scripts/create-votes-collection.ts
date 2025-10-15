import { Client, Databases, Permission, Role, IndexType } from "node-appwrite";
import * as dotenv from "dotenv";

dotenv.config();

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

async function createVotesCollection() {
  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    console.log("🚀 Criando collection de votos dos jogadores...\n");

    // Collection playerVotes
    try {
      await databases.createCollection(
        databaseId,
        "playerVotes",
        "Player Votes",
        [
          Permission.read(Role.any()),
          Permission.create(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
        ]
      );
      console.log("✅ Coleção 'playerVotes' criada");
    } catch (error: unknown) {
      if ((error as any).code === 409) console.log("✅ Coleção 'playerVotes' já existe");
      else throw error;
    }

    // Atributos playerVotes
    const attributes = [
      { name: "steamid", type: "string", size: 50, required: true },
      { name: "voterId", type: "string", size: 255, required: true },
      { name: "voteType", type: "string", size: 20, required: true }, // like, dislike, neutral
      { name: "createdAt", type: "datetime", required: true },
      { name: "updatedAt", type: "datetime", required: true },
    ];

    for (const attr of attributes) {
      try {
        if (attr.type === "string") {
          await databases.createStringAttribute(
            databaseId,
            "playerVotes",
            attr.name,
            attr.size!,
            attr.required
          );
        } else if (attr.type === "datetime") {
          await databases.createDatetimeAttribute(
            databaseId,
            "playerVotes",
            attr.name,
            attr.required
          );
        }
        console.log(`  ✓ Atributo '${attr.name}' criado`);
      } catch (error: unknown) {
        if ((error as any).code === 409) console.log(`  ℹ️  Atributo '${attr.name}' já existe`);
        else throw error;
      }
    }

    // Criar índices para melhorar performance
    console.log("\n📊 Criando índices...");
    
    try {
      await databases.createIndex(
        databaseId,
        "playerVotes",
        "idx_steamid",
        IndexType.Key,
        ["steamid"],
        ["ASC"]
      );
      console.log("  ✓ Índice 'idx_steamid' criado");
    } catch (error: unknown) {
      if ((error as any).code === 409) console.log("  ℹ️  Índice 'idx_steamid' já existe");
      else console.log("  ⚠️  Erro ao criar índice idx_steamid:", (error as any).message);
    }

    try {
      await databases.createIndex(
        databaseId,
        "playerVotes",
        "idx_voter",
        IndexType.Key,
        ["voterId", "steamid"],
        ["ASC", "ASC"]
      );
      console.log("  ✓ Índice 'idx_voter' criado");
    } catch (error: unknown) {
      if ((error as any).code === 409) console.log("  ℹ️  Índice 'idx_voter' já existe");
      else console.log("  ⚠️  Erro ao criar índice idx_voter:", (error as any).message);
    }

    console.log("\n✅ Collection de votos criada com sucesso!");
    console.log("💡 Aguarde alguns segundos para os índices serem criados antes de usar");

  } catch (error: unknown) {
    console.error("❌ Erro:", (error as any).message);
  }
}

createVotesCollection();
