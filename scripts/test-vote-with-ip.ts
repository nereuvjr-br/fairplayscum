import { Client, Databases, Query } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

async function testVote() {
  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  console.log("🔍 Listando todos os votos...\n");

  try {
    const votes = await databases.listDocuments(
      databaseId,
      "playerVotes",
      [Query.limit(10)]
    );

    console.log(`📊 Total de votos: ${votes.total}\n`);

    votes.documents.forEach((vote: any, index: number) => {
      console.log(`Voto #${index + 1}:`);
      console.log(`  SteamID: ${vote.steamid}`);
      console.log(`  Tipo: ${vote.voteType}`);
      console.log(`  VoterId: ${vote.voterId}`);
      console.log(`  IP: ${vote.voterIp || 'N/A'}`);
      console.log(`  Motivo: ${vote.reason || 'N/A'}`);
      console.log(`  Data: ${vote.createdAt}`);
      console.log('---\n');
    });
  } catch (error: any) {
    console.error("❌ Erro ao listar votos:", error.message);
  }
}

testVote();
