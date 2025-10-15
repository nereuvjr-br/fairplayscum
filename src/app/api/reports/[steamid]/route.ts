import { NextResponse } from "next/server";
import { Client, Databases, Query } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

export async function GET(
  request: Request,
  { params }: { params: { steamid: string } }
) {
  const steamid = params.steamid;

  if (!steamid) {
    return NextResponse.json(
      { success: false, error: "SteamID é obrigatório" },
      { status: 400 }
    );
  }

  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    // Buscar todos os votos deste jogador
    const votes = await databases.listDocuments(
      databaseId,
      "playerVotes",
      [
        Query.equal("steamid", steamid),
        Query.orderDesc("$createdAt"),
        Query.limit(100)
      ]
    );

    // Buscar dados do jogador
    const playerData = await databases.listDocuments(
      databaseId,
      "players",
      [Query.equal("steamid", steamid), Query.limit(1)]
    );

    const player = playerData.documents[0] || null;

    // Buscar dados Steam
    let steamData = null;
    let steamBans = null;

    if (player) {
      const steamDataRes = await databases.listDocuments(
        databaseId,
        "steamData",
        [Query.equal("steamid", steamid), Query.limit(1)]
      );
      steamData = steamDataRes.documents[0] || null;

      const steamBansRes = await databases.listDocuments(
        databaseId,
        "steamBans",
        [Query.equal("steamid", steamid), Query.limit(1)]
      );
      steamBans = steamBansRes.documents[0] || null;
    }

    // Processar votos
    const reports = votes.documents.map((vote: any) => {
      let clips = [];
      if (vote.clips) {
        try {
          clips = JSON.parse(vote.clips);
        } catch (e) {
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
      };
    });

    // Calcular estatísticas
    const stats = {
      total: reports.length,
      likes: reports.filter(r => r.voteType === "like").length,
      dislikes: reports.filter(r => r.voteType === "dislike").length,
      neutral: reports.filter(r => r.voteType === "neutral").length,
      withClips: reports.filter(r => r.clips && r.clips.length > 0).length,
    };

    return NextResponse.json({
      success: true,
      steamid,
      player: player ? {
        currentName: (player as any).currentName,
        nameHistory: (player as any).nameHistory || [],
        firstSeen: (player as any).firstSeen,
        lastSeen: (player as any).lastSeen,
      } : null,
      steamData: steamData ? {
        personaname: (steamData as any).personaname,
        avatar: (steamData as any).avatar,
        avatarfull: (steamData as any).avatarfull,
        profileurl: (steamData as any).profileurl,
        communityvisibilitystate: (steamData as any).communityvisibilitystate,
      } : null,
      steamBans: steamBans ? {
        VACBanned: (steamBans as any).VACBanned,
        NumberOfVACBans: (steamBans as any).NumberOfVACBans,
        CommunityBanned: (steamBans as any).CommunityBanned,
        NumberOfGameBans: (steamBans as any).NumberOfGameBans,
        DaysSinceLastBan: (steamBans as any).DaysSinceLastBan,
      } : null,
      reports,
      stats,
    });
  } catch (error: any) {
    console.error("Error fetching player reports:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
