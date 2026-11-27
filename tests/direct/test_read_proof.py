"""Direct-mode tests for ReadProof: host-read podcast sponsorships checked against the feed, Apple's directory and the
episode's transcript."""

import json
import re
import sys

import pytest

from tests.direct.conftest import CONTRACT_PATH, llm_json, to_hex

GEN = 10**18
PRICE = GEN // 2
FEED = "https://feeds.example.fm/the-show.rss"
APPLE_ID = "123456789"
APPLE = f"https://itunes.apple.com/lookup?id={APPLE_ID}&entity=podcastEpisode&limit=200"
GUID = "ep-42"
TR_URL = "https://feeds.example.fm/ep42.vtt"
AUDIO = "https://cdn.example.fm/ep42.mp3"
POINTS = "top 10 network reach | a team that emails you back"
READ = ("This podcast is sponsored by Gamut Podcast Network. Want top 10 network reach? And a team that actually emails "
        "you back? Gamut does both of those. Use code SHOW20 at gamut dot com.")
FILLER = "We talked about the week in podcasting, the charts, and listener mail. " * 8
NOW = "2026-11-24T12:00:00Z"


def _vtt(text):
    words, out, n = text.split(" "), ["WEBVTT", ""], 1
    for i in range(0, len(words), 12):
        out += [str(n), f"00:00:{n:02d}.000 --> 00:00:{n + 1:02d}.000", " ".join(words[i:i + 12]), ""]
        n += 1
    return "\n".join(out)


def _item(guid=GUID, title="Episode 42: the week", pub="Fri, 20 Nov 2026 18:00:00 +1000", transcripts=None, audio=AUDIO):
    trs = [(TR_URL, "text/vtt")] if transcripts is None else transcripts
    tags = "".join(f'<podcast:transcript url="{u}" type="{t}" />' for u, t in trs)
    pub_tag = f"<pubDate>{pub}</pubDate>" if pub else ""
    return (f"<item><title><![CDATA[{title}]]></title><guid isPermaLink=\"false\">{guid}</guid>{pub_tag}"
            f"<enclosure url=\"{audio}\" type=\"audio/mpeg\" length=\"1\"/>{tags}</item>")


def _feed(items=None, wallet=None, description="A show about shows."):
    txt = f'<podcast:txt purpose="genlayer">{wallet}</podcast:txt>' if wallet else ""
    body = "".join(items if items is not None else [_item()])
    return (f'<?xml version="1.0"?><rss version="2.0" xmlns:podcast="https://podcastindex.org/namespace/1.0"><channel>'
            f"<title>The Show</title><description>{description}</description>{txt}{body}</channel></rss>")


def _apple(episodes=None, feed=FEED):
    eps = episodes if episodes is not None else [{"guid": GUID, "title": "Episode 42: the week", "released": "2026-11-20T08:00:00Z"}]
    results = [{"kind": "podcast", "collectionName": "The Show", "feedUrl": feed}]
    results += [{"kind": "podcast-episode", "episodeGuid": e.get("guid", ""), "trackId": e.get("track", 1000000042), "trackName": e["title"],
                 "releaseDate": e["released"], "episodeUrl": e.get("audio", "")} for e in eps]
    return {"resultCount": len(results), "results": results}


def _web(vm, url, body, status=200):
    payload = body if isinstance(body, str) else json.dumps(body)
    vm.mock_web("^" + re.escape(url) + "$", {"method": "GET", "response": {"status": status, "headers": {}, "body": payload.encode()}})


def _setup(vm, feed=None, apple=None, transcript=None, tr_status=200, feed_status=200, apple_status=200, ad_read=True, points=(True, True),
           llm_raw=None, extra=()):
    vm.clear_mocks()
    _web(vm, FEED, _feed() if feed is None else feed, feed_status)
    _web(vm, APPLE, _apple() if apple is None else apple, apple_status)
    _web(vm, TR_URL, _vtt(FILLER + READ + " " + FILLER) if transcript is None else transcript, tr_status)
    for url, body in extra:
        _web(vm, url, body)
    vm.mock_llm(r".*", llm_raw if llm_raw is not None else llm_json({"ad_read": ad_read, "points": list(points), "quote": READ[:120]}))


def _at(vm, ts):
    vm.warp(ts)
    raw = getattr(sys.modules.get("genlayer.gl"), "message_raw", None)
    if isinstance(raw, dict):
        raw["datetime"] = ts


def _deposit(vm, c, who, amount):
    vm.sender, vm.value = who, amount
    c.deposit()
    vm.value = 0


def _owed(c, who):
    return int(c.owed_to(to_hex(who).lower()))


def _balance(c):
    t = json.loads(c.totals())
    assert int(t["expected_balance"]) == sum(int(t[k]) for k in ("budgets", "reserved", "held", "owed"))
    return t


def _open(vm, deploy, sponsor, code="", points=POINTS, slots=2, expect=None, setup=None, deposit=None, **terms):
    _at(vm, NOW)
    vm.sender = sponsor
    c = deploy(CONTRACT_PATH)
    _deposit(vm, c, sponsor, PRICE * slots if deposit is None else deposit)
    _setup(vm, **(setup or {}))
    args = dict(feed=FEED, apple_id=APPLE_ID, brand="Gamut Podcast Network", code=code, points=points, start="2026-11-01",
                end="2026-11-30", survival_days=1, price=PRICE, slots=slots)
    args.update(terms)
    vm.sender = sponsor
    if expect:
        with vm.expect_revert(expect):
            c.open_deal(*args.values())
        return c, None
    return c, c.open_deal(*args.values())


def _deliver(vm, c, deal, who, guid=GUID, expect=None, **setup):
    _setup(vm, **setup)
    vm.sender = who
    if expect:
        with vm.expect_revert(expect):
            c.deliver(deal, guid)
        return None
    return c.deliver(deal, guid)


@pytest.fixture
def deal(direct_vm, direct_deploy, direct_alice):
    return _open(direct_vm, direct_deploy, direct_alice)


# --- opening a deal ----------------------------------------------------------------------------------------------------


def test_open_deal_takes_the_budget_from_the_deposit(direct_vm, direct_deploy, direct_alice, deal):
    c, deal_id = deal
    d = c.get_deal(deal_id)
    assert (d.show, d.brand, int(d.budget), int(d.slots), d.state) == ("The Show", "Gamut Podcast Network", 2 * PRICE, 2, "open")
    assert json.loads(d.points_json) == ["top 10 network reach", "a team that emails you back"]
    assert _owed(c, direct_alice) == 0
    assert _balance(c)["budgets"] == str(2 * PRICE)


@pytest.mark.parametrize("terms, reason", [
    (dict(feed="not a url"), "feed must be"), (dict(apple_id="abc"), "apple_id must be"), (dict(brand="x"), "brand must be"),
    (dict(code="!!"), "code must be"), (dict(points="a|b|c|d|e|f"), "at most 5 talking points"),
    (dict(start="2026-11-31"), "dates YYYY-MM-DD"), (dict(end="2026-10-01"), "end must be on or after start"),
    (dict(start="2026-08-01", end="2026-12-31"), "within 120 days"), (dict(start="2026-09-01", end="2026-09-30"), "at most 60 days ago"),
    (dict(survival_days=0), "survival_days must be"), (dict(slots=11), "slots must be"), (dict(price=1), "price must be"),
])
def test_bad_deals_are_refused(direct_vm, direct_deploy, direct_alice, terms, reason):
    _open(direct_vm, direct_deploy, direct_alice, expect=reason, **terms)


def test_a_deal_needs_the_deposit(direct_vm, direct_deploy, direct_alice):
    _open(direct_vm, direct_deploy, direct_alice, slots=3, deposit=2 * PRICE, expect="deposit first")


def test_apple_must_list_the_same_feed(direct_vm, direct_deploy, direct_alice):
    _open(direct_vm, direct_deploy, direct_alice, setup=dict(apple=_apple(feed="https://other.example/feed")), expect="with another feed")


@pytest.mark.parametrize("feed", ["http://feeds.example.fm/the-show.rss/", "https://FEEDS.example.fm/the-show.rss"])
def test_feed_urls_match_as_apple_stores_them(direct_vm, direct_deploy, direct_alice, feed):
    c, deal_id = _open(direct_vm, direct_deploy, direct_alice, setup=dict(apple=_apple(feed=feed)))
    assert deal_id == "deal_0"


# --- rulings -------------------------------------------------------------------------------------------------------------


def test_a_delivered_read_reserves_the_price(direct_vm, direct_alice, direct_bob, deal):
    c, deal_id = deal
    read_id = _deliver(direct_vm, c, deal_id, direct_bob)
    rd = c.get_read(read_id)
    assert (rd.verdict, rd.code, rd.state, int(rd.price)) == ("DELIVERED", "delivered", "held", PRICE)
    assert rd.published == "2026-11-20T08:00:00" and rd.held_until == "2026-11-21T08:00:00"
    r = json.loads(rd.reading_json)
    assert r["facts"]["apple"]["by"] == "guid" and r["facts"]["mentions"] == 1 and r["judged"]["points"] == [True, True]
    d = c.get_deal(deal_id)
    assert (int(d.budget), int(d.reserved), int(d.n_delivered)) == (PRICE, PRICE, 1)
    _balance(c)


@pytest.mark.parametrize("setup, verdict, code", [
    (dict(feed=_feed([_item(pub="Sat, 31 Oct 2026 23:00:00 +0000")])), "INELIGIBLE", "outside_window"),
    (dict(feed=_feed([_item(pub="")])), "INELIGIBLE", "no_date"),
    (dict(apple=_apple([])), "UNCLEAR", "apple_missing"),
    (dict(apple=_apple([{"guid": GUID, "title": "Episode 42: the week", "released": "2026-11-15T08:00:00Z"}])), "INELIGIBLE", "date_mismatch"),
    (dict(feed=_feed([_item(transcripts=[])])), "UNCLEAR", "no_transcript"),
    (dict(feed=_feed([_item(transcripts=[(TR_URL, "application/pdf")])])), "UNCLEAR", "no_transcript"),
    (dict(tr_status=500, transcript=""), "UNCLEAR", "transcript_unreadable"),
    (dict(transcript=_vtt(FILLER * 3)), "INELIGIBLE", "no_mention"),
    (dict(ad_read=False), "INELIGIBLE", "not_a_read"),
    (dict(points=(True, False)), "INELIGIBLE", "points_missing"),
    (dict(points=(True,)), "INELIGIBLE", "points_missing"),  # a short answer counts the missing point as not covered
])
def test_rulings(direct_vm, direct_bob, deal, setup, verdict, code):
    c, deal_id = deal
    rd = c.get_read(_deliver(direct_vm, c, deal_id, direct_bob, **setup))
    assert (rd.verdict, rd.code, rd.state, int(rd.price)) == (verdict, code, "refused", 0)
    assert int(c.get_deal(deal_id).budget) == 2 * PRICE


def test_the_promo_code_is_found_even_when_transcribed_with_spaces(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, deal_id = _open(direct_vm, direct_deploy, direct_alice, code="SHOW20")
    spaced = _vtt(FILLER + READ.replace("SHOW20", "show 20") + FILLER)
    assert c.get_read(_deliver(direct_vm, c, deal_id, direct_bob, transcript=spaced)).verdict == "DELIVERED"
    missing = _vtt(FILLER + READ.replace("Use code SHOW20", "Visit") + FILLER)
    feed = _feed([_item(guid="ep-43")])
    apple = _apple([{"guid": "ep-43", "title": "Episode 42: the week", "released": "2026-11-20T08:00:00Z"}])
    rd = c.get_read(_deliver(direct_vm, c, deal_id, direct_bob, guid="ep-43", feed=feed, apple=apple, transcript=missing))
    assert (rd.verdict, rd.code) == ("INELIGIBLE", "no_code")


@pytest.mark.parametrize("apple_episode, by", [
    ({"guid": "other-guid", "title": "Something", "released": "2026-11-20T08:00:00Z", "audio": AUDIO + "?src=apple"}, "audio"),
    ({"guid": "other-guid", "title": "the week", "released": "2026-11-21T08:00:00Z"}, "title"),  # Apple dropped "Episode 42:"
])
def test_apple_matches_by_audio_or_title_when_guids_differ(direct_vm, direct_bob, deal, apple_episode, by):
    c, deal_id = deal
    rd = c.get_read(_deliver(direct_vm, c, deal_id, direct_bob, apple=_apple([apple_episode])))
    assert rd.verdict == "DELIVERED" and json.loads(rd.reading_json)["facts"]["apple"]["by"] == by


def test_a_title_match_far_from_the_feed_date_does_not_count(direct_vm, direct_bob, deal):
    c, deal_id = deal
    apple = _apple([{"guid": "other", "title": "Episode 42: the week", "released": "2026-11-25T08:00:00Z"}])
    assert c.get_read(_deliver(direct_vm, c, deal_id, direct_bob, apple=apple)).code == "apple_missing"


@pytest.mark.parametrize("kind, body", [
    ("application/x-subrip", "1\n00:00:01,000 --> 00:00:04,000\n" + FILLER + "\n\n2\n00:00:05,000 --> 00:00:09,000\n" + READ + "\n"),
    ("application/json", json.dumps({"version": "1.0.0", "segments": [{"body": FILLER}, {"speaker": "Host", "body": READ}]})),
    ("text/html", "<html><body><p>" + FILLER + "</p><p><b>" + READ + "</b></p><script>x()</script></body></html>"),
    ("text/plain", FILLER + READ),
])
def test_transcript_formats(direct_vm, direct_bob, deal, kind, body):
    c, deal_id = deal
    url = "https://feeds.example.fm/ep42.other"
    rd = c.get_read(_deliver(direct_vm, c, deal_id, direct_bob, feed=_feed([_item(transcripts=[(url, kind)])]), extra=[(url, body)]))
    assert rd.verdict == "DELIVERED" and json.loads(rd.reading_json)["facts"]["transcript"]["type"] == kind


def test_webvtt_is_preferred_over_html(direct_vm, direct_bob, deal):
    c, deal_id = deal
    feed = _feed([_item(transcripts=[("https://feeds.example.fm/ep42.html", "text/html"), (TR_URL, "text/vtt")])])
    rd = c.get_read(_deliver(direct_vm, c, deal_id, direct_bob, feed=feed))
    assert json.loads(rd.reading_json)["facts"]["transcript"]["url"] == TR_URL


@pytest.mark.parametrize("setup, reason", [
    (dict(feed=_feed([_item(guid="other")])), "no episode with this guid"),
    (dict(feed_status=503), "could not be read right now"),
    (dict(apple_status=500), "could not be read right now"),
])
def test_unreadable_submissions_record_nothing(direct_vm, direct_bob, deal, setup, reason):
    c, deal_id = deal
    _deliver(direct_vm, c, deal_id, direct_bob, expect=reason, **setup)
    assert int(c.get_deal(deal_id).n_submitted) == 0


def test_one_read_per_episode_and_no_more_than_the_slots(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, deal_id = _open(direct_vm, direct_deploy, direct_alice, slots=1)
    _deliver(direct_vm, c, deal_id, direct_bob)
    _deliver(direct_vm, c, deal_id, direct_bob, expect="already delivered a read")
    feed = _feed([_item(guid="ep-43", title="Episode 43")])
    _deliver(direct_vm, c, deal_id, direct_bob, guid="ep-43", feed=feed, expect="Every slot of this deal is taken")


def test_a_refused_episode_can_be_submitted_again(direct_vm, direct_bob, deal):
    c, deal_id = deal
    assert c.get_read(_deliver(direct_vm, c, deal_id, direct_bob, apple=_apple([]))).code == "apple_missing"
    assert c.get_read(_deliver(direct_vm, c, deal_id, direct_bob)).verdict == "DELIVERED"  # Apple caught up


def test_episodes_are_taken_until_14_days_after_the_window(direct_vm, direct_bob, deal):
    c, deal_id = deal
    _at(direct_vm, "2026-12-15T00:00:00Z")
    _deliver(direct_vm, c, deal_id, direct_bob, expect="took episodes until 2026-12-14")


# --- confirmation, wallets, disputes -----------------------------------------------------------------------------------


def _delivered(vm, deploy, sponsor, host_side):
    c, deal_id = _open(vm, deploy, sponsor)
    return c, deal_id, _deliver(vm, c, deal_id, host_side)


def test_confirm_pays_the_wallet_the_feed_declares(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    c, deal_id, read_id = _delivered(direct_vm, direct_deploy, direct_alice, direct_bob)
    _setup(direct_vm, feed=_feed(wallet=to_hex(direct_charlie)))
    assert c.confirm(read_id) == "paid"
    rd = c.get_read(read_id)
    assert rd.host_wallet == to_hex(direct_charlie).lower() and _owed(c, direct_charlie) == PRICE
    assert _owed(c, direct_bob) == 0  # the submitter earns nothing: the show is paid
    assert int(c.get_deal(deal_id).paid_total) == PRICE
    direct_vm.sender = direct_charlie
    assert c.withdraw() == str(PRICE)
    _balance(c)


def test_confirm_waits_for_the_survival_period(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, deal_id = _open(direct_vm, direct_deploy, direct_alice)
    feed = _feed([_item(pub="Tue, 24 Nov 2026 06:00:00 +0000")])
    apple = _apple([{"guid": GUID, "title": "Episode 42: the week", "released": "2026-11-24T06:00:00Z"}])
    read_id = _deliver(direct_vm, c, deal_id, direct_bob, feed=feed, apple=apple)
    with direct_vm.expect_revert("confirmed from 2026-11-25 06:00:00 UTC"):
        c.confirm(read_id)


def test_a_show_without_a_wallet_is_held_then_claimed(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    c, deal_id, read_id = _delivered(direct_vm, direct_deploy, direct_alice, direct_bob)
    _setup(direct_vm)
    assert c.confirm(read_id) == "awaiting_wallet"
    assert _balance(c)["held"] == str(PRICE)
    _setup(direct_vm)
    with direct_vm.expect_revert("does not declare one GenLayer wallet yet"):
        c.claim(read_id)
    other = "0x" + "ab" * 20
    _setup(direct_vm, feed=_feed(wallet=to_hex(direct_charlie), description=f"GenLayer wallet: {other}"))
    assert c.claim(read_id) == to_hex(direct_charlie).lower()  # the podcast:txt tag wins over the description
    assert _owed(c, direct_charlie) == PRICE and c.get_read(read_id).state == "paid"
    _balance(c)


def test_a_wallet_line_in_the_description_counts_and_two_count_as_none(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    c, deal_id, read_id = _delivered(direct_vm, direct_deploy, direct_alice, direct_bob)
    two = f"GenLayer wallet: {to_hex(direct_charlie)} or GenLayer wallet: 0x{'cd' * 20}"
    _setup(direct_vm, feed=_feed(description=two))
    assert c.confirm(read_id) == "awaiting_wallet"
    _setup(direct_vm, feed=_feed(description=f"Support us! GenLayer wallet: {to_hex(direct_charlie)}"))
    assert c.claim(read_id) == to_hex(direct_charlie).lower()


@pytest.mark.parametrize("setup", [
    dict(feed=_feed([])),  # the episode was pulled from the feed
    dict(transcript=_vtt(FILLER * 3)),  # the read was cut from the episode
])
def test_a_read_that_is_gone_at_confirmation_returns_to_the_deal(direct_vm, direct_deploy, direct_alice, direct_bob, setup):
    c, deal_id, read_id = _delivered(direct_vm, direct_deploy, direct_alice, direct_bob)
    _setup(direct_vm, **setup)
    assert c.confirm(read_id) == "reverted"
    d = c.get_deal(deal_id)
    assert (int(d.budget), int(d.reserved)) == (2 * PRICE, 0)
    _balance(c)


def test_an_unreadable_transcript_at_confirmation_changes_nothing(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, deal_id, read_id = _delivered(direct_vm, direct_deploy, direct_alice, direct_bob)
    _setup(direct_vm, tr_status=503, transcript="")
    with direct_vm.expect_revert("could not be read right now"):
        c.confirm(read_id)
    assert c.get_read(read_id).state == "held"


def test_a_dismissed_dispute_pays_its_stake_to_the_show(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    c, deal_id, read_id = _delivered(direct_vm, direct_deploy, direct_alice, direct_bob)
    _deposit(direct_vm, c, direct_alice, PRICE // 10)
    _setup(direct_vm)
    direct_vm.sender = direct_alice
    assert c.dispute(read_id) == "DISMISSED"
    rd = c.get_read(read_id)
    assert (int(rd.bonus), rd.disputed_by) == (PRICE // 10, to_hex(direct_alice).lower())
    _setup(direct_vm)
    with direct_vm.expect_revert("disputed already"):
        c.dispute(read_id)
    _setup(direct_vm, feed=_feed(wallet=to_hex(direct_charlie)))
    assert c.confirm(read_id) == "paid" and _owed(c, direct_charlie) == PRICE + PRICE // 10
    _balance(c)


def test_an_upheld_dispute_pays_the_disputer_and_returns_the_rest(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    c, deal_id, read_id = _delivered(direct_vm, direct_deploy, direct_alice, direct_bob)
    _deposit(direct_vm, c, direct_charlie, PRICE // 10)
    _setup(direct_vm, points=(True, False))  # read again: the second point is not there
    direct_vm.sender = direct_charlie
    assert c.dispute(read_id) == "UPHELD"
    assert c.get_read(read_id).state == "disputed"
    assert _owed(c, direct_charlie) == PRICE // 10 + PRICE // 10  # stake back + 10% of the price
    d = c.get_deal(deal_id)
    assert (int(d.budget), int(d.reserved)) == (2 * PRICE - PRICE // 10, 0)
    _balance(c)


def test_disputes_need_a_held_read_a_stake_and_a_readable_episode(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, deal_id, read_id = _delivered(direct_vm, direct_deploy, direct_alice, direct_bob)
    _setup(direct_vm)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("deposit first"):
        c.dispute(read_id)
    _deposit(direct_vm, c, direct_bob, PRICE // 10)
    _setup(direct_vm, tr_status=500, transcript="")
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("could not be read again right now; nothing was staked"):
        c.dispute(read_id)
    assert _owed(c, direct_bob) == PRICE // 10
    _setup(direct_vm)
    c.confirm(read_id)
    with direct_vm.expect_revert("Only a read waiting for confirmation"):
        c.dispute(read_id)


# --- v1.1: confirmation makes the whole ruling again; one read per underlying episode ----------------------------------

CODE_DEAL = dict(code="SHOW20")
# The paid message removed, the brand and the code kept: a passing mention in the outro.
NO_AD = _vtt(FILLER + "Thanks to everyone at Gamut Podcast Network for the coffee, SHOW20 was the room number. " + FILLER)


def _delivered_with_code(vm, deploy, sponsor, host_side):
    c, deal_id = _open(vm, deploy, sponsor, **CODE_DEAL)
    return c, deal_id, _deliver(vm, c, deal_id, host_side)


@pytest.mark.parametrize("setup, code", [
    (dict(transcript=NO_AD, ad_read=False), "not_a_read"),  # brand and code still in the transcript, the sponsor message gone
    (dict(points=(True, False)), "points_missing"),  # the read was recut and drops a paid talking point
])
def test_confirmation_judges_the_sponsor_message_again(direct_vm, direct_deploy, direct_alice, direct_bob, setup, code):
    c, deal_id, read_id = _delivered_with_code(direct_vm, direct_deploy, direct_alice, direct_bob)
    assert json.loads(c.check_text(NO_AD, "Gamut Podcast Network", "SHOW20"))["mentions"] == 1  # brand + code alone would pass
    _setup(direct_vm, **setup)
    assert c.confirm(read_id) == "reverted"
    r = json.loads(c.get_read(read_id).confirm_json)
    assert (r["verdict"], r["code"], r["stands"]) == ("INELIGIBLE", code, False)
    d = c.get_deal(deal_id)
    assert (int(d.budget), int(d.reserved), int(d.paid_total)) == (2 * PRICE, 0, 0)
    _balance(c)


@pytest.mark.parametrize("new_body, outcome", [
    (NO_AD, "reverted"),  # the link now points at a transcript without the paid message: no payment
    (_vtt(FILLER + READ + " " + FILLER), "paid"),  # a new link that still carries the read is judged the same way and pays
])
def test_a_changed_transcript_link_is_judged_too(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, new_body, outcome):
    c, deal_id, read_id = _delivered_with_code(direct_vm, direct_deploy, direct_alice, direct_bob)
    new_url = "https://cdn.other-host.fm/ep42-v2.vtt"
    feed = _feed([_item(transcripts=[(new_url, "text/vtt")])], wallet=to_hex(direct_charlie))
    _setup(direct_vm, feed=feed, extra=[(new_url, new_body)], ad_read=outcome == "paid")
    assert c.confirm(read_id) == outcome
    r = json.loads(c.get_read(read_id).confirm_json)
    assert r["transcript_changed"] is True and r["facts"]["transcript"]["url"] == new_url
    assert _owed(c, direct_charlie) == (PRICE if outcome == "paid" else 0)
    _balance(c)


def test_a_dismissed_dispute_does_not_skip_the_confirmation_reading(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    c, deal_id, read_id = _delivered_with_code(direct_vm, direct_deploy, direct_alice, direct_bob)
    _deposit(direct_vm, c, direct_charlie, PRICE // 10)
    _setup(direct_vm)
    direct_vm.sender = direct_charlie
    assert c.dispute(read_id) == "DISMISSED"
    assert _owed(c, direct_charlie) == 0 and int(c.get_read(read_id).bonus) == PRICE // 10
    _setup(direct_vm, transcript=NO_AD, ad_read=False)  # after the dispute, the sponsor message is cut
    direct_vm.sender = direct_bob
    assert c.confirm(read_id) == "reverted"
    assert _owed(c, direct_charlie) == PRICE // 10  # the read did not stand after all: the stake goes back to the disputer
    d = c.get_deal(deal_id)
    assert (int(d.budget), int(d.reserved), int(d.paid_total)) == (2 * PRICE, 0, 0)
    _balance(c)


FRESH = "ep-42-reupload"


@pytest.mark.parametrize("item, apple_ep", [
    # the host changed the guid; Apple still has the old one and matches by the audio file
    (_item(guid=FRESH), {"guid": GUID, "title": "Episode 42: the week", "released": "2026-11-20T08:00:00Z", "audio": AUDIO}),
    # new guid and a new audio URL; Apple matches by title, and it is Apple's same episode record
    (_item(guid=FRESH, audio="https://cdn.example.fm/ep42-v2.mp3"),
     {"guid": GUID, "title": "the week", "released": "2026-11-20T09:00:00Z"}),
    # Apple re-ingested the episode under the new guid: same Apple episode id
    (_item(guid=FRESH, audio="https://cdn.example.fm/ep42-v2.mp3"),
     {"guid": FRESH, "title": "Episode 42: the week", "released": "2026-11-20T08:00:00Z"}),
    # everything at Apple changed, but the feed's audio file is the one already delivered
    (_item(guid=FRESH, title="Episode 42 (re-upload)"),
     {"guid": FRESH, "track": 2000000042, "title": "Episode 42 (re-upload)", "released": "2026-11-20T08:00:00Z"}),
])
def test_the_same_episode_under_a_fresh_guid_takes_no_second_slot(direct_vm, direct_bob, deal, item, apple_ep):
    c, deal_id = deal
    first = _deliver(direct_vm, c, deal_id, direct_bob)
    assert c.get_read(first).verdict == "DELIVERED"
    rd = c.get_read(_deliver(direct_vm, c, deal_id, direct_bob, guid=FRESH, feed=_feed([_item(), item]), apple=_apple([apple_ep])))
    assert (rd.verdict, rd.code, rd.state, int(rd.price)) == ("INELIGIBLE", "already_delivered", "refused", 0)
    assert first in rd.why
    d = c.get_deal(deal_id)
    assert (int(d.budget), int(d.reserved), int(d.n_delivered)) == (PRICE, PRICE, 1)
    _balance(c)


def test_a_different_episode_still_takes_the_next_slot(direct_vm, direct_bob, deal):
    c, deal_id = deal
    _deliver(direct_vm, c, deal_id, direct_bob)
    other = _item(guid="ep-43", title="Episode 43: listener mail", pub="Sat, 21 Nov 2026 18:00:00 +1000",
                  audio="https://cdn.example.fm/ep43.mp3")
    apple = _apple([{"guid": "ep-43", "track": 1000000043, "title": "Episode 43: listener mail", "released": "2026-11-21T08:00:00Z"}])
    rd = c.get_read(_deliver(direct_vm, c, deal_id, direct_bob, guid="ep-43", feed=_feed([_item(), other]), apple=apple))
    assert rd.verdict == "DELIVERED" and int(c.get_deal(deal_id).n_delivered) == 2


def test_confirmation_refuses_a_guid_that_now_points_to_another_episode(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, deal_id, read_id = _delivered(direct_vm, direct_deploy, direct_alice, direct_bob)
    swapped = _item(title="Episode 44: a new read", pub="Sun, 22 Nov 2026 18:00:00 +1000", audio="https://cdn.example.fm/ep44.mp3")
    apple = _apple([{"guid": GUID, "track": 1000000044, "title": "Episode 44: a new read", "released": "2026-11-22T08:00:00Z"}])
    _setup(direct_vm, feed=_feed([swapped]), apple=apple)
    assert c.confirm(read_id) == "reverted"
    r = json.loads(c.get_read(read_id).confirm_json)
    assert (r["code"], r["same_episode"]) == ("different_episode", False)
    _balance(c)


# --- closing ---------------------------------------------------------------------------------------------------------------


def test_closing_returns_the_unreserved_budget_and_later_reverts_go_to_the_sponsor(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, deal_id, read_id = _delivered(direct_vm, direct_deploy, direct_alice, direct_bob)
    with direct_vm.expect_revert("takes episodes until 2026-12-14"):
        c.close_deal(deal_id)
    _at(direct_vm, "2026-12-15T00:00:00Z")
    assert c.close_deal(deal_id) == str(PRICE)
    assert _owed(c, direct_alice) == PRICE
    _setup(direct_vm, feed=_feed([]))
    assert c.confirm(read_id) == "reverted"
    assert _owed(c, direct_alice) == 2 * PRICE and int(c.get_deal(deal_id).returned_total) == 2 * PRICE
    _balance(c)


def test_an_unclaimed_price_returns_to_the_sponsor_after_90_days(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, deal_id, read_id = _delivered(direct_vm, direct_deploy, direct_alice, direct_bob)
    _setup(direct_vm)
    c.confirm(read_id)
    with direct_vm.expect_revert("has not closed yet"):
        c.reclaim(read_id)
    _at(direct_vm, "2026-12-15T00:00:00Z")
    c.close_deal(deal_id)
    with direct_vm.expect_revert("held until 2027-03-14"):
        c.reclaim(read_id)
    _at(direct_vm, "2027-03-15T00:00:00Z")
    assert c.reclaim(read_id) == str(PRICE)
    assert _owed(c, direct_alice) == 2 * PRICE and c.get_read(read_id).state == "returned"
    _balance(c)


def test_withdraw_needs_something_credited(direct_vm, direct_deploy, direct_alice, direct_bob, deal):
    c, _ = deal
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Nothing to withdraw"):
        c.withdraw()


# --- pure helpers, through views -------------------------------------------------------------------------------------------


def test_check_text_matches_brand_words_and_codes(deal):
    c, _ = deal
    r = json.loads(c.check_text("thanks to gamut-podcast network and Gamut Podcast Network! use code s h o w 2 0", "Gamut Podcast Network", "SHOW20"))
    assert r["mentions"] == 2 and r["code_found"] is True and len(r["passages"]) == 1
    assert json.loads(c.check_text("gamutpodcastnetwork", "Gamut Podcast Network", ""))["mentions"] == 0
