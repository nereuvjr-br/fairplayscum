import { Client, Databases, ID, Permission, Role } from "node-appwrite";

const projectId = "68ef2d40000e144b455c";
const endpoint = "https://fra.cloud.appwrite.io/v1";
const apiKey = "standard_58a03631731cbc27063c16d60ad13f92003349ff9ceb4c34a7498a3fefb6dbed62fcea0b1fc2448292c718a60bf39400b1f9e87024613cc6381f7dbf6a34055de99737576f90196a858ce495067c64ad8dbb134768a7980bce36ee0b6e469cf55038600667f8533770d6fc2cc40fe3622d516bbd25f187bfea59558a85ce16f9";
const databaseId = "68ef2ed6000fa358405c";

async function createSteamCollections() {
  const client = new Client();
  client
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const databases = new Databases(client);

  try {
    console.log("🚀 Criando collection de dados da Steam...\n");

    // Collection steamData - Dados dos jogadores da Steam
    try {
      await databases.createCollection(
        databaseId,
        "steamData",
        "Steam Data",
        [
          Permission.read(Role.any()),
          Permission.create(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
        ]
      );
      console.log("✅ Coleção 'steamData' criada");
    } catch (error: any) {
      if (error.code === 409) console.log("✅ Coleção 'steamData' já existe");
      else throw error;
    }

    // Atributos steamData
    const steamDataAttrs = [
      { name: "steamid", type: "string", size: 50, required: true },
      { name: "personaname", type: "string", size: 100, required: false },
      { name: "profileurl", type: "string", size: 255, required: false },
      { name: "avatar", type: "string", size: 255, required: false },
      { name: "avatarmedium", type: "string", size: 255, required: false },
      { name: "avatarfull", type: "string", size: 255, required: false },
      { name: "communityvisibilitystate", type: "integer", required: false },
      { name: "profilestate", type: "integer", required: false },
      { name: "personastate", type: "integer", required: false },
      { name: "lastUpdated", type: "datetime", required: false },
    ];

    for (const attr of steamDataAttrs) {
      try {
        if (attr.type === "string") {
          await databases.createStringAttribute(databaseId, "steamData", attr.name, attr.size!, attr.required);
        } else if (attr.type === "integer") {
          await databases.createIntegerAttribute(databaseId, "steamData", attr.name, attr.required);
        } else if (attr.type === "datetime") {
          await databases.createDatetimeAttribute(databaseId, "steamData", attr.name, attr.required);
        }
        console.log(`  ✓ Atributo '${attr.name}' criado`);
      } catch (error: any) {
        if (error.code === 409) console.log(`  ℹ️  Atributo '${attr.name}' já existe`);
        else throw error;
      }
    }

    console.log("\n🚀 Criando collection de bans da Steam...\n");

    // Collection steamBans
    try {
      await databases.createCollection(
        databaseId,
        "steamBans",
        "Steam Bans",
        [
          Permission.read(Role.any()),
          Permission.create(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
        ]
      );
      console.log("✅ Coleção 'steamBans' criada");
    } catch (error: any) {
      if (error.code === 409) console.log("✅ Coleção 'steamBans' já existe");
      else throw error;
    }

    // Atributos steamBans
    const steamBansAttrs = [
      { name: "steamid", type: "string", size: 50, required: true },
      { name: "CommunityBanned", type: "boolean", required: false },
      { name: "VACBanned", type: "boolean", required: false },
      { name: "NumberOfVACBans", type: "integer", required: false },
      { name: "DaysSinceLastBan", type: "integer", required: false },
      { name: "NumberOfGameBans", type: "integer", required: false },
      { name: "EconomyBan", type: "string", size: 50, required: false },
      { name: "lastUpdated", type: "datetime", required: false },
    ];

    for (const attr of steamBansAttrs) {
      try {
        if (attr.type === "string") {
          await databases.createStringAttribute(databaseId, "steamBans", attr.name, attr.size!, attr.required);
        } else if (attr.type === "integer") {
          await databases.createIntegerAttribute(databaseId, "steamBans", attr.name, attr.required);
        } else if (attr.type === "boolean") {
          await databases.createBooleanAttribute(databaseId, "steamBans", attr.name, attr.required);
        } else if (attr.type === "datetime") {
          await databases.createDatetimeAttribute(databaseId, "steamBans", attr.name, attr.required);
        }
        console.log(`  ✓ Atributo '${attr.name}' criado`);
      } catch (error: any) {
        if (error.code === 409) console.log(`  ℹ️  Atributo '${attr.name}' já existe`);
        else throw error;
      }
    }

    console.log("\n🚀 Criando collection de fila de consultas...\n");

    // Collection steamQueue - Fila de consultas
    try {
      await databases.createCollection(
        databaseId,
        "steamQueue",
        "Steam Query Queue",
        [
          Permission.read(Role.any()),
          Permission.create(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
        ]
      );
      console.log("✅ Coleção 'steamQueue' criada");
    } catch (error: any) {
      if (error.code === 409) console.log("✅ Coleção 'steamQueue' já existe");
      else throw error;
    }

    // Atributos steamQueue
    const queueAttrs = [
      { name: "steamid", type: "string", size: 50, required: true },
      { name: "queryType", type: "string", size: 50, required: true }, // "summary" ou "bans"
      { name: "status", type: "string", size: 20, required: true }, // "pending", "processing", "completed", "error"
      { name: "priority", type: "integer", required: false },
      { name: "scheduledFor", type: "datetime", required: false },
      { name: "lastAttempt", type: "datetime", required: false },
      { name: "attempts", type: "integer", required: false },
      { name: "error", type: "string", size: 500, required: false },
    ];

    for (const attr of queueAttrs) {
      try {
        if (attr.type === "string") {
          await databases.createStringAttribute(databaseId, "steamQueue", attr.name, attr.size!, attr.required);
        } else if (attr.type === "integer") {
          await databases.createIntegerAttribute(databaseId, "steamQueue", attr.name, attr.required);
        } else if (attr.type === "datetime") {
          await databases.createDatetimeAttribute(databaseId, "steamQueue", attr.name, attr.required);
        }
        console.log(`  ✓ Atributo '${attr.name}' criado`);
      } catch (error: any) {
        if (error.code === 409) console.log(`  ℹ️  Atributo '${attr.name}' já existe`);
        else throw error;
      }
    }

    console.log("\n🎉 Collections da Steam criadas com sucesso!\n");
    console.log("📋 Resumo:");
    console.log("  - steamData: Perfis dos jogadores da Steam");
    console.log("  - steamBans: Histórico de bans");
    console.log("  - steamQueue: Fila de consultas agendadas");

  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    console.error("Detalhes:", error);
  }
}

createSteamCollections();
