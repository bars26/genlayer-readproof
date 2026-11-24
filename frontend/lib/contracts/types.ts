/** Types and display helpers for the ReadProof contract. */

type Num = string | number | bigint;

export type ReadState = "held" | "paid" | "awaiting_wallet" | "reverted" | "disputed" | "returned" | "refused";
export type Verdict = "DELIVERED" | "INELIGIBLE" | "UNCLEAR";

export interface Deal {
  id: string;
  sponsor: string;
  feed: string;
  apple_id: string;
  show: string;
  brand: string;
  code: string;
  points_json: string;
  start: string;
  end: string;
  survival_days: Num;
  price: Num;
  slots: Num;
  budget: Num;
  reserved: Num;
  paid_total: Num;
  returned_total: Num;
  n_submitted: Num;
  n_delivered: Num;
  state: "open" | "closed";
  history_json: string;
}

export interface Read {
  id: string;
  deal_id: string;
  guid: string;
  title: string;
  published: string;
  submitter: string;
  verdict: Verdict;
  code: string;
  why: string;
  state: ReadState;
  held_until: string;
  price: Num;
  bonus: Num;
  host_share: Num;
  host_wallet: string;
  reading_json: string;
  confirm_json: string;
  disputed_by: string;
  dispute_json: string;
  submitted_at: string;
}

export interface Reading {
  facts?: {
    guid: string;
    title: string;
    published: string;
    show: string;
    apple?: { guid: string; title: string; released: string; audio?: string; by?: "guid" | "audio" | "title" };
    transcript?: { url: string; type: string };
    transcript_chars?: number;
    transcript_sha256?: string;
    mentions?: number;
    code_found?: boolean;
  };
  judged?: { ad_read: boolean; points: boolean[]; quote: string };
  verdict?: Verdict;
  code?: string;
  read_at?: string;
  packet_sha256?: string;
}

export interface Recheck {
  in_feed: boolean;
  wallet: string;
  mentions: number;
  code_found: boolean;
  same: boolean;
  read_at?: string;
}

/** What the app's checker (no validators, no model) finds for a show: see app/api/show. */
export interface ShowPreview {
  feed: string;
  title: string;
  wallet: string;
  apple: { id: string; name: string; feed: string; same: boolean } | null;
  episodes: {
    guid: string;
    title: string;
    published: string;
    transcript: { url: string; type: string } | null;
    apple: string;
    mentions: number | null;
    codeFound: boolean | null;
    excerpt: string;
  }[];
}

export const MIN_PRICE_WEI = 10n ** 16n;
/** A dispute stakes a tenth of the read's price from the disputer's credit. */
export const STAKE_DIVISOR = 10n;
export const GRACE_DAYS = 14;

export function wei(v: Num | undefined): bigint {
  try {
    return BigInt(String(v ?? "0").split(".")[0]);
  } catch {
    return 0n;
  }
}

export function formatGen(v: Num | undefined, digits = 2): string {
  const n = Number(wei(v)) / 1e18;
  return n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export function parseGen(input: string): bigint | null {
  const t = input.trim();
  if (!/^\d+(\.\d{1,18})?$/.test(t)) return null;
  const [whole, frac = ""] = t.split(".");
  return BigInt(whole) * 10n ** 18n + BigInt((frac + "0".repeat(18)).slice(0, 18));
}

export function parseJson<T>(json: string | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export const sameAddress = (a?: string | null, b?: string | null) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
export const todayUtc = () => new Date().toISOString().slice(0, 10);
export function addDays(day: string, n: number): string {
  const t = Date.parse(`${day}T00:00:00Z`);
  return Number.isNaN(t) ? "" : new Date(t + n * 86_400_000).toISOString().slice(0, 10);
}
export const nowIso = () => new Date().toISOString().slice(0, 19);
export const pointsOf = (d: Deal) => parseJson<string[]>(d.points_json, []);
export const readingOf = (r: Read) => parseJson<Reading>(r.reading_json, {});
export const lastDay = (d: Deal) => addDays(d.end, GRACE_DAYS);
export const appleUrl = (id: string) => `https://podcasts.apple.com/podcast/id${id}`;

export const VERDICT_STYLE: Record<Verdict, { label: string; cls: string }> = {
  DELIVERED: { label: "Read delivered", cls: "bg-[#E3F1EA] text-[#2F7A55] border-[#BBDCCB]" },
  INELIGIBLE: { label: "Not a delivered read", cls: "bg-[#FBE5E2] text-[#A7342A] border-[#F2C2BC]" },
  UNCLEAR: { label: "Could not check yet", cls: "bg-[#EEEAF4] text-[#5D5770] border-[#DDD6E9]" },
};

export const STATE_TEXT: Record<ReadState, string> = {
  held: "Price reserved until the episode has stood the survival period",
  paid: "Paid to the GenLayer wallet the show's feed declares",
  awaiting_wallet: "Confirmed: the price waits for the show to declare a GenLayer wallet in its feed",
  reverted: "The episode or the read was gone at confirmation: the price went back to the deal",
  disputed: "Disputed and upheld: the disputer got the stake back plus 10%, the rest went back to the deal",
  returned: "Never claimed: the price went back to the sponsor",
  refused: "Nothing reserved; the episode can be submitted again",
};

export const CODE_LABEL: Record<string, string> = {
  delivered: "sponsor message with every talking point",
  no_date: "episode has no date",
  outside_window: "published outside the deal's window",
  apple_missing: "Apple does not list the episode yet",
  date_mismatch: "feed and Apple dates differ",
  no_transcript: "no transcript in a readable format",
  transcript_unreadable: "transcript could not be read",
  no_mention: "transcript never names the sponsor",
  no_code: "promo code not in the transcript",
  not_a_read: "named, but not in a sponsor message",
  points_missing: "talking points left out",
};
