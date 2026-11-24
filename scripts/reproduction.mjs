// Renders docs/REPRODUCTION.md from docs/demo-run.json (written by scripts/demo.mjs) and, when present,
// docs/ui-test.json (a MetaMask run from the live app).
//
//   node scripts/reproduction.mjs

import { readFileSync, writeFileSync } from "fs";

const run = JSON.parse(readFileSync(new URL("../docs/demo-run.json", import.meta.url), "utf8"));
const EXPLORER = "https://explorer-studio.genlayer.com";
const tx = (h) => (h ? `[${h.slice(0, 10)}…](${EXPLORER}/tx/${h})` : "");
const gen = (w) => `${(Number(w) / 1e18).toLocaleString("en-US", { maximumFractionDigits: 4 })} GEN`;
const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const js = (s) => { try { return JSON.parse(s || "{}"); } catch { return {}; } };

const deals = Object.values(run.deals).map((d) =>
  `| ${d.id} | ${esc(d.brand)} on ${esc(d.show)} ([feed](${d.feed}), [Apple ${d.apple_id}](https://podcasts.apple.com/podcast/id${d.apple_id})) | ${d.code ? `\`${esc(d.code)}\`` : "—"} | ${JSON.parse(d.points_json).map(esc).join("; ") || "—"} | ${d.start} to ${d.end} | ${gen(d.price)} × ${d.slots} | ${d.n_delivered}/${d.slots} delivered, ${gen(d.reserved)} reserved, ${gen(d.budget)} left |`);

const reads = Object.values(run.reads).map((r) => {
  const g = js(r.reading_json);
  const f = g.facts || {};
  const points = JSON.parse(run.deals[r.deal_id].points_json);
  const judged = g.judged ? `${g.judged.ad_read ? "sponsor message" : "not a sponsor message"}${points.length ? `; ${points.map((p, i) => `${g.judged.points[i] ? "✓" : "✗"} ${esc(p)}`).join(", ")}` : ""}` : "—";
  return `| ${r.id} (${r.deal_id}) | ${esc(r.title)}<br>${(r.published || "").replace("T", " ")} UTC | ${f.apple?.by ? `by ${f.apple.by}, ${String(f.apple.released).replace("T", " ")}` : "—"} | ${f.transcript ? `${f.transcript.type}, ${f.transcript_chars ?? "?"} chars` : "—"} | ${f.mentions ?? "—"}${f.code_found !== undefined ? `, code ${f.code_found ? "found" : "missing"}` : ""} | ${judged} | **${r.verdict}** ${r.code} | ${r.state} |`;
});

const details = Object.values(run.reads).map((r) => {
  const g = js(r.reading_json);
  const f = g.facts || {};
  const d = r.dispute_json ? js(r.dispute_json) : null;
  const c = r.confirm_json ? js(r.confirm_json) : null;
  return `- **${r.id}** (${esc(run.readLabels[r.id])}): ${esc(r.why)} Guid \`${esc(r.guid)}\`.${f.transcript ? ` Transcript ${f.transcript.url}, sha256 \`${f.transcript_sha256}\`.` : ""} Ruling packet sha256 \`${g.packet_sha256}\`, read at ${g.read_at} UTC.${d ? ` **Disputed** by \`${r.disputed_by}\` at ${d.read_at} UTC: read again, ${d.verdict === "DELIVERED" ? "DISMISSED (still delivered)" : `UPHELD (${d.code})`}${Number(r.bonus) ? `; the stake, ${gen(r.bonus)}, joined the show's price` : ""}.` : ""}${c ? ` Confirmed at ${c.read_at} UTC: ${c.in_feed ? "still in the feed" : "gone from the feed"}, ${c.mentions} mention(s) in the transcript; wallet in the feed: ${c.wallet || "none yet"}; ${gen(r.host_share)} ${r.state === "paid" ? "paid" : "held for the show"}.` : ""}`;
});

const log = run.log.map((r) => `| ${r.who} | \`${esc(r.call).slice(0, 110)}\` | ${r.value === "0" ? "" : r.value} | ${r.status} | ${r.exec} | ${esc(r.refused ? `refused: ${r.refused}` : r.returned ?? "").slice(0, 150)} | ${tx(r.hash)} |`);
const recon = run.reconciliations.map((r) => `| ${r.label} | ${gen(r.budgets)} | ${gen(r.reserved)} | ${gen(r.held)} | ${gen(r.owed)} | ${gen(r.expected)} | ${gen(r.balance)} | ${r.ok ? "match" : "MISMATCH"} |`);

let uiTest = "";
try {
  const ui = JSON.parse(readFileSync(new URL("../docs/ui-test.json", import.meta.url), "utf8"));
  uiTest = `## Wallet test from the live app

${ui.note} Wallet \`${ui.wallet}\`.

| Step | GEN sent | Result | Tx |
|---|---|---|---|
${ui.steps.map(([step, value, result, hash]) => `| ${esc(step)} | ${value} | ${esc(result)} | ${tx(hash)} |`).join("\n")}

`;
} catch {
  // no wallet test recorded
}

const md = `# ReadProof: reproduction

Every ruling below was made by GenLayer validators on GenLayer Studio, reading the shows' own RSS feeds, Apple's public
podcast directory and the episodes' published transcripts. Contract \`${run.contract}\` ([explorer](${EXPLORER}/address/${run.contract}));
\`node scripts/verify-code.mjs ${run.contract}\` checks the deployed code is byte-identical to \`contracts/read_proof.py\`.

The deals are **demo deals** funded by test wallets with Studio test GEN: not offers from these sponsors or to these
shows. The feeds, episodes, transcripts and the sponsor reads in them are real.

## The deals

| Deal | Sponsor on show | Code | Talking points | Window | Price | State |
|---|---|---|---|---|---|---|
${deals.join("\n")}

## Every episode submitted

| Read | Episode | Apple's record | Transcript | Mentions | The model, on the passages | Ruling | State |
|---|---|---|---|---|---|---|---|
${reads.join("\n")}

${details.join("\n")}

Check one yourself: \`curl -s https://podnews.net/audio/podnews261120.mp3.vtt | grep -i -A2 "sponsored by"\` and
\`curl -s "https://itunes.apple.com/lookup?id=1325018583&entity=podcastEpisode&limit=5"\`.

${uiTest}## Every transaction

A refused call is still ACCEPTED by consensus; the contract outcome is the \`exec\` column (\`ERROR\` = refused, on purpose here).
GenLayer Studio charges a fee distribution on every transaction (since 2026-11-24); a withdrawal's GEN arrives when the
transaction is finalized.

| Who | Call | GEN sent | Consensus | exec | Returned / refused | Tx |
|---|---|---|---|---|---|---|
${log.join("\n")}

Accounts: ${Object.entries(run.accounts).map(([k, a]) => `${k} \`${a}\``).join(", ")}.

## Balance reconciliation

\`totals()\` keeps running totals (unreserved budgets, reserved prices, prices held for a wallet, GEN credited but not
withdrawn); their sum must equal the contract's GEN balance on chain. Each line was taken once every transaction had
finalized.

| When | Budgets | Reserved | Held | Credited | Expected | On-chain balance | |
|---|---|---|---|---|---|---|---|
${recon.join("\n")}
`;
writeFileSync(new URL("../docs/REPRODUCTION.md", import.meta.url), md);
console.log(`wrote docs/REPRODUCTION.md (${run.log.length} transactions)`);
