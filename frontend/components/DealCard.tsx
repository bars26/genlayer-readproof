"use client";

import { ExternalLink, Loader2, Mic } from "lucide-react";
import {
  CODE_LABEL,
  STAKE_DIVISOR,
  STATE_TEXT,
  VERDICT_STYLE,
  appleUrl,
  formatGen,
  lastDay,
  parseJson,
  pointsOf,
  readingOf,
  todayUtc,
  wei,
  type Deal,
  type Read,
  type Reading,
  type Recheck,
} from "@/lib/contracts/types";
import { useWallet } from "@/lib/genlayer/wallet";
import { useProofWrite } from "@/lib/hooks/useReadProof";
import { useNow } from "@/lib/hooks/useNow";
import { addressUrl, currentNetwork } from "@/lib/network";
import { Button } from "./ui/button";

const short = (a: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

function ReadRow({ read: r, deal }: { read: Read; deal: Deal }) {
  const now = useNow(30_000);
  const { isConnected } = useWallet();
  const { write, pending } = useProofWrite();
  const g = readingOf(r);
  const f = g.facts;
  const points = pointsOf(deal);
  const v = VERDICT_STYLE[r.verdict] ?? VERDICT_STYLE.UNCLEAR;
  const ripe = r.state === "held" && new Date(now).toISOString().slice(0, 19) >= r.held_until;
  const busy = (k: string) => pending === `${k}:${r.id}`;
  const dispute = r.dispute_json ? parseJson<Reading>(r.dispute_json, {}) : null;
  const confirm = r.confirm_json ? parseJson<Recheck>(r.confirm_json, {} as Recheck) : null;
  const bonus = wei(r.bonus);
  return (
    <li className="rounded-xl border border-border bg-white p-3 space-y-2 text-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="mono text-muted-foreground">{r.id}</span>
        <span className={`rounded-full border px-2 py-0.5 font-medium ${v.cls}`}>{v.label}</span>
        <span className="text-muted-foreground">{CODE_LABEL[r.code] ?? r.code}</span>
        <span className="ml-auto font-medium">{r.state.replace("_", " ")}</span>
      </div>
      <p className="font-semibold">{r.title || r.guid}</p>
      <p className="text-xs text-muted-foreground">
        Published {r.published.replace("T", " ")} UTC
        {f?.apple?.released ? ` · Apple lists it ${f.apple.released.replace("T", " ")} UTC (matched by ${f.apple.by})` : ""}
        {f?.transcript ? ` · transcript ${f.transcript.type}` : ""}
        {typeof f?.mentions === "number" ? ` · ${f.mentions} mention${f.mentions === 1 ? "" : "s"}` : ""}
        {deal.code ? ` · code ${f?.code_found ? "found" : "not found"}` : ""}
      </p>
      {g.judged && (
        <div className="rounded-lg bg-muted/60 p-2 text-xs space-y-1">
          <p>
            <span className="font-medium">{g.judged.ad_read ? "A sponsor message" : "Not a sponsor message"}</span>
            {g.judged.quote ? <>: &ldquo;{g.judged.quote}&rdquo;</> : null}
          </p>
          {points.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {points.map((p, i) => (
                <li key={p} className={`rounded-full border px-2 py-0.5 ${g.judged!.points[i] ? "border-[#BBDCCB] text-[#2F7A55]" : "border-[#F2C2BC] text-[#A7342A]"}`}>
                  {g.judged!.points[i] ? "✓" : "✗"} {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {dispute && (
        <p className="text-xs rounded-lg bg-muted/60 p-2">
          Disputed by <span className="mono">{short(r.disputed_by)}</span>
          {dispute.read_at ? ` at ${dispute.read_at.replace("T", " ")} UTC` : ""}: read again, {dispute.verdict === "DELIVERED" ? "it stands (dismissed)" : `${CODE_LABEL[dispute.code ?? ""] ?? "it is gone"} (upheld)`}.
        </p>
      )}
      {confirm && (
        <p className="text-xs text-muted-foreground">
          Confirmed at {confirm.read_at?.replace("T", " ")} UTC: episode {confirm.in_feed ? "still in the feed" : "gone from the feed"}, {confirm.mentions} mention
          {confirm.mentions === 1 ? "" : "s"} in the transcript; wallet in the feed {confirm.wallet ? short(confirm.wallet) : "not declared yet"}.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {STATE_TEXT[r.state]}
        {r.state === "held" ? ` (confirmable from ${r.held_until.replace("T", " ")} UTC)` : ""}
        {Number(r.price) > 0 ? ` · price ${formatGen(r.price, 3)} GEN` : ""}
        {bonus > 0n ? ` + ${formatGen(bonus, 3)} GEN from a dismissed dispute` : ""} · submitted by <span className="mono">{short(r.submitter)}</span>
      </p>
      {isConnected && (
        <div className="flex flex-wrap gap-2">
          {ripe && (
            <Button size="sm" onClick={() => write({ kind: "confirm", readId: r.id })} disabled={!!pending}>
              {busy("confirm") && <Loader2 className="w-4 h-4 animate-spin" />} Confirm (validators read it again)
            </Button>
          )}
          {r.state === "held" && !r.disputed_by && (
            <Button size="sm" variant="outline" onClick={() => write({ kind: "dispute", readId: r.id })} disabled={!!pending}>
              {busy("dispute") && <Loader2 className="w-4 h-4 animate-spin" />} Dispute (stake {formatGen(wei(r.price) / STAKE_DIVISOR, 3)} GEN)
            </Button>
          )}
          {r.state === "awaiting_wallet" && (
            <Button size="sm" variant="outline" onClick={() => write({ kind: "claim", readId: r.id })} disabled={!!pending}>
              {busy("claim") && <Loader2 className="w-4 h-4 animate-spin" />} Send to the wallet in the show&apos;s feed
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

export function DealCard({ deal: d, reads }: { deal: Deal; reads: Read[] }) {
  const { isConnected } = useWallet();
  const { write, pending } = useProofWrite();
  const net = currentNetwork();
  const points = pointsOf(d);
  const ordered = [...reads].sort((a, b) => Number(b.id.split("_")[1]) - Number(a.id.split("_")[1]));
  const taking = d.state === "open" && todayUtc() <= lastDay(d);
  return (
    <article className="brand-card overflow-hidden">
      <div className="p-5 space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="mono text-muted-foreground">{d.id}</span>
          <span className={`rounded-full border px-2 py-0.5 font-medium ${taking ? "bg-[#FBE5E2] text-[#A7342A] border-[#F2C2BC]" : "bg-muted text-muted-foreground"}`}>
            {taking ? "● on air: taking episodes" : d.state === "open" ? "window over" : "closed"}
          </span>
        </div>
        <h3 className="display text-2xl leading-tight flex items-center gap-2">
          <Mic className="w-5 h-5 text-[#E4503F]" /> {d.brand} <span className="text-muted-foreground font-normal">on</span> {d.show}
        </h3>
        <p className="text-sm text-muted-foreground">
          Episodes published {d.start} to {d.end} (submitted until {lastDay(d)}) · must stand {String(d.survival_days)} day
          {Number(d.survival_days) === 1 ? "" : "s"}
          {d.code ? ` · code ${d.code}` : ""}
        </p>
        {points.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 text-xs">
            {points.map((p) => (
              <li key={p} className="rounded-full bg-muted px-2 py-0.5">
                {p}
              </li>
            ))}
          </ul>
        )}
        <dl className="grid grid-cols-3 gap-2 text-xs pt-1">
          <div className="rounded-lg bg-muted/60 p-2">
            <dt className="text-muted-foreground">per read</dt>
            <dd className="display text-xl">{formatGen(d.price, 3)} GEN</dd>
          </div>
          <div className="rounded-lg bg-muted/60 p-2">
            <dt className="text-muted-foreground">budget left / reserved</dt>
            <dd className="display text-xl">
              {formatGen(d.budget, 2)} / {formatGen(d.reserved, 2)}
            </dd>
          </div>
          <div className="rounded-lg bg-muted/60 p-2">
            <dt className="text-muted-foreground">delivered / slots</dt>
            <dd className="display text-xl">
              {String(d.n_delivered)} / {String(d.slots)}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          Sponsor{" "}
          <a href={addressUrl(net, d.sponsor)} target="_blank" rel="noopener noreferrer" className="mono hover:underline">
            {short(d.sponsor)}
          </a>{" "}
          · paid {formatGen(d.paid_total, 3)} GEN ·{" "}
          <a href={d.feed} target="_blank" rel="noopener noreferrer" className="hover:underline">
            feed <ExternalLink className="inline w-3 h-3" />
          </a>{" "}
          ·{" "}
          <a href={appleUrl(d.apple_id)} target="_blank" rel="noopener noreferrer" className="hover:underline">
            Apple id {d.apple_id} <ExternalLink className="inline w-3 h-3" />
          </a>
        </p>
        {isConnected && d.state === "open" && todayUtc() > lastDay(d) && (
          <Button size="sm" variant="outline" onClick={() => write({ kind: "close", dealId: d.id })} disabled={!!pending}>
            {pending === `close:${d.id}` && <Loader2 className="w-4 h-4 animate-spin" />} Close and return the unreserved budget
          </Button>
        )}
      </div>
      <div className="border-t border-border bg-[#FBFAFD] p-5">
        {ordered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No episode submitted yet. Check the show above and submit an episode with the read.</p>
        ) : (
          <ul className="space-y-3">
            {ordered.map((r) => (
              <ReadRow key={r.id} read={r} deal={d} />
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
