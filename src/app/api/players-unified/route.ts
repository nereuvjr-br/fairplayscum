import { NextResponse } from "next/server";
import { Client, Databases, Query } from "node-appwrite";
import { EnrichedPlayer, ListPlayer, Player, PlayerVote, Server, SteamBans, SteamData } from "@/types";
import "dotenv/config";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

// Simple in-memory caches to reduce repeated Appwrite calls during dev / single-instance server
const CACHE_TTL = 60 * 1000; // 60 seconds
const serverCache = new Map<string, { expires: number; doc: Server }>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const serverId = searchParams.get("serverId") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(200, parseInt(searchParams.get("limit") || "50")));
  const offset = (page - 1) * limit;

  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    // To prioritize players with VAC/game bans across the entire list (not just within a page),
    // we fetch a reasonable-sized snapshot of the collections (limited) and perform a global
    // sort by ban score, then paginate the sorted list and only enrich the players on the
    // requested page. This keeps per-request enrichment work bounded while ensuring
    // banned players are shown first globally.
    const COLLECTION_LIMIT = 5000; // adjust if you expect more documents

    // Fetch all players (snapshot)
    const allPlayersRes = await databases.listDocuments<Player>(databaseId, "players", [Query.limit(COLLECTION_LIMIT)]);
    const allPlayers = allPlayersRes.documents || [];

    // Fetch steamBans and steamData snapshots to compute ban score and allow searching by persona name
    const allSteamBansRes = await databases.listDocuments<SteamBans>(databaseId, "steamBans", [Query.limit(COLLECTION_LIMIT)]);
    const allSteamBans = allSteamBansRes.documents || [];
    const steamBansMap: Record<string, SteamBans> = {};
    for (const s of allSteamBans) {
      if (s.steamid) steamBansMap[s.steamid] = s;
    }

    const allSteamDataRes = await databases.listDocuments<SteamData>(databaseId, "steamData", [Query.limit(COLLECTION_LIMIT)]);
    const allSteamData = allSteamDataRes.documents || [];
    const steamDataMap: Record<string, SteamData> = {};
    for (const s of allSteamData) {
      if (s.steamid) steamDataMap[s.steamid] = s;
    }

    // Build a map of the latest listplayer entry per steamid (to get lastServer quickly)
    const allListPlayerRes = await databases.listDocuments<ListPlayer>(databaseId, "listplayer", [Query.limit(COLLECTION_LIMIT), Query.orderDesc("$createdAt")]);
    const allListPlayer = allListPlayerRes.documents || [];
    const lastListMap: Record<string, ListPlayer> = {};
    for (const lp of allListPlayer) {
      if (!lp.steamid) continue;
      if (!lastListMap[lp.steamid]) lastListMap[lp.steamid] = lp; // because ordered desc, first wins
    }

    // Helper to compute ban score for sorting
    const computeBanScore = (steamid: string) => {
      const b = steamBansMap[steamid] || {};
      // handle different possible field namings in the steamBans documents
      const vacCount = Number(b.NumberOfVACBans ?? b.NumberOfVacBans ?? b.vacBans ?? 0);
      const gameCount = Number(b.NumberOfGameBans ?? b.NumberOfGameBans ?? b.NumberOfGameBans ?? b.gameBans ?? 0);
      const vacFlag = b.VACBanned === true || vacCount > 0;
      const communityFlag = b.CommunityBanned === true || b.communityBanned === true;
      const economyFlag = typeof b.EconomyBan === 'string' ? b.EconomyBan.toLowerCase() !== 'none' : !!b.economyBan;

      // Score weights: VACs are most severe, then game bans, then other flags
      const score = vacCount * 10 + (vacFlag ? 5 : 0) + gameCount * 5 + (communityFlag ? 2 : 0) + (economyFlag ? 2 : 0);
      return score;
    };

    // Combine players with their steamData and steamBans for sorting and optional search
    const playersSnapshot = allPlayers.map((p) => ({
      steamid: p.steamid,
      currentName: p.currentName,
      raw: p,
      steamData: steamDataMap[p.steamid] || null,
      steamBans: steamBansMap[p.steamid] || null,
      lastList: lastListMap[p.steamid] || null,
    }));

    // Apply optional search/serverId filters on the snapshot before sorting
    let snapshotFiltered = playersSnapshot;
    if (search) {
      const sLower = search.toLowerCase();
      snapshotFiltered = snapshotFiltered.filter((p) =>
        (p.currentName && p.currentName.toLowerCase().includes(sLower)) ||
        (p.steamid && p.steamid.includes(sLower)) ||
        (p.steamData && p.steamData.personaname && p.steamData.personaname.toLowerCase().includes(sLower))
      );
    }

    if (serverId) {
      snapshotFiltered = snapshotFiltered.filter((p) => {
        const last = p.lastList;
        return last && last.serverId === serverId;
      });
    }

    // Global sort by ban score (desc)
    snapshotFiltered.sort((a, b) => {
      const aScore = computeBanScore(a.steamid || "");
      const bScore = computeBanScore(b.steamid || "");
      if (bScore !== aScore) return bScore - aScore;
      return 0; // stable tie
    });

    const totalPlayers = snapshotFiltered.length;

    // Paginate the sorted snapshot and only enrich the current page
  const pagePlayers = snapshotFiltered.slice(offset, offset + limit);

  // Build perPlayerResults for pagePlayers (use cached maps where possible)
  // Keep the original raw player doc so we can return fields like lastSeen/firstSeen
  const playersPage = pagePlayers.map((p) => ({ steamid: p.steamid, currentName: p.currentName, raw: p.raw }));

    const perPlayerResults = await Promise.all(
      playersPage.map(async (player) => {
        try {
          // steamData and steamBans already in maps; listplayer we have lastListMap as well
          const steamData = steamDataMap[player.steamid] || null;
          const steamBans = steamBansMap[player.steamid] || null;
          const lastList = lastListMap[player.steamid] || null;
          const lastServerId = lastList?.serverId || null;

          return {
            player,
            steamData,
            steamBans,
            lastServerId,
          };
        } catch (err) {
          console.error(`Erro ao enriquecer dados para ${player.steamid}:`, err);
          return { player, steamData: null, steamBans: null, lastServerId: null };
        }
      })
    );

    // Collect unique server IDs and fetch them once
    const uniqueServerIds = Array.from(new Set(perPlayerResults.map(r => r.lastServerId).filter(Boolean) as string[]));
    const serverMap: Record<string, Server> = {};

    if (uniqueServerIds.length > 0) {
      const serverFetchPromises = uniqueServerIds.map(async (sid) => {
        try {
          // Try cache first
          const cached = serverCache.get(sid);
          if (cached && cached.expires > Date.now()) {
            serverMap[sid] = cached.doc;
            return;
          }

          const serverDoc = await databases.getDocument<Server>(databaseId, "servers", sid);
          serverMap[sid] = serverDoc;
          serverCache.set(sid, { expires: Date.now() + CACHE_TTL, doc: serverDoc });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`Erro ao buscar servidor ${sid}:`, msg);
        }
      });

      await Promise.all(serverFetchPromises);
    }

    // Assemble final enriched players array
    const playersWithData: EnrichedPlayer[] = perPlayerResults.map((r) => {
      const lastServerDoc = r.lastServerId ? serverMap[r.lastServerId] : null;
      const lastServer = lastServerDoc
        ? {
            serverId: lastServerDoc.$id,
            serverName: lastServerDoc.name,
            serverRegion: lastServerDoc.region,
            serverFlag: lastServerDoc.flag,
          }
        : null;

      // If we have the original raw player doc, spread it to keep fields like $id, firstSeen, lastSeen, nameHistory
      const base: Player = r.player?.raw ? { ...r.player.raw } : {
        steamid: r.player.steamid,
        currentName: r.player.currentName,
        nameHistory: [],
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        $id: "",
        $collectionId: "",
        $databaseId: "",
        $createdAt: new Date().toISOString(),
        $updatedAt: new
        Date().toISOString(),
        $permissions: [],
        $sequence: 0,
      };

      return {
        ...base,
        steamData: r.steamData,
        steamBans: r.steamBans,
        lastServer,
      };
    });

    // NOTE: We fetched a paginated subset and enriched it. Additional filtering/searching across the whole dataset
    // is expensive and would require different queries. For now, if search or serverId are provided, we perform
    // filtering on the already paginated subset. This keeps memory and CPU usage low.
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

    if (serverId) {
      filteredPlayers = filteredPlayers.filter((p) => p.lastServer?.serverId === serverId);
    }

    // AGREGAR VOTOS: buscar votos da página atual e montar estatísticas por steamid
    const steamIdsOnPage = playersWithData.map((p) => p.steamid).filter(Boolean);
    const votesMap: Record<string, { likes: number; dislikes: number; neutral: number; total: number } > = {};
    const userVoteMap: Record<string, string | null> = {};

    // Inicializar
    steamIdsOnPage.forEach((id) => {
      votesMap[id] = { likes: 0, dislikes: 0, neutral: 0, total: 0 };
      userVoteMap[id] = null;
    });

    try {
      // Busca global limitada e filtra localmente para os steamids da página.
      // Ajuste Query.limit para um número adequado ao seu dataset.
      const allVotes = await databases.listDocuments<PlayerVote>(databaseId, "playerVotes", [Query.limit(5000)]);
      const votesDocs = allVotes.documents || [];

      for (const v of votesDocs) {
        const sid = v.steamid;
        if (!sid || !votesMap[sid]) continue;
        votesMap[sid].total++;
        if (v.voteType === "like") votesMap[sid].likes++;
        else if (v.voteType === "dislike") votesMap[sid].dislikes++;
        else if (v.voteType === "neutral") votesMap[sid].neutral++;
      }

      // If voterId provided, find user votes
      const voterIdParam = searchParams.get("voterId");
      if (voterIdParam) {
        const userVotes = votesDocs.filter((v) => v.voterId === voterIdParam && votesMap[v.steamid]);
        for (const uv of userVotes) {
          userVoteMap[uv.steamid] = uv.voteType;
        }
      }
    } catch (err) {
      console.error("Erro ao agregar votes:", err instanceof Error ? err.message : String(err));
    }

    // Anexar stats e userVote a cada player
    let playersWithVotes = filteredPlayers.map((p) => ({
      ...p,
      votes: votesMap[p.steamid] || { likes: 0, dislikes: 0, neutral: 0, total: 0 },
      userVote: userVoteMap[p.steamid] || null,
    }));

    // Prioritize players with VAC/Game bans (place them first).
    // Compute a simple ban score: vacBans * 10 + gameBans * 5 + number of recorded ban flags
    playersWithVotes = playersWithVotes.sort((a, b) => {
      const defaultBans: SteamBans = {
        steamid: '',
        VACBanned: false,
        NumberOfVACBans: 0,
        CommunityBanned: false,
        NumberOfGameBans: 0,
        DaysSinceLastBan: 0,
        EconomyBan: 'none',
        lastUpdated: '',
        $id: '',
        $collectionId: '',
        $databaseId: '',
        $createdAt: '',
        $updatedAt: '',
        $permissions: [],
        $sequence: 0,
      };
      const aBans = a.steamBans || defaultBans;
      const bBans = b.steamBans || defaultBans;

      const aVac = Number(aBans.vacBans || aBans.NumberOfVACBans || 0);
      const aGame = Number(aBans.gameBans || aBans.NumberOfGameBans || 0);
      // count other ban indicators (e.g., communityBanned, economyBan) if present
      const aFlags = [aBans.communityBanned, aBans.EconomyBan !== 'none'].filter(Boolean).length;

      const bVac = Number(bBans.vacBans || bBans.NumberOfVACBans || 0);
      const bGame = Number(bBans.gameBans || bBans.NumberOfGameBans || 0);
      const bFlags = [bBans.communityBanned, bBans.EconomyBan !== 'none'].filter(Boolean).length;

      const aScore = aVac * 10 + aGame * 5 + aFlags * 2;
      const bScore = bVac * 10 + bGame * 5 + bFlags * 2;

      // Higher score should come first
      if (bScore !== aScore) return bScore - aScore;
      return 0; // keep original relative order for ties
    });

    return NextResponse.json({
      success: true,
      players: playersWithVotes,
      total: totalPlayers,
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
