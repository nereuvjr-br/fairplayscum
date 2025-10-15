import { NextResponse } from "next/server";
import { Client, Databases, ID, Query } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

export async function POST(request: Request) {
  const { steamid, player, server, serverId } = await request.json();

  const client = new Client();
  client
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const databases = new Databases(client);

  try {
    const now = new Date().toISOString();
    let isNew = false;

    // Verificar se o jogador já existe na collection players
    const existingPlayers = await databases.listDocuments(
      databaseId,
      "players",
      [Query.equal("steamid", steamid)]
    );

    if (existingPlayers.documents.length > 0) {
      // Jogador existe - atualizar
      const existingPlayer = existingPlayers.documents[0];
      const nameHistory = existingPlayer.nameHistory || [];
      // Adicionar nome ao histórico se for diferente do atual
      if (player !== existingPlayer.currentName) {
        if (!nameHistory.includes(existingPlayer.currentName)) {
          nameHistory.push(existingPlayer.currentName);
        }
        if (!nameHistory.includes(player)) {
          nameHistory.push(player);
        }
      }
      await databases.updateDocument(
        databaseId,
        "players",
        existingPlayer.$id,
        {
          currentName: player,
          nameHistory: nameHistory,
          lastSeen: now,
        }
      );
      // Retornar erro informando que já existe, mas foi atualizado
      return NextResponse.json({ success: false, error: "SteamID já existe, dados atualizados.", updated: true });
    } else {
      // Jogador novo - criar
      await databases.createDocument(
        databaseId,
        "players",
        ID.unique(),
        {
          steamid,
          currentName: player,
          nameHistory: [],
          firstSeen: now,
          lastSeen: now,
        }
      );
      isNew = true;
    }

    // Registrar na collection listplayer
    const doc = await databases.createDocument(
      databaseId,
      "listplayer",
      ID.unique(),
      { steamid, player, server, serverId }
    );

    return NextResponse.json({ success: true, isNew, doc });
  } catch (error: unknown) {
    console.error("Appwrite error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
