import { NextResponse } from "next/server";
import { Client, Databases, Query } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const voteType = searchParams.get("voteType") || "all"; // all, dislike, neutral
  const limit = parseInt(searchParams.get("limit") || "50");
  const search = searchParams.get("search") || "";

  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    // Construir queries
    const queries: string[] = [
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
    ];

    if (voteType !== "all") {
      queries.push(Query.equal("voteType", voteType));
    }

    // Buscar votos
    const votes = await databases.listDocuments(
      databaseId,
      "playerVotes",
      queries
    );

    // Buscar dados dos jogadores para cada voto
    const reportsWithPlayerData = await Promise.all(
      votes.documents.map(async (vote: { $id: string; steamid: string; voteType: string; reason: string; clips: string; createdAt: string; updatedAt: string; }) => {
        try {
          // Buscar dados do player
          const playerData = await databases.listDocuments(
            databaseId,
            "players",
            [Query.equal("steamid", vote.steamid), Query.limit(1)]
          );

          const player = playerData.documents[0] || null;

          // Buscar dados Steam se disponível
          let steamData = null;
          let steamBans = null;

          if (player) {
            const steamDataRes = await databases.listDocuments(
              databaseId,
              "steamData",
              [Query.equal("steamid", vote.steamid), Query.limit(1)]
            );
            steamData = steamDataRes.documents[0] || null;

            const steamBansRes = await databases.listDocuments(
              databaseId,
              "steamBans",
              [Query.equal("steamid", vote.steamid), Query.limit(1)]
            );
            steamBans = steamBansRes.documents[0] || null;
          }

          // Parse clips se existir
          let clips = [];
          if (vote.clips) {
            try {
              clips = JSON.parse(vote.clips);
            } catch {
              clips = [];
            }
          }

          return {
            $id: vote.$id,
            steamid: vote.steamid,
            voteType: vote.voteType,
            reason: vote.reason,
            clips,
            createdAt: vote.createdAt,
            updatedAt: vote.updatedAt,
            player: player ? {
              currentName: (player as { currentName: string; }).currentName,
              nameHistory: (player as { nameHistory: string[]; }).nameHistory || [],
              firstSeen: (player as { firstSeen: string; }).firstSeen,
              lastSeen: (player as { lastSeen: string; }).lastSeen,
            } : null,
            steamData: steamData ? {
              personaname: (steamData as { personaname: string; }).personaname,
              avatar: (steamData as { avatar: string; }).avatar,
              profileurl: (steamData as { profileurl: string; }).profileurl,
              communityvisibilitystate: (steamData as { communityvisibilitystate: number; }).communityvisibilitystate,
            } : null,
            steamBans: steamBans ? {
              VACBanned: (steamBans as { VACBanned: boolean; }).VACBanned,
              NumberOfVACBans: (steamBans as { NumberOfVACBans: number; }).NumberOfVACBans,
              CommunityBanned: (steamBans as { CommunityBanned: boolean; }).CommunityBanned,
              NumberOfGameBans: (steamBans as { NumberOfGameBans: number; }).NumberOfGameBans,
              DaysSinceLastBan: (steamBans as { DaysSinceLastBan: number; }).DaysSinceLastBan,
            } : null,
          };
        } catch (error) {
          console.error(`Erro ao buscar dados para ${vote.steamid}:`, error);
          return {
            $id: vote.$id,
            steamid: vote.steamid,
            voteType: vote.voteType,
            reason: vote.reason,
            clips: [],
            createdAt: vote.createdAt,
            updatedAt: vote.updatedAt,
            player: null,
            steamData: null,
            steamBans: null,
          };
        }
      })
    );

    // Filtrar por search se fornecido
    let filteredReports = reportsWithPlayerData;
    if (search) {
      filteredReports = reportsWithPlayerData.filter(report => {
        const searchLower = search.toLowerCase();
        return (
          report.steamid.toLowerCase().includes(searchLower) ||
          report.player?.currentName.toLowerCase().includes(searchLower) ||
          report.steamData?.personaname?.toLowerCase().includes(searchLower) ||
          report.reason.toLowerCase().includes(searchLower)
        );
      });
    }

    return NextResponse.json({
      success: true,
      reports: filteredReports,
      total: filteredReports.length,
    });
  } catch (error: unknown) {
    console.error("Error fetching reports:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
