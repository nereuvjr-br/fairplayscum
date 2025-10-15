import { Client, Databases, Query } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

async function monitorQueue() {
  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  console.log("📊 Monitor de Fila - Atualizando a cada 5 segundos");
  console.log("Pressione Ctrl+C para parar\n");

  let iteration = 0;

  const check = async () => {
    try {
      const pending = await databases.listDocuments(
        databaseId,
        "steamQueue",
        [Query.equal("status", "pending"), Query.limit(1)]
      );

      const processing = await databases.listDocuments(
        databaseId,
        "steamQueue",
        [Query.equal("status", "processing"), Query.limit(1)]
      );

      const completed = await databases.listDocuments(
        databaseId,
        "steamQueue",
        [Query.equal("status", "completed"), Query.limit(1)]
      );

      const failed = await databases.listDocuments(
        databaseId,
        "steamQueue",
        [Query.equal("status", "failed"), Query.limit(1)]
      );

      const timestamp = new Date().toLocaleTimeString();
      iteration++;

      console.clear();
      console.log("📊 Monitor de Fila - Atualizando a cada 5 segundos");
      console.log("Pressione Ctrl+C para parar");
      console.log("=".repeat(60));
      console.log(`\n⏰ ${timestamp} (Iteração #${iteration})\n`);
      console.log(`  ⏳ Pendentes:    ${pending.total}`);
      console.log(`  ⚙️  Processando: ${processing.total}`);
      console.log(`  ✅ Concluídos:   ${completed.total}`);
      console.log(`  ❌ Falhas:       ${failed.total}`);
      console.log(`  📊 Total:        ${pending.total + processing.total + completed.total + failed.total}`);

      if (processing.total > 0) {
        console.log("\n🔄 Processando agora:");
        processing.documents.slice(0, 3).forEach((item: any) => {
          console.log(`     • ${item.steamid} (${item.queryType})`);
        });
      }

      if (pending.total === 0 && processing.total === 0) {
        console.log("\n🎉 Fila vazia! Todos os itens foram processados.");
      }
    } catch (error: any) {
      console.error("❌ Erro ao monitorar:", error.message);
    }
  };

  // Primeira verificação imediata
  await check();

  // Verificações periódicas
  setInterval(check, 5000);
}

monitorQueue();
