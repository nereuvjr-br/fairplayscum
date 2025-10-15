import { NextResponse } from "next/server";
import { Client, Databases, Query } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const serverId = searchParams.get("serverId") || "";

  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    // Buscar todos os players
    const queries = [Query.limit(500)];
    
    const playersResponse = await databases.listDocuments(
      databaseId,
      "players",
      queries
    );

    // Buscar dados da Steam para cada player
    const playersWithData = await Promise.all(
      playersResponse.documents.map(async (player: any) => {
        // Buscar dados de perfil Steam
        let steamData = null;
        try {
          const steamDataResponse = await databases.listDocuments(
            databaseId,
            "steamData",
            [Query.equal("steamid", player.steamid), Query.limit(1)]
          );
          steamData = steamDataResponse.documents[0] || null;
        } catch (error) {
          console.error(`Erro ao buscar steamData para ${player.steamid}:`, error);
        }

        // Buscar dados de bans Steam
        let steamBans = null;
        try {
          const steamBansResponse = await databases.listDocuments(
            databaseId,
            "steamBans",
            [Query.equal("steamid", player.steamid), Query.limit(1)]
          );
          steamBans = steamBansResponse.documents[0] || null;
        } catch (error) {
          console.error(`Erro ao buscar steamBans para ${player.steamid}:`, error);
        }

        // Buscar última aparição em servidor
        let lastServer = null;
        try {
          const listPlayerResponse = await databases.listDocuments(
            databaseId,
            "listplayer",
            [
              Query.equal("steamid", player.steamid),
              Query.orderDesc("$createdAt"),
              Query.limit(1)
            ]
          );
          
          if (listPlayerResponse.documents.length > 0) {
            const listPlayer = listPlayerResponse.documents[0];
            // Buscar dados do servidor
            try {
              const serverResponse = await databases.getDocument(
                databaseId,
                "servers",
                listPlayer.serverId
              );
              lastServer = {
                serverId: serverResponse.$id,
                serverName: serverResponse.name,
                serverRegion: serverResponse.region,
                serverFlag: serverResponse.flag,
              };
            } catch (error) {
              console.error(`Erro ao buscar servidor ${listPlayer.serverId}:`, error);
            }
          }
        } catch (error) {
          console.error(`Erro ao buscar listplayer para ${player.steamid}:`, error);
        }

        return {
          ...player,
          steamData,
          steamBans,
          lastServer,
        };
      })
    );

    // Filtrar por busca se necessário
    let filteredPlayers = playersWithData;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPlayers = playersWithData.filter(
        (p) =>
          p.currentName?.toLowerCase().includes(searchLower) ||
          p.steamid?.includes(searchLower) ||
          p.steamData?.personaname?.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por servidor se necessário
    if (serverId) {
      filteredPlayers = filteredPlayers.filter(
        (p) => p.lastServer?.serverId === serverId
      );
    }

    return NextResponse.json({
      success: true,
      players: filteredPlayers,
      total: filteredPlayers.length,
    });
  } catch (error: any) {
    console.error("Error fetching unified players data:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
