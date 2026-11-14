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
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer

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
    ao = [len(re.findall(r'\b(and|or)\b', vis(x), re.I)) for x in ch]
    R['most_and_or'] = pick_share(ao)
    return R


def load_cards():
    script = r'''
const L=require("./tests/load.js").load();
const cards=[];
["fecivil","cbet"].forEach(deck => {
  L.decks[deck].cards.forEach(c => cards.push({deck, id:c.id, topic:c.topic, s:c.s, c:c.c, f:c.f}));
});
process.stdout.write(JSON.stringify(cards));
'''
    raw = subprocess.check_output(['node', '-e', script], cwd=str(ROOT))
    return json.loads(raw)


def _summarize_seeds(seed_scores):
    """Return mean/min/max in percent for a dict of name -> list of per-seed accuracies."""
    out = {}
    for k, vals in seed_scores.items():
        arr = np.array(vals, dtype=float)
        out[k] = {
            'mean': 100 * float(np.mean(arr)),
            'min': 100 * float(np.min(arr)),
            'max': 100 * float(np.max(arr)),
            'seeds': [100 * float(v) for v in arr],
        }
    return out


def cv_scores(cards, seeds=5):
    seed_scores = {'logreg': [], 'gbm': []}
    for seed in range(seeds):
        rng = np.random.default_rng(seed)
        idx = rng.permutation(len(cards))
        folds = np.array_split(idx, 10)
        fold_logreg, fold_gbm = [], []
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
                fold_logreg.append(1.0 if int(np.argmax(pr)) == 1 else 0.0)
            gbm = GradientBoostingClassifier(n_estimators=80, max_depth=2, random_state=seed)
            gbm.fit(X, y)
            for c in te:
                pr = gbm.predict_proba(feats(c))[:, 1]
                fold_gbm.append(1.0 if int(np.argmax(pr)) == 1 else 0.0)
        seed_scores['logreg'].append(float(np.mean(fold_logreg)))
        seed_scores['gbm'].append(float(np.mean(fold_gbm)))
    return _summarize_seeds(seed_scores)


def cue_scores(cards):
    acc = {}
    for c in cards:
        R = strategies(c)
        for k, v in R.items():
            if v is None:
                continue
            acc.setdefault(k, []).append(v)
    return {k: 100 * sum(v) / len(v) for k, v in acc.items()}


def share_pred(p):
    best = max(p)
    tied = [i for i, v in enumerate(p) if abs(v - best) < 1e-12]
    return (1 / len(tied)) if 1 in tied else 0.0


def token_list(t):
    return [w for w in re.findall(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*', vis(t).lower()) if w not in STOP and len(w) > 2]


def exclusive_tokens(cards, min_count=5):
    from collections import Counter
    keys, wrongs = Counter(), Counter()
    where = {}
    for c in cards:
        for i, t in enumerate(c['c']):
            for w in set(token_list(t)):
                (keys if i == 1 else wrongs).update([w])
                where.setdefault(w, []).append(f"{c['id']}c{i}")
    bad = []
    for w, n in sorted(keys.items()):
        if n >= min_count and wrongs[w] == 0:
            bad.append((w, n, 0, where[w]))
    for w, n in sorted(wrongs.items()):
        if n >= min_count and keys[w] == 0:
            bad.append((w, 0, n, where[w]))
    return bad


def tfidf_cv(cards, seeds=5):
    """Held-out 10-fold word-level tf-idf classifiers over several seeds.

    Returns mean and range of the per-seed accuracies. Each seed is independently
    reseeded so the five results are comparable draws, not one long RNG stream.
    """
    seed_scores = {'tfidf_logreg': [], 'tfidf_gbm': [], 'tfidf_rf': []}
    for seed in range(seeds):
        rng = np.random.default_rng(seed)
        idx = rng.permutation(len(cards))
        folds = np.array_split(idx, 10)
        fold_hits = {k: [] for k in seed_scores}
        for fold in folds:
            te_set = set(fold.tolist())
            tr = [cards[i] for i in idx if i not in te_set]
            te = [cards[i] for i in fold]
            txt = [vis(x) for c in tr for x in c['c']]
            y = np.array([1 if i == 1 else 0 for c in tr for i in range(4)])
            vec = TfidfVectorizer(
                ngram_range=(1, 1),
                min_df=2,
                sublinear_tf=True,
                lowercase=True,
                token_pattern=r'(?u)\b[a-zA-Z][a-zA-Z0-9\-]*\b',
            )
            T = vec.fit_transform(txt)
            models = {
                'tfidf_logreg': LogisticRegression(max_iter=3000, C=2),
                'tfidf_gbm': GradientBoostingClassifier(n_estimators=100, max_depth=2, random_state=seed),
                'tfidf_rf': RandomForestClassifier(n_estimators=200, min_samples_leaf=3, random_state=seed),
            }
            for mdl in models.values():
                mdl.fit(T, y)
            for c in te:
                Tt = vec.transform([vis(x) for x in c['c']])
                for name, mdl in models.items():
                    pr = mdl.predict_proba(Tt)[:, 1]
                    fold_hits[name].append(share_pred(pr))
        for name in seed_scores:
            seed_scores[name].append(float(np.mean(fold_hits[name])))
    return _summarize_seeds(seed_scores)


def _choice_tokens(t):
    return re.findall(r"[a-z0-9']+", vis(t).lower())


def _ngrams(ws, n):
    return [tuple(ws[i:i + n]) for i in range(0, max(0, len(ws) - n + 1))]


def f_bigram(choices):
    B = [set(_ngrams(_choice_tokens(c), 2)) for c in choices]
    sc = []
    for i, b in enumerate(B):
        if not b:
            sc.append(0.0)
            continue
        sc.append(sum(len(b & B[j]) for j in range(4) if j != i) / len(b))
    return sc


def pick_min_share(scores):
    m = min(scores)
    hits = [i for i, s in enumerate(scores) if s == m]
    return (1.0 / len(hits)) if 1 in hits else 0.0


def missing_phrase_hit(choices):
    """Return 1, 0, or 0.25: fire when exactly one option lacks a 3-gram the other three share."""
    G = [set(_ngrams(_choice_tokens(c), 3)) for c in choices]
    allg = {}
    for i, gset in enumerate(G):
        for g in gset:
            allg.setdefault(g, set()).add(i)
    missing = set()
    for g, ids in allg.items():
        if len(ids) == 3:
            missing.add(({0, 1, 2, 3} - ids).pop())
    if len(missing) == 1:
        return 1.0 if missing.pop() == 1 else 0.0
    return 0.25


def rule_scores(cards):
    """Fewest-shared-bigrams odd-one-out and missing-shared-phrase scores, overall and per topic."""
    big, phr = [], []
    by_t = {}
    for c in cards:
        b = pick_min_share(f_bigram(c['c']))
        p = missing_phrase_hit(c['c'])
        big.append(b)
        phr.append(p)
        rec = by_t.setdefault(c.get('topic') or 'unknown', {'big': [], 'phr': []})
        rec['big'].append(b)
        rec['phr'].append(p)
    def pct(xs):
        return 100.0 * sum(xs) / len(xs) if xs else 0.0
    topics = {t: {'bigram': pct(v['big']), 'phrase': pct(v['phr']), 'n': len(v['big'])} for t, v in sorted(by_t.items())}
    return {'bigram': pct(big), 'phrase': pct(phr), 'topics': topics}


def shuffle_null_tfidf_logreg(cards, seeds=5):
    """Train tf-idf logreg on label-shuffled options; report mean test accuracy (expect ~25%)."""
    scores = []
    for seed in range(seeds):
        rng = np.random.default_rng(seed + 101)
        idx = rng.permutation(len(cards))
        folds = np.array_split(idx, min(10, len(cards)))
        hits = []
        for fold in folds:
            te_set = set(fold.tolist())
            tr = [cards[i] for i in idx if i not in te_set]
            te = [cards[i] for i in fold]
            txt = [vis(x) for c in tr for x in c['c']]
            y = np.array([1 if i == 1 else 0 for c in tr for i in range(4)])
            rng.shuffle(y)
            vec = TfidfVectorizer(ngram_range=(1, 1), min_df=2, sublinear_tf=True, lowercase=True,
                                  token_pattern=r'(?u)\b[a-zA-Z][a-zA-Z0-9\-]*\b')
            T = vec.fit_transform(txt)
            mdl = LogisticRegression(max_iter=3000, C=2)
            mdl.fit(T, y)
            for c in te:
                pr = mdl.predict_proba(vec.transform([vis(x) for x in c['c']]))[:, 1]
                hits.append(share_pred(pr))
        scores.append(float(np.mean(hits)) if hits else 0.25)
    arr = np.array(scores, dtype=float)
    return {'mean': 100 * float(np.mean(arr)), 'min': 100 * float(np.min(arr)), 'max': 100 * float(np.max(arr))}


def tfidf_logreg_by_topic(cards, seeds=5):
    """Held-out tf-idf logreg share, averaged over seeds, overall and per topic."""
    card_hits = {c['id']: [] for c in cards}
    by_id = {c['id']: c for c in cards}
    for seed in range(seeds):
        rng = np.random.default_rng(seed)
        idx = rng.permutation(len(cards))
        folds = np.array_split(idx, min(10, len(cards)))
        for fold in folds:
            te_set = set(fold.tolist())
            tr = [cards[i] for i in idx if i not in te_set]
            te = [cards[i] for i in fold]
            txt = [vis(x) for c in tr for x in c['c']]
            y = np.array([1 if i == 1 else 0 for c in tr for i in range(4)])
            vec = TfidfVectorizer(ngram_range=(1, 1), min_df=2, sublinear_tf=True, lowercase=True,
                                  token_pattern=r'(?u)\b[a-zA-Z][a-zA-Z0-9\-]*\b')
            T = vec.fit_transform(txt)
            mdl = LogisticRegression(max_iter=3000, C=2)
            mdl.fit(T, y)
            for c in te:
                pr = mdl.predict_proba(vec.transform([vis(x) for x in c['c']]))[:, 1]
                card_hits[c['id']].append(share_pred(pr))
    overall = [float(np.mean(v)) for v in card_hits.values() if v]
    topics = {}
    for cid, hits in card_hits.items():
        if not hits:
            continue
        t = by_id[cid].get('topic') or 'unknown'
        topics.setdefault(t, []).append(float(np.mean(hits)))
    def pct(xs):
        return 100.0 * float(np.mean(xs)) if xs else 0.0
    return {'overall': pct(overall), 'topics': {t: pct(v) for t, v in sorted(topics.items())}}


def main():
    cards = load_cards()
    failed = []
    for deck in ('fecivil', 'cbet'):
        cs = [c for c in cards if c['deck'] == deck]
        cv = cv_scores(cs)
        tf = tfidf_cv(cs)
        cues = cue_scores(cs)
        def fmt(s):
            return f"{s['mean']:.1f}% (range {s['min']:.1f}-{s['max']:.1f}%)"
        print(
            f"{deck} feat-logreg {fmt(cv['logreg'])}  feat-gbm {fmt(cv['gbm'])}  "
            f"tfidf-logreg {fmt(tf['tfidf_logreg'])}  tfidf-gbm {fmt(tf['tfidf_gbm'])}  "
            f"tfidf-rf {fmt(tf['tfidf_rf'])}  n={len(cs)}  seeds=5"
        )
        for k, v in sorted(cues.items(), key=lambda kv: -kv[1]):
            print(f"  cue {k}: {v:.1f}%")
        excl = exclusive_tokens(cs)
        if excl:
            print(f"  exclusive tokens (>=5 only in keys or only in distractors): {len(excl)}")
            for w, k, wr, where in excl:
                print(f"    {w} keys={k} wrongs={wr} {', '.join(where[:8])}")
            failed.append(f"{deck} exclusive tokens: " + ', '.join(w for w, *_ in excl))
        else:
            print('  exclusive tokens: none')
        if cv['logreg']['mean'] > 35.0 + 1e-9:
            failed.append(f"{deck} feat-logreg {cv['logreg']['mean']:.1f}% exceeds 35%")
        if cv['gbm']['mean'] > 35.0 + 1e-9:
            failed.append(f"{deck} feat-gbm {cv['gbm']['mean']:.1f}% exceeds 35%")
        for name, rec in tf.items():
            if rec['mean'] > 35.0 + 1e-9:
                failed.append(f"{deck} {name} {rec['mean']:.1f}% exceeds 35%")
        for k, v in cues.items():
            if k == 'combined':
                continue
            if v > 32.0 + 1e-9:
                failed.append(f"{deck} cue {k} {v:.1f}% exceeds 32%")
        rules = rule_scores(cs)
        print(f"  fewest-shared-bigrams {rules['bigram']:.1f}%  missing-shared-phrase {rules['phrase']:.1f}%")
        for t, rec in rules['topics'].items():
            print(f"    topic {t} (n={rec['n']}): bigram {rec['bigram']:.1f}%  phrase {rec['phrase']:.1f}%")
            if rec['bigram'] > 30.0 + 1e-9:
                failed.append(f"{deck}/{t} fewest-shared-bigrams {rec['bigram']:.1f}% exceeds 30%")
            if rec['phrase'] > 30.0 + 1e-9:
                failed.append(f"{deck}/{t} missing-shared-phrase {rec['phrase']:.1f}% exceeds 30%")
        if rules['bigram'] > 30.0 + 1e-9:
            failed.append(f"{deck} fewest-shared-bigrams {rules['bigram']:.1f}% exceeds 30%")
        if rules['phrase'] > 30.0 + 1e-9:
            failed.append(f"{deck} missing-shared-phrase {rules['phrase']:.1f}% exceeds 30%")
        if deck == 'cbet':
            # Tighter 30% gate on CBET tf-idf logreg (5-seed mean already in tf).
            if tf['tfidf_logreg']['mean'] > 30.0 + 1e-9:
                failed.append(f"{deck} tfidf-logreg {tf['tfidf_logreg']['mean']:.1f}% exceeds 30%")
            null = shuffle_null_tfidf_logreg(cs)
            print(f"  cbet shuffle-null tfidf-logreg {null['mean']:.1f}% (range {null['min']:.1f}-{null['max']:.1f}%)")
            by_t = tfidf_logreg_by_topic(cs)
            for t, v in by_t['topics'].items():
                print(f"    topic {t} tfidf-logreg {v:.1f}%")
                if v > 30.0 + 1e-9:
                    failed.append(f"{deck}/{t} tfidf-logreg {v:.1f}% exceeds 30%")
    if failed:
        print('FAIL')
        for f in failed:
            print(' ', f)
        sys.exit(1)
    print('ok engineer CV (tf-idf/GBM/RF <= 35%, cue and most-and/or <= 32%, no exclusive tokens)')


if __name__ == '__main__':
    main()
