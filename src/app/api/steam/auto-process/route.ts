import { NextResponse } from "next/server";
import { Client, Databases, Query } from "node-appwrite";

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = "68ef2ed6000fa358405c";

/**
 * Endpoint para iniciar processamento automático da fila
 * Este endpoint é chamado pelo cliente e mantém uma conexão ativa
 * processando múltiplos itens da fila
 */
export async function POST(request: Request) {
  const { batchSize = 5 } = await request.json();

  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    // Verificar quantos itens pendentes existem
    const pendingCount = await databases.listDocuments(
      databaseId,
      "steamQueue",
      [
        Query.equal("status", "pending"),
        Query.lessThanEqual("scheduledFor", new Date().toISOString()),
        Query.limit(1)
      ]
    );

    if (pendingCount.total === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhum item pendente na fila",
        processed: 0,
      });
    }

    // Processar em lote usando o endpoint existente
    const processUrl = new URL('/api/steam/process-batch', request.url);
    processUrl.searchParams.set('batch', batchSize.toString());

    const response = await fetch(processUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: `Processamento em lote concluído`,
      processed: data.processed || 0,
      results: data.results || [],
    });
  } catch (error: unknown) {
    console.error("Error in auto-process:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET: Retorna status do processamento automático
 */
export async function GET() {
  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    const now = new Date().toISOString();
    
    // Contar itens pendentes prontos para processar
    const pending = await databases.listDocuments(
      databaseId,
      "steamQueue",
      [
        Query.equal("status", "pending"),
        Query.lessThanEqual("scheduledFor", now),
        Query.limit(1)
      ]
    );

    // Contar itens em processamento
    const processing = await databases.listDocuments(
      databaseId,
      "steamQueue",
      [Query.equal("status", "processing"), Query.limit(1)]
    );

    return NextResponse.json({
      success: true,
      pending: pending.total,
      processing: processing.total,
      canProcess: pending.total > 0 && processing.total === 0,
    });
  } catch (error: unknown) {
    console.error("Error checking auto-process status:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
