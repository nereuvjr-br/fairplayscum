import { NextResponse } from "next/server";
import { Client, Databases, Query } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "pending";

  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    let queries: string[] = [
      Query.equal("voteType", "dislike"),
      Query.orderDesc("createdAt"),
      Query.limit(1000)
    ];

    if (filter === "pending") {
      queries.push(Query.equal("approved", false));
    } else if (filter === "approved") {
      queries.push(Query.equal("approved", true));
    }
    // filter === "all" não adiciona filtro de approved

    const reports = await databases.listDocuments(
      databaseId,
      "playerVotes",
      queries
    );

    // Buscar informações dos jogadores
    const reportsWithPlayerData = await Promise.all(
      reports.documents.map(async (report: any) => {
        try {
          const playerDocs = await databases.listDocuments(
            databaseId,
            "players",
            [Query.equal("steamid", report.steamid), Query.limit(1)]
          );

          const playerName = playerDocs.documents[0]?.currentName || "Jogador Desconhecido";

          return {
            $id: report.$id,
            steamid: report.steamid,
            playerName,
            reason: report.reason,
            clips: report.clips,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
            approved: report.approved,
            approvedBy: report.approvedBy,
            approvedAt: report.approvedAt,
          };
        } catch (error) {
          return {
            $id: report.$id,
            steamid: report.steamid,
            playerName: "Erro ao buscar nome",
            reason: report.reason,
            clips: report.clips,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
            approved: report.approved,
            approvedBy: report.approvedBy,
            approvedAt: report.approvedAt,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      reports: reportsWithPlayerData,
      total: reports.total,
    });
  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
