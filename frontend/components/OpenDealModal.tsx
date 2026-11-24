"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { MIN_PRICE_WEI, addDays, parseGen, todayUtc } from "@/lib/contracts/types";
import { useWallet } from "@/lib/genlayer/wallet";
import { useProofWrite } from "@/lib/hooks/useReadProof";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const SHOWS = [
  { label: "Podnews Daily", feed: "https://podnews.net/rss", apple: "1325018583", brand: "Gamut Podcast Network", points: "top 10 network reach | a team that actually emails you back" },
  { label: "Podnews Weekly Review", feed: "https://rss.buzzsprout.com/1538779.rss", apple: "1542481043", brand: "Buzzsprout", points: "start podcasting, keep podcasting" },
  { label: "Buzzcast", feed: "https://rss.buzzsprout.com/231452.rss", apple: "1446336657", brand: "Buzzsprout", points: "" },
];

export type DealPrefill = { feed: string; apple: string; brand?: string; code?: string };

export function OpenDealModal({ open, onOpenChange, prefill }: { open: boolean; onOpenChange: (o: boolean) => void; prefill?: DealPrefill | null }) {
  const { isConnected } = useWallet();
  const { writeAsync, pending } = useProofWrite();
  const [f, setF] = useState({
    feed: SHOWS[0].feed,
    apple: SHOWS[0].apple,
    brand: SHOWS[0].brand,
    code: "",
    points: SHOWS[0].points,
    start: "",
    end: "",
    price: "0.1",
    slots: "3",
    survival: "1",
  });
  useEffect(() => {
    if (!open) return;
    setF((x) => ({
      ...x,
      ...(prefill ? { feed: prefill.feed, apple: prefill.apple, brand: prefill.brand || x.brand, code: prefill.code ?? x.code } : {}),
      start: x.start || addDays(todayUtc(), -20),
      end: x.end || addDays(todayUtc(), 30),
    }));
  }, [open, prefill]);
  const price = parseGen(f.price);
  const slots = Number(f.slots);
  const budget = price && Number.isInteger(slots) ? price * BigInt(Math.max(slots, 0)) : null;
  const points = f.points.split(/[|\n]/).map((p) => p.trim()).filter(Boolean);
  const alnum = f.code.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const problems = [
    !/^https?:\/\/\S{4,300}$/.test(f.feed.trim()) && "Paste the show's RSS feed URL.",
    !/^\d{4,12}$/.test(f.apple.trim()) && "The show's Apple Podcasts id is the number in its podcasts.apple.com link (…/id1325018583).",
    !(f.brand.trim().length >= 2 && f.brand.trim().length <= 60) && "Name the sponsor (2 to 60 characters), as the host says it.",
    f.code && (f.code.length > 40 || alnum.length < 3) && "A promo code has 3 to 40 characters with letters or digits (or leave it empty).",
    (points.length > 5 || points.some((p) => p.length > 120)) && "At most 5 talking points of up to 120 characters.",
    (!f.start || !f.end || f.end < f.start || f.end > addDays(f.start, 120)) && "The window ends on or after it starts, within 120 days.",
    f.start < addDays(todayUtc(), -60) && "The window may start at most 60 days ago.",
    (!price || price < MIN_PRICE_WEI) && "The price per read is at least 0.01 GEN.",
    !(Number.isInteger(slots) && slots >= 1 && slots <= 10) && "1 to 10 reads.",
    !(Number(f.survival) >= 1 && Number(f.survival) <= 60) && "The episode stands 1 to 60 days before payment.",
  ].filter(Boolean) as string[];
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    try {
      await writeAsync({
        kind: "open",
        input: {
          feed: f.feed.trim(),
          appleId: f.apple.trim(),
          brand: f.brand.trim(),
          code: f.code.trim(),
          points: points.join(" | "),
          start: f.start,
          end: f.end,
          survivalDays: Number(f.survival),
          price: price!,
          slots,
        },
      });
      onOpenChange(false);
    } catch {
      // the toast and the transaction panel explain it
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="brand-card max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="display text-2xl">Book host-read sponsor messages</DialogTitle>
          <DialogDescription>
            Each episode of this show, published in your window, that names your brand in a sponsor message (with your code and every
            talking point) earns the price once it has stayed up for the survival period. The budget is committed until the window and
            14 days after it have passed; what is not reserved then comes back to you.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {SHOWS.map((s) => (
            <button
              key={s.label}
              type="button"
              className="rounded-full border border-border bg-white px-3 py-1 text-xs hover:bg-muted"
              onClick={() => setF({ ...f, feed: s.feed, apple: s.apple, brand: s.brand, points: s.points })}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label htmlFor="od-feed">The show&apos;s RSS feed</Label>
            <Input id="od-feed" value={f.feed} onChange={set("feed")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="od-apple">Apple Podcasts id</Label>
            <Input id="od-apple" value={f.apple} onChange={set("apple")} inputMode="numeric" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="od-brand">Sponsor, as the host says it</Label>
            <Input id="od-brand" value={f.brand} onChange={set("brand")} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label htmlFor="od-points">Talking points (separate with |)</Label>
            <textarea
              id="od-points"
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
              rows={2}
              value={f.points}
              onChange={set("points")}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="od-code">Promo code (optional)</Label>
            <Input id="od-code" value={f.code} onChange={set("code")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="od-surv">Episode stands (days)</Label>
            <Input id="od-surv" value={f.survival} onChange={set("survival")} inputMode="numeric" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="od-start">Published from</Label>
            <Input id="od-start" type="date" value={f.start} onChange={set("start")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="od-end">Published until</Label>
            <Input id="od-end" type="date" value={f.end} onChange={set("end")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="od-price">Price per read (GEN)</Label>
            <Input id="od-price" value={f.price} onChange={set("price")} inputMode="decimal" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="od-slots">Reads</Label>
            <Input id="od-slots" value={f.slots} onChange={set("slots")} inputMode="numeric" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Validators check that Apple Podcasts lists this id with exactly this feed, so the feed and Apple describe one show. The model only
          judges whether a passage is a sponsor message that conveys each point; your brand name and code are found in code.
        </p>
        {problems.length > 0 && (
          <ul className="list-disc pl-5 text-xs text-[#A7342A]">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
        <Button className="w-full" disabled={!isConnected || problems.length > 0 || pending === "open"} onClick={submit}>
          {pending === "open" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isConnected ? `Deposit and book (${budget ? (Number(budget) / 1e18).toLocaleString("en-US", { maximumFractionDigits: 4 }) : 0} GEN)` : "Connect a wallet first"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
