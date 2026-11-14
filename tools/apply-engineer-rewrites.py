#!/usr/bin/env python3
"""Apply hand-written choice rewrites to engineer deck JS files and validate length and phrase rules."""
from __future__ import annotations
import json, re, sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from engineer_rewrites import REWRITES

DECKS = {
    "fecivil": ROOT / "src/content/decks/eng_fecivil.js",
    "cbet": ROOT / "src/content/decks/eng_cbet.js",
}
DASH_RE = re.compile(r"[\u2013\u2014]")
TAIL_RE = re.compile(r"ordinary practice|complete usual rule|full governing answer|sole controlling measure|typical first-pass treatment", re.I)
CARD_RE = re.compile(r'\{ id: "((?:fe|cb)\d+)",.*? \},', re.S)


def words(s):
    return re.findall(r"[a-z0-9]+", s.lower())


def four_grams(s):
    w = words(s)
    return [" ".join(w[i:i + 4]) for i in range(0, len(w) - 3)]


def js_c(ch):
    return "c: [" + ", ".join(json.dumps(x, ensure_ascii=False) for x in ch) + "]"


def replace_string_field(block, key, value, cid):
    m = re.search(rf'{key}: "((?:\\.|[^"\\])*)"', block)
    if not m:
        raise SystemExit(f"{cid}: no {key} field")
    return block[:m.start()] + f"{key}: " + json.dumps(value, ensure_ascii=False) + block[m.end():]


def patch_card(block, cid, rw):
    out = block
    if "c" in rw:
        m = re.search(r"c: \[[^\]]+\]", out)
        if not m:
            raise SystemExit(f"{cid}: no c array")
        out = out[:m.start()] + js_c(rw["c"]) + out[m.end():]
    if "s" in rw:
        out = replace_string_field(out, "s", rw["s"], cid)
    if "f" in rw:
        out = replace_string_field(out, "f", rw["f"], cid)
    return out


def parse_cards(text):
    cards = []
    for m in CARD_RE.finditer(text):
        body = m.group(0)
        cid = m.group(1)
        c = json.loads(re.search(r"c: (\[[^\]]+\])", body).group(1))
        fm = re.search(r'f: (".*?"), src:', body, re.S)
        f = json.loads(fm.group(1)) if fm else ""
        cards.append({"id": cid, "c": c, "f": f, "span": (m.start(), m.end())})
    return cards


def validate(label, cards):
    errs = []
    longest = 0
    gram_choices = Counter()
    seen_ids = set()
    for card in cards:
        cid, ch, f = card["id"], card["c"], card["f"]
        if cid in seen_ids:
            errs.append(f"{cid}: duplicate")
        seen_ids.add(cid)
        if len(ch) != 4 or len(set(ch)) != 4:
            errs.append(f"{cid}: need 4 distinct choices")
            continue
        for i, x in enumerate(ch):
            if DASH_RE.search(x):
                errs.append(f"{cid} c{i}: dash")
            if TAIL_RE.search(x):
                errs.append(f"{cid} c{i}: stock tail leftover: {x}")
            gs = four_grams(x)
            counts = Counter(gs)
            for g, n in counts.items():
                if n > 1:
                    errs.append(f"{cid} c{i}: repeated phrase in one choice: {g!r}")
            for g in set(gs):
                gram_choices[g] += 1
        r = len(ch[1])
        o = max(len(ch[0]), len(ch[2]), len(ch[3]))
        if r > 1.3 * o + 1e-9:
            errs.append(f"{cid}: right is {r / o:.2f}x next longest ({ch[1]!r} vs max wrong {o})")
        if r >= o:
            longest += 1
        if f and DASH_RE.search(f):
            errs.append(f"{cid}: dash in explanation")
        if TAIL_RE.search(f or ""):
            errs.append(f"{cid}: tail in explanation")
    share = longest / len(cards) if cards else 0
    if share > 0.4 + 1e-12:
        errs.append(f"{label}: right is longest on {share:.1%} ({longest}/{len(cards)})")
    for g, n in gram_choices.items():
        if n > 3:
            errs.append(f"{label}: phrase {g!r} appears in {n} choices")
    return errs, longest, len(cards)


def apply_to_file(path):
    text = path.read_text()
    applied = 0
    def repl(m):
        nonlocal applied
        cid = m.group(1)
        block = m.group(0)
        if cid in REWRITES:
            applied += 1
            return patch_card(block, cid, REWRITES[cid])
        return block
    new = CARD_RE.sub(repl, text)
    # leftover tails anywhere
    if TAIL_RE.search(new):
        # list them
        for m in CARD_RE.finditer(new):
            if TAIL_RE.search(m.group(0)):
                raise SystemExit(f"tail leftover after apply in {m.group(1)}")
    path.write_text(new)
    return applied, parse_cards(new)


def main():
    missing = []
    # every rewrite id should exist in some deck
    all_ids = set()
    total_applied = 0
    reports = []
    for name, path in DECKS.items():
        applied, cards = apply_to_file(path)
        total_applied += applied
        all_ids.update(c["id"] for c in cards)
        errs, longest, n = validate(name, cards)
        reports.append((name, applied, longest, n, errs))
    unknown = [k for k in REWRITES if k not in all_ids]
    if unknown:
        raise SystemExit(f"rewrite ids not in decks: {unknown}")
    print(f"applied {total_applied} card rewrites")
    fail = 0
    for name, applied, longest, n, errs in reports:
        print(f"{name}: rewrites used on this pass {applied}, right-longest {longest}/{n} ({longest/n:.1%})")
        if errs:
            fail += len(errs)
            print(f"  {len(errs)} problems:")
            for e in errs[:40]:
                print("   -", e)
            if len(errs) > 40:
                print(f"   ... {len(errs)-40} more")
    if fail:
        raise SystemExit(f"{fail} validation problems")
    print("ok engineer rewrites validated")


if __name__ == "__main__":
    main()
