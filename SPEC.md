# Life Skills Academy: Know It (Spec v0.2, Oct 19, 2026)

Spec only. Nothing is built or pushed yet.

## Goal
A phone-first family game that fixes the life skill mistakes most people make when they answer fast. Each card is a real everyday moment where the gut answer is wrong. You pick, say how sure you are, then see why.

## What the research says (all citations checked on Crossref, Oct 19, 2026)
1. Testing yourself beats rereading. Practice tests and spaced practice are the two top rated study methods. (Dunlosky, Rawson, Marsh, Nathan, Willingham, 2013, "Improving Students' Learning With Effective Learning Techniques," Psychological Science in the Public Interest. https://doi.org/10.1177/1529100612453266)
2. Recall now means better memory later, even more than extra study time. (Roediger and Karpicke, 2006, "Test-Enhanced Learning," Psychological Science. https://doi.org/10.1111/j.1467-9280.2006.01693.x) A meta-analysis backs this up across many settings. (Adesope, Trevisan, Sundararajan, 2017, "Rethinking the Use of Tests: A Meta-Analysis of Practice Testing," Review of Educational Research. https://doi.org/10.3102/0034654316689306)
3. Spread reviews out over days. (Cepeda, Pashler, Vul, Wixted, Rohrer, 2006, "Distributed practice in verbal recall tasks: A review and quantitative synthesis," Psychological Bulletin. https://doi.org/10.1037/0033-2909.132.3.354)
4. Mix topics instead of doing one block at a time. (Rohrer and Taylor, 2007, "The shuffling of mathematics problems improves learning," Instructional Science. https://doi.org/10.1007/s11251-007-9015-8)
5. Multiple choice can teach the wrong answer by accident. Feedback right after fixes this. (Butler and Roediger, 2008, "Feedback enhances the positive effects and reduces the negative effects of multiple-choice testing," Memory and Cognition. https://doi.org/10.3758/MC.36.3.604)
6. Errors made with high confidence get fixed best once corrected (hypercorrection). (Butterfield and Metcalfe, 2001, "Errors committed with high confidence are hypercorrected," JEP: Learning, Memory, and Cognition. https://doi.org/10.1037/0278-7393.27.6.1491) Making and fixing errors helps learning. (Metcalfe, 2017, "Learning from Errors," Annual Review of Psychology. https://doi.org/10.1146/annurev-psych-010416-044022)
7. To fix a myth, name it, say plainly it is wrong, and give the right idea with a reason. (Tippett, 2010, "Refutation Text in Science Education: A Review of Two Decades of Research," Int. J. of Science and Math Education. https://doi.org/10.1007/s10763-010-9203-x; Kendeou, Walsh, Smith, O'Brien, 2014, "Knowledge Revision Processes in Refutation Texts," Discourse Processes. https://doi.org/10.1080/0163853X.2014.913961) Repeating a myth without the fix can make it stick, so the fix must be clear and must give a reason. (Lewandowsky, Ecker, Seifert, Schwarz, Cook, 2012, "Misinformation and Its Correction," Psychological Science in the Public Interest. https://doi.org/10.1177/1529100612451018)
Note: our "real life scenario" format is a design choice that fits these findings. I did not find one strong review that proves scenarios beat plain questions, so the spec does not claim that.

## Round format: Gut Check
1. Scenario (1 to 2 short lines): "Your kid burns a hand on the stove. First thing?"
2. Pick one of 3 big answer buttons. One is the common myth, one is right, one is a decoy.
3. Tap how sure you are: "Guess", "Pretty sure", "Sure".
4. Fix screen, refutation style: "Many people think: put butter on it. That is wrong. Do this: cool it under running water for 20 minutes. Why: butter holds heat in." Plus source name and link. A big "Wow" badge shows when you were "Sure" but wrong.
5. Round = 10 cards, mixed topics from all decks you have on, about 2 minutes.
Bonus game: Myth Match. Match each myth tile to its fix tile. Uses cards you have already seen. Kept for fun and family play, since it is not a recall test.
Family mode: pass the phone, each player has their own profile and progress.

## Spaced repetition: Leitner, tuned (changed from v0.1)
Still 5 boxes with gaps of 0, 1, 3, 7, 14 days. Changes, based on the research above:
- Right and "Sure" or "Pretty sure": move up one box.
- Right but "Guess": stay in the same box (a lucky guess is not learned yet).
- Wrong: back to box 1, and the card comes back once more later in the same round (fast fix while it sticks).
- Wrong and "Sure": also flagged "Wow" and shown in a recap at round end.
- Rounds draw due cards first, mixed across topics, never two cards in a row from the same topic when there is a choice.
Leitner stays over SM-2 because kids can see it and it is easy to test.

## Age groups
Player picks "Young adults (15 to 30)" or "Adults (30+)" on their profile and can change it later.
Choice: one deck per topic with a shared core plus tagged age cards, not separate decks. Why: most safety facts (burns, grease fires, raw chicken) are the same at any age, so one card, one source, one fix. Only the scenario wording and some topics change. A card can carry two scenario lines (ya and adult) over the same answer and source.
Card count rule: each deck has at least 50 cards that each age group will see (about 30 shared core + at least 20 for that group). So a deck has at least 70 cards total.
Young adult themes: first job, first apartment, credit cards, driving, roommates, online scams. Adult themes: kids, aging parents, home, retirement, taxes.

## Card data shape
id, deck, topic, ages ("both" | "ya" | "adult"), scenario {ya, adult}, choices [3], answer, myth (the wrong belief), fix (right answer), why (one line), sourceId. Decks list their sources. Data lives in src/content/decks/ only.

## Starter decks with example topics (source pages checked Oct 19, 2026)
### 1. First Aid Myths
- Burn: myth "butter or cream on it." Fix: cool running water 20 min, no butter. https://www.nhs.uk/conditions/burns-and-scalds/
- Nosebleed: myth "tilt head back." Fix: lean forward, pinch soft part. https://www.nhs.uk/conditions/nosebleed/
- Swallowed poison: myth "make them throw up." Fix: do not, get help. https://www.nhs.uk/conditions/poisoning/
- Seizure: myth "put something in their mouth" or "hold them down." Fix: neither; turn on side, time it. https://www.cdc.gov/epilepsy/first-aid-for-seizures/index.html
- Tick: myth "burn it or smother it with nail polish." Fix: tweezers, steady pull. https://www.cdc.gov/ticks/after-a-tick-bite/index.html
- Snake bite: myth "suck out the venom." Fix: do not suck or cut, get help. https://www.nhs.uk/conditions/snake-bites/
- Frostbite: myth "rub it to warm it." Fix: do not rub. https://www.nhs.uk/conditions/frostbite/
- Sprain: myth "heat pack right away." Fix: avoid heat early. https://www.nhs.uk/conditions/sprains-and-strains/
- Head bump (adult: your kid; ya: a friend at a party): myth "alcohol or sleeping pills are fine after." Fix: avoid them. https://www.nhs.uk/conditions/head-injury-and-concussion/
### 2. Kitchen and Food Safety Myths
- Raw chicken: myth "rinse it first." Fix: no need, it splashes germs. https://www.cdc.gov/food-safety/foods/chicken.html
- Grease fire: myth "throw water on it." Fix: lid or baking sheet, burner off. https://www.usfa.fema.gov/prevention/home-fires/prevent-fires/cooking/
- Thawing: myth "on the counter is fine." Fix: fridge, cold water, or microwave. https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/big-thaw-safe-defrosting-methods
- Burger color: myth "brown inside means done." Fix: use a thermometer, 160 F. https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/color-meat-and-poultry
- Hot leftovers: myth "let them cool on the counter first." Fix: hot food can go right in the fridge, split into shallow containers. https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/leftovers-and-food-safety
- Moldy bread: myth "cut off the moldy part." Fix: toss it (hard cheese is the exception). https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/molds-food-are-they-dangerous
- Pork chop: myth "pork must be cooked to 160 F or more." Fix: 145 F plus 3 min rest. https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures
- Leftovers in fridge: myth "good for a week." Fix: 3 to 4 days. (USDA leftovers page above)
- Eggs: myth "eggs are fine on the counter." Fix: keep them in the fridge (US). https://www.fda.gov/food/buy-store-serve-safe-food/what-you-need-know-about-egg-safety
### 3. Money Myths
- Minimum payment (ya): myth "paying the minimum keeps me fine." Fix: it can take years and lots of interest. https://www.consumerfinance.gov/ask-cfpb/a-box-on-my-credit-card-bill-says-that-i-will-pay-off-the-balance-in-three-years-if-i-pay-a-certain-amount-what-does-that-mean-do-i-have-to-pay-that-much-if-i-pay-that-much-and-make-new-purchases-will-i-still-owe-nothing-after-three-years-en-36/
- Checking your credit: myth "checking my own report hurts my score." Fix: it does not. https://www.consumerfinance.gov/ask-cfpb/does-requesting-my-credit-report-hurt-my-credit-score-en-1229/
- Raise (both): myth "a raise into a higher bracket taxes all my pay more." Fix: only the part in the new bracket. https://www.irs.gov/filing/federal-income-tax-rates-and-brackets
- Lost debit card (ya): myth "debit and credit cards have the same fraud protection." Fix: debit loss can grow if you report late. https://consumer.ftc.gov/articles/lost-or-stolen-credit-atm-and-debit-cards
- Social Security (adult): myth "claim at 62, it is about the same." Fix: up to 30% less for life if born 1960 or later. https://www.ssa.gov/benefits/retirement/planner/agereduction.html
- Free credit report: myth "you have to pay for it." Fix: free at AnnualCreditReport.com. https://www.consumerfinance.gov/ask-cfpb/how-do-i-get-a-free-copy-of-my-credit-reports-en-5/
- Rate shopping (adult, car or home loan): myth "every lender check hurts my score." Fix: checks for the same loan type within a short window count as one. https://www.consumerfinance.gov/ask-cfpb/what-kind-of-credit-inquiry-has-no-effect-on-my-credit-score-en-321/
- Emergency water (adult): myth "a few bottles is enough." Fix: 1 gallon per person per day for several days. https://www.ready.gov/kit
### 4. Scam Defense Myths
- Gift card pay: myth "a real agency might take gift cards." Fix: only scammers ask. https://consumer.ftc.gov/articles/avoiding-and-reporting-gift-card-scams
- Overpay check (ya selling online): myth "the check cleared, so it is good." Fix: fakes can take weeks to bounce. https://consumer.ftc.gov/articles/how-spot-avoid-and-report-fake-check-scams
- IRS call: myth "the IRS calls to demand pay now." Fix: it mails first and never asks for gift cards. https://www.irs.gov/newsroom/how-to-know-its-really-the-irs-calling-or-knocking-on-your-door
- Family emergency call (adult: aging parent or grandchild): myth "it sounds just like them, so it is real." Fix: voice cloning exists; hang up and call them back. (FTC gift card page above)
- Account alert text: myth "click the link to fix it." Fix: go to the real site or number yourself. https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams
- Job offer (ya): myth "a new boss sending a check to buy supplies is normal." Fix: classic fake check scam. (FTC fake check page above)
- "Card security dept" call: myth "you need loss protection insurance." Fix: federal law already limits your loss. (FTC lost card page above)
- Prize win: myth "paying a small fee to claim it is normal." Fix: real prizes do not charge you. (FTC fake check page above)

## Code layout (same as v0.1)
src/engine (rng, deck, srs, save), src/modes (gutcheck, mythmatch), src/content/decks (data), src/ui (DOM only). Other sections reuse engine and add modes.

## Reuse, deploy, repo (same as v0.1)
Reuse legacy sw.js, version.json check, build label, save versioning, tests (load, sim, Playwright), and poker pwa_check. Repo Passingby5/life-skills-academy, live https://passingby5.github.io/life-skills-academy/. Normal push only, never force-push.

## Acceptance checklist
1. Home shows a version label like "v2 - Oct 19 - abc1234" that matches version.json.
2. After a new push, an open app picks up the new version on next launch or return to foreground with no manual cache clear, and saves first.
3. With network off, the app loads from cache and plays a full round.
4. At 390x844 portrait, nothing overflows and nothing needs side scroll (Playwright).
5. At 844x390 landscape, same as item 4; scenario and answers fit with no scroll.
6. Every button and tile is at least 48x48 CSS px (Playwright measures).
7. No feature needs hover; all actions work by tap only.
8. Two taps within 300 ms on the same control count as one (unit and Playwright tests).
9. Profile screen lets a player pick Young adults or Adults, and the pick can be changed and is saved.
10. A Young adult profile never gets an "adult" only card, and an Adult profile never gets a "ya" only card (sim over 1,000 seeded rounds).
11. For cards with two scenario lines, the line shown matches the player's age group.
12. Deck checker: every deck has at least 50 cards visible to each age group; build fails if not.
13. Deck checker: every card has id, deck, topic, ages, scenario, 3 choices, answer, myth, fix, why, and a sourceId that exists in its deck; ids are unique; build fails if not.
14. A round is 10 cards; each card shows scenario, then 3 answers, then 3 confidence buttons, then the fix screen.
15. Answer order is shuffled by the seeded RNG; the right answer lands in each position about one third of the time over 3,000 seeded cards (within 5 points).
16. Fix screen shows, in order: the myth, "That is wrong", the fix, the why, and a tappable source link.
17. A "Wow" badge shows only when the answer was wrong and confidence was "Sure".
18. Leitner rules pass unit tests: right with "Sure" or "Pretty sure" moves up one box (max 5); right with "Guess" stays; wrong goes to box 1; gaps are 0/1/3/7/14 days.
19. A card missed in a round comes back once more later in the same round (unit test).
20. Round end shows a recap listing every "Wow" card from that round.
21. Due cards are drawn first; when two or more topics are due, no two cards in a row share a topic (sim test).
22. Myth Match: only uses cards the player has seen; a right pair clears, a wrong pair flips back, the round ends when all clear.
23. Family mode: two profiles on one phone keep separate boxes and age groups (unit test).
24. Close and reopen mid-round: round, profile, and box progress all come back.
25. Saves carry a version number; a v1 test save loads and upgrades with no data loss; a broken save does not crash and offers a fresh start.
26. Same seed gives the same card order, answer order, and match layout (unit test).
27. Engine files (rng, deck, srs, save) have no DOM use and run in Node.
28. A stub deck in another format (step list) loads through deck.js with no engine changes.
29. Headless sim: 1,000 seeded players over 60 fake days run with no errors; a perfect "Sure" player gets every card to box 5.
30. Playwright phone click-through (profile, Gut Check round, fix screen, recap, Myth Match, About, back) ends with zero console errors or warnings.
31. About page lists every card source and every research citation above, each with a working link.
32. Each starter deck's cards are checked by Tom against the source before release (checkbox in a review list file).
33. A text scan of decks and UI finds no em-dash characters.
34. Deploy is a normal git push to main; no force-push in history; the live URL shows the new version label.
