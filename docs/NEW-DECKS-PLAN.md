# New Decks Plan: Tactical Field Care, Field Survival, Country Living

Research and plan only. No code was changed. Written Oct 19, 2026 (PDT). Updated 1:55 PM PDT with gap sources and checked section numbers.

## Ready to write?
| Sub-deck | Status |
|---|---|
| 1A Bleeding and field care | **Ready** |
| 1B Triage | **Ready** |
| 1C Foodborne illness and inspection | **Ready** |
| 1D Medicines, safe use | **Ready** (CDC, FDA, MedlinePlus now saved) |
| 2A Navigation and gear | **Ready** |
| 2B Water, food, traps, knots | **Ready** |
| 3A Canning and garden | **Ready** (the garden cards still need a writer to pick lines from umn-garden) |
| 3B Animals, water, home health | **Ready** (goat Extension sources added) |
Not reached: Navy Preventive Medicine chapters on med.navy.mil (403 from both tools). Facility-inspection cards use TB MED 530 Ch. 8 instead.
Source copies are saved in `sources-new/` (PDFs, HTML, `.txt` text pulled from each PDF, and `webfetch-copies.md` for pages that only load through WebFetch).

## Ground rules for writers
- Card format is the same as `src/content/decks/firstaid.js`: `id`, `ages` ('both' | 'ya' | 'adult'), `topic`, `s: {ya, adult}` scenario, `c: [myth, right, decoy]`, myth, fix, why, `sourceId`.
- Sizing: each deck needs 50+ cards for each age group. Plan for every deck: about 40 shared + 15 young adult + 15 adult = 70 cards, so each group sees 55.
- Every fix must match a line in a saved source. Cite the page or paragraph in a code comment (for example `// ATP 3-50.21 para A-8`).
- Plain short words. No em-dashes. Family-friendly.
- Medical: first-aid recognition and safe steps only. Add "call for help (911)" where it applies. **No drug doses.** Medicine cards teach what a drug class is for, the danger signs, and "follow the label or a doctor". Do not copy the dose tables from the WTND Green Pages or NAVEDTRA.
- Tactical sources talk about weapons and combat. Leave all of that out. Rewrite each scene as a hike, farm, car crash, storm, or church-camp setting.
- Copyright: do not copy text or images from Emery or Alton. Use them only as a topic checklist. Every fact comes from the free sources below, written in our own words.
- Steps that must be done in order (dressing a wound, triage order, putting on a tourniquet, the STOP plan, canning steps, water boiling steps) are tagged **[DO-IT-IN-ORDER]** as future content for the Do It in Order section. Know It cards can test one key point from those steps.

## Verified sources (all loaded Oct 19, 2026)
| sourceId | Title | URL | Saved copy | Image reuse |
|---|---|---|---|---|
| navedtra-14295 | Hospital Corpsman, NAVEDTRA 14295 (Aug 2000, admin update 2003), 574 pp | https://navytribe.com/wp-content/uploads/2015/11/navedtra-14295.pdf | navedtra14295.pdf/.txt | Marked "Distribution Statement A: approved for public release". US Navy work, so public domain. Figures OK to reuse with credit. Mirror site, not navy.mil. |
| tccc-2024 | TCCC Guidelines, 25 Jan 2024 (CoTCCC, J Spec Oper Med) | https://jsomonline.org/wp-content/uploads/2024/11/20241100Deaton.pdf | tccc-2024.pdf/.txt | Text only (10 pp). Written by DoD authors in a journal. Cite it, do not copy images. Official index: https://jts.health.mil/index.cfm/committees/cotccc/guidelines (found by search, not fetched). |
| tbmed-530 | Tri-Service Food Code, TB MED 530 / NAVMED P-5010-1 (Mar 2019), 454 pp | https://armypubs.army.mil/epubs/DR_pubs/DR_a/pdf/web/ARN15052_TB_MED_530_FINAL.pdf | tbmed530.pdf/.txt | US government, public domain. Replaces old P-5010 Ch. 1. Has inspection items and frequencies (Ch. 8). |
| chemm-salt | CHEMM: SALT Mass Casualty Triage (HHS) | https://chemm.hhs.gov/incident-primer/triage/salt-triage | chemm-salt.html | HHS work, public domain. The flowchart is OK to adapt. |
| chemm-start | CHEMM: START Adult Triage (HHS) | https://chemm.hhs.gov/incident-primer/triage/start-triage | chemm-start.html | Same. |
| atp-3-50-21 | ATP 3-50.21 Survival (Sept 2018), 228 pp | https://armypubs.army.mil/epubs/DR_pubs/DR_a/pdf/web/ARN12086_ATP%203-50x21%20FINAL%20WEB%202.pdf | atp3-50-21.pdf/.txt | "Approved for public release; distribution unlimited." Public domain. Knot figures A-5 to A-15, snare figures 4-7 to 4-20, shadow-tip figure 7-8. |
| fm-21-76 | FM 21-76 Survival (1992), 233 pp | https://archive.org/download/Fm21-76SurvivalManual/FM21-76_SurvivalManual.pdf | fm21-76.pdf/.txt | Public domain. Older and replaced by ATP 3-50.21. Use it to back up ATP, not as the only source. |
| nps-10 | NPS: Ten Essentials | https://www.nps.gov/articles/10essentials.htm | nps-10.html | NPS text is public domain. Check credit on each photo. |
| va-dwr-snare | Virginia DWR: Furbearer trapping rules | https://dwr.virginia.gov/hunting/regulations/furbearertrapping/ | va-dwr-trapping.html | State page. Text cited only. One example of snare laws. |
| cdc-water | CDC: How to Make Water Safe in an Emergency | https://www.cdc.gov/water-emergency/about/ | webfetch-copies.md (curl got 403; WebFetch worked) | CDC, public domain. |
| cdc-botulism | CDC: Home-Canned Foods (botulism) | https://www.cdc.gov/botulism/prevention/home-canned-foods.html | webfetch-copies.md | Public domain. |
| cdc-poultry | CDC: Backyard Poultry | https://www.cdc.gov/healthy-pets/about/backyard-poultry.html | webfetch-copies.md | Public domain (stock photos are not; Getty). |
| fsgov-temps | FoodSafety.gov: Safe Minimum Internal Temperatures | https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures | webfetch-copies.md | Public domain. |
| nchfp-home | NCHFP (Univ. of Georgia): Home canning | https://nchfp.uga.edu/how/can_home.html | nchfp.html | University site. Cite text, do not copy images. |
| nchfp-intro | NCHFP/USDA Complete Guide Intro "Principles of Home Canning" | https://nchfp.uga.edu/papers/guide/INTRO_HomeCanrev0715.pdf | nchfp-intro.pdf/.txt | USDA guide, public domain. |
| nchfp-canners | NCHFP: Boiling Water and Pressure Canners | https://nchfp.uga.edu/how/can/general-information/recommended-canners/ | nchfp-canners.html | Cite only. |
| unh-pressure | UNH Extension: Canning Vegetables in a Pressure Canner | https://extension.unh.edu/resource/canning-vegetables-pressure-canner | unh-pressure.html | Cite only. |
| umn-garden | U of Minnesota Extension: Planting the vegetable garden | https://extension.umn.edu/planting-and-growing-guides/planting-vegetable-garden | usda-garden-ext.html | Cite only. |
| wtnd-2025 | Hesperian: Where There Is No Doctor (2025), chapter PDFs | https://languages.hesperian.org/pages/en/pdf.html (index); chapters at https://hesperian.org/wp-content/uploads/pdf/en_wtnd_2025/en_wtnd_2025_NN.pdf | wtnd/ (toc, ch 10, 11, 12, 13, Green Pages) + wtnd-frontmatter.pdf | See license note below. |
| hesperian-license | Hesperian Open Copyright Policy | https://hesperian.org/open-copyright-policy/ | hesperian-copyright.html | - |
| cdc-antibiotics | CDC: Antibiotic Do's and Don'ts | https://www.cdc.gov/antibiotic-use/about/index.html | webfetch-copies.md | Public domain. |
| fda-disposal | FDA: Disposal of Unused Medicines | https://www.fda.gov/drugs/safe-disposal-medicines/disposal-unused-medicines-what-you-should-know | webfetch-copies.md | Public domain. |
| fda-apap | FDA: Acetaminophen | https://www.fda.gov/drugs/information-drug-class/acetaminophen | fda-apap.html | Public domain. |
| medline-anaph | MedlinePlus: Anaphylaxis | https://medlineplus.gov/ency/article/000844.htm | webfetch-copies.md | Text public; the A.D.A.M. images are licensed, so do not use them. |
| cdc-foodsafety | CDC: Preventing Food Poisoning | https://www.cdc.gov/food-safety/prevention/index.html | webfetch-copies.md | Public domain. |
| cdc-noro | CDC: How to Prevent Norovirus | https://www.cdc.gov/norovirus/prevention/index.html | webfetch-copies.md | Public domain. |
| usgs-decl | USGS FAQ: What is declination? | https://www.usgs.gov/faqs/what-declination | usgs-declination.html | Public domain. |
| usgs-mapcompass | USGS Fact Sheet 035-01: Finding Your Way with Map and Compass | https://pubs.usgs.gov/fs/2001/0035/report.pdf | usgs-mapcompass.pdf/.txt | Public domain. Has a declination diagram figure. |
| wisc-goats | UW Extension 4-H: Guide to Raising Healthy Goats (A3858-05) | https://4h.extension.wisc.edu/files/2026/02/Guide-to-Raising-Healthy-Goats.pdf | wisc-goats.pdf/.txt | University. Cite only. |
| ucanr-goats | UC ANR: Basic Meat Goat Facts | https://www.ucanr.edu/sites/default/files/2020-12/341671.pdf | ucanr-goats.pdf/.txt | University. Cite only. |
| stopbleed | Stop the Bleed home page | https://www.stopthebleed.org/ | stopbleed.html | Loaded, but only the home page. Do not use for facts until a content page is fetched. |

### Hesperian license, read carefully
The WTND front matter allows copying and adapting "including the illustrations" for **non-commercial** use with credit. But it also says to contact permissions@hesperian.org before using any part "in any digital format". The Open Copyright Policy page says the same thing for digital materials ("contact Hesperian for written permission"). A PWA is digital. So: **do not put any Hesperian images or quoted text in the app** unless Tom gets written permission (Tom would need to email permissions@hesperian.org). We can still cite WTND facts in our own words with a link. Also note that WTND is a developing-world book, and some of its advice is different from current US guidance. Example: WTND ch 10 says a tourniquet "usually results in total loss of the arm or leg", but TCCC 2024 says to use a recommended tourniquet right away for bleeding that could kill. Go with the current US source and say why.

### Sources that did NOT load, or that we cannot use
- **TC 3-25.26 / FM 3-25.26 Map Reading and Land Navigation**: the armypubs PDF URL gave an error page, and the archive.org copy gave 503. The 2013 TC is also marked "Distribution authorized to U.S. government agencies and their contractors only". **Do not use it.** For navigation, use ATP 3-50.21 Ch. 7 (public release) and FM 21-76.
- **NAVEDTRA 14295B (2010)**: has copyrighted parts and is "only available for distribution through DoD restricted websites". Do not use. The 2000 edition above is public release. The archive.org copy gave 503.
- **Manual of Naval Preventive Medicine (P-5010) on med.navy.mil**: all of it gave 403, including Ch. 2 (Sanitation of Living Spaces, public release), Ch. 6 (Water Quality Afloat), Ch. 9 (Ground Forces), and the Navy copy of the Food Code. I tried both curl and WebFetch. The Army copy of the Food Code (TB MED 530) loaded and is the same code. Tom could open the Ch. 2 and Ch. 9 PDFs in a normal browser and drop them in `sources-new/` if he wants them.
- FDA acetaminophen and the USGS north-arrows FAQ timed out in WebFetch. The FDA page loaded with curl. The north-arrows FAQ was skipped; the USGS fact sheet covers the same thing.
- MSU Extension goat winter page returned a stub through curl. Not used.
- **deployedmedicine.com**: needs login since Dec 2023. Use the JSOM TCCC PDF.
- CHEMM old URLs `startadult.htm` and `salttriage.htm` now give an "under construction" shell. Use the /incident-primer/ URLs.
- fs.usda.gov hiking-safety and ten-essentials pages gave 404. `stacks.cdc.gov` SALT PDF gave 403. `em.umaryland.edu` SALT PDF timed out. Several en.hesperian.org wiki pages and hesperian permissions URLs gave 404 (use the URLs above). The Penn State chickens page gave 404 (CDC poultry is used instead). The CDC old URLs for home canning and emergency water gave 404 (new URLs above work).
- Earlier gaps are now filled (see the new rows in the table). Still optional: NOAA lightning safety, cattle and pig Extension pages. Any card on those needs its page fetched first.

---

## Deck 1: Tactical Field Care (4 sub-decks, about 280 cards)
Based on the Navy Corpsman and TCCC material, written for civilians. Leave out all combat or weapon parts (TCCC steps such as "take away weapons" are not used).

### 1A. Bleeding, Dressings, and Field Care (id `tfc-field`, 70 cards)
Sub-topics: direct pressure and when to use a tourniquet, hemostatic gauze and packing, pressure dressings, chest wounds, shock, preventing hypothermia in injured people, burns, eye injuries, splints, moving the injured, heat injury.
Sources: tccc-2024, navedtra-14295 (Ch. 4), atp-3-50-21 (Ch. 2), wtnd-2025 ch 10 (cite only).
Example cards:
1. Tourniquet as last resort. Myth: "a tourniquet always costs the limb, so wait." Fix: for bleeding from an arm or leg that could kill, use a recommended tourniquet right away and call 911. (tccc-2024, Massive Hemorrhage 3a)
2. Tourniquet place. Myth: "right on the wound." Fix: 2 to 3 inches above the wound, or "high and tight" if you cannot find the wound. (tccc-2024)
3. One tourniquet failed. Myth: "tighten it until it breaks." Fix: add a second one side by side with the first. (tccc-2024)
4. Hemostatic gauze. Myth: "pack it and let go." Fix: hold firm pressure at least 3 minutes. (tccc-2024)
5. Chest wound that bubbles. Myth: "leave it open so it can breathe." Fix: cover it right away with a vented chest seal and watch the breathing. (tccc-2024 sec 4b; atp-3-50-21 para on sucking chest wounds)
6. Hurt person on a summer night. Myth: "it is warm out, cold is not a risk." Fix: keep them off cold ground and swap wet clothes for dry. Hypothermia makes bleeding injuries worse. (tccc-2024 sec 7)
7. Heating pad for a hurt person. Myth: "put it right on the skin." Fix: never put a heat source right on the skin, because it can burn. (tccc-2024 7d)
8. Heat stroke. Myth: "cool them slowly so they don't go into shock." Fix: cool fast with cold water and wet towels, and call 911. It is life or death. (navedtra-14295 p. 4-60)
9. Heat stroke drink. Myth: "give hot tea or coffee." Fix: no hot drinks or stimulants. Give cool water only if they are awake. (navedtra-14295 p. 4-60)
10. Object stuck in the eye. Myth: "pull it out fast." Fix: do not pull it out. Cover the eye with a rigid eye shield, "NOT a pressure patch", and get help. (tccc-2024 sec 9, checked. Leave out the antibiotic tablet line in that section, because it is a dose.)
[DO-IT-IN-ORDER]: applying a tourniquet, packing a wound, a pressure dressing, the TCCC field care sequence.

### 1B. Mass Casualty Triage (id `tfc-triage`, 70 cards)
Sub-topics: what triage is, SALT (sort, assess, lifesaving help, treat and transport), START (walk, breathe, pulse, follow commands), tag colors, re-checking, Navy priority classes, scene safety first.
Sources: chemm-salt, chemm-start, navedtra-14295 (Ch. 4 Triage).
Example cards:
1. Who to check first. Myth: "the loudest screamer." Fix: in SALT, the still people and anyone with a clear threat to life come first. Walkers come last. (chemm-salt)
2. People who can walk. Myth: "treat them first because it is fast." Fix: send them to a safe spot and check them last. (chemm-salt)
3. How long per person. Myth: "do a full exam." Fix: less than one minute each, focused on fixing threats to life. (chemm-salt)
4. Green tag. Myth: "green means fine, send home." Fix: minor injuries that can wait. They may even help with their own care. (chemm-start)
5. Gray tag. Myth: "gray means dead." Fix: gray (SALT) means "expectant", not expected to live with the care on hand. Black means dead. (chemm-salt)
6. START age. Myth: "START is for everyone." Fix: START is for people who look older than 8. SALT covers all ages. (chemm-start, chemm-salt)
7. Triage once. Myth: "a tag is final." Fix: triage keeps going. A person's priority can go up or down. (navedtra-14295 p. 4-2)
8. Arriving at the scene. Myth: "run to the first victim." Fix: make sure the scene is safe for you first, then for the victims. (navedtra-14295 p. 4-2)
9. Child not breathing in SALT. Myth: "same as an adult." Fix: open the airway. For a child, think about 2 rescue breaths. (chemm-salt)
10. Radial pulse check. Myth: "need a cuff and a watch." Fix: START uses whether you can feel a wrist pulse, or capillary refill under 2 seconds. (chemm-start)
[DO-IT-IN-ORDER]: SALT steps, START steps.

### 1C. Foodborne Illness and Facility Inspection (id `tfc-food`, 70 cards)
Sub-topics: the danger zone, cold holding at 41 F or below and hot holding at 135 F or above, cooling, cooking temperatures, bare hands and ready-to-eat food, sick food workers, botulism, what an inspection checks, water safety for camps.
Sources: tbmed-530, fsgov-temps, cdc-botulism, cdc-water, navedtra-14295 (preventive medicine chapter, still to be checked).
Example cards:
1. Cooling a big pot of chili. Myth: "leave it on the stove overnight to cool." Fix: food must cool from 135 F to 70 F within 2 hours. (tbmed-530 §3-501.14(A)(1), checked. Full rule: 135 F to 70 F in 2 hours, then to 41 F within 4 more.)
2. Cold food on arrival. Myth: "cool to the touch is fine." Fix: cold food must be 41 F or below when it arrives. (tbmed-530 §3-202.11(A), checked)
3. Hot holding. Myth: "warm is enough." Fix: 135 F or above. (tbmed-530 §3-501.16(A)(1), checked. The code also holds cold food at 41 F or below, §3-501.16(A)(2).)
4. Chicken. Myth: "clear juices mean done." Fix: use a thermometer and cook to 165 F. (fsgov-temps)
5. Pork chop. Myth: "pork must be cooked to well done." Fix: 145 F plus a 3 minute rest. (fsgov-temps)
6. Making sandwiches at camp. Myth: "clean bare hands are fine." Fix: no bare hands on ready-to-eat food. Use deli tissue, tongs, spatulas, or single-use gloves. (tbmed-530 §3-301.11(B), checked)
7. Bulging can. Myth: "taste a bit to check." Fix: never taste. You cannot see, smell, or taste botulinum toxin. Throw it out. (cdc-botulism)
8. Fuel-spilled water. Myth: "boil it and it is safe." Fix: boiling does not remove fuel or chemicals. Use another source. (cdc-water)
9. Inspection focus. Myth: "inspectors mostly look at clean floors." Fix: outbreaks come from five main risk factors: wrong holding temperatures, not cooking enough, dirty equipment, food from unsafe sources, and poor personal hygiene. (tbmed-530 Introduction, the five risk factors list, checked. How often places get inspected depends on their risk rating, §8-401.10(A).)
10. Sick cook. Myth: "fine to cook if the vomiting stopped this morning." Fix: a worker with vomiting or diarrhea is kept off the job (§2-201.12(A)). Under this military code, they come back only with a medical note (§2-201.13(A)(1)). For norovirus at home, CDC says wait at least 48 hours after symptoms stop (cdc-noro). (Checked. The earlier "24 hours" line was wrong. In this code, 24 hours is only one part of the norovirus rule.)
11. Hand sanitizer after a stomach bug. Myth: "sanitizer kills it." Fix: sanitizer does not work well on norovirus. Wash with soap and water. (cdc-noro)
12. Two danger zones. Home advice (cdc-foodsafety) says 40 to 140 F; the food code (tbmed-530 §3-501.16) uses 41 to 135 F. Cards must name which one they use.

### 1D. Basic Hospital and Field Medicines, safe use (id `tfc-meds`, 70 cards)
Recognition and safety only. No doses.
Sub-topics: what medicine classes are for (pain and fever, antibiotics, antihistamines, rehydration salts), reading labels, expired medicine, allergic reactions, why antibiotics do not treat colds, oral rehydration, storing medicines.
Sources: wtnd-2025 Green Pages and ch 13 (cite facts only), cdc-antibiotics, fda-apap, fda-disposal, medline-anaph.
Example cards:
1. Diarrhea. Myth: "stop drinking so it slows down." Fix: keep drinking. A rehydration drink is best. (wtnd-2025 ch 13)
2. Antibiotics for a cold with green mucus. Myth: "green means it needs antibiotics." Fix: antibiotics do not work on viruses, even when mucus is thick, yellow, or green. (cdc-antibiotics)
3. Feeling better on day 3. Myth: "save the rest for next time." Fix: take them exactly as prescribed. Do not save them or share them. (cdc-antibiotics)
4. Two cold medicines. Myth: "both are over the counter, so both are safe." Fix: do not use more than one acetaminophen product at a time. Too much can cause liver failure. (fda-apap)
5. Pain still there. Myth: "take a bit extra." Fix: never take more than the label says, even if the pain or fever is still there. (fda-apap)
6. Alcohol plus acetaminophen. Fix: 3 or more drinks a day while using it can cause severe liver damage. Adult-tagged. (fda-apap)
7. Old pills. Myth: "flush them all." Fix: use a take-back site first. Flush only medicines on the FDA Flush List. (fda-disposal)
8. Trash disposal. Myth: "just toss the bottle." Fix: mix with dirt, cat litter, or coffee grounds, seal in a bag, and scratch out the label. (fda-disposal)
9. Hives and a swollen face after a pill. Myth: "wait and see." Fix: call 911. Use their epinephrine injector if they have one. Nothing by mouth if they have trouble breathing. (medline-anaph)
10. Bee stinger. Myth: "pull it out with tweezers." Fix: scrape it off, because squeezing releases more venom. (medline-anaph)
Rule: no card names a dose amount. The tablet amount in TCCC §9 is left out on purpose.

---

## Deck 2: Field Survival (id `survival`, 2 sub-decks, about 140 cards)

### 2A. Navigation and Hiking Gear (id `surv-nav`, 70 cards)
Sub-topics: the Ten Essentials, telling someone your plan, map and compass basics, declination, the shadow-tip method, what to do when lost (STOP: Stop, Think, Observe, Plan, from FM 21-76's SURVIVAL list), what not to bring (cotton for wet cold trips, untested gear), and patrol packing as hike packing.
Sources: nps-10, atp-3-50-21 Ch. 7 and 8, fm-21-76.
Example cards:
1. Phone GPS only. Myth: "my phone is enough." Fix: bring a paper map as backup and an extra battery. (nps-10)
2. Light. Myth: "phone flashlight is fine." Fix: a headlamp is best because it leaves your hands free. Bring spare batteries. (nps-10)
3. Extra food. Myth: "pack exactly what you will eat." Fix: pack an extra day of food. (nps-10)
4. Thirst. Myth: "drink when thirsty." Fix: drink often, before you feel thirsty. (nps-10)
5. Clothes color. Myth: "earth tones blend in nicely." Fix: bright clothing helps rescuers see you. (nps-10)
6. Trip plan. Myth: "only needed for long trips." Fix: always tell someone where you are going and when you will be back. (nps-10)
7. Compass and map disagree. Myth: "the compass points to true north." Fix: it points to magnetic north. The difference is declination, which changes by place and over time. The map collar shows it for the year the map was made, so check NOAA's calculator for today. (atp-3-50-21 para 7-70; usgs-decl)
11. Contour lines. Myth: "lines close together mean flat ground." Fix: close lines mean steep ground. (usgs-mapcompass)
8. Shadow-tip method. Myth: "the first mark is east." Fix: the first shadow mark is always west. (atp-3-50-21 para 7-22)
9. Shadow-tip limits. Myth: "works anywhere." Fix: it does not work beyond 66.5 degrees latitude. (atp-3-50-21 para 7-22)
10. Lost. Myth: "keep walking fast to find the trail." Fix: stop and size up the situation first (S in SURVIVAL). (fm-21-76 Ch. 1 "Size Up the Situation")
[DO-IT-IN-ORDER]: orienting a map, shadow-tip method, STOP plan.

### 2B. Water, Food, Traps, and Knots (id `surv-camp`, 70 cards)
Sub-topics: water (do not ration it, do not eat snow, never drink salt water, treat all water), wild plants (positive ID or the edibility test, avoid all mushrooms), traps and snares for food in a true emergency only, legal limits, knots (square, granny and thief danger, bowline, clove hitch, overhand fixed loop).
Sources: atp-3-50-21 (Ch. 3, 4, App. A), fm-21-76, cdc-water, va-dwr-snare.
Example cards:
1. Low on water in heat. Myth: "ration it in sips." Fix: do not ration. Drink it and cut activity in the heat of the day. (fm-21-76 p. on desert water; .txt line 5054)
2. Eat snow. Myth: "snow is fine as water." Fix: melt and treat it first. Eating it burns heat and calories. (atp-3-50-21 Ch. 3)
3. Salt water. Myth: "a little is OK." Fix: do not drink any. (atp-3-50-21 Ch. 3)
4. Wild mushrooms. Myth: "the edibility test works for them." Fix: avoid all mushrooms. (atp-3-50-21 para on edibility test)
5. Square knot vs granny. Myth: "any two overhands work." Fix: if the ends do not lie next to their own standing part, it is a granny and it slips. (atp-3-50-21 para A-8)
6. Thief knot. Myth: "looks the same, holds the same." Fix: it slips under strain. (atp-3-50-21 para A-9)
7. Fixed loop. Myth: "slip knot for a loop." Fix: the bowline makes a loop at the end and is easy to untie. (atp-3-50-21 para A-13)
8. Rescue loop. Myth: "bowline is the one to know for rescue." Fix: ATP says the overhand fixed loop is the one to learn by heart for a rescue device. (atp-3-50-21 App. A list)
9. Snares are legal anywhere. Myth: "it is just survival skill." Fix: snares need a season, a license, and rules such as loop size. Use them only in a real emergency. (va-dwr-snare)
10. Water filter. Myth: "a filter makes water fully safe." Fix: filters do not remove viruses. Add a disinfectant after filtering. (cdc-water)
Trap content rule: teach that traps exist and what the law says. Snare building steps go to a future, adult-only Do It in Order card with a legal warning. Use the ATP figures only to show a snare from the outside. No details aimed at people or pets.
[DO-IT-IN-ORDER]: tying each knot, water boiling steps.

---

## Deck 3: Country Living (id `country`, 2 sub-decks, about 140 cards)
Topic list modeled on Emery, Alton, and WTND, but every fact comes from free sources.

### 3A. Food Preserving and Kitchen Garden (id `cl-food`, 70 cards)
Sub-topics: pressure vs water-bath canning, altitude changes, checking gauges, storing jars, signs of spoilage, garlic oil, garden planting basics.
Sources: cdc-botulism, nchfp-intro, nchfp-canners, nchfp-home, unh-pressure, umn-garden, fsgov-temps.
Example cards:
1. Green beans in a water bath. Myth: "boil long enough and it is safe." Fix: low-acid foods need a pressure canner. (cdc-botulism; unh-pressure)
2. Grandma's recipe. Myth: "family recipes are proven." Fix: use only recipes that follow the USDA guide. (cdc-botulism)
3. Multi-cooker "canning" button. Myth: "built for it." Fix: CDC says do not use it for canning. (cdc-botulism)
4. Altitude. Myth: "sea-level times are fine." Fix: adjust time or pressure for altitude. (nchfp-intro)
5. Gauge. Myth: "new gauges stay accurate." Fix: have it checked. Many county extension offices will do it. (cdc-botulism)
6. Storing jars. Myth: "a warm attic is fine." Fix: keep them cool and dark, never above 95 F. (cdc-botulism)
7. Before eating home-canned beans. Myth: "eat from the jar." Fix: boil 10 minutes, plus 1 minute for each 1,000 feet above 1,000 feet. (cdc-botulism)
8. Garlic in oil. Myth: "oil keeps it safe at room temp." Fix: refrigerate and throw out after 4 days. (cdc-botulism)
9. Venison. Myth: "same as beef steak, 145 F." Fix: 160 F. (fsgov-temps)
10. Garden timing: no card until a writer picks and checks a line in umn-garden. Put in a placeholder only.
[DO-IT-IN-ORDER]: pressure canning steps.

### 3B. Animals, Water, and Home Health (id `cl-home`, 70 cards)
Sub-topics: backyard chickens and eggs, quarantine for new animals, well and emergency water, home health from WTND (shock signs, diarrhea, wound care), when to go to a doctor.
Sources: cdc-poultry, cdc-water, wtnd-2025 (cite only), navedtra-14295. Goats: wisc-goats, ucanr-goats.
Example cards:
1. Dirty fresh eggs. Myth: "wash them in cold water." Fix: do not wash warm, fresh eggs. Cold water can pull germs in. Clean them dry. (cdc-poultry)
2. Cracked egg. Myth: "fine if cooked." Fix: throw it out. (cdc-poultry)
3. Chicks for a 4-year-old. Myth: "a sweet Easter gift." Fix: no poultry handling under age 5. (cdc-poultry)
4. New hens. Myth: "add them to the flock right away." Fix: keep them apart at least 30 days. (cdc-poultry)
5. Disinfecting a coop. Myth: "spray bleach on the mess." Fix: clean first, because disinfectant does not work on dirty surfaces. (cdc-poultry)
6. Healthy-looking birds. Myth: "clean birds carry no germs." Fix: healthy-looking birds can still spread Salmonella. (cdc-poultry)
7. Iodine tablets forever. Myth: "fine long term." Fix: not for more than a few weeks, and not in pregnancy or with thyroid problems. (cdc-water)
8. Cloudy water and bleach. Myth: "same amount." Fix: double the amount for cloudy, colored, or very cold water. (cdc-water)
9. Radiator water in a storm. Myth: "it is clean tap water." Fix: never drink it. (cdc-water)
10. Bleeding wound at home. Myth: "peek every minute." Fix: press firmly for 20 minutes before checking. (wtnd-2025 ch 10; write in our own words)
11. New goats. Myth: "add them to the herd now." Fix: keep new animals apart for about a month. (ucanr-goats "Isolate animals for a month")
12. Goats on lush clover or alfalfa pasture. Myth: "richer grass is always better." Fix: lush legume pasture can cause bloat. Dry hay can lower the risk. (wisc-goats Nutrition)
13. Goat housing. Myth: "they need a closed, heated barn." Fix: a simple three-sided shed facing away from winter wind is enough if it is not drafty. (wisc-goats Housing)

---

## Image plan
| Cards | Image | Source and license |
|---|---|---|
| Knots (square, granny, thief, bowline, clove hitch, overhand loop) | Yes, a must | Use ATP 3-50.21 App. A figures (public domain) as reference, but **draw simple original SVGs**. They look cleaner on phones and match the app's style. Credit "after ATP 3-50.21" in a comment. |
| Tourniquet place, pressure dressing, chest seal | Yes | Original SVG line drawings. NAVEDTRA 14295 figures (Ch. 4, pressure points) are public domain and could be used as is with credit, but they are old scans. SVG is better. No Hesperian art without permission. |
| Triage tags and SALT/START flow | Yes | Original SVG color tags (red, yellow, green, gray, black). The CHEMM flowcharts are HHS public domain and could be adapted. |
| Navigation: shadow-tip, declination diagram, map orienting | Yes | Original SVG based on ATP 3-50.21 fig 7-8 (public domain). |
| Ten Essentials | Optional | Original icons. NPS photos may have their own credits, so do not use them. |
| Canning (pressure vs water-bath canner), bulging can signs | Optional | Original SVG. CDC/Getty images are not public domain. |
| Snares | No pictures in Know It | Text only for legal and safety reasons. |
| Medicine cards | No | Text only. |
Rule: public-domain US government figures are allowed with credit, but the default is simple original SVGs. No images from Emery, Alton, or Hesperian (Hesperian only with written permission for digital use).

## Totals
About 560 cards across 8 sub-decks, each 70 cards (40 shared, 15 young adult, 15 adult). All 8 sub-decks are now sourced. Every section number cited above was checked against tbmed530.txt. None are guesses.
