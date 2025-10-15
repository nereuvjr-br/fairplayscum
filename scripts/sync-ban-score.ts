import { Client, Databases, Query } from 'node-appwrite';

/**
 * Script to compute `banScore` and `hasBan` for `players` documents based on `steamBans`.
 *
 * Usage:
 *  - Dry run (no writes):
 *      npx ts-node scripts/sync-ban-score.ts
 *  - Apply changes (will update players documents):
 *      npx ts-node scripts/sync-ban-score.ts --apply
 *
 * Requires env vars: NEXT_PUBLIC_APPWRITE_PROJECT_ID, NEXT_PUBLIC_APPWRITE_ENDPOINT, APPWRITE_API_KEY
 */

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const apiKey = process.env.APPWRITE_API_KEY!;
const databaseId = '68ef2ed6000fa358405c';

if (!projectId || !endpoint || !apiKey) {
  console.error('Missing Appwrite env vars. Set NEXT_PUBLIC_APPWRITE_PROJECT_ID, NEXT_PUBLIC_APPWRITE_ENDPOINT and APPWRITE_API_KEY');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');

async function main() {
  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const db = new Databases(client);

  const BATCH = 500;

  console.log('Fetching steamBans snapshot...');
  const allBansRes = await db.listDocuments(databaseId, 'steamBans', [Query.limit(5000)]);
  const bans = (allBansRes.documents || []) as any[];
  const bansMap: Record<string, any> = {};
  for (const b of bans) if (b.steamid) bansMap[b.steamid] = b;

  console.log(`Got ${Object.keys(bansMap).length} steamBans`);

  let offset = 0;
  let updated = 0;
  let checked = 0;

  while (true) {
    const res = await db.listDocuments(databaseId, 'players', [Query.limit(BATCH), Query.offset(offset)]);
    const docs = res.documents as any[];
    if (!docs || docs.length === 0) break;

    for (const p of docs) {
      checked++;
      const sid = p.steamid;
      const b = (bansMap[sid] as any) || {};

      const vacCount = Number(b.NumberOfVACBans ?? b.NumberOfVacBans ?? b.vacBans ?? 0);
      const gameCount = Number(b.NumberOfGameBans ?? b.gameBans ?? 0);
      const vacFlag = b.VACBanned === true || vacCount > 0;
      const communityFlag = b.CommunityBanned === true || b.communityBanned === true;
      const economyFlag = typeof b.EconomyBan === 'string' ? b.EconomyBan.toLowerCase() !== 'none' : !!b.economyBan;
      const newScore = vacCount * 10 + (vacFlag ? 5 : 0) + gameCount * 5 + (communityFlag ? 2 : 0) + (economyFlag ? 2 : 0);
      const newHas = newScore > 0;

      const oldScore = Number(p.banScore ?? 0);
      const oldHas = !!p.hasBan;

      if (oldScore !== newScore || oldHas !== newHas) {
        console.log(`${APPLY ? 'Updating' : 'Would update'} player ${p.$id} / ${sid}: banScore ${oldScore} -> ${newScore}, hasBan ${oldHas} -> ${newHas}`);
        if (APPLY) {
          try {
            await db.updateDocument(databaseId, 'players', p.$id, { ...p, banScore: newScore, hasBan: newHas });
            updated++;
          } catch (err) {
            console.error('Failed to update', p.$id, err);
          }
        }
      }
    }

    offset += docs.length;
    if (docs.length < BATCH) break;
  }

  console.log(`Checked ${checked} players. ${APPLY ? `Updated ${updated}` : `Would update ${updated}`} players.`);
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
