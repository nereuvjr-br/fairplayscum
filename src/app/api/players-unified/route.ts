import { NextResponse } from "next/server";
import { Client, Databases, Query } from "node-appwrite";
import { EnrichedPlayer, ListPlayer, Player, PlayerVote, Server, SteamBans, SteamData } from "@/types";
import "dotenv/config";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const serverId = searchParams.get("serverId") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(200, parseInt(searchParams.get("limit") || "50")));
  const sortBy = searchParams.get("sortBy") || "backend"; // 'backend', 'name', 'steamid', 'server', 'lastSeen'
  const filterBanned = searchParams.get("filterBanned") || "all"; // 'all', 'banned', 'clean'
  const voterId = searchParams.get("voterId");
  const offset = (page - 1) * limit;

  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    const COLLECTION_LIMIT = 5000; // Acknowledge snapshot nature

    // Fetch all necessary data in parallel
    const [allPlayersRes, allSteamBansRes, allSteamDataRes, allListPlayerRes] = await Promise.all([
      databases.listDocuments<Player>(databaseId, "players", [Query.limit(COLLECTION_LIMIT)]),
      databases.listDocuments<SteamBans>(databaseId, "steamBans", [Query.limit(COLLECTION_LIMIT)]),
      databases.listDocuments<SteamData>(databaseId, "steamData", [Query.limit(COLLECTION_LIMIT)]),
      databases.listDocuments<ListPlayer>(databaseId, "listplayer", [Query.limit(COLLECTION_LIMIT), Query.orderDesc("$createdAt")])
    ]);

    // Create maps for efficient lookups
    const steamBansMap = new Map(allSteamBansRes.documents.map(s => [s.steamid, s]));
    const steamDataMap = new Map(allSteamDataRes.documents.map(s => [s.steamid, s]));
    const lastListMap: Record<string, ListPlayer> = {};
    for (const lp of allListPlayerRes.documents) {
      if (lp.steamid && !lastListMap[lp.steamid]) {
        lastListMap[lp.steamid] = lp;
      }
    }

    const computeBanScore = (bans?: SteamBans | null) => {
      if (!bans) return 0;
      const vacCount = bans.NumberOfVACBans || 0;
      const gameCount = bans.NumberOfGameBans || 0;
      let score = 0;
      if (bans.VACBanned) score += 100;
      if (bans.CommunityBanned) score += 20;
      if (gameCount > 0) score += gameCount * 10;
      if (vacCount > 0) score += vacCount * 50;
      return score;
    };

    // Create a single, enriched snapshot for filtering and sorting
    const enrichedSnapshot = allPlayersRes.documents.map(p => {
      const steamBans = steamBansMap.get(p.steamid);
      return {
        ...p, // Spread the raw player document
        steamData: steamDataMap.get(p.steamid) || null,
        steamBans: steamBans || null,
        lastList: lastListMap[p.steamid] || null,
        banScore: computeBanScore(steamBans),
      };
    });

    // 1. APPLY FILTERS
    // Filter by last seen (30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    let filteredPlayers = enrichedSnapshot.filter(p => new Date(p.lastSeen) >= thirtyDaysAgo);

    // Filter by search term
    if (search) {
      const sLower = search.toLowerCase();
      filteredPlayers = filteredPlayers.filter(p =>
        p.currentName?.toLowerCase().includes(sLower) ||
        p.steamid?.includes(sLower) ||
        p.steamData?.personaname?.toLowerCase().includes(sLower)
      );
    }

    // Filter by server ID
    if (serverId) {
      filteredPlayers = filteredPlayers.filter(p => p.lastList?.serverId === serverId);
    }

    // Filter by ban status
    if (filterBanned === "banned") {
      filteredPlayers = filteredPlayers.filter(p => p.banScore > 0);
    } else if (filterBanned === "clean") {
      filteredPlayers = filteredPlayers.filter(p => p.banScore === 0);
    }

    const total = filteredPlayers.length;

    // 2. APPLY SORTING
    filteredPlayers.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.currentName || "").localeCompare(b.currentName || "");
        case "steamid":
          return (a.steamid || "").localeCompare(b.steamid || "");
        case "server":
          return (a.lastList?.serverId || "").localeCompare(b.lastList?.serverId || "");
        case "lastSeen":
          return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
        case "backend":
        default:
          // Default sort is by ban score (desc), then last seen (desc)
          if (b.banScore !== a.banScore) return b.banScore - a.banScore;
          return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      }
    });

    // 3. APPLY PAGINATION
    const pagePlayers = filteredPlayers.slice(offset, offset + limit);

    // 4. ENRICH FINAL PAGE (Servers and Votes)
    const steamIdsOnPage = pagePlayers.map(p => p.steamid);
    const serverIdsOnPage = Array.from(new Set(pagePlayers.map(p => p.lastList?.serverId).filter(Boolean) as string[]));

    const [serverDocs, votesDocs] = await Promise.all([
      serverIdsOnPage.length > 0 ? databases.listDocuments<Server>(databaseId, "servers", [Query.equal("$id", serverIdsOnPage)]) : Promise.resolve({ documents: [] }),
      steamIdsOnPage.length > 0 ? databases.listDocuments<PlayerVote>(databaseId, "playerVotes", [Query.equal("steamid", steamIdsOnPage), Query.limit(5000)]) : Promise.resolve({ documents: [] })
    ]);

    const serverMap = new Map(serverDocs.documents.map(s => [s.$id, s]));
    const votesMap: Record<string, { likes: number; dislikes: number; neutral: number; total: number }> = {};
    const userVoteMap: Record<string, string | null> = {};

    steamIdsOnPage.forEach(id => {
      votesMap[id] = { likes: 0, dislikes: 0, neutral: 0, total: 0 };
    });

    for (const v of votesDocs.documents) {
      if (votesMap[v.steamid]) {
        votesMap[v.steamid].total++;
        if (v.voteType === "like") votesMap[v.steamid].likes++;
        else if (v.voteType === "dislike") votesMap[v.steamid].dislikes++;
        else if (v.voteType === "neutral") votesMap[v.steamid].neutral++;

        if (voterId && v.voterId === voterId) {
          userVoteMap[v.steamid] = v.voteType;
        }
      }
    }

    // Assemble the final array
    const playersWithFullData: EnrichedPlayer[] = pagePlayers.map(p => {
      const serverDoc = p.lastList?.serverId ? serverMap.get(p.lastList.serverId) : null;
      return {
        ...p, // a fully populated player object from the snapshot
        lastServer: serverDoc ? {
          serverId: serverDoc.$id,
          serverName: serverDoc.name,
          serverRegion: serverDoc.region,
          serverFlag: serverDoc.flag,
        } : null,
        votes: votesMap[p.steamid] || { likes: 0, dislikes: 0, neutral: 0, total: 0 },
        userVote: userVoteMap[p.steamid] || null,
      };
    });

    return NextResponse.json({
      success: true,
      players: playersWithFullData,
      total,
      page,
      limit,
    });
  } catch (error: unknown) {
    console.error("Error fetching unified players data:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
