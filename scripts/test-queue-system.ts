import { Client, Databases, ID, Query } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

async function testQueue() {
  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  console.log("🔍 Verificando fila...\n");

  try {
    // 1. Verificar status atual
    const pending = await databases.listDocuments(
      databaseId,
      "steamQueue",
      [Query.equal("status", "pending"), Query.limit(10)]
    );

    const processing = await databases.listDocuments(
      databaseId,
      "steamQueue",
      [Query.equal("status", "processing"), Query.limit(10)]
    );

    const completed = await databases.listDocuments(
      databaseId,
      "steamQueue",
      [Query.equal("status", "completed"), Query.limit(10)]
    );

    console.log("📊 Status da Fila:");
    console.log(`  Pendentes: ${pending.total}`);
    console.log(`  Processando: ${processing.total}`);
    console.log(`  Concluídos: ${completed.total}`);
    console.log();

    // 2. Se não houver pendentes, adicionar alguns para teste
    if (pending.total === 0) {
      console.log("📝 Adicionando itens de teste à fila...\n");

      // Buscar alguns jogadores
      const players = await databases.listDocuments(
        databaseId,
        "players",
        [Query.limit(3)]
      );

      if (players.documents.length === 0) {
        console.log("❌ Nenhum jogador encontrado no banco de dados");
        return;
      }

      for (const player of players.documents) {
        const steamid = (player as any).steamid;
        
        // Adicionar consulta de perfil
        await databases.createDocument(
          databaseId,
          "steamQueue",
          ID.unique(),
          {
            steamid,
            queryType: "summary",
            status: "pending",
            priority: 5,
            scheduledFor: new Date().toISOString(),
            attempts: 0,
          }
        );
        console.log(`  ✓ Adicionado: ${steamid} (summary)`);

        // Adicionar consulta de bans
        await databases.createDocument(
          databaseId,
          "steamQueue",
          ID.unique(),
          {
            steamid,
            queryType: "bans",
            status: "pending",
            priority: 5,
            scheduledFor: new Date(Date.now() + 2000).toISOString(),
            attempts: 0,
          }
        );
        console.log(`  ✓ Adicionado: ${steamid} (bans)`);
      }

      console.log(`\n✅ ${players.documents.length * 2} itens adicionados à fila!`);
    } else {
      console.log("✅ Já existem itens pendentes na fila");
      
      // Mostrar os 5 primeiros pendentes
      console.log("\n📋 Próximos itens a serem processados:");
      pending.documents.slice(0, 5).forEach((item: any, index: number) => {
        console.log(`  ${index + 1}. ${item.steamid} - ${item.queryType} (${item.status})`);
      });
    }

    console.log("\n💡 Agora acesse http://localhost:3001/queue e clique em 'Iniciar Processamento'");
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
  }
}

testQueue();
