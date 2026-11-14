#!/usr/bin/env python3
"""Held-out CV classifier and single-cue gates for Engineer Practice decks.

Logistic regression on length rank, absolutes, stem overlap, numeric rank, and
similar features must stay at or under 35% on each deck (chance is 25%).
No single cue rule may exceed 32%.
"""
from __future__ import annotations

import json
import re
import statistics
import subprocess
import sys
from pathlib import Path

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import GradientBoostingClassifier

ROOT = Path(__file__).resolve().parents[1]
STOP = set('a an the of to in on for and or is are be by with as at from that this which what it its your you their than into per when if not no any all'.split())
ABS = re.compile(r'\b(only|always|never|every|all|none|any|must|completely|entirely|no)\b', re.I)
HEDGE = re.compile(r'\b(often|typically|generally|usually|may|might|can|could|some|most|mainly|likely|approximately|about|unless|if|common|commonly|many|tends?)\b', re.I)
FILLER = re.compile(r'\b(on this assignment|in this situation|for this case)\b', re.I)
APPOS = re.compile(r',\s+(a|an|the)\s+[a-z\- ]+$', re.I)


def vis(t):
    t = re.sub(r'\\[()\[\]]', '', t)
    t = re.sub(r'\\mathrm\{([^}]*)\}', r'\1', t)
    t = re.sub(r'\\[,;!]', ' ', t)
    t = re.sub(r'\\times', 'x', t)
    t = re.sub(r'\\[a-zA-Z]+', '#', t)
    t = re.sub(r'[{}]', '', t)
    return t


def words(t):
    return [w for w in re.findall(r'[a-z0-9]+', vis(t).lower()) if w not in STOP and len(w) > 2]


def nums(t):
    v = vis(t).replace(',', '')
    m = re.findall(r'-?\d+(?:\.\d+)?(?:e-?\d+)?', v)
    if not m:
        return None
    x = float(m[0])
    me = re.search(r'10\^\s*(-?\d+)', v)
    if me:
        x = x * 10 ** int(me.group(1))
    return x


def pick_share(scores, maximize=True):
    best = max(scores) if maximize else min(scores)
    tied = [i for i, s in enumerate(scores) if s == best]
    return (1 / len(tied)) if 1 in tied else 0.0


def feats(c):
    ch = c['c']
    L = [len(vis(x).strip()) for x in ch]
    sl = sorted(L)
    sw = set(words(c['s']))
    ns = [nums(x) for x in ch]
    numeric = all(n is not None for n in ns) and len(set(ns)) == 4
    o = sorted(range(4), key=lambda i: ns[i]) if numeric else None
    F = []
    for i, x in enumerate(ch):
        v = vis(x)
        mean = statistics.mean(L)
        sd = statistics.pstdev(L) or 1
        F.append([
            L[i],
            (L[i] - mean) / sd,
            sum(l < L[i] for l in L),
            sum(l > L[i] for l in L),
            int(L[i] == sl[-2]),
            int(bool(ABS.search(v))),
            len(HEDGE.findall(v)),
            int(bool(FILLER.search(x))),
            len(sw & set(words(x))),
            int(numeric and o.index(i) in (1, 2)),
            int(numeric),
            int('\\(' in x),
            v.count(','),
            len(v.split()),
        ])
    return np.array(F, float)


def strategies(c):
    ch = c['c']
    L = [len(vis(x).strip()) for x in ch]
    R = {}
    R['shortest'] = pick_share(L, False)
    R['longest'] = pick_share(L, True)
    sl = sorted(set(L), reverse=True)
    if len(sl) >= 2:
        R['second_longest'] = pick_share([1 if x == sl[1] else 0 for x in L], True)
    else:
        R['second_longest'] = 0.25
    a = [1 if ABS.search(vis(x)) else 0 for x in ch]
    R['no_absolute'] = pick_share([-v for v in a])
    R['has_absolute'] = pick_share(a)
    h = [len(HEDGE.findall(vis(x))) for x in ch]
    R['most_hedged'] = pick_share(h)
    dev = [abs(L[i] - statistics.mean([L[j] for j in range(4) if j != i])) for i in range(4)]
    R['oddone_length'] = pick_share(dev)
    feats_fmt = [(bool(re.search(r'\\\(', x)), bool(re.search(r'\d', x)), vis(x).split()[0].lower() if vis(x).split() else '', ',' in x, bool(FILLER.search(x))) for x in ch]
    uniq = [sum(1 for j in range(4) if j != i and feats_fmt[j] != feats_fmt[i]) for i in range(4)]
    R['oddone_format'] = pick_share(uniq) if max(uniq) == 3 and uniq.count(3) == 1 else 0.25
    sw = set(words(c['s']))
    ov = [len(sw & set(words(x))) for x in ch]
    R['stem_overlap_max'] = pick_share(ov)
    R['stem_overlap_min'] = pick_share(ov, False)
    fl = [1 if FILLER.search(x) else 0 for x in ch]
    R['avoid_filler'] = pick_share([-v for v in fl])
    ap = [1 if APPOS.search(vis(x).strip().rstrip('.')) else 0 for x in ch]
    R['avoid_appositive_tail'] = pick_share([-v for v in ap])
    ns = [nums(x) for x in ch]
    numeric = all(n is not None for n in ns) and len(set(ns)) == 4
    if numeric:
        order = sorted(range(4), key=lambda i: ns[i])
        R['middle_numeric'] = 0.5 if 1 in (order[1], order[2]) else 0.0
    else:
        R['middle_numeric'] = None
    sc = [-3 * fl[i] - 1 * a[i] - 1 * ap[i] for i in range(4)]
    best = max(sc)
    cand = [i for i in range(4) if sc[i] == best]
    if numeric and len(cand) > 1:
        order = sorted(range(4), key=lambda i: ns[i])
        mid = [i for i in cand if i in (order[1], order[2])]
        cand = mid or cand
    if len(cand) > 1:
        bo = max(ov[i] for i in cand)
        cand = [i for i in cand if ov[i] == bo]
    R['combined'] = (1 / len(cand)) if 1 in cand else 0.0
    return R


def load_cards():
    script = r'''
const L=require("./tests/load.js").load();
const cards=[];
["fecivil","cbet"].forEach(deck => {
  L.decks[deck].cards.forEach(c => cards.push({deck, id:c.id, s:c.s, c:c.c, f:c.f}));
});
process.stdout.write(JSON.stringify(cards));
'''
    raw = subprocess.check_output(['node', '-e', script], cwd=str(ROOT))
    return json.loads(raw)


def cv_scores(cards, seeds=4):
    out = {}
    rng = np.random.default_rng(0)
    for seed in range(seeds):
        idx = rng.permutation(len(cards))
        folds = np.array_split(idx, 10)
        for fold in folds:
            te_set = set(fold.tolist())
            tr = [cards[i] for i in idx if i not in te_set]
            te = [cards[i] for i in fold]
            X = np.vstack([feats(c) for c in tr])
            y = np.array([1 if i == 1 else 0 for c in tr for i in range(4)])
            mdl = LogisticRegression(max_iter=2000, C=1.0)
            mdl.fit(X, y)
            for c in te:
                pr = mdl.predict_proba(feats(c))[:, 1]
                out.setdefault('logreg', []).append(1.0 if int(np.argmax(pr)) == 1 else 0.0)
            gbm = GradientBoostingClassifier(n_estimators=80, max_depth=2, random_state=seed)
            gbm.fit(X, y)
            for c in te:
                pr = gbm.predict_proba(feats(c))[:, 1]
                out.setdefault('gbm', []).append(1.0 if int(np.argmax(pr)) == 1 else 0.0)
    return {k: 100 * float(np.mean(v)) for k, v in out.items()}


def cue_scores(cards):
    acc = {}
    for c in cards:
        R = strategies(c)
        for k, v in R.items():
            if v is None:
                continue
            acc.setdefault(k, []).append(v)
    return {k: 100 * sum(v) / len(v) for k, v in acc.items()}


def main():
    cards = load_cards()
    failed = []
    for deck in ('fecivil', 'cbet'):
        cs = [c for c in cards if c['deck'] == deck]
        cv = cv_scores(cs)
        cues = cue_scores(cs)
        print(f"{deck} logreg {cv['logreg']:.1f}%  gbm {cv['gbm']:.1f}%  n={len(cs)}")
        for k, v in sorted(cues.items(), key=lambda kv: -kv[1]):
            print(f"  cue {k}: {v:.1f}%")
        if cv['logreg'] > 35.0 + 1e-9:
            failed.append(f"{deck} logreg {cv['logreg']:.1f}% exceeds 35%")
        for k, v in cues.items():
            if k == 'combined':
                continue
            if v > 32.0 + 1e-9:
                failed.append(f"{deck} cue {k} {v:.1f}% exceeds 32%")
    if failed:
        print('FAIL')
        for f in failed:
            print(' ', f)
        sys.exit(1)
    print('ok engineer CV classifier (logreg <= 35%) and cue rules (<= 32%)')


if __name__ == '__main__':
    main()
