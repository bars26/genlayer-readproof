# ReadProof

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/license/mit/)

<img src="frontend/public/favicon.svg" alt="ReadProof logo" width="80" align="right" />

**Host-read podcast sponsorships, escrowed in GEN and paid when the read is in the episode, checked by GenLayer
validators against the show's own feed, Apple's directory and the episode's transcript.**

Independent podcasts sell host-read ads on trust: a sponsor pays an invoice and checks by listening, a show waits 30
to 90 days to be paid, and neither can prove much about the other. Yet most podcast hosts now publish a transcript
with every episode (the Podcasting 2.0 `<podcast:transcript>` tag), and Apple's public directory independently
records every episode a show publishes. ReadProof turns that into a contract:

1. A **sponsor books reads** on a show: its RSS feed and Apple Podcasts id, the brand as the host says it, an optional
   **promo code**, up to five **talking points**, a publication window, a price per read and a number of reads. The
   budget comes from the sponsor's GEN deposit and stays committed until the window and 14 days after it have passed.
   Validators check that Apple lists that id with **exactly that feed**, so both describe one show.
2. The **host reads it**. When the episode is out, anyone (the host, their producer) **submits its guid**.
3. **Every validator** reads:
   - the **show's feed**: the episode with that guid, its date (inside the window);
   - **Apple's directory**: the same episode (by guid, by audio file, or by title within two days, since some hosts
     give Apple another guid and Apple drops episode numbers) with a date within two days of the feed's, so a
     backdated or invented episode does not match;
   - the **transcript** (WebVTT, SRT, Podcasting 2.0 JSON, text or HTML, best format first). **Code** finds the brand
     and the promo code (spaces and punctuation ignored, as transcription splits "PODNEWS10" into "pod news 10"); the
     **model** sees only up to three passages around the mentions (sponsor wording first) and says whether this is a
     sponsor message, not a passing or mocking mention, and which talking points it conveys.
4. A **delivered** read **reserves** the price. Until confirmation, anyone may **dispute** it with 10% of the price at
   stake: validators make the whole ruling again. Upheld: the stake back plus 10% of the price, the rest returns to the
   deal. Dismissed: the stake is paid to the show with the price.
5. Once the episode has **stood the survival period**, anyone **confirms**: validators make the **whole ruling again**
   on the episode as published now (feed, Apple, whatever transcript the episode links now, brand, code and the model's
   reading: still a sponsor message conveying every talking point) and check it is **still the episode that was
   delivered** (Apple's episode id, the audio file or the dated title). A changed transcript link or a dismissed dispute
   skips nothing; if the read no longer stands the price returns to the deal and a dismissed disputer's stake to the
   disputer. The show is paid at the **GenLayer wallet it declares
   in its own feed**, `<podcast:txt purpose="genlayer">0x…</podcast:txt>` (the Podcasting 2.0 tag made for ownership
   proofs) or a "GenLayer wallet: 0x…" line in its description; until it does, the price is **held** for it and anyone
   can send it once the wallet appears. GEN leaves the contract only through `withdraw()`, to the caller.

**Live app:** [readproof-bars26.vercel.app](https://readproof-bars26.vercel.app). Paste any show's feed (or pick an
example) to see, without a wallet, its latest episodes, whether Apple lists them, their transcripts, and where a
sponsor is named; then book reads or submit an episode with MetaMask on GenLayer Studio and **Test GEN** from the header.

**Contract (GenLayer Studio), v1.1:** [`0xe22705C4D38ce2dd6df160F650770606F3851042`](https://explorer-studio.genlayer.com/address/0xe22705C4D38ce2dd6df160F650770606F3851042)
(`node scripts/verify-code.mjs 0xe22705C4D38ce2dd6df160F650770606F3851042` checks it is byte-identical to `contracts/read_proof.py`).
The v1 run below used [`0xB813297AbF3Ec4fDe08663EE6520F746cc983eDe`](https://explorer-studio.genlayer.com/address/0xB813297AbF3Ec4fDe08663EE6520F746cc983eDe),
deployed from commit `aa5c52c`; what changed in v1.1 is under [v1.1: review fixes](#v11-review-fixes).

## Why GenLayer

- **Reading a transcript is a judgement.** "Want top 10 network reach? And a team that actually emails you back?" is
  a sponsor message conveying two talking points; "the latest from podnews.net with Gamut" in an intro is a credit,
  and "I'd never use Gamut" is a mention. Validators each read the passages and must agree on every point.
- **Nothing reported by an interested party.** The episode, its date, Apple's record of it, the transcript and the
  wallet are all read by every validator from the show's own feed and Apple's directory. Neither the sponsor nor the
  show supplies evidence.
- **The model decides only what needs judgement.** Dates, the Apple match, the brand, the code and every state change
  are code; validators must agree exactly on all of them and on the model's yes/no answers.

## Verified live, on real podcasts

`scripts/demo.mjs` ran ReadProof on GenLayer Studio on 2026-11-24 with demo deals (test wallets, test GEN; not offers
from these sponsors or to these shows) over real episodes, transcripts and sponsor reads. Every transaction, ruling,
quote and reconciliation is in [`docs/REPRODUCTION.md`](docs/REPRODUCTION.md).

| Read | Episode (real) | Deal | Ruling |
|---|---|---|---|
| `read_1` | Podnews Daily, 19 Nov: *"this podcast is sponsored by Gamut Podcast Network. If you want top ten network reach and a team that actually emails you back…"* | Gamut, 3 points | **DELIVERED**; disputed, **dismissed**; confirmed, held for the show |
| `read_2` | Podnews Daily, 20 Nov (same read, other words) | Gamut | **DELIVERED**; confirmed |
| `read_3` | Podnews Daily, 23 Nov | Gamut | **DELIVERED**; confirmation refused until it has stood a day |
| `read_4` | Podnews Weekly Review, 20 Nov: *"there is a code which you can use to get money off the London podcast show… use the code pod news10"* | The Podcast Show London, code `PODNEWS10` | **DELIVERED** (the code, transcribed as "pod news10", found) |
| `read_0` | Podnews Daily, 29 Oct | Gamut | INELIGIBLE `outside_window` |
| `read_5` | Podnews Daily, 19 Nov | Gamut, asking for "a free trial for new shows" | INELIGIBLE `points_missing`: the read never offers one |
| `read_6` | Darknet Diaries 182 (Apple matched by audio file: different guids) | ThreatLocker | INELIGIBLE `no_mention`: the show's ads are inserted dynamically and are not in its transcript |

- **Refused, taking nothing:** a deal whose Apple id lists another feed, the same episode twice for one deal, a second
  dispute of the same read, confirming before the survival period, a claim while the feed declares no wallet, closing
  a deal before its window and grace have passed.
- `totals()` matched the contract's on-chain balance at **every** step, the last after the sponsor's withdrawal
  finalized.
- **A MetaMask test from the live app** (`docs/ui-test.json`): the tester booked their own Gamut reads on Podnews Daily
  (`deal_4`), submitted two real episodes (both DELIVERED) and confirmed one (held for the show's wallet); along the way
  an episode sent to the wrong deal was refused (`points_missing`) and their dispute of a demo read was dismissed.
  Eight transactions, all finalized; the books matched afterwards.

## v1.1: review fixes

A steward asked that confirmation enforce the paid sponsor message and talking points (also after the transcript link
changes or a dispute was dismissed), and that a deal pay one read per underlying episode across changed RSS guids and
the audio/title fallback matches. Both are in [`contracts/read_proof.py`](contracts/read_proof.py):

- **Confirmation makes the whole ruling again.** `confirm()` no longer only looks for the brand and the code: it runs
  `read_delivery()` again, as `deliver()` and `dispute()` do, on the episode as published now: the feed, Apple's
  directory, whatever transcript the episode links *now*, the brand, the code, and the model's reading of the passages.
  The price is released only if the verdict is still `DELIVERED` (a sponsor message conveying every talking point).
  A dismissed dispute does not exempt the read: if it fails at confirmation the price returns to the deal and the
  disputer gets the stake back. The confirmation records `transcript_changed`, `same_episode` and `stands`.
- **One read per underlying episode.** `episode_keys()` lists what identifies the episode a reading corroborated: the
  feed's guid, Apple's episode id (`trackId`) and guid, the audio file (the feed's and Apple's, query stripped) and the
  title on its publication day. A delivered read stores them all under its deal; a later reading that shares any of them
  is ruled `INELIGIBLE` `already_delivered` and reserves nothing. At confirmation the guid must still lead to the same
  episode (Apple's id, the audio file or the dated title), else `different_episode`.

Regression tests (`tests/direct/test_read_proof.py`, 69 in all):

| Test | Shows |
|---|---|
| `test_confirmation_judges_the_sponsor_message_again` | the paid message removed while the brand and the code stay in the transcript: `reverted` (`not_a_read`); a recut read that drops a talking point: `reverted` (`points_missing`) |
| `test_a_changed_transcript_link_is_judged_too` | the episode now links another transcript: without the paid message, `reverted`; with it, judged the same way and paid |
| `test_a_dismissed_dispute_does_not_skip_the_confirmation_reading` | dispute dismissed, then the message cut: `reverted`, the stake back to the disputer, books balanced |
| `test_the_same_episode_under_a_fresh_guid_takes_no_second_slot` | a fresh guid matched by Apple's audio file, by title (same Apple record), after Apple re-ingested it (same Apple id), or with everything at Apple changed but the same audio file: `already_delivered`, no slot taken |
| `test_a_different_episode_still_takes_the_next_slot` | a genuinely different episode is not caught by mistake |
| `test_confirmation_refuses_a_guid_that_now_points_to_another_episode` | the guid reused for a later episode: `reverted` (`different_episode`) |

**Verified live on Studio** (`scripts/v11-check.mjs`, [`docs/v11-run.json`](docs/v11-run.json)) with a demo Gamut deal on
Podnews Daily: the 20 Nov and 23 Nov episodes `DELIVERED` (two different episodes, two slots; stored keys include Apple
ids `1000803110173` and `1000803578432`); the 20 Nov episode submitted again was refused; a dispute of it was
`DISMISSED`; both confirmations made the whole ruling again (`DELIVERED`, all three talking points, same episode) and
held the price for the show's wallet. `totals()` matched the contract's balance before and after.

## Who can do what (and the attacks this blocks)

| Rule | Why |
|---|---|
| A deal names a feed and an Apple id, and Apple must list that id with that exact feed | A sponsor pays one show, and both sources describe it |
| The episode must be in the feed, inside the window, and on Apple within two days of the feed's date | A backdated, invented or edited-in episode does not count |
| Brand and code are found in code; the model judges only passages around the brand | The model cannot invent a mention, and sees a few thousand characters, not the whole episode |
| Every talking point must be conveyed, in a sponsor message | A passing, mocking or partial mention is not paid |
| One read per underlying episode per deal: a delivered read records the feed guid, Apple's episode id and guid, the audio file and the dated title, and any of them seen again is `already_delivered` | The same episode re-published under a fresh guid cannot take a second slot |
| The budget stays committed until the window and 14 days have passed | The sponsor cannot pull out after the host has read |
| A delivered read is paid only after the survival period, after the whole ruling is made again (model included) on the transcript the episode links then, and only if it is still the same episode | Removing the paid message while keeping the brand or code, swapping the transcript link, or reusing the guid for another episode releases nothing |
| Disputes stake 10% of the price; dismissed stakes pay the show | Challenging a good read costs the challenger |
| The show is paid only at the wallet its own feed declares; two different addresses count as none | Nobody can redirect a show's payment |
| Unreadable feeds, Apple outages and missing transcripts decide nothing (`UNCLEAR` or refused) | An outage never decides a payout; the episode can be submitted again |
| Budgets come from a deposit; every payment is credited; only `withdraw` sends GEN | No GEN rides on a reading, and no payout can fail halfway |
| `totals()` keeps running totals that must equal the contract's balance | Anyone can reconcile the books |

## Run it

```bash
python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
genvm-lint check contracts/read_proof.py
python -m pytest tests/direct -q                          # 69 direct-mode tests (feeds, Apple, transcripts and the model mocked)
npm install                                               # genlayer-js 2.0 (Studio charges a fee distribution on every transaction)
node scripts/deploy.mjs                                   # deploys to GenLayer Studio, prints the address
DEMO_KEYS=<file> node scripts/demo.mjs <address>          # the live run; writes docs/demo-run.json
node scripts/reproduction.mjs                             # renders docs/REPRODUCTION.md
node scripts/verify-code.mjs <address>
cd frontend && npm install && npm run dev                 # the app on localhost:3000
```

## Limits

- A show must publish transcripts in its feed. Shows whose ads are inserted dynamically (not read into the episode
  file) carry no ad in their transcripts and cannot deliver reads this way (Darknet Diaries above).
- Transcripts are machine-made: a brand the transcriber mangles is not found. Sponsors should name the brand as it is
  spoken (several words are matched with any spacing or punctuation between them).
- Apple's lookup returns a show's 200 latest episodes: an older episode cannot be matched (`apple_missing`).
- The read is checked as text, not audio: what the transcript says is what is judged. A show could edit its
  transcript; Apple's record pins the date, and the survival recheck uses the same transcript URL.
- Shows do not declare GenLayer wallets in their feeds yet, so prices are held; the claim path is covered by the tests.
- GenLayer Studio. The source carries the Bradbury header switch used by our other contracts.

Feeds, transcripts and episode metadata are the shows' own and Apple's public directory data, read as published.
