# Red Flags (deck safety): sources

v14 (Oct 19, 2026). 52 cue sets, all ages both (52 per age group), each built on a real, named case from a DOJ press release (U.S. Attorney offices or the Office of Public Affairs), pulled from the justice.gov press release API and saved to sources/street/<id>.txt (kept out of git). The red flag cues come from the case record. The fine cues are ordinary signs added for contrast and are labeled that way in the deck notice. Quotes are checked by tools/street-quotes.js; excerpts are in tests/fixtures/street-excerpts.json.

Flag counts: {"2":20,"3":24,"4":8}. Cue tells (lift over base rate, max 45%): {"firstWord":"8%","punct":"12%","length":"0%","keywords":"41%"}.

| id | Source | URL | Sets |
|---|---|---|---|
| doj-carmona | U.S. Attorney, S.D. Cal. (Oct. 20, 2023): Woman Pleads Guilty to Drug Trafficking and Obstruction of Justice in So-Called “Blind Mule” Case | https://www.justice.gov/usao-sdca/pr/woman-pleads-guilty-drug-trafficking-and-obstruction-justice-so-called-blind-mule-case | sf01 |
| ftc-reshipping | FTC: Job Scams | https://consumer.ftc.gov/articles/job-scams | sf01, sf43 |
| doj-fbcourier | U.S. Attorney, W.D. Wash. (June 23, 2025): Mexican National sentenced to prison for role as drug ring courier | https://www.justice.gov/usao-wdwa/pr/mexican-national-sentenced-prison-role-drug-ring-courier | sf02 |
| polaris-recruit | Polaris Project: Human Trafficking Myths, Facts and Statistics | https://polarisproject.org/myths-facts-and-statistics/ | sf02, sf04, sf42, sf52 |
| doj-sanchez-courier | U.S. Attorney, N.D. Okla. (May 12, 2026): Foreign National Drug Courier Sentenced for Conspiring with Cartel to Distribute Fentanyl in Oklahoma | https://www.justice.gov/usao-ndok/pr/foreign-national-drug-courier-sentenced-conspiring-cartel-distribute-fentanyl-oklahoma | sf03 |
| dhs-blue-signs | DHS Blue Campaign: Indicators of Human Trafficking | https://www.dhs.gov/blue-campaign/indicators-human-trafficking | sf03, sf39, sf40, sf41, sf44, sf45, sf46 |
| doj-teens | U.S. Attorney, S.D. Cal. (Aug. 31, 2021): Drug Trafficker who used Teens as Couriers Sentenced to 85 Months | https://www.justice.gov/usao-sdca/pr/drug-trafficker-who-used-teens-couriers-sentenced-85-months | sf04 |
| doj-carty | U.S. Attorney, W.D. Wash. (May 15, 2026): Jamaican national sentenced to prison for lottery scam that devastated southwest Washington retiree | https://www.justice.gov/usao-wdwa/pr/jamaican-national-sentenced-prison-lottery-scam-devastated-southwest-washington | sf05 |
| doj-dolisi | U.S. Attorney, E.D. Mo. (Mar. 25, 2026): Missouri Woman Admits Serving as Money Mule for $2 Million Lottery Scam | https://www.justice.gov/usao-edmo/pr/missouri-woman-admits-serving-money-mule-2-million-lottery-scam | sf06 |
| ftc-fake-check | FTC: How To Spot, Avoid, and Report Fake Check Scams | https://consumer.ftc.gov/articles/how-spot-avoid-and-report-fake-check-scams | sf06, sf22, sf27, sf28 |
| doj-chester | U.S. Attorney, E.D. Pa. (Aug. 10, 2026): Chester County Woman Who Served as Money Mule for Foreign Scammers Pleads Guilty to 13 Counts of Fraud | https://www.justice.gov/usao-edpa/pr/chester-county-woman-who-served-money-mule-foreign-scammers-pleads-guilty-13-counts | sf07 |
| doj-cupid | U.S. Attorney, N.D. Ohio: Cupid Doesn't Ask for Crypto (romance scam red flags) | https://www.justice.gov/usao-ndoh/pr/cupid-doesnt-ask-crypto-us-attorneys-office-warns-public-about-romance-scams-ahead | sf07, sf29, sf30, sf31, sf32, sf33, sf34, sf35 |
| doj-canada-mule | U.S. Attorney, W.D.N.Y. (Apr. 11, 2025): Canadian man sentenced for being a money mule in a scam targeting the elderly | https://www.justice.gov/usao-wdny/pr/canadian-man-sentenced-being-money-mule-scam-targeting-elderly | sf08 |
| doj-pla | U.S. Attorney, N.D. Ohio (July 27, 2021): Two Florida Men Sentenced for Running Grandparent Scam in Northern Ohio | https://www.justice.gov/usao-ndoh/pr/two-florida-men-sentenced-running-grandparent-scam-northern-ohio | sf09 |
| doj-ky-grand | U.S. Attorney, W.D. Ky. (June 13, 2025): Canadian Man is the Sixth and Final Defendant Sentenced in a Grandparent Scam that Targeted Kentucky Victims and Others | https://www.justice.gov/usao-wdky/pr/canadian-man-sixth-and-final-defendant-sentenced-grandparent-scam-targeted-kentucky | sf10 |
| doj-ri-grand | U.S. Attorney, D.R.I. (Nov. 4, 2024): Two Men Face Federal Charges in Grandparent Scams that Targeted Elderly Victims Across Multiple States | https://www.justice.gov/usao-ri/pr/two-men-face-federal-charges-grandparent-scams-targeted-elderly-victims-across-multiple | sf11 |
| doj-cirillo | U.S. Attorney, C.D. Cal. (Sept. 6, 2022): Former Stockbroker Sentenced to 6½ Years in Prison for $3.2 Million Investment Fraud, Cheating on Taxes and Grandparent Scam | https://www.justice.gov/usao-cdca/pr/former-stockbroker-sentenced-6-years-prison-32-million-investment-fraud-cheating-taxes | sf12 |
| doj-strothers | U.S. Attorney, E.D. Wash. (Sept. 4, 2024): Georgia Man Sentenced to Federal Prison for Impersonating a U.S. Marshal and Stealing $84,000 | https://www.justice.gov/usao-edwa/pr/georgia-man-sentenced-federal-prison-impersonating-us-marshal-and-stealing-84000 | sf13 |
| doj-brand-ice | U.S. Attorney, C.D. Cal. (May 25, 2023): SoCal Man Allegedly Impersonated Federal Agent and Used that Persona to Bilk Latino Immigrants Seeking Status to Remain in U.S. | https://www.justice.gov/usao-cdca/pr/socal-man-allegedly-impersonated-federal-agent-and-used-persona-bilk-latino-immigrants | sf14 |
| doj-morales | U.S. Attorney, W.D. Mich. (May 14, 2024): Milford Resident Charged In “Arrest Warrant” Scam After Co-Conspirator Unwittingly Texts Federal Agent | https://www.justice.gov/usao-wdmi/pr/2024_0514_Morales_K_Indictment | sf15 |
| doj-mohammed | U.S. Attorney, D.S.D. (Jan. 28, 2026): Indianapolis Man Sentenced to 5 Years in Federal Prison for Defrauding Elderly Victims | https://www.justice.gov/usao-sd/pr/indianapolis-man-sentenced-5-years-federal-prison-defrauding-elderly-victims | sf16 |
| doj-austin-amazon | U.S. Attorney, W.D. Tex. (Nov. 13, 2025): Indian National Sentenced in Austin for Role in Multi-Million Dollar Elder Fraud Scheme | https://www.justice.gov/usao-wdtx/pr/indian-national-sentenced-austin-role-multi-million-dollar-elder-fraud-scheme | sf17 |
| doj-gold-sdny | U.S. Attorney, S.D.N.Y. (July 31, 2025): Two Men Charged For Nationwide Fraud Scheme Targeting Hundreds Of Elderly Victims | https://www.justice.gov/usao-sdny/pr/two-men-charged-nationwide-fraud-scheme-targeting-hundreds-elderly-victims | sf18 |
| doj-gold-ri | U.S. Attorney, D.R.I. (Aug. 6, 2026): Two Individuals Sentenced for Their Roles in Transnational Fraud Scheme Targeting Elderly Victims | https://www.justice.gov/usao-ri/pr/two-individuals-sentenced-their-roles-transnational-fraud-scheme-targeting-elderly | sf19 |
| doj-tech-wdpa | U.S. Attorney, W.D. Pa. (May 12, 2022): Two Californians Indicted in Multi-Million Dollar Tech-Support Scam Targeting Elderly Victims | https://www.justice.gov/usao-wdpa/pr/two-californians-indicted-multi-million-dollar-tech-support-scam-targeting-elderly | sf20 |
| doj-refund | U.S. Attorney, S.D. Tex. (Sept. 30, 2021): Indian national pleads guilty to role in nationwide tech support refund scam | https://www.justice.gov/usao-sdtx/pr/indian-national-pleads-guilty-role-nationwide-tech-support-refund-scam | sf21 |
| doj-tech-az | U.S. Attorney, D. Ariz. (Dec. 30, 2024): Participants in “Tech Support” Scheme Charged with Conspiracy to Launder Fraudulent Proceeds | https://www.justice.gov/usao-az/pr/participants-tech-support-scheme-charged-conspiracy-launder-fraudulent-proceeds | sf22 |
| doj-tech-edmo | U.S. Attorney, E.D. Mo. (Oct. 7, 2024): Five Arrested, Accused of Targeting Elderly Victims in Tech Support Scam | https://www.justice.gov/usao-edmo/pr/five-arrested-accused-targeting-elderly-victims-tech-support-scam | sf23 |
| doj-mdfl-mule | U.S. Attorney, M.D. Fla. (Nov. 1, 2024): Money Mule Sentenced To Federal Prison For Laundering Proceeds From Senior Citizens Victimized In A Government-Imposter Fraud Scheme | https://www.justice.gov/usao-mdfl/pr/money-mule-sentenced-federal-prison-laundering-proceeds-senior-citizens-victimized | sf24 |
| doj-chen | U.S. Attorney, D. Md. (July 27, 2023): Owings Mills Man Sentenced to Three Years in Federal Prison for a Fraudulent Gift Card Scheme | https://www.justice.gov/usao-md/pr/owings-mills-man-sentenced-three-years-federal-prison-fraudulent-gift-card-scheme | sf25 |
| doj-target | U.S. Attorney, C.D. Cal. (Sept. 26, 2023): Los Angeles County Trio Found Guilty of Laundering Target Gift Cards Purchased by Victims of Transnational Fraud Rings | https://www.justice.gov/usao-cdca/pr/los-angeles-county-trio-found-guilty-laundering-target-gift-cards-purchased-victims | sf26 |
| doj-hedspeth | U.S. Attorney, E.D. Va. (Nov. 3, 2017): Woman Sentenced for $6 Million “Mystery Shopper” Fraud Scheme | https://www.justice.gov/usao-edva/pr/woman-sentenced-6-million-mystery-shopper-fraud-scheme | sf27 |
| doj-pgh-shopper | U.S. Attorney, W.D. Pa. (July 14, 2021): Pittsburgh Man Sentenced in Mystery Shopper Fraud Scheme | https://www.justice.gov/usao-wdpa/pr/pittsburgh-man-sentenced-mystery-shopper-fraud-scheme | sf28 |
| doj-onyobeno | U.S. Attorney, D.R.I. (Oct. 8, 2024): Leader of an International Romance Scam Conspiracy Sentenced to More Than Ten Years in Federal Prison | https://www.justice.gov/usao-ri/pr/leader-international-romance-scam-conspiracy-sentenced-more-ten-years-federal-prison | sf29 |
| doj-ghana8m | U.S. Attorney, N.D. Ohio (Dec. 11, 2025): Ghanaian National Charged with Running Romance Scams That Took Over $8 Million From Elderly Victims | https://www.justice.gov/usao-ndoh/pr/ghanaian-national-charged-running-romance-scams-took-over-8-million-elderly-victims | sf30 |
| doj-ndtx-romance | U.S. Attorney, N.D. Tex. (Mar. 19, 2024): Romance Scammer Sentenced to 10 Years in Federal Prison, Ordered to Pay $2.2M in Restitution | https://www.justice.gov/usao-ndtx/pr/romance-scammer-sentenced-10-years-federal-prison-ordered-pay-22m-restitution | sf31 |
| doj-stl-romance | U.S. Attorney, E.D. Mo. (Dec. 19, 2022): Texas Man Admits $1.2 Million Romance Scam Targeting St. Louis Woman | https://www.justice.gov/usao-edmo/pr/texas-man-admits-12-million-romance-scam-targeting-st-louis-woman | sf32 |
| doj-nj-romance | U.S. Attorney, D.N.J. (Apr. 14, 2023): Essex County Man Convicted of Conspiracy to Commit Wire Fraud and Wire Fraud in Connection with Romance Scam | https://www.justice.gov/usao-nj/pr/essex-county-man-convicted-conspiracy-commit-wire-fraud-and-wire-fraud-connection | sf33 |
| doj-pig-ndny | U.S. Attorney, N.D.N.Y. (Apr. 8, 2025): Secret Service Seizes Another Web Domain Used in Furtherance of a Cryptocurrency “Pig Butchering” Scheme | https://www.justice.gov/usao-ndny/pr/secret-service-seizes-another-web-domain-used-furtherance-cryptocurrency-pig | sf34 |
| doj-pig-wdmo | U.S. Attorney, W.D. Mo. (Sept. 25, 2026): Vietnamese National Charged for Role in Massive “Pig Butchering” Cryptocurrency Scam | https://www.justice.gov/usao-wdmo/pr/vietnamese-national-charged-role-massive-pig-butchering-cryptocurrency-scam | sf35 |
| doj-mcelhiney | U.S. Attorney, E.D. Wash. (June 26, 2024): Man Pleads Guilty to Operating a Cryptocurrency Investment Scheme and Defrauding Investors of More than $350,000 | https://www.justice.gov/usao-edwa/pr/man-pleads-guilty-operating-cryptocurrency-investment-scheme-and-defrauding-investors | sf36 |
| doj-felton | U.S. Attorney, N.D. Ga. (July 21, 2022): Atlanta film producer pleads guilty for $2.5 million cryptocurrency-based investment scams | https://www.justice.gov/usao-ndga/pr/atlanta-film-producer-pleads-guilty-25-million-cryptocurrency-based-investment-scams | sf37 |
| doj-babysit | U.S. Attorney, D.D.C. (Oct. 6, 2026): D.C. Woman Sentenced in Kidnapping and Violent Armed Robbery of Two Women Lured for a Fake ‘Babysitting’ Job | https://www.justice.gov/usao-dc/pr/dc-woman-sentenced-kidnapping-and-violent-armed-robbery-two-women-lured-fake-babysitting | sf38 |
| doj-lvh | DOJ Office of Public Affairs (Oct. 27, 2022): Three Defendants Sentenced in Multi-State Racketeering Conspiracy Involving Forced Labor of Mexican Agricultural H-2A Workers | https://www.justice.gov/archives/opa/pr/three-defendants-sentenced-multi-state-racketeering-conspiracy-involving-forced-labor-mexican | sf39 |
| doj-balcazar | U.S. Attorney, D.S.C. (June 15, 2023): Three Lexington County Defendants Sentenced in Federal Court for Labor Trafficking and Fraud in Foreign Labor Contracting | https://www.justice.gov/usao-sc/pr/three-lexington-county-defendants-sentenced-federal-court-labor-trafficking-and-fraud | sf40 |
| doj-ct-debt | U.S. Attorney, D. Conn. (Mar. 2, 2023): Mexican Nationals Charged with Offenses Stemming from Smuggling and Labor Trafficking Scheme | https://www.justice.gov/usao-ct/pr/mexican-nationals-charged-offenses-stemming-smuggling-and-labor-trafficking-scheme | sf41 |
| doj-diego | DOJ Office of Public Affairs (Apr. 27, 2018): Two Guatemalan Nationals Sentenced in Connection with Labor Trafficking Scheme and Forced Labor of Other Guatemalan Nationals | https://www.justice.gov/archives/opa/pr/two-guatemalan-nationals-sentenced-connection-labor-trafficking-scheme-and-forced-labor-other | sf42 |
| doj-saipan | U.S. Attorney, D. Guam and N. Mariana Is. (Mar. 9, 2018): Muksedur Rahman, Md. Rafiqul Islam and David Trung Quoc Phan Sentenced for Mail Fraud, Fraud in Foreign Labor Contracting, and Visa Fraud | https://www.justice.gov/usao-gu/pr/muksedur-rahman-md-rafiqul-islam-and-david-trung-quoc-phan-sentenced-mail-fraud-fraud | sf43 |
| doj-vasquez | U.S. Attorney, C.D. Cal. (Aug. 31, 2026): Santa Maria Labor Recruiter Sentenced to One Year in Prison for Lying to Government, Exploiting Farmworkers in Visa Fraud Scheme | https://www.justice.gov/usao-cdca/pr/santa-maria-labor-recruiter-sentenced-one-year-prison-lying-government-exploiting | sf44 |
| doj-catering | U.S. Attorney, E.D.N.Y. (Dec. 11, 2017): Former Owner and Manager of Long Island Catering Hall Indicted For Forced Labor and Visa Fraud | https://www.justice.gov/usao-edny/pr/former-owner-and-manager-long-island-catering-hall-indicted-forced-labor-and-visa-fraud | sf45 |
| doj-jumroon | U.S. Attorney, D. Or. (June 14, 2018): Oregon Woman Pleads Guilty for Role in Forced Labor and Visa Fraud Scheme Involving Thai Restaurant Workers | https://www.justice.gov/usao-or/pr/oregon-woman-pleads-guilty-role-forced-labor-and-visa-fraud-scheme-involving-thai | sf46 |
| doj-saunders | U.S. Attorney, D. Neb. (June 8, 2026): Utah Man Sentenced to 2 Years for Cyberstalking Charges | https://www.justice.gov/usao-ne/pr/utah-man-sentenced-2-years-cyberstalking-charges | sf47 |
| doj-wang | U.S. Attorney, D. Utah (Sept. 1, 2026): Utah County Woman Sentenced to Prison for Cyberstalking Two Victims She Met via Online Dating Platforms | https://www.justice.gov/usao-ut/pr/utah-county-woman-sentenced-prison-cyberstalking-two-victims-she-met-online-dating | sf48 |
| doj-dadig | U.S. Attorney, W.D. Pa. (Dec. 2, 2025): Whitehall Borough Resident Charged with Cyberstalking, Interstate Stalking and Threats | https://www.justice.gov/usao-wdpa/pr/whitehall-borough-resident-charged-cyberstalking-interstate-stalking-and-threats | sf49 |
| doj-waev | U.S. Attorney, D. Mass. (Aug. 13, 2026): Massachusetts Man Charged with Cyberstalking and Threats Offenses | https://www.justice.gov/usao-ma/pr/massachusetts-man-charged-cyberstalking-and-threats-offenses | sf50 |
| doj-lascruces | U.S. Attorney, D.N.M. (July 9, 2026): Las Cruces Woman Pleads Guilty to Cyberstalking Co-Workers | https://www.justice.gov/usao-nm/pr/las-cruces-woman-pleads-guilty-cyberstalking-co-workers | sf51 |
| doj-prince | DOJ Office of Public Affairs (Oct. 14, 2025): Chairman of Prince Group Indicted for Operating Cambodian Forced Labor Scam Compounds Engaged in Cryptocurrency Fraud Schemes | https://www.justice.gov/opa/pr/chairman-prince-group-indicted-operating-cambodian-forced-labor-scam-compounds-engaged | sf52 |

## Topics

- courier: 4
- scams: 17
- moneyMule: 4
- impostor: 5
- romance: 7
- newCity: 2
- labor: 8
- stalking: 5

## Cut or left out in v14

- Drink spiking: left out for now. Real cases are usually sexual assault cases, which this deck keeps out (RAINN page saved, not used).
- Sextortion: left out (sexual content and child victims).
- Cases with murder or suicide outcomes (two Kansas City cyberstalking cases, a South Carolina extortion case): left out as too dark for a teen-rated deck.
- Travel safety from State Dept pages: travel.state.gov blocked the fetch, so no set is built on it. The new-city sets use DOJ cases instead (the D.C. babysitting lure and the Prince Group scam compounds).
- FBI pages blocked the fetch. Not needed: every set uses a justice.gov release.
- General warnings (the Money Mule Initiative release and the Cupid romance warning) are not used as cases. Cupid is used only as an also source.
- Draft red flags removed because the release did not say them: a crying voice and keep-it-secret in the Kentucky grandparent case, pay-to-withdraw in the NDNY pig butchering case, minors-get-off-easy in the teen courier case, a nameless job ad in the Facebook courier case, high pay and passport taken in the Prince Group case.

## Fixed while checking names

- Names checked against each release: Kari Morales, Emily Zawacki, Viraj Patel, Sharon Dolisi, Robert Cirillo, Ijeoma Okoro, Jorge Vasquez, Ryan Felton, Jonas Saunders (a former classmate, not an ex), Brett Dadig.
- Victoria Carmona: her job story was a planned cover story, and she pleaded guilty. The set says so.
