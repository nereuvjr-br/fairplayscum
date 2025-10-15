import * as dotenv from "dotenv";

dotenv.config();

async function processQueue() {
  console.log("🚀 Processando próxima consulta da fila...\n");

  try {
    const response = await fetch("http://localhost:3000/api/steam/process");
    const data = await response.json();

    if (data.success) {
      console.log("✅", data.message);
    } else {
      console.log("❌", data.error || data.message);
    }
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    console.log("\n⚠️  Certifique-se de que o servidor está rodando: npm run dev");
  }
}

processQueue();
