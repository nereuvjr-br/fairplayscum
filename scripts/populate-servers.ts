import { Client, Databases, ID } from "node-appwrite";

const projectId = "68ef2d40000e144b455c";
const endpoint = "https://fra.cloud.appwrite.io/v1";
const apiKey = "standard_58a03631731cbc27063c16d60ad13f92003349ff9ceb4c34a7498a3fefb6dbed62fcea0b1fc2448292c718a60bf39400b1f9e87024613cc6381f7dbf6a34055de99737576f90196a858ce495067c64ad8dbb134768a7980bce36ee0b6e469cf55038600667f8533770d6fc2cc40fe3622d516bbd25f187bfea59558a85ce16f9";
const databaseId = "68ef2ed6000fa358405c";

const servers = [
  { serverId: "BR-01", name: "BR-01 (São Paulo)", region: "South America", flag: "🇧🇷", active: true },
  { serverId: "BR-02", name: "BR-02 (Rio de Janeiro)", region: "South America", flag: "🇧🇷", active: true },
  { serverId: "US-01", name: "US-01 (Virginia)", region: "North America", flag: "🇺🇸", active: true },
  { serverId: "EU-01", name: "EU-01 (Frankfurt)", region: "Europe", flag: "🇪🇺", active: true },
  { serverId: "TEST", name: "Servidor de Testes", region: "Development", flag: "🧪", active: true },
];

async function populateServers() {
  const client = new Client();
  client
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const databases = new Databases(client);

  console.log("🚀 Populando servidores...\n");

  for (const server of servers) {
    try {
      const doc = await databases.createDocument(
        databaseId,
        "servers",
        ID.unique(),
        server
      );
      console.log(`✅ Servidor criado: ${server.name} (${doc.$id})`);
    } catch (error: any) {
      console.error(`❌ Erro ao criar ${server.name}:`, error.message);
    }
  }

  console.log("\n🎉 Servidores populados com sucesso!");
}

populateServers();
