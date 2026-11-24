"use client";

import { useState } from "react";
import { ExternalLink, FileText, Loader2, Search } from "lucide-react";
import { appleUrl, lastDay, pointsOf, sameAddress, todayUtc, wei, type Deal, type ShowPreview } from "@/lib/contracts/types";
import { useWallet } from "@/lib/genlayer/wallet";
import { useProofWrite } from "@/lib/hooks/useReadProof";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const EXAMPLES = [
  { label: "Podnews Daily · Gamut", feed: "https://podnews.net/rss", brand: "Gamut Podcast Network", code: "" },
  { label: "Podnews Weekly · PODNEWS10", feed: "https://rss.buzzsprout.com/1538779.rss", brand: "Podcast Show London", code: "PODNEWS10" },
  { label: "Darknet Diaries", feed: "https://podcast.darknetdiaries.com", brand: "ThreatLocker", code: "" },
];

/** Look at a show's latest episodes before paying for a transaction: what its feed, Apple and its transcripts say. */
export function EpisodeCheck({ deals, onBook }: { deals: Deal[]; onBook: (p: { feed: string; apple: string; brand: string; code: string }) => void }) {
  const { isConnected, address } = useWallet();
  const { write, pending } = useProofWrite();
  const [feed, setFeed] = useState(EXAMPLES[0].feed);
  const [brand, setBrand] = useState(EXAMPLES[0].brand);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [show, setShow] = useState<ShowPreview | null>(null);

  const look = async (f = feed, b = brand, c = code) => {
    setLoading(true);
    setErr("");
    setShow(null);
    try {
      const qs = new URLSearchParams({ feed: f.trim(), brand: b.trim(), code: c.trim() });
      const res = await fetch(`/api/show?${qs}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setShow(body);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const norm = (u: string) => u.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "");
  // Deals on this show that can still pay a read: open, inside their submission period, with a slot left. The
  // connected wallet's own deals first, then the newest.
  const openDeals = deals
    .filter((d) => show && norm(d.feed) === norm(show.feed) && d.state === "open" && todayUtc() <= lastDay(d) && wei(d.budget) >= wei(d.price))
    .sort((a, b) => Number(sameAddress(b.sponsor, address)) - Number(sameAddress(a.sponsor, address)) || Number(b.id.split("_")[1]) - Number(a.id.split("_")[1]));

  return (
    <div className="brand-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="display text-xl font-semibold flex items-center gap-2">
          <Search className="w-5 h-5" /> Check a show&apos;s episodes
        </h2>
        <span className="text-xs text-muted-foreground">no wallet needed</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((x) => (
          <button
            key={x.label}
            type="button"
            className="rounded-full border border-border bg-white px-3 py-1 text-xs hover:bg-muted"
            onClick={() => {
              setFeed(x.feed);
              setBrand(x.brand);
              setCode(x.code);
              look(x.feed, x.brand, x.code);
            }}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
        <Input className="sm:col-span-3" value={feed} onChange={(e) => setFeed(e.target.value)} placeholder="RSS feed URL" aria-label="RSS feed URL" />
        <Input className="sm:col-span-2" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Sponsor" aria-label="Sponsor" />
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code" aria-label="Promo code" />
      </div>
      <Button onClick={() => look()} disabled={loading} variant="outline" size="sm">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Read the feed
      </Button>
      {err && <p className="text-sm text-[#A7342A]">{err}</p>}
      {show && (
        <div className="space-y-3">
          <div className="text-sm">
            <p className="font-semibold">{show.title || show.feed}</p>
            <p className="text-xs text-muted-foreground">
              {show.apple ? (
                <>
                  Apple Podcasts{" "}
                  <a href={appleUrl(show.apple.id)} target="_blank" rel="noopener noreferrer" className="underline">
                    id {show.apple.id}
                  </a>{" "}
                  {show.apple.same ? "lists this exact feed" : `lists another feed (${show.apple.feed})`}
                </>
              ) : (
                "Apple Podcasts: no record found for this feed"
              )}{" "}
              · {show.wallet ? `GenLayer wallet in the feed: ${show.wallet.slice(0, 6)}…${show.wallet.slice(-4)}` : "no GenLayer wallet in the feed yet (prices are held until it adds one)"}
            </p>
            {show.apple?.same && (
              <Button size="sm" className="mt-2" onClick={() => onBook({ feed: show.feed, apple: show.apple!.id, brand, code })}>
                Book reads on this show
              </Button>
            )}
          </div>
          <ul className="space-y-2">
            {show.episodes.map((e) => (
              <li key={e.guid} className="rounded-lg border border-border bg-white p-3 text-sm space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{e.published.replace("T", " ").slice(0, 16)} UTC</span>
                  <span className={`rounded-full border px-2 py-0.5 ${e.transcript ? "border-[#BBDCCB] text-[#2F7A55]" : "border-border text-muted-foreground"}`}>
                    <FileText className="inline w-3 h-3" /> {e.transcript ? e.transcript.type : "no transcript"}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 ${e.apple ? "border-[#BBDCCB] text-[#2F7A55]" : "border-border text-muted-foreground"}`}>
                    {e.apple ? `on Apple (by ${e.apple})` : "not on Apple yet"}
                  </span>
                  {e.mentions !== null && (
                    <span className={`rounded-full border px-2 py-0.5 ${e.mentions ? "border-[#F2C2BC] text-[#A7342A]" : "border-border text-muted-foreground"}`}>
                      {e.mentions} mention{e.mentions === 1 ? "" : "s"} of {brand}
                      {e.codeFound !== null ? ` · code ${e.codeFound ? "found" : "missing"}` : ""}
                    </span>
                  )}
                </div>
                <p className="font-medium">{e.title}</p>
                {e.excerpt && <p className="text-xs text-muted-foreground">&ldquo;…{e.excerpt}…&rdquo;</p>}
                {isConnected && openDeals.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-xs text-muted-foreground">Submit this episode to a deal on this show (its brand and points must be in the read):</p>
                    {openDeals.map((d) => {
                      const mine = sameAddress(d.sponsor, address);
                      const left = Number(wei(d.budget) / (wei(d.price) || 1n));
                      return (
                        <Button
                          key={d.id}
                          size="sm"
                          variant={mine ? "default" : "outline"}
                          className="h-auto w-full justify-start whitespace-normal py-1.5 text-left"
                          disabled={!!pending}
                          onClick={() => write({ kind: "deliver", dealId: d.id, guid: e.guid })}
                        >
                          {pending === `deliver:${d.id}|${e.guid}` && <Loader2 className="w-4 h-4 animate-spin" />}
                          <span>
                            {mine ? "Your deal " : ""}
                            {d.id}: {d.brand} · {left} slot{left === 1 ? "" : "s"} left
                            {pointsOf(d).length ? ` · points: ${pointsOf(d).join("; ")}` : ""}
                            {d.code ? ` · code ${d.code}` : ""}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            This preview runs the contract&apos;s rules without validators or a model, on the 12 latest episodes (transcripts of the first 6).
            Submitting asks the validators for the real ruling. Feed:{" "}
            <a href={show.feed} target="_blank" rel="noopener noreferrer" className="underline">
              {show.feed} <ExternalLink className="inline w-3 h-3" />
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
