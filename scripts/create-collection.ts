import { Client, Databases, ID, Permission, Role } from "node-appwrite";

const projectId = "68ef2d40000e144b455c";
const endpoint = "https://fra.cloud.appwrite.io/v1";
const apiKey = "standard_58a03631731cbc27063c16d60ad13f92003349ff9ceb4c34a7498a3fefb6dbed62fcea0b1fc2448292c718a60bf39400b1f9e87024613cc6381f7dbf6a34055de99737576f90196a858ce495067c64ad8dbb134768a7980bce36ee0b6e469cf55038600667f8533770d6fc2cc40fe3622d516bbd25f187bfea59558a85ce16f9";
const databaseId = "68ef2ed6000fa358405c";

async function createCollection() {
  const client = new Client();
  client
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const databases = new Databases(client);

  try {
    // Criar coleção
    const collection = await databases.createCollection(
      databaseId,
      "listplayer", // Collection ID
      "listplayer", // Collection Name
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ]
    );

    console.log("Coleção criada:", collection);

    // Criar atributo steamid
    await databases.createStringAttribute(
      databaseId,
      "listplayer",
      "steamid",
      255,
      true // required
    );
    console.log("Atributo 'steamid' criado");

    // Criar atributo player
    await databases.createStringAttribute(
      databaseId,
      "listplayer",
      "player",
      255,
      true // required
    );
    console.log("Atributo 'player' criado");

    // Criar atributo server
    await databases.createStringAttribute(
      databaseId,
      "listplayer",
      "server",
      255,
      true // required
    );
    console.log("Atributo 'server' criado");

    console.log("\n✅ Coleção 'listplayer' criada com sucesso!");
  } catch (error: any) {
    console.error("Erro ao criar coleção:", error.message);
    console.error("Detalhes:", error);
  }
}

createCollection();
