import { NextResponse } from "next/server";
import { Client, Databases, Query, ID } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const steamApiKey = process.env.STEAM_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

async function fetchSteamSummary(steamid: string) {
  const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${steamApiKey}&steamids=${steamid}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.response?.players?.[0] || null;
}

async function fetchSteamBans(steamid: string) {
  const url = `https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${steamApiKey}&steamids=${steamid}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.players?.[0] || null;
}

async function processSingleQuery() {
  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  const now = new Date().toISOString();
  
  // Buscar próxima consulta pendente agendada
  const pendingQueries = await databases.listDocuments(
    databaseId,
    "steamQueue",
    [
      Query.equal("status", "pending"),
      Query.lessThanEqual("scheduledFor", now),
      Query.orderAsc("scheduledFor"),
      Query.limit(1),
    ]
  );

  if (pendingQueries.documents.length === 0) {
    return { processed: false, message: "Nenhuma consulta pendente" };
  }

  const query = pendingQueries.documents[0];
  
  // Marcar como processando
  await databases.updateDocument(
    databaseId,
    "steamQueue",
    query.$id,
    {
      status: "processing",
      lastAttempt: now,
      attempts: (query.attempts || 0) + 1,
    }
  );

  try {
    if (query.queryType === "summary") {
      const summaryData = await fetchSteamSummary(query.steamid);
      
      if (summaryData) {
        const existing = await databases.listDocuments(
          databaseId,
          "steamData",
          [Query.equal("steamid", query.steamid)]
        );

        if (existing.documents.length > 0) {
          await databases.updateDocument(
            databaseId,
            "steamData",
            existing.documents[0].$id,
            {
              personaname: summaryData.personaname,
              profileurl: summaryData.profileurl,
              avatar: summaryData.avatar,
              avatarmedium: summaryData.avatarmedium,
              avatarfull: summaryData.avatarfull,
              communityvisibilitystate: summaryData.communityvisibilitystate,
              profilestate: summaryData.profilestate,
              personastate: summaryData.personastate,
              lastUpdated: now,
            }
          );
        } else {
          await databases.createDocument(
            databaseId,
            "steamData",
            ID.unique(),
            {
              steamid: query.steamid,
              personaname: summaryData.personaname,
              profileurl: summaryData.profileurl,
              avatar: summaryData.avatar,
              avatarmedium: summaryData.avatarmedium,
              avatarfull: summaryData.avatarfull,
              communityvisibilitystate: summaryData.communityvisibilitystate,
              profilestate: summaryData.profilestate,
              personastate: summaryData.personastate,
              lastUpdated: now,
            }
          );
        }
      }
    } else if (query.queryType === "bans") {
      const bansData = await fetchSteamBans(query.steamid);
      
      if (bansData) {
        const existing = await databases.listDocuments(
          databaseId,
          "steamBans",
          [Query.equal("steamid", query.steamid)]
        );

        if (existing.documents.length > 0) {
          await databases.updateDocument(
            databaseId,
            "steamBans",
            existing.documents[0].$id,
            {
              CommunityBanned: bansData.CommunityBanned,
              VACBanned: bansData.VACBanned,
              NumberOfVACBans: bansData.NumberOfVACBans,
              DaysSinceLastBan: bansData.DaysSinceLastBan,
              NumberOfGameBans: bansData.NumberOfGameBans,
              EconomyBan: bansData.EconomyBan,
              lastUpdated: now,
            }
          );
        } else {
          await databases.createDocument(
            databaseId,
            "steamBans",
            ID.unique(),
            {
              steamid: query.steamid,
              CommunityBanned: bansData.CommunityBanned,
              VACBanned: bansData.VACBanned,
              NumberOfVACBans: bansData.NumberOfVACBans,
              DaysSinceLastBan: bansData.DaysSinceLastBan,
              NumberOfGameBans: bansData.NumberOfGameBans,
              EconomyBan: bansData.EconomyBan,
              lastUpdated: now,
            }
          );
        }
      }
    }

    // Marcar como concluído
    await databases.updateDocument(
      databaseId,
      "steamQueue",
      query.$id,
      { status: "completed" }
    );

    return {
      processed: true,
      message: `Consulta ${query.queryType} para ${query.steamid} concluída`,
      steamid: query.steamid,
      queryType: query.queryType,
    };
  } catch (error: unknown) {
    // Marcar como erro
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    await databases.updateDocument(
      databaseId,
      "steamQueue",
      query.$id,
      {
        status: "failed",
        error: errorMessage,
      }
    );

    throw error;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const batch = parseInt(searchParams.get("batch") || "1");

  try {
    const results = [];
    
    for (let i = 0; i < batch; i++) {
      try {
        const result = await processSingleQuery();
        results.push(result);
        
        if (!result.processed) {
          break; // Não há mais consultas para processar
        }
        
        // Aguardar 2 segundos entre cada consulta para respeitar rate limits
        if (i < batch - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        results.push({
          processed: false,
          error: errorMessage,
        });
      }
    }

    const processed = results.filter(r => r.processed).length;
    
    return NextResponse.json({
      success: true,
      processed,
      total: results.length,
      results,
    });
  } catch (error: unknown) {
    console.error("Error in batch processing:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
