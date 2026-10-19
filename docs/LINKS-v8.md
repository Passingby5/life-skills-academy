# Source link check, v8 (Oct 19, 2026, about 4:20 PM PT)

Every source URL used by a card (167 URLs) was fetched from the build box with curl, following redirects.

- 108 answered 200 from the box. Redirects that still land on the same topic are listed below.
- 59 were refused by the box network (403 from CDC, FSIS, FoodSafety.gov, CPSC, SSA, FCC, ESFI; 404 for every consumer.ftc.gov page, which is a block, not a dead page). These were checked with a separate fetcher: FTC (lost cards, credit repair, debt collection, cosigning, get out of debt, fake checks, gift cards, phishing), CPSC CO center, FCC spoofing, SSA scams, ESFI downed lines and the FDA grapefruit page all load. CDC, FSIS and FoodSafety.gov pages were checked the same way in v7. CDC rabies (when to seek care) returned a server error to the fetcher on the second try today; it loaded earlier today and its quote is saved in tools/quotes-new.json.

Dead links QA named, and what replaced them:

- Hesperian WTND: now the 2025 chapter PDFs, https://hesperian.org/wp-content/uploads/pdf/en_wtnd_2025/en_wtnd_2025_06.pdf (and _07, _10, _13). All quotes found in those PDFs.
- TB MED 530: https://armypubs.army.mil/epubs/DR_pubs/DR_a/pdf/web/ARN15052_TB_MED_530_FINAL.pdf (byte-for-byte the same PDF the quotes came from).
- NCHFP canners: https://nchfp.uga.edu/how/can/general-information/recommended-canners/ (all 16 quotes found on the live page).
- UNH pressure canner: https://extension.unh.edu/resource/canning-vegetables-pressure-canner (all 7 quotes found).
- CHEMM START and SALT: https://chemm.hhs.gov/incident-primer/triage/start-triage and .../salt-triage (all 12 quotes found). The new START breathing-rate card uses REMM (HHS) https://remm.hhs.gov/startalgotext.htm.
- Virginia DWR: cut with the Virginia trapping cards.

Redirects (old URL -> where it lands):

- https://extension.umn.edu/planting-and-growing-guides/planting-vegetable-garden -> https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/planting-the-vegetable-garden
- https://www.nhs.uk/conditions/fainting/ -> https://www.nhs.uk/symptoms/fainting/
- https://www.nhs.uk/conditions/fever-in-children/ -> https://www.nhs.uk/symptoms/fever-in-children/
- https://www.nhs.uk/conditions/heart-attack/symptoms/ -> https://www.nhs.uk/conditions/heart-attack/
- https://www.nhs.uk/conditions/asthma/asthma-attack/ -> https://www.nhs.uk/conditions/asthma/
- https://www.nhs.uk/conditions/first-aid/cpr/ -> https://www.sja.org.uk/first-aid-advice/cpr/
- https://www.fda.gov/drugs/information-drug-class/acetaminophen -> https://www.fda.gov/drugs/safe-use-over-counter-pain-relievers-and-fever-reducers/acetaminophen
- https://www.consumerfinance.gov/ask-cfpb/how-long-does-negative-information-remain-on-my-credit-report-en-323/ -> https://www.consumerfinance.gov/ask-cfpb/how-long-does-information-stay-on-my-credit-report-en-323/
- https://www.fda.gov/drugs/special-features/dont-be-tempted-use-expired-medicines -> https://www.fda.gov/drugs/safe-disposal-medicines/dont-be-tempted-use-expired-medicines?topics=121&searchtext=cold
- https://www.uspis.gov/news/scam-article/smishing -> https://www.uspis.gov/news/scam-article/smishing-package-tracking-text-scams
