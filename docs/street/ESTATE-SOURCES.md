# Estate Planning (deck estate): sources

v16 (Oct 20, 2026). 54 cards: 51 for both ages and 3 adult only (family partnership and estate tax cards), so 51 for ya and 54 for adult. Every card is built on a real, named case: a California or federal court opinion (CourtListener, or Justia for Clark v. Rameker) or a jury verdict reported by AP (Aretha Franklin will, Prince estate), cited with the statute (California Probate and Family Codes from leginfo, U.S. Code from Cornell LII). Each page was loaded in Chrome and its text saved to sources/street/<id>.txt (kept out of git). Quotes are checked by tools/street-quotes.js; excerpts are in tests/fixtures/street-excerpts.json.

Cut for lack of a saved source (CourtListener rate limits and Justia bot blocks): Rice v. Clark (2002), Estate of Stoker (Gularte v. Pradia, 2011), Estate of Berger (2023), Carne v. Worthington (2016), Lintz v. Lintz (2014), Donkin v. Donkin (2013), Haggerty v. Thornton (2024), Estate of Duke (2015). Merritt v. Dito (2011) was saved but not used.

| id | Source | URL | Cards |
|---|---|---|---|
| egelhoff | Egelhoff v. Egelhoff (2001) 532 U.S. 141 | https://www.courtlistener.com/opinion/118416/egelhoff-v-egelhoff-ex-rel-breiner/ | es01, es52 |
| usc-29-1144 | 29 U.S.C. 1144: ERISA pre-emption of state laws | https://www.law.cornell.edu/uscode/text/29/1144 | es01 |
| kennedy | Kennedy v. Plan Administrator for DuPont Savings and Investment Plan (2009) 555 U.S. 285 | https://www.courtlistener.com/opinion/145914/kennedy-v-plan-administrator-for-dupont-savings-investment-plan/ | es02, es03, es54 |
| hillman | Hillman v. Maretta (2013) 569 U.S. 483 | https://www.courtlistener.com/opinion/873660/hillman-v-maretta/ | es04, es05, es53 |
| usc-5-8705 | 5 U.S.C. 8705: Federal employee life insurance, order of precedence | https://www.law.cornell.edu/uscode/text/5/8705 | es04, es05 |
| sveen | Sveen v. Melin (2018) 584 U.S. 811 | https://www.courtlistener.com/opinion/4505999/sveen-v-melin/ | es06, es07, es41, es45 |
| prob-5040 | California Probate Code 5040: Transfers to a former spouse fail | https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PROB&sectionNum=5040 | es07 |
| clark | Clark v. Rameker (2014) 573 U.S. 122 | https://supreme.justia.com/cases/federal/us/573/122/ | es08, es09 |
| usc-11-522 | 11 U.S.C. 522: Bankruptcy exemptions | https://www.law.cornell.edu/uscode/text/11/522 | es08 |
| ap-aretha | AP (July 11, 2023): Document found in Aretha Franklin's couch is valid will, jury says | https://apnews.com/article/aretha-franklin-will-dispute-d7aba286b05ea0d0e6318ce6abc887d5 | es10, es11, es12, es44 |
| prob-6111 | California Probate Code 6111: Handwritten (holographic) wills | https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PROB&sectionNum=6111 | es11, es46 |
| hall | Hall v. Kalfayan (2010) 190 Cal.App.4th 927 | https://www.courtlistener.com/opinion/5809883/hall-v-kalfayan/ | es13, es14 |
| prob-6110 | California Probate Code 6110: Signing and witnessing a will | https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PROB&sectionNum=6110 | es14 |
| moore | Moore v. Anderson Zeigler Disharoon Gallagher & Gray (2003) 109 Cal.App.4th 1287 | https://www.courtlistener.com/opinion/2268651/moore-v-anderson-zeigler-disharoon-gallagher-gray-pc/ | es15 |
| ap-prince | AP (Jan. 15, 2022): Final valuation of Prince's estate pegged at $156.4 million | https://apnews.com/article/entertainment-business-minnesota-personal-taxes-internal-revenue-service-e46d73374aea6bac533cb9225fa02451 | es16, es17, es18, es43 |
| prob-6402 | California Probate Code 6402: Who inherits without a will | https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PROB&sectionNum=6402 | es16, es18 |
| heggstad | Estate of Heggstad (1993) 16 Cal.App.4th 943 | https://www.courtlistener.com/opinion/2253427/heggstad-v-heggstad/ | es19, es20 |
| prob-21610 | California Probate Code 21610: Omitted spouse | https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PROB&sectionNum=21610 | es19 |
| prob-850 | California Probate Code 850: Petition to confirm property | https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PROB&sectionNum=850 | es20, es21 |
| ukkestad | Ukkestad v. RBS Asset Finance, Inc. (2015) 235 Cal.App.4th 156 | https://www.courtlistener.com/opinion/2786377/ukkestad-v-rbs-asset-finance-inc/ | es21, es22 |
| barefoot | Barefoot v. Jennings (2020) 8 Cal.5th 822 | https://www.courtlistener.com/opinion/4714805/barefoot-v-jennings/ | es23, es24, es42 |
| prob-21380 | California Probate Code 21380: Presumed fraud or undue influence | https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PROB&sectionNum=21380 | es24, es25, es26 |
| bernard | Bernard v. Foley (2006) 39 Cal.4th 794 | https://www.courtlistener.com/opinion/2600573/bernard-v-foley/ | es25, es26 |
| lowrie | Estate of Lowrie (2004) 118 Cal.App.4th 220 | https://www.courtlistener.com/opinion/2251837/in-re-estate-of-lowrie/ | es27, es28, es29 |
| prob-259 | California Probate Code 259: Abusers treated as predeceased | https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PROB&sectionNum=259 | es28 |
| powell | Estate of Powell v. Commissioner (2017) 148 T.C. No. 18 | https://www.courtlistener.com/opinion/4563430/estate-of-powell-v-commr/ | es30, es31, es32, es35 |
| prob-4264 | California Probate Code 4264: Powers an agent needs in writing | https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PROB&sectionNum=4264 | es30, es31 |
| prob-4232 | California Probate Code 4232: Agent's duty of loyalty | https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PROB&sectionNum=4232 | es32 |
| strangi | Strangi v. Commissioner (5th Cir. 2005) 417 F.3d 468 | https://www.courtlistener.com/opinion/791260/albert-strangi-deceased-rosalie-gulig-independent-v-commissioner-of/ | es33, es34 |
| usc-26-2036 | 26 U.S.C. 2036: Transfers with retained life estate | https://www.law.cornell.edu/uscode/text/26/2036 | es33, es34, es35 |
| valli | In re Marriage of Valli (2014) 58 Cal.4th 1396 | https://www.courtlistener.com/opinion/2674462/marr-of-valli/ | es36, es37, es38 |
| fam-852 | California Family Code 852: Transmutation must be in writing | https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=FAM&sectionNum=852 | es36, es37 |
| prob-100 | California Probate Code 100: Community property at death | https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PROB&sectionNum=100 | es38 |
| riddle | Riddle v. Harmon (1980) 102 Cal.App.3d 524 | https://www.courtlistener.com/opinion/2109417/riddle-v-harmon/ | es39, es40 |
| prob-6122 | California Probate Code 6122: Divorce revokes will gifts to the ex | https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PROB&sectionNum=6122 | es41 |
| prob-15401 | California Probate Code 15401: Revoking a trust | https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PROB&sectionNum=15401 | es42 |
| prob-13100 | California Probate Code 13100: Small estate affidavit | https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PROB&sectionNum=13100 | es43 |
| prob-6124 | California Probate Code 6124: Lost will presumed revoked | https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PROB&sectionNum=6124 | es44 |
| black | Estate of Black (1982) 30 Cal.3d 880 | https://www.courtlistener.com/opinion/1222943/estate-of-black/ | es46, es47 |
| southworth | Estate of Southworth (1996) 51 Cal.App.4th 564 | https://www.courtlistener.com/opinion/2257204/estate-of-southworth/ | es48, es49 |
| andersen | Andersen v. Hunt (2011) 196 Cal.App.4th 722 | https://www.courtlistener.com/opinion/5810338/andersen-v-hunt/ | es50, es51 |
