# ReadProof: reproduction

Every ruling below was made by GenLayer validators on GenLayer Studio, reading the shows' own RSS feeds, Apple's public
podcast directory and the episodes' published transcripts. Contract `0xB813297AbF3Ec4fDe08663EE6520F746cc983eDe` ([explorer](https://explorer-studio.genlayer.com/address/0xB813297AbF3Ec4fDe08663EE6520F746cc983eDe));
`node scripts/verify-code.mjs 0xB813297AbF3Ec4fDe08663EE6520F746cc983eDe` checks the deployed code is byte-identical to `contracts/read_proof.py`.

The deals are **demo deals** funded by test wallets with Studio test GEN: not offers from these sponsors or to these
shows. The feeds, episodes, transcripts and the sponsor reads in them are real.

## The deals

| Deal | Sponsor on show | Code | Talking points | Window | Price | State |
|---|---|---|---|---|---|---|
| deal_0 | Gamut Podcast Network on Podnews Daily - podcast industry and podcasting news ([feed](https://podnews.net/rss), [Apple 1325018583](https://podcasts.apple.com/podcast/id1325018583)) | — | top 10 network reach; a team that actually emails you back; talk to them if your show should be making more money | 2026-11-01 to 2026-11-30 | 0.5 GEN × 3 | 3/3 delivered, 0.5 GEN reserved, 0 GEN left |
| deal_1 | Podcast Show London on Podnews Weekly Review ([feed](https://rss.buzzsprout.com/1538779.rss), [Apple 1542481043](https://podcasts.apple.com/podcast/id1542481043)) | `PODNEWS10` | listeners get money off tickets with the code | 2026-11-01 to 2026-11-30 | 0.5 GEN × 1 | 1/1 delivered, 0 GEN reserved, 0 GEN left |
| deal_2 | Gamut Podcast Network on Podnews Daily - podcast industry and podcasting news ([feed](https://podnews.net/rss), [Apple 1325018583](https://podcasts.apple.com/podcast/id1325018583)) | — | a free trial for new shows | 2026-11-01 to 2026-11-30 | 0.5 GEN × 1 | 0/1 delivered, 0 GEN reserved, 0.5 GEN left |
| deal_3 | ThreatLocker on Darknet Diaries ([feed](https://podcast.darknetdiaries.com), [Apple 1296350485](https://podcasts.apple.com/podcast/id1296350485)) | — | — | 2026-11-01 to 2026-11-30 | 0.5 GEN × 1 | 0/1 delivered, 0 GEN reserved, 0.5 GEN left |

## Every episode submitted

| Read | Episode | Apple's record | Transcript | Mentions | The model, on the passages | Ruling | State |
|---|---|---|---|---|---|---|---|
| read_0 (deal_0) | Rest Is Politics US to livestream election results<br>2026-10-29 12:21:09 UTC | — | — | — | — | **INELIGIBLE** outside_window | refused |
| read_1 (deal_0) | An AI slopcaster returns: targeting sports shows<br>2026-11-19 11:00:00 UTC | by guid, 2026-11-19 11:00:00 | text/vtt, 4208 chars | 3 | sponsor message; ✓ top 10 network reach, ✓ a team that actually emails you back, ✓ talk to them if your show should be making more money | **DELIVERED** delivered | awaiting_wallet |
| read_2 (deal_0) | Smell like the podcast you listen to<br>2026-11-20 11:33:00 UTC | by guid, 2026-11-20 11:33:00 | text/vtt, 5187 chars | 3 | sponsor message; ✓ top 10 network reach, ✓ a team that actually emails you back, ✓ talk to them if your show should be making more money | **DELIVERED** delivered | awaiting_wallet |
| read_3 (deal_0) | Pierre Bouvard leaves Westwood One<br>2026-11-23 10:56:37 UTC | by guid, 2026-11-23 10:56:37 | text/vtt, 4857 chars | 3 | sponsor message; ✓ top 10 network reach, ✓ a team that actually emails you back, ✓ talk to them if your show should be making more money | **DELIVERED** delivered | held |
| read_4 (deal_1) | Apple TV adds podcast video - and the slop jockey rides again<br>2026-11-20 08:00:00 UTC | by guid, 2026-11-20 08:00:00 | text/vtt, 64229 chars | 2, code found | sponsor message; ✓ listeners get money off tickets with the code | **DELIVERED** delivered | awaiting_wallet |
| read_5 (deal_2) | An AI slopcaster returns: targeting sports shows<br>2026-11-19 11:00:00 UTC | by guid, 2026-11-19 11:00:00 | text/vtt, 4208 chars | 3 | sponsor message; ✗ a free trial for new shows | **INELIGIBLE** points_missing | refused |
| read_6 (deal_3) | 182: Blackshades<br>2026-11-03 08:00:00 UTC | by audio, 2026-11-03 08:00:00 | text/vtt, 40190 chars | 0 | — | **INELIGIBLE** no_mention | refused |

- **read_0** (Podnews Daily, 29 Oct (before the window)): INELIGIBLE: The episode was not published within the deal's window. "Rest Is Politics US to livestream election results" (Podnews Daily - podcast industry and podcasting news), published 2026-10-29 12:21:09 UTC. Guid `https://podnews.net/update/tripus-live-stream-us`. Ruling packet sha256 `ab3f402a52da7471082eb5adef4a89275f777bb68d5d05275056cd7f657d715f`, read at 2026-11-24T07:02:58 UTC.
- **read_1** (Podnews Daily, 19 Nov: Gamut read): DELIVERED: The episode carries the sponsor message the deal asked for, and Apple's directory lists it on the same date. "An AI slopcaster returns: targeting sports shows" (Podnews Daily - podcast industry and podcasting news), published 2026-11-19 11:00:00 UTC. The read: "And this podcast is sponsored by Gamut Podcast Network. If you want top ten network reach and a team that actually emails you back, Gamut does both. No emergency rock, though, so far as I'm aware. If " Guid `https://podnews.net/update/ai-sports-slopcaster`. Transcript https://podnews.net/audio/podnews261119.mp3.vtt, sha256 `449740779eb0842cb76b7c03e57a6cb76d14cb30fbf75af9119711fdee9ccdeb`. Ruling packet sha256 `afe6283adbb7bca3625dc6c61547a14126aac0896186963fcdabb897ff47b1ce`, read at 2026-11-24T07:03:09 UTC. **Disputed** by `0x781a2a87863c3c200748cbbc84d590cdce7a858f` at 2026-11-24T07:06:46 UTC: read again, DISMISSED (still delivered); the stake, 0.05 GEN, joined the show's price. Confirmed at 2026-11-24T07:08:06 UTC: still in the feed, 3 mention(s) in the transcript; wallet in the feed: none yet; 0.55 GEN held for the show.
- **read_2** (Podnews Daily, 20 Nov: Gamut read): DELIVERED: The episode carries the sponsor message the deal asked for, and Apple's directory lists it on the same date. "Smell like the podcast you listen to" (Podnews Daily - podcast industry and podcasting news), published 2026-11-20 11:33:00 UTC. The read: "And this podcast is sponsored by Gamut Podcast Network. Do you want top 10 network reach and a team that actually emails you back? Gamut does both. If your show should be making more money, you should" Guid `https://podnews.net/update/night-vale-perfume`. Transcript https://podnews.net/audio/podnews261120.mp3.vtt, sha256 `2c50d7922bf6b9a2239c016baa979a1211d65f12ffa86e8bdf61909aa59abf63`. Ruling packet sha256 `5056defd12a83f7a43785febd3da75b0e1687905792cc183e8284e21e49e0632`, read at 2026-11-24T07:03:28 UTC. Confirmed at 2026-11-24T07:08:18 UTC: still in the feed, 3 mention(s) in the transcript; wallet in the feed: none yet; 0.5 GEN held for the show.
- **read_3** (Podnews Daily, 23 Nov: Gamut read): DELIVERED: The episode carries the sponsor message the deal asked for, and Apple's directory lists it on the same date. "Pierre Bouvard leaves Westwood One" (Podnews Daily - podcast industry and podcasting news), published 2026-11-23 10:56:37 UTC. The read: "This podcast is sponsored by Gamut Podcast Network. Want top 10 network reach? And a team that actually emails you back. Gamut does both of those. If your show should be making more money, you should " Guid `https://podnews.net/update/bouvard-leaves-westwood-one`. Transcript https://podnews.net/audio/podnews261123.mp3.vtt, sha256 `4f580f847f9aaf97dc698b1b0c4a16a8e1530fb2f048b3314a4aefc757ab50bd`. Ruling packet sha256 `4fb25b1fc78ecebd4d1c0c92b71ec78007dfe6464469e83d704720e26d10af07`, read at 2026-11-24T07:03:54 UTC.
- **read_4** (Podnews Weekly Review, 20 Nov: 'use the code pod news 10'): DELIVERED: The episode carries the sponsor message the deal asked for, and Apple's directory lists it on the same date. "Apple TV adds podcast video - and the slop jockey rides again" (Podnews Weekly Review), published 2026-11-20 08:00:00 UTC. The read: "there is a code which you can use to get money off the London podcast show if you wish or the podcast show London I should call it because that's its name you can use the code pod news10 and that will" Guid `Buzzsprout-20153963`. Transcript https://www.buzzsprout.com/1538779/20153963/transcript.vtt, sha256 `39043619d938cd1ce29769a76bf31bd6c2c2f8407fc2c964f762553d20206d38`. Ruling packet sha256 `ca1be67437371f1304100c08f7ff962910abdcd8c2e6dd06d002e752f9dff07e`, read at 2026-11-24T07:04:25 UTC. Confirmed at 2026-11-24T07:08:34 UTC: still in the feed, 2 mention(s) in the transcript; wallet in the feed: none yet; 0.5 GEN held for the show.
- **read_5** (Podnews Daily, 19 Nov, for the free-trial deal): INELIGIBLE: The sponsor message leaves out talking points the deal paid for. "An AI slopcaster returns: targeting sports shows" (Podnews Daily - podcast industry and podcasting news), published 2026-11-19 11:00:00 UTC. The read: "And this podcast is sponsored by Gamut Podcast Network. If you want top ten network reach and a team that actually emails you back, Gamut does both. No emergency rock, though, so far as I'm aware. If " Guid `https://podnews.net/update/ai-sports-slopcaster`. Transcript https://podnews.net/audio/podnews261119.mp3.vtt, sha256 `449740779eb0842cb76b7c03e57a6cb76d14cb30fbf75af9119711fdee9ccdeb`. Ruling packet sha256 `d99ec179f30cfdb9f04c443d10ddf46671bd19312d8d657ae8170fbd52f01335`, read at 2026-11-24T07:04:51 UTC.
- **read_6** (Darknet Diaries 182, Blackshades (ads are inserted dynamically, not in the transcript)): INELIGIBLE: The transcript never names the sponsor. "182: Blackshades" (Darknet Diaries), published 2026-11-03 08:00:00 UTC. Guid `prx_7057_c0abbff3-ae98-4e23-a389-5ee0fd824f51`. Transcript https://f.prxu.org/7057/c0abbff3-ae98-4e23-a389-5ee0fd824f51/transcripts/673ef6c8-d8e1-4f97-8c6a-d7ac2ca2401a/darknet-diaries-ep182-blackshades.vtt, sha256 `ffa9cdd325d0cd9c0b4e9a1d1d1b66487ee5d50c2b2d26b74cc290e4b20a1f31`. Ruling packet sha256 `8f3073e43ab8ffca4c2ed5c19f6f3cf5abda53b667477f9ca16d65c87f438e5e`, read at 2026-11-24T07:05:11 UTC.

Check one yourself: `curl -s https://podnews.net/audio/podnews261120.mp3.vtt | grep -i -A2 "sponsored by"` and
`curl -s "https://itunes.apple.com/lookup?id=1325018583&entity=podcastEpisode&limit=5"`.

## Every transaction

A refused call is still ACCEPTED by consensus; the contract outcome is the `exec` column (`ERROR` = refused, on purpose here).
GenLayer Studio charges a fee distribution on every transaction (since 2026-11-24); a withdrawal's GEN arrives when the
transaction is finalized.

| Who | Call | GEN sent | Consensus | exec | Returned / refused | Tx |
|---|---|---|---|---|---|---|
| sponsor | `deposit()` | 3.5 | ACCEPTED | SUCCESS | 3500000000000000000 | [0xe775d91a…](https://explorer-studio.genlayer.com/tx/0xe775d91a37ee167c3e65490e214f906b2307f637e8e516f239dca2128860ecb0) |
| sponsor | `open_deal("https://podnews.net/rss", "1325018583", "Gamut Podcast Network", "", "top 10 network reach \| a tea` |  | ACCEPTED | SUCCESS | deal_0 | [0xafb377cc…](https://explorer-studio.genlayer.com/tx/0xafb377cc271d6e280c1bff93041176e9ea1e9e1aea78a67434199b9d8e551b19) |
| sponsor | `open_deal("https://rss.buzzsprout.com/1538779.rss", "1542481043", "Podcast Show London", "PODNEWS10", "listene` |  | ACCEPTED | SUCCESS | deal_1 | [0x83b5189b…](https://explorer-studio.genlayer.com/tx/0x83b5189bb4a96e4fa1e475c10f32163017ba528416dc45863786cb9fca16fe22) |
| sponsor | `open_deal("https://podnews.net/rss", "1325018583", "Gamut Podcast Network", "", "a free trial for new shows", ` |  | ACCEPTED | SUCCESS | deal_2 | [0x565d28bf…](https://explorer-studio.genlayer.com/tx/0x565d28bf436d226f0ab259922aa48b32afb8b29ae7351fc45cc796a58cd650f0) |
| sponsor | `open_deal("https://podcast.darknetdiaries.com", "1296350485", "ThreatLocker", "", "", "2026-11-01", "2026-11-3` |  | ACCEPTED | SUCCESS | deal_3 | [0xa254463a…](https://explorer-studio.genlayer.com/tx/0xa254463abaa487be09bc9e1499a671582b5098111a89d4b794750dfdf7c680ac) |
| sponsor | `open_deal("https://podcast.darknetdiaries.com", "1325018583", "ThreatLocker", "", "", "2026-11-01", "2026-11-3` |  | ACCEPTED | ERROR | refused: Apple lists id 1325018583 (Podnews Daily - podcast industry and podcasting news) with another feed: https://podnews.net/rss | [0xa8e133b3…](https://explorer-studio.genlayer.com/tx/0xa8e133b3849a27ff47e3ff43469f7f4a5eb5b1c6e0f7c12ff548a75389ba7fc5) |
| producer | `deliver("deal_0", "https://podnews.net/update/tripus-live-stream-us")` |  | ACCEPTED | SUCCESS | read_0 | [0xfab69999…](https://explorer-studio.genlayer.com/tx/0xfab69999a15729e140b6489c74df574735c7219a4a2a4710d7ec3f00c4fb0973) |
| producer | `deliver("deal_0", "https://podnews.net/update/ai-sports-slopcaster")` |  | ACCEPTED | SUCCESS | read_1 | [0x577504ad…](https://explorer-studio.genlayer.com/tx/0x577504ad0e9c12342bfab096e54d6a4159cad41afd4d1126ba03e7b6eeda3770) |
| producer | `deliver("deal_0", "https://podnews.net/update/night-vale-perfume")` |  | ACCEPTED | SUCCESS | read_2 | [0x538925a8…](https://explorer-studio.genlayer.com/tx/0x538925a8f14c390ac1c492d40f73a05db287edaff8bdb392e9742084f4068ffc) |
| producer | `deliver("deal_0", "https://podnews.net/update/bouvard-leaves-westwood-one")` |  | ACCEPTED | SUCCESS | read_3 | [0x5a7af66e…](https://explorer-studio.genlayer.com/tx/0x5a7af66e974ea261706d325c99f5b13be4526bc183c2762fd1f6b545b5bb43e6) |
| producer | `deliver("deal_0", "https://podnews.net/update/night-vale-perfume")` |  | ACCEPTED | ERROR | refused: This episode already delivered a read for this deal (read_2) | [0xb05a55f5…](https://explorer-studio.genlayer.com/tx/0xb05a55f594d5f04e867d1deaabf6f74cf1c239fa5fcae0811c9d5660e51e0544) |
| producer | `deliver("deal_1", "Buzzsprout-20153963")` |  | ACCEPTED | SUCCESS | read_4 | [0x28ce141a…](https://explorer-studio.genlayer.com/tx/0x28ce141ac79a3dbd09d85592d68afbddd7794d5f90d0986d3749b4c7b5be9673) |
| producer | `deliver("deal_2", "https://podnews.net/update/ai-sports-slopcaster")` |  | ACCEPTED | SUCCESS | read_5 | [0x9faa3920…](https://explorer-studio.genlayer.com/tx/0x9faa392089bbf1d9db31450f63c3800ef52a31d5efa62ecea8e21178be27aefb) |
| producer | `deliver("deal_3", "prx_7057_c0abbff3-ae98-4e23-a389-5ee0fd824f51")` |  | ACCEPTED | SUCCESS | read_6 | [0xc5f9aa45…](https://explorer-studio.genlayer.com/tx/0xc5f9aa458ae21d39eb35f66b97e45bf64050aa6346913df138c9208fb7e43335) |
| listener | `deposit()` | 0.05 | ACCEPTED | SUCCESS | 50000000000000000 | [0x2bfcefcd…](https://explorer-studio.genlayer.com/tx/0x2bfcefcdcca21de90b545e59b70d5068aa973d001b99dd7c7ceab1981a335293) |
| listener | `dispute("read_1")` |  | ACCEPTED | SUCCESS | DISMISSED | [0xcfec121a…](https://explorer-studio.genlayer.com/tx/0xcfec121abb9044c0e0b1e85b53e7eb6090d82b5f11e660efe4e354038c1466d1) |
| listener | `dispute("read_1")` |  | ACCEPTED | ERROR | refused: This read has been disputed already | [0xc61311a3…](https://explorer-studio.genlayer.com/tx/0xc61311a39f258eace0391857c23d743fcd2c6131aa1e86d84a089ef587323182) |
| producer | `confirm("read_1")` |  | ACCEPTED | SUCCESS | awaiting_wallet | [0xdcee58f2…](https://explorer-studio.genlayer.com/tx/0xdcee58f27ae9b395ec3198a503e23ae653c3d3b98a0ef8e80717db29d57fa6c9) |
| producer | `confirm("read_2")` |  | ACCEPTED | SUCCESS | awaiting_wallet | [0xcee10769…](https://explorer-studio.genlayer.com/tx/0xcee10769f71ace63dc56fe692ffa75122d9a5df17421a4898de3a00c3ac35fdc) |
| producer | `confirm("read_4")` |  | ACCEPTED | SUCCESS | awaiting_wallet | [0xd5cc508a…](https://explorer-studio.genlayer.com/tx/0xd5cc508ad6f5e4cf3abb807dbbdc3903dc508c02db56cc54f4e0f0704b0aabc9) |
| producer | `confirm("read_3")` |  | ACCEPTED | ERROR | refused: The read is confirmed from 2026-11-24 10:56:37 UTC | [0x08f922d8…](https://explorer-studio.genlayer.com/tx/0x08f922d83b7a8bf9b2ccd07742950424f8c784a6c0552ed1629b0c309a4c9488) |
| producer | `claim("read_1")` |  | ACCEPTED | ERROR | refused: Podnews Daily - podcast industry and podcasting news's feed does not declare one GenLayer wallet yet | [0x1b5b8a0c…](https://explorer-studio.genlayer.com/tx/0x1b5b8a0c7beb1704ac19ee68f92cb5fd1396d052a460584e77c458653f27bb62) |
| producer | `close_deal("deal_0")` |  | ACCEPTED | ERROR | refused: The deal takes episodes until 2026-12-14 | [0xe7224a32…](https://explorer-studio.genlayer.com/tx/0xe7224a32b2bb9fb43e5c84c525a8b2e64f38a2eabb5833d44a4d97be0b5ae79f) |
| sponsor | `withdraw()` |  | ACCEPTED | SUCCESS | 500000000000000000 | [0xf07319a3…](https://explorer-studio.genlayer.com/tx/0xf07319a31956bd9e500555dd0ed50fe280fba934cbdcc2bccdb426427203a1a4) |

Accounts: sponsor `0xB3a2de526B0260775Fb313A0Ced0E222e1BD8482`, producer `0x98Fc2913693B362aDfC26CA304C62299dB4d5d8f`, listener `0x781a2a87863c3c200748CbBC84d590cdCE7A858f`.

## Balance reconciliation

`totals()` keeps running totals (unreserved budgets, reserved prices, prices held for a wallet, GEN credited but not
withdrawn); their sum must equal the contract's GEN balance on chain. Each line was taken once every transaction had
finalized.

| When | Budgets | Reserved | Held | Credited | Expected | On-chain balance | |
|---|---|---|---|---|---|---|---|
| four deals funded, 0.5 GEN still credited to the sponsor | 3 GEN | 0 GEN | 0 GEN | 0.5 GEN | 3.5 GEN | 3.5 GEN | match |
| four reads delivered and reserved | 1 GEN | 2 GEN | 0 GEN | 0.5 GEN | 3.5 GEN | 3.5 GEN | match |
| a dismissed dispute: the stake reserved for the show | 1 GEN | 2.05 GEN | 0 GEN | 0.5 GEN | 3.55 GEN | 3.55 GEN | match |
| reads confirmed: the shows' prices held for their wallets | 1 GEN | 0.5 GEN | 1.55 GEN | 0.5 GEN | 3.55 GEN | 3.55 GEN | match |
| end of run, after the sponsor's withdrawal finalized | 1 GEN | 0.5 GEN | 1.55 GEN | 0 GEN | 3.05 GEN | 3.05 GEN | match |
