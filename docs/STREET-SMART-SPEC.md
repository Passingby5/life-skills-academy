# Street Smart: Design Spec (v0.1, Oct 19, 2026)

Spec only. Nothing is built yet. Matches SPEC.md v0.2 (Know It) and the deck format in src/content/decks/.

## Goal
Short, real case studies that teach a player to spot danger, tricks, and legal or money traps, and to pick a safe way out. Answers are short and concrete: good enough to get out of a sticky spot in one move.

## What stays the same (from Know It)
- Gut Check flow: scenario, pick, confidence tap ("Guess", "Pretty sure", "Sure"), fix screen (myth, "That is wrong", fix, why, source link), "Wow" badge when Sure and wrong, round recap.
- Tuned Leitner: 5 boxes, gaps 0/1/3/7/14 days, Guess-right stays, wrong goes to box 1 and comes back once in the round.
- Ages: "both" | "ya" (15 to 30) | "adult" (30+), with s: {ya, adult} lines. Each deck needs 50+ cards per age group.
- Every fix ties to a saved source (sourceId in the deck's sources list). Plain words, no em-dashes.
- Deck checker and tell gate (tools/checkdecks.js, tools/tellgate.js): every rule and the surface classifier at or under 45%, right answer not over 1.3x the next longest, not longest on over 40% of cards.

## Section and opt-in
- New home section "Street Smart" with 5 decks. The whole section is off by default (like the Big Debates deck) and each deck has its own switch.
- Recommended defaults (flag for Tom): Street Safety, Legal, and Estate are open to both age groups once turned on. Reading (Hard Reads) and Power Plays default to Adult profiles only; a parent PIN on the profile can turn them on for a YA profile. Content rating tag per deck: "teen" or "adult".
- Turning on an adult-rated deck shows a one-line note about what it covers.

## The 5 decks
| # | Deck id | Name | Mode | Target count |
|---|---|---|---|---|
| 1 | hardreads | Hard Reads (reading) | NEW Passage mode | 50 passages x 5-7 questions (about 300 questions) |
| 2 | streetcues | Street Safety | NEW Red Flags (multi-select) | 52 cue sets (6 cues each) |
| 3 | legal | Legal Traps (CA + federal) | Gut Check (3 choices) | 70 cards (40 both + 15 ya + 15 adult) |
| 4 | power | Power Plays | Gut Check + step diagram fix | 60 cards |
| 5 | estate | Estate Planning (CA) | Gut Check (3 choices) | 54 cards as built in v16 (51 both + 3 adult only; 51 per ya, 54 per adult), each on a named case plus statute |
Total: about 550 scored items.

### 1. Hard Reads (Passage mode, new)
- Screen 1: passage, 2 to 3 short paragraphs (150 to 300 words), scrolls, "I read it" button. Screen 2 on: one question at a time, 3 choices, confidence tap, short fix (why this answer, quoting the line that proves it). The passage stays one tap away ("Show passage").
- Question types (tag each): mainIdea, inference, purpose, assumption, strengthen, weaken, tone. Each passage has 5 to 7 questions and at least 4 types.
- Topics: religions, philosophy, cultures, politics, socialism and capitalism, Islam, genocide (for example the Khmer Rouge), honor killing, and tactics of narcissists, psychopaths, gang recruiters, abusers, extremists, cults, and high-control groups.
- Leitner unit is the question. A passage counts as due when any of its questions is due. A Passage round = 1 passage (not mixed into the 10-card Gut Check round).

### 2. Street Safety (Red Flags mode, new)
- Scenario (1 to 2 lines) plus 6 cue tiles: lines of talk, behavior, tone, markings, pushiness or flattery. Each cue is a red flag or not. Player taps all red flags (2 to 4 per set), then "Done", then confidence tap.
- Scoring: right only if the picked set matches exactly. Fix screen shows each cue marked flag or fine, with a one-line why, then one "Do this" safe move and the source.
- Topics: new city safety, stalking, drink spiking, being tricked into crimes (money mules, carrying packages), scams. Cases drawn from documented sources (FBI, FTC, DOJ press releases, UNODC, State Dept travel pages, RAINN, court records).

### 3. Legal Traps
- Thinks-it's-legal-but-isn't, thinks-they're-at-fault-but-aren't, tax pitfalls, insurance denials (pre-existing conditions, policy wording) with real cases, laxly enforced laws, and lawful loopholes. California and federal.
- Every card cites a statute, regulation, or real case (CA codes on leginfo.legislature.ca.gov, U.S. Code, IRS pubs, CA DOI, CourtListener or Justia for cases). Fix screen ends with "General info, not legal advice."

### 4. Power Plays
- Short, vivid scenes from well-documented public conflicts (politics, business, Hollywood, street, family). Player picks the best safe way out.
- Fix screen adds a step diagram: 3 to 4 boxes with arrows (for example "Pause > Write it down > Get a witness > Say no once, calmly"). Steps come from sourced guidance (negotiation, HR, conflict research).
- Uses our own named tactics, about 12, for example "The Flattery Hook", "Split and Rule", "The Fake Deadline", "Borrowed Credit", "The Freeze Out", "The Debt Trap". Not Robert Greene's laws, list, wording, or order.
- A short faith note where it fits (for example Matthew 10:16, "wise as serpents, harmless as doves"), shown as a small line, never in the scoring.

### 5. Estate Planning
- Wills, POA, trusts, LLCs, beneficiary forms, CA probate. One right answer, two plausible wrong ones. Sources: CA Probate Code, CA Courts self-help, IRS, state bar pages. "Not legal advice" line on every fix.

## Guardrails (checker-tagged where possible)
1. Recognition and defense only. Manipulation, violence, extremism, and genocide passages analyze and condemn. They never instruct, never glorify, and have no graphic gore. Where extremist or genocidal reasoning is shown (for example "pull up weeds by the roots"), it is quoted briefly, labeled, and rebutted in the same passage.
2. Religion is fair and respectful. Questions test reading, not which faith is right. Each faith is described from its own sources plus a neutral scholar or survey (for example Pew).
3. High-control groups are framed by behaviors (Behavior, Information, Thought, Emotional control, Hassan BITE model, cited, plus a peer-reviewed source). No mainstream religion is named as a cult.
4. Copyright: no text, list, or order from 48 Laws of Power. Our own tactic names and wording.
5. Real people: only well-documented public events, every fact sourced, nothing beyond the record, no images of real people (icons and diagrams only).
6. Legal, tax, insurance: general education, "not legal advice", real statutes and cases only. Never invent a case; each case cite is checked against CourtListener or Justia before release.
7. Street safety: no steps that enable harm (no how-to for spiking, stalking, scams, or evading police). Cues teach spotting; fixes teach leaving, telling, and reporting (911, 988, RAINN 800-656-4673, FTC, IC3).
8. Family tone: no slurs, no sexual detail, crimes named in plain words.

## Data format
Passage (hardreads):
```js
{ id: 'hr-khmer-01', ages: 'adult', rating: 'adult', topic: 'genocide',
  title: 'Weeds and Roots', passage: ['para 1', 'para 2', 'para 3'],
  sourceIds: ['yale-cgp', 'eccc'], guard: ['quotesExtremism', 'rebutted'],
  qs: [ { id: 'hr-khmer-01-q1', type: 'mainIdea', q: '...', c: [wrong, right, decoy], fix: '...', line: 2 } ] }
```
Cue set (streetcues):
```js
{ id: 'sc-mule-03', ages: 'both', topic: 'moneyMule', s: { ya: '...', adult: '...' },
  cues: [ { t: 'He says you can keep 10% for helping.', flag: true, why: '...' }, ... 6 total ],
  doThis: 'Say no, block, and report at ic3.gov.', sourceId: 'fbi-mule' }
```
Power card adds `steps: ['Pause', 'Write it down', 'Get a witness', 'Say no once']` and `tactic: 'fakeDeadline'`, optional `faith: '...'`.
Legal and estate cards are the normal card shape plus `cite: 'Cal. Veh. Code 23123.5'` and `law: 'CA' | 'federal'`.

## Checker extensions
- Passage: all Gut Check tells apply per question (length, longest, first word, negation, classifier). Plus: each passage has 5 to 7 questions and at least 4 types; no type has the right answer in one slot over 45%; "passage-free" test: a classifier trained on question plus choices only (no passage) must stay at or under 45% (stops questions answerable without reading); every q has a `line` that exists.
- Red Flags: each set has exactly 6 cues and 2 to 4 flags; flag count spread (no single count over 50% of sets); flag cues may not be longer on average than safe cues by over 1.2x; first-word and punctuation tells per cue at or under 45%; a "pick the pushiest-sounding words" keyword classifier stays at or under 45% cue accuracy above the base rate; flag positions are shuffled by the seeded RNG.
- Power: `steps` 3 to 4 items, each under 6 words; tactic name in the allowed list; banned phrase list (Greene law titles) must not appear.
- Absolute words (Legal and Estate, v16): wrong choices with always/never/nothing/any/all/ever/only/whatsoever may be at most 3x the right ones (or 3), and at most 15% of cards may be solvable by dropping the lone absolute-worded choice.
- Legal and estate: every card has `cite`, and every case cite is in a reviewed list file (docs/street/LEGAL-SOURCES.md for Legal, docs/street/ESTATE-SOURCES.md for Estate) with a checked URL.
- Guardrails: banned-word list (gore and how-to terms) fails the build; adult-rated decks must have `rating: 'adult'`; a passage tagged `quotesExtremism` must also be tagged `rebutted`.

## Build order (vertical slices)
1. Legal Traps first: uses the existing Gut Check mode, so it proves the section, opt-in, `cite`, and the "not legal advice" line with no new UI. (10 cards, then 70.)
2. Street Safety: builds the Red Flags mode and its checker. (10 sets, then 52.)
3. Estate Planning: Gut Check mode, reuses the legal cite pattern; cites in docs/street/ESTATE-SOURCES.md. (54 in v16.)
4. Power Plays: adds step diagram on the fix screen. (60.) Built in v18 with 53 sourced cards (5 drafted cases cut for weak sources); see docs/street/POWER-SOURCES.md.
5. Hard Reads last: biggest new mode, most writing, most guardrail review. (5 passages, then 50.)
Each slice ships with its tests, checker rules, and Tom's review list before the next starts.

## QA scope
- Unit: new mode scoring, Leitner per question and per cue set, opt-in and age rules, checker rules (with failing fixtures).
- Sim: 1,000 seeded players, 60 days, all Street Smart decks on, no errors.
- Playwright: phone portrait and landscape for Passage and Red Flags screens, 48 px targets, tap only, zero console errors.
- Human: Tom checks every card against its source and signs the review list; a second reader checks every Hard Reads passage and Power Plays scene for the guardrails.

## Acceptance checklist
1. Home shows a "Street Smart" section that is off by default; turning it on shows 5 deck switches, each off by default.
2. With default settings, a YA profile cannot turn on Hard Reads or Power Plays without the parent PIN; an Adult profile can.
3. No adult-rated card or passage reaches a YA profile without the PIN (sim over 1,000 seeded rounds).
4. Legal, Estate, and Power cards play in the normal Gut Check flow: scenario, 3 choices, confidence tap, fix screen, Wow badge, recap.
5. Every Legal and Estate fix screen shows the cite and the line "General info, not legal advice."
6. Every Power fix screen shows a step diagram of 3 to 4 boxes that fits at 390x844 and 844x390 with no side scroll.
7. Passage mode shows the passage first, then 5 to 7 questions one at a time, each with 3 choices and a confidence tap, and "Show passage" works from any question.
8. Passage question fixes show the why and the passage line that proves it.
9. Red Flags mode shows a scenario and 6 cue tiles; any number can be toggled; "Done" then the confidence tap; the score is right only on an exact match.
10. The Red Flags fix screen marks every cue flag or fine with its why, then "Do this" and the source link.
11. Leitner rules from SPEC.md item 18 pass for passage questions and cue sets (unit test).
12. Deck checker fails the build if any Street Smart deck has fewer than 50 items for an age group it serves (Hard Reads counted in questions, 250+ for Adult).
13. Deck checker fails on any missing field in the passage, cue set, power, legal, or estate shapes in this spec.
14. Every existing tell rule and the classifier stay at or under 45% for each new deck and for passage questions.
15. The passage-free classifier scores at or under 45% on Hard Reads questions.
16. Red Flags checker: exactly 6 cues and 2 to 4 flags per set; no flag count over 50% of sets; flag cues not over 1.2x the length of safe cues on average; cue tells at or under 45%.
17. Cue order and choice order are shuffled by the seeded RNG; each flag position is used within 5 points of even over 3,000 seeded sets.
18. Build fails if any banned gore or how-to term appears, or a `quotesExtremism` passage lacks `rebutted`.
19. Build fails if any Greene law title from the banned list appears in the Power deck.
20. Every case cite in Legal and Estate appears in its deck file under docs/street/ (LEGAL-SOURCES.md, ESTATE-SOURCES.md) with a working link (link check passes; some sites such as the FTC and leginfo return 403 or 404 to plain curl, so check those in a browser fetch).
21. Every sourceId resolves, and the About page lists every Street Smart source with a working link.
22. No image of a real person is in any Street Smart deck (checker: img paths only from src/img/ icons list).
23. Playwright phone click-through of Passage and Red Flags rounds ends with zero console errors; all targets at least 48x48 px.
24. Offline: a Passage round and a Red Flags round play with network off.
25. Saves with Street Smart progress load after an upgrade with no data loss (v-old save fixture).
26. Tom signs the review list for each deck, and a second reader signs the guardrail list for Hard Reads and Power Plays, before release.

## Open questions for Tom
1. Adult-only default for Hard Reads and Power Plays, with a parent PIN to unlock for YA: OK?
2. Is a parent PIN wanted at all, or just a simple age gate?
3. Faith notes: Power Plays only, or also in Hard Reads conclusions?
4. Red Flags scoring: exact match only, or partial credit (would change Leitner)?
5. Legal: which "loopholes" are in bounds (lawful tax and consumer rules only is the proposal)?
