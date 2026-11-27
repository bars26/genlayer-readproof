// Live check of ReadProof v1.1 on GenLayer Studio: confirmation makes the whole ruling again (model included), and a
// deal pays one read per underlying episode. Real Podnews Daily episodes; demo deal funded with test GEN.
//
//   DEMO_KEYS=<file> node scripts/v11-check.mjs <address>

import { readFileSync, writeFileSync } from "fs";
import { createAccount } from "genlayer-js";
import { GEN, client, field, fund, log, read, reconcile, reconciliations, setContract, sleep, write } from "./studio.mjs";

const [CONTRACT] = process.argv.slice(2);
if (!CONTRACT || !process.env.DEMO_KEYS) throw new Error("usage: DEMO_KEYS=<file> node scripts/v11-check.mjs <address>");
setContract(CONTRACT);
const keys = JSON.parse(readFileSync(process.env.DEMO_KEYS, "utf8"));
const acct = Object.fromEntries(Object.entries(keys).map(([k, v]) => [k, createAccount(v)]));
const C = Object.fromEntries(Object.entries(acct).map(([k, a]) => [k, client(a)]));
console.log("contract  ", CONTRACT);
for (const [k, a] of Object.entries(acct)) console.log(k.padEnd(10), a.address);
await fund(acct.sponsor.address, 5n);
await fund(acct.producer.address, 3n);
await fund(acct.listener.address, 3n);
await sleep(3000);

const PRICE = GEN / 10n;
const DAILY = ["https://podnews.net/rss", "1325018583"];
const EP20 = "https://podnews.net/update/night-vale-perfume";
const EP23 = "https://podnews.net/update/bouvard-leaves-westwood-one";
const reads = {};
let nextRead = (await read(C.sponsor, "get_reads", [0, 200])).length;
const deliver = async (label, dealId, guid, opts) => {
  await write(C.producer, "producer", "deliver", [dealId, guid], 0n, opts);
  if (opts?.expectError) return null;
  const id = `read_${nextRead++}`;
  const r = await read(C.sponsor, "get_read", [id]);
  console.log(`  -> ${id} ${label}: ${field(r, "verdict")} ${field(r, "code")}`);
  reads[id] = label;
  return id;
};

await write(C.sponsor, "sponsor", "deposit", [], 3n * PRICE);
await write(C.sponsor, "sponsor", "open_deal", [...DAILY, "Gamut Podcast Network", "",
  "top 10 network reach | a team that actually emails you back | talk to them if your show should be making more money",
  "2026-11-01", "2026-11-30", 1, PRICE, 2]);
const deal = `deal_${(await read(C.sponsor, "get_deals", [0, 100])).length - 1}`;
const r20 = await deliver("Podnews Daily, 20 Nov: Gamut read", deal, EP20);
const r23 = await deliver("Podnews Daily, 23 Nov: Gamut read (another episode: takes the second slot)", deal, EP23);
await deliver("the 20 Nov episode again", deal, EP20, { expectError: true });
await reconcile(C.sponsor, "two reads delivered");

// A listener disputes the 20 Nov read with a 10% stake: the whole ruling is made again, it stands.
await write(C.listener, "listener", "deposit", [], PRICE / 10n);
await write(C.listener, "listener", "dispute", [r20]);
// Confirmation makes the whole ruling again, model included, even after the dismissed dispute.
for (const id of [r20, r23]) await write(C.producer, "producer", "confirm", [id]);
for (const id of [r20, r23]) {
  const c = JSON.parse(field(await read(C.sponsor, "get_read", [id]), "confirm_json"));
  console.log(`  ${id} confirmation: ${c.verdict} ${c.code}, stands ${c.stands}, same episode ${c.same_episode}, transcript changed ${c.transcript_changed}, points ${JSON.stringify(c.judged?.points)}`);
}
await write(C.sponsor, "sponsor", "withdraw", []);
await reconcile(C.sponsor, "after the confirmations and the sponsor's withdrawal");

const plain = (m) => JSON.parse(JSON.stringify(m instanceof Map ? Object.fromEntries(m) : m, (k, v) => (typeof v === "bigint" ? v.toString() : v instanceof Map ? Object.fromEntries(v) : v)));
const out = { network: "studio", contract: CONTRACT, accounts: Object.fromEntries(Object.entries(acct).map(([k, a]) => [k, a.address])),
  deal: plain(await read(C.sponsor, "get_deal", [deal])), reads: {}, readLabels: reads, reconciliations, log };
for (const id of Object.keys(reads)) out.reads[id] = plain(await read(C.sponsor, "get_read", [id]));
writeFileSync(new URL("../docs/v11-run.json", import.meta.url), JSON.stringify(out, null, 2));
console.log("wrote docs/v11-run.json");
