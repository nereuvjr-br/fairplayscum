import { Client, Databases, ID, Permission, Role } from "node-appwrite";

const projectId = "68ef2d40000e144b455c";
const endpoint = "https://fra.cloud.appwrite.io/v1";
const apiKey = "standard_58a03631731cbc27063c16d60ad13f92003349ff9ceb4c34a7498a3fefb6dbed62fcea0b1fc2448292c718a60bf39400b1f9e87024613cc6381f7dbf6a34055de99737576f90196a858ce495067c64ad8dbb134768a7980bce36ee0b6e469cf55038600667f8533770d6fc2cc40fe3622d516bbd25f187bfea59558a85ce16f9";
const databaseId = "68ef2ed6000fa358405c";

async function completeCollections() {
  const client = new Client();
  client
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const databases = new Databases(client);

  try {
    console.log("🚀 Completando coleção de servidores...\n");

    // Completar atributos da coleção servers
    try {
      await databases.createBooleanAttribute(
        databaseId,
        "servers",
        "active",
        false,
        true
      );
      console.log("  ✓ Atributo 'active' criado");
    } catch (error: any) {
      if (error.code === 409) {
        console.log("  ℹ️  Atributo 'active' já existe");
      } else {
        console.error("  ❌ Erro ao criar 'active':", error.message);
      }
    }

    console.log("\n🚀 Criando coleção de jogadores...\n");

    // Criar coleção de players
    try {
      const playersCollection = await databases.createCollection(
        databaseId,
        "players",
        "Jogadores",
        [
          Permission.read(Role.any()),
          Permission.create(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
        ]
      );
      console.log("✅ Coleção 'players' criada:", playersCollection.$id);
    } catch (error: any) {
      if (error.code === 409) {
        console.log("✅ Coleção 'players' já existe");
      } else {
        throw error;
      }
    }

    // Atributos da coleção players
    try {
      await databases.createStringAttribute(
        databaseId,
        "players",
        "steamid",
        50,
        true
      );
      console.log("  ✓ Atributo 'steamid' criado");
    } catch (error: any) {
      if (error.code === 409) console.log("  ℹ️  Atributo 'steamid' já existe");
      else throw error;
    }

    try {
      await databases.createStringAttribute(
        databaseId,
        "players",
        "currentName",
        100,
        true
      );
      console.log("  ✓ Atributo 'currentName' criado");
    } catch (error: any) {
      if (error.code === 409) console.log("  ℹ️  Atributo 'currentName' já existe");
      else throw error;
    }

    try {
      await databases.createStringAttribute(
        databaseId,
        "players",
        "nameHistory",
        10000,
        false,
        undefined,
        true // array
      );
      console.log("  ✓ Atributo 'nameHistory' criado (array)");
    } catch (error: any) {
      if (error.code === 409) console.log("  ℹ️  Atributo 'nameHistory' já existe");
      else throw error;
    }

    try {
      await databases.createDatetimeAttribute(
        databaseId,
        "players",
        "firstSeen",
        false
      );
      console.log("  ✓ Atributo 'firstSeen' criado");
    } catch (error: any) {
      if (error.code === 409) console.log("  ℹ️  Atributo 'firstSeen' já existe");
      else throw error;
    }

    try {
      await databases.createDatetimeAttribute(
        databaseId,
        "players",
        "lastSeen",
        false
      );
      console.log("  ✓ Atributo 'lastSeen' criado");
    } catch (error: any) {
      if (error.code === 409) console.log("  ℹ️  Atributo 'lastSeen' já existe");
      else throw error;
    }

    console.log("\n🚀 Atualizando coleção listplayer...\n");

    // Adicionar campo serverId na coleção existente listplayer
    try {
      await databases.createStringAttribute(
        databaseId,
        "listplayer",
        "serverId",
        50,
        false
      );
      console.log("  ✓ Atributo 'serverId' adicionado em 'listplayer'");
    } catch (error: any) {
      if (error.code === 409) {
        console.log("  ℹ️  Atributo 'serverId' já existe em 'listplayer'");
      } else {
        throw error;
      }
    }

    console.log("\n🎉 Todas as coleções foram configuradas com sucesso!\n");
    console.log("📋 Resumo:");
    console.log("  - servers: Para gerenciar servidores");
    console.log("    Campos: serverId, name, region, flag, active");
    console.log("  - players: Para gerenciar jogadores com histórico de nomes");
    console.log("    Campos: steamid, currentName, nameHistory[], firstSeen, lastSeen");
    console.log("  - listplayer: Atualizada com vínculo ao servidor");
    console.log("    Campos: steamid, player, server, serverId");

  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    console.error("Detalhes:", error);
  }
}

completeCollections();
