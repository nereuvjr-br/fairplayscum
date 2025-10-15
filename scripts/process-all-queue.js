#!/usr/bin/env node

const BATCH_SIZE = 5; // Processar 5 por vez
const DELAY_BETWEEN_BATCHES = 35000; // 35 segundos entre batches

async function processBatch() {
  try {
    console.log(`⏳ Processando batch de até ${BATCH_SIZE} consultas...`);
    
    const response = await fetch(`http://localhost:3000/api/steam/process-batch?batch=${BATCH_SIZE}`);
    const data = await response.json();

    if (data.success) {
      console.log(`✅ ${data.processed} consultas processadas`);
      
      data.results.forEach((result) => {
        if (result.processed) {
          console.log(`   ✓ ${result.steamid} - ${result.queryType}`);
        } else if (result.error) {
          console.log(`   ✗ Erro: ${result.error}`);
        } else {
          console.log(`   ℹ ${result.message}`);
        }
      });

      return data.processed;
    } else {
      console.error("❌ Erro:", data.error);
      return 0;
    }
  } catch (error) {
    console.error("❌ Erro ao processar batch:", error.message);
    return 0;
  }
}

async function processAll() {
  console.log("🚀 Iniciando processamento de todas as consultas pendentes...\n");

  let totalProcessed = 0;
  let continueProcessing = true;

  while (continueProcessing) {
    const processed = await processBatch();
    totalProcessed += processed;

    if (processed === 0) {
      continueProcessing = false;
      console.log("\n✅ Todas as consultas foram processadas!");
    } else {
      console.log(`\n⏳ Aguardando ${DELAY_BETWEEN_BATCHES / 1000}s antes do próximo batch...\n`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  console.log(`\n📊 Total processado: ${totalProcessed} consultas`);
}

processAll();
