// Live run of ReadProof on GenLayer Studio over real podcasts: their own RSS feeds, Apple's directory and the
// episodes' published transcripts. Writes docs/demo-run.json.
//
//   DEMO_KEYS=<file> node scripts/demo.mjs <contract-address>
//
// The deals are DEMO deals funded by test wallets with Studio test GEN, not offers from these sponsors or to these
// shows. The feeds, episodes, transcripts and the sponsor reads in them are real.

import { writeFileSync } from "fs";
import { createAccount, generatePrivateKey } from "genlayer-js";
import { GEN, client, field, fund, log, read, reconcile, reconciliations, setContract, sleep, write } from "./studio.mjs";

const [CONTRACT] = process.argv.slice(2);
if (!CONTRACT) {
  console.error("usage: node scripts/demo.mjs <contract-address>");
  process.exit(1);
}
setContract(CONTRACT);
const keys = { sponsor: generatePrivateKey(), producer: generatePrivateKey(), listener: generatePrivateKey() };
if (process.env.DEMO_KEYS) writeFileSync(process.env.DEMO_KEYS, JSON.stringify(keys));
const acct = Object.fromEntries(Object.entries(keys).map(([k, v]) => [k, createAccount(v)]));
const C = Object.fromEntries(Object.entries(acct).map(([k, a]) => [k, client(a)]));
console.log("contract  ", CONTRACT);
for (const [k, a] of Object.entries(acct)) console.log(k.padEnd(10), a.address);
await fund(acct.sponsor.address, 20n);
await fund(acct.producer.address, 5n);
await fund(acct.listener.address, 3n);
await sleep(3000);

const PRICE = GEN / 2n;
const DAILY = ["https://podnews.net/rss", "1325018583"];
const WEEKLY = ["https://rss.buzzsprout.com/1538779.rss", "1542481043"];
const DARKNET = ["https://podcast.darknetdiaries.com", "1296350485"];
const firstDeal = (await read(C.sponsor, "get_deals", [0, 100])).length;
let nextRead = (await read(C.sponsor, "get_reads", [0, 200])).length;
const dealIds = {};
const reads = {};
const open = async (label, [feed, apple], brand, code, points, slots, opts) => {
  const row = await write(C.sponsor, "sponsor", "open_deal", [feed, apple, brand, code, points, "2026-11-01", "2026-11-30", 1, PRICE, slots], 0n, opts);
  if (opts?.expectError) return null;
  const id = `deal_${firstDeal + Object.keys(dealIds).length}`;
  dealIds[id] = label;
  return id;
};
const deliver = async (label, dealId, guid, opts) => {
  await write(C.producer, "producer", "deliver", [dealId, guid], 0n, opts);
  if (opts?.expectError) return null;
  const id = `read_${nextRead++}`;
  const r = await read(C.sponsor, "get_read", [id]);
  console.log(`  -> ${id} ${label}: ${field(r, "verdict")} ${field(r, "code")}. ${field(r, "why")}`);
  reads[id] = label;
  return id;
};

// A sponsor funds four deals from one deposit (and keeps 0.5 GEN to withdraw at the end).
await write(C.sponsor, "sponsor", "deposit", [], 7n * PRICE);
const gamut = await open("Gamut Podcast Network on Podnews Daily: three reads", DAILY, "Gamut Podcast Network", "",
  "top 10 network reach | a team that actually emails you back | talk to them if your show should be making more money", 3);
const london = await open("The Podcast Show London on Podnews Weekly Review, with the code PODNEWS10", WEEKLY, "Podcast Show London", "PODNEWS10",
  "listeners get money off tickets with the code", 1);
const trial = await open("Gamut on Podnews Daily, asking for a point the read does not make", DAILY, "Gamut Podcast Network", "",
  "a free trial for new shows", 1);
const darknet = await open("ThreatLocker on Darknet Diaries", DARKNET, "ThreatLocker", "", "", 1);
// Refused before anything is taken: Apple lists the Podnews Daily id with another feed than Darknet Diaries'.
await open("mismatched show", [DARKNET[0], DAILY[1]], "ThreatLocker", "", "", 1, { expectError: true });
await reconcile(C.sponsor, "four deals funded, 0.5 GEN still credited to the sponsor");

// Real episodes, as they are in the feeds today.
await deliver("Podnews Daily, 29 Oct (before the window)", gamut, "https://podnews.net/update/tripus-live-stream-us");
const r19 = await deliver("Podnews Daily, 19 Nov: Gamut read", gamut, "https://podnews.net/update/ai-sports-slopcaster");
const r20 = await deliver("Podnews Daily, 20 Nov: Gamut read", gamut, "https://podnews.net/update/night-vale-perfume");
const r23 = await deliver("Podnews Daily, 23 Nov: Gamut read", gamut, "https://podnews.net/update/bouvard-leaves-westwood-one");
await deliver("the 20 Nov episode again", gamut, "https://podnews.net/update/night-vale-perfume", { expectError: true });
const rLondon = await deliver("Podnews Weekly Review, 20 Nov: 'use the code pod news 10'", london, "Buzzsprout-20153963");
await deliver("Podnews Daily, 19 Nov, for the free-trial deal", trial, "https://podnews.net/update/ai-sports-slopcaster");
await deliver("Darknet Diaries 182, Blackshades (ads are inserted dynamically, not in the transcript)", darknet, "prx_7057_c0abbff3-ae98-4e23-a389-5ee0fd824f51");
await reconcile(C.sponsor, "four reads delivered and reserved");

// A listener disputes one read with a 10% stake: validators make the whole ruling again. It stands: dismissed.
await write(C.listener, "listener", "deposit", [], PRICE / 10n);
await write(C.listener, "listener", "dispute", [r19]);
await write(C.listener, "listener", "dispute", [r19], 0n, { expectError: true });
await reconcile(C.sponsor, "a dismissed dispute: the stake reserved for the show");

// Each episode has stood a day: confirm. The feeds declare no GenLayer wallet yet, so the shows' prices are held.
for (const id of [r19, r20, rLondon]) await write(C.producer, "producer", "confirm", [id]);
const now = new Date().toISOString().slice(0, 19);
if (now < "2026-11-24T10:56:37") await write(C.producer, "producer", "confirm", [r23], 0n, { expectError: true }); // stands until 10:56 UTC
else await write(C.producer, "producer", "confirm", [r23]);
await write(C.producer, "producer", "claim", [r19], 0n, { expectError: true });
await write(C.producer, "producer", "close_deal", [gamut], 0n, { expectError: true });
await reconcile(C.sponsor, "reads confirmed: the shows' prices held for their wallets");
await write(C.sponsor, "sponsor", "withdraw", []);
await reconcile(C.sponsor, "end of run, after the sponsor's withdrawal finalized");

const plain = (m) => JSON.parse(JSON.stringify(m instanceof Map ? Object.fromEntries(m) : m, (k, v) => (typeof v === "bigint" ? v.toString() : v instanceof Map ? Object.fromEntries(v) : v)));
const out = { network: "studio", contract: CONTRACT, accounts: Object.fromEntries(Object.entries(acct).map(([k, a]) => [k, a.address])),
  deals: {}, reads: {}, dealLabels: dealIds, readLabels: reads, reconciliations, log };
for (const id of Object.keys(dealIds)) out.deals[id] = plain(await read(C.sponsor, "get_deal", [id]));
for (const id of Object.keys(reads)) out.reads[id] = plain(await read(C.sponsor, "get_read", [id]));
writeFileSync(new URL("../docs/demo-run.json", import.meta.url), JSON.stringify(out, null, 2));
console.log("wrote docs/demo-run.json");
