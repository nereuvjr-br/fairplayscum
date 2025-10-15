import { NextResponse } from "next/server";
import { Client, Databases, Query } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");
  const search = searchParams.get("search") || "";
  const includeQueried = searchParams.get("includeQueried") === "true";

  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    const queries = [Query.limit(limit), Query.offset(offset)];
    
    if (search) {
      queries.push(Query.search("currentName", search));
    }

    const players = await databases.listDocuments(
      databaseId,
      "players",
      queries
    );

    // Se não incluir já consultados, filtrar
    if (!includeQueried) {
      const playersWithStatus = await Promise.all(
        players.documents.map(async (player) => {
          // Verificar se já tem dados da Steam
          const [steamData, steamBans] = await Promise.all([
            databases.listDocuments(
              databaseId,
              "steamData",
              [Query.equal("steamid", player.steamid), Query.limit(1)]
            ),
            databases.listDocuments(
              databaseId,
              "steamBans",
              [Query.equal("steamid", player.steamid), Query.limit(1)]
            ),
          ]);

          return {
            ...player,
            hasData: steamData.total > 0,
            hasBans: steamBans.total > 0,
          };
        })
      );

      // Filtrar apenas jogadores sem dados
      const filteredPlayers = playersWithStatus.filter(
        (p) => !p.hasData && !p.hasBans
      );

      return NextResponse.json({
        success: true,
        players: filteredPlayers,
        total: filteredPlayers.length,
      });
    }

    return NextResponse.json({ success: true, players: players.documents, total: players.total });
  } catch (error: any) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
