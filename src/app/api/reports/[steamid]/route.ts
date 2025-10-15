import { NextResponse, NextRequest } from "next/server";
import { Client, Databases, Query, Models } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

// Interfaces para os documentos
interface VoteDocument extends Models.Document {
  steamid: string;
  voteType: string;
  reason: string;
  clips: string;
  createdAt: string;
  updatedAt: string;
  approved: boolean;
  approvedBy: string;
  approvedAt: string;
}

interface PlayerDocument extends Models.Document {
  currentName: string;
  nameHistory: string[];
  firstSeen: string;
  lastSeen: string;
}

interface SteamDataDocument extends Models.Document {
  personaname: string;
  avatar: string;
  avatarfull: string;
  profileurl: string;
  communityvisibilitystate: number;
}

interface SteamBansDocument extends Models.Document {
  VACBanned: boolean;
  NumberOfVACBans: number;
  CommunityBanned: boolean;
  NumberOfGameBans: number;
  DaysSinceLastBan: number;
}


export async function GET(
  request: NextRequest,
  context: { params: Promise<{ steamid: string; }> }
) {
  const { steamid } = await context.params;

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
    // Buscar TODAS as denúncias (apenas dislikes) para estatísticas
    const allDenunciations = await databases.listDocuments<VoteDocument>(
      databaseId,
      "playerVotes",
      [
        Query.equal("steamid", steamid),
        Query.equal("voteType", "dislike"),
        Query.orderDesc("$createdAt"),
        Query.limit(1000)
      ]
    );

    // Buscar apenas denúncias APROVADAS para mostrar detalhes
    const approvedDenunciations = await databases.listDocuments<VoteDocument>(
      databaseId,
      "playerVotes",
      [
        Query.equal("steamid", steamid),
        Query.equal("voteType", "dislike"),
        Query.equal("approved", true),
        Query.orderDesc("$createdAt"),
        Query.limit(1000)
      ]
    );

    // Buscar dados do jogador
    const playerData = await databases.listDocuments<PlayerDocument>(
      databaseId,
      "players",
      [Query.equal("steamid", steamid), Query.limit(1)]
    );

    const player = playerData.documents[0] || null;

    // Buscar dados Steam
    let steamData: SteamDataDocument | null = null;
    let steamBans: SteamBansDocument | null = null;

    if (player) {
      const steamDataRes = await databases.listDocuments<SteamDataDocument>(
        databaseId,
        "steamData",
        [Query.equal("steamid", steamid), Query.limit(1)]
      );
      steamData = steamDataRes.documents[0] || null;

      const steamBansRes = await databases.listDocuments<SteamBansDocument>(
        databaseId,
        "steamBans",
        [Query.equal("steamid", steamid), Query.limit(1)]
      );
      steamBans = steamBansRes.documents[0] || null;
    }

    // Processar apenas denúncias aprovadas para exibição
    const reports = approvedDenunciations.documents.map((vote) => {
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
        approved: vote.approved,
        approvedBy: vote.approvedBy,
        approvedAt: vote.approvedAt,
      };
    });

    // Calcular estatísticas (todas as denúncias)
    const stats = {
      total: allDenunciations.total,
      totalApproved: approvedDenunciations.total,
      totalPending: allDenunciations.total - approvedDenunciations.total,
      withClips: allDenunciations.documents.filter((d) => {
        try {
          const clips = d.clips ? JSON.parse(d.clips) : [];
          return clips && (clips.youtube?.length > 0 || clips.medal?.length > 0);
        } catch {
          return false;
        }
      }).length,
    };

    return NextResponse.json({
      success: true,
      steamid,
      player: player ? {
        currentName: player.currentName,
        nameHistory: player.nameHistory || [],
        firstSeen: player.firstSeen,
        lastSeen: player.lastSeen,
      } : null,
      steamData: steamData ? {
        personaname: steamData.personaname,
        avatar: steamData.avatar,
        avatarfull: steamData.avatarfull,
        profileurl: steamData.profileurl,
        communityvisibilitystate: steamData.communityvisibilitystate,
      } : null,
      steamBans: steamBans ? {
        VACBanned: steamBans.VACBanned,
        NumberOfVACBans: steamBans.NumberOfVACBans,
        CommunityBanned: steamBans.CommunityBanned,
        NumberOfGameBans: steamBans.NumberOfGameBans,
        DaysSinceLastBan: steamBans.DaysSinceLastBan,
      } : null,
      reports,
      stats,
    });
  } catch (error: unknown) {
    console.error("Error fetching player reports:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}