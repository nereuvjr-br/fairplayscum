import { NextResponse } from "next/server";
import { Client, Databases, Query, ID } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

export async function POST(request: Request) {
  const { steamid, voteType, voterId, reason, clips } = await request.json();

  if (!steamid || !voteType || !voterId || !reason) {
    return NextResponse.json(
      { success: false, error: "steamid, voteType, voterId e reason são obrigatórios" },
      { status: 400 }
    );
  }

  if (!["dislike"].includes(voteType)) {
    return NextResponse.json(
      { success: false, error: "Apenas denúncias (dislike) são permitidas" },
      { status: 400 }
    );
  }

  // Capturar IP do usuário
  const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown';

  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    // Verificar se já existe voto deste usuário (por voterId OU IP) para este jogador
    const existingVoteByVoterId = await databases.listDocuments(
      databaseId,
      "playerVotes",
      [
        Query.equal("steamid", steamid),
        Query.equal("voterId", voterId),
        Query.limit(1)
      ]
    );

    const existingVoteByIP = await databases.listDocuments(
      databaseId,
      "playerVotes",
      [
        Query.equal("steamid", steamid),
        Query.equal("voterIp", ip),
        Query.limit(1)
      ]
    );

    const existingVote = existingVoteByVoterId.documents[0] || existingVoteByIP.documents[0];

    if (existingVote) {
      // Atualizar denúncia existente
      await databases.updateDocument(
        databaseId,
        "playerVotes",
        existingVote.$id,
        {
          voteType,
          reason,
          clips: clips || null,
          voterId, // Atualizar voterId caso tenha mudado
          voterIp: ip, // Atualizar IP
          updatedAt: new Date().toISOString(),
          // Resetar aprovação ao atualizar denúncia
          approved: false,
          approvedBy: null,
          approvedAt: null,
        }
      );
    } else {
      // Criar nova denúncia (não aprovada por padrão)
      await databases.createDocument(
        databaseId,
        "playerVotes",
        ID.unique(),
        {
          steamid,
          voterId,
          voterIp: ip,
          voteType,
          reason,
          clips: clips || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          approved: false,
          approvedBy: null,
          approvedAt: null,
        }
      );
    }

    // Calcular estatísticas de votos
    const allVotes = await databases.listDocuments(
      databaseId,
      "playerVotes",
      [Query.equal("steamid", steamid), Query.limit(1000)]
    );

    const stats = {
      likes: 0,
      dislikes: 0,
      neutral: 0,
      total: allVotes.total,
    };

    allVotes.documents.forEach((vote: any) => {
      if (vote.voteType === "like") stats.likes++;
      else if (vote.voteType === "dislike") stats.dislikes++;
      else if (vote.voteType === "neutral") stats.neutral++;
    });

    return NextResponse.json({
      success: true,
      message: "Voto registrado com sucesso",
      stats,
      userVote: voteType,
    });
  } catch (error: any) {
    console.error("Error voting:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const steamid = searchParams.get("steamid");
  const voterId = searchParams.get("voterId");

  if (!steamid) {
    return NextResponse.json(
      { success: false, error: "steamid é obrigatório" },
      { status: 400 }
    );
  }

  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    // Buscar todos os votos deste jogador
    const allVotes = await databases.listDocuments(
      databaseId,
      "playerVotes",
      [Query.equal("steamid", steamid), Query.limit(1000)]
    );

    const stats = {
      likes: 0,
      dislikes: 0,
      neutral: 0,
      total: allVotes.total,
    };

    allVotes.documents.forEach((vote: any) => {
      if (vote.voteType === "like") stats.likes++;
      else if (vote.voteType === "dislike") stats.dislikes++;
      else if (vote.voteType === "neutral") stats.neutral++;
    });

    // Buscar voto do usuário atual se voterId for fornecido
    let userVote = null;
    if (voterId) {
      const userVoteDoc = await databases.listDocuments(
        databaseId,
        "playerVotes",
        [
          Query.equal("steamid", steamid),
          Query.equal("voterId", voterId),
          Query.limit(1)
        ]
      );

      if (userVoteDoc.documents.length > 0) {
        userVote = userVoteDoc.documents[0].voteType;
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      userVote,
    });
  } catch (error: any) {
    console.error("Error getting votes:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
