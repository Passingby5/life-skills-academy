#!/usr/bin/env python3
"""v23 engineer-deck repairs. Every content edit is keyed by card id and
verified against the current text (and, for key restorations, the v22 key).
Do not patch by array position or with unscoped string replace."""
from __future__ import annotations
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FE = ROOT / "src/content/decks/eng_fecivil.js"
CB = ROOT / "src/content/decks/eng_cbet.js"
V21_FE = Path("/tmp/v21_fe.js")
V21_CB = Path("/tmp/v21_cb.js")
CARD_RE = re.compile(r'\{ id: "((?:fe|cb)\d+)",.*? \},', re.S)

def js_str(s):
    return json.dumps(s, ensure_ascii=False)

def parse_string_field(body, key):
    m = re.search(rf'{key}: ("(?:\\.|[^"\\])*")', body)
    return json.loads(m.group(1)) if m else None

def parse_card(body, cid):
    c = json.loads(re.search(r"c: (\[[^\]]+\])", body).group(1))
    card = {
        "id": cid,
        "body": body,
        "topic": re.search(r'topic: "([^"]+)"', body).group(1),
        "ages": re.search(r"ages: '([^']+)'", body).group(1),
        "s": parse_string_field(body, "s"),
        "c": c,
        "f": parse_string_field(body, "f"),
        "src": re.search(r'src: "([^"]+)"', body).group(1),
    }
    img = re.search(r'img: "([^"]+)"', body)
    if img:
        card["img"] = img.group(1)
    alt = parse_string_field(body, "imgAlt")
    if alt is not None:
        card["imgAlt"] = alt
    if "imgAsk: true" in body:
        card["imgAsk"] = True
    also = re.search(r"also: (\[[^\]]+\])", body)
    if also:
        card["also"] = json.loads(also.group(1))
    kt = parse_string_field(body, "keyTerm")
    if kt is not None:
        card["keyTerm"] = kt
    return card

def load_file(path):
    text = path.read_text()
    start = text.index("cards: [")
    header = text[: start + len("cards: [")]
    cards = [parse_card(m.group(0), m.group(1)) for m in CARD_RE.finditer(text)]
    last = list(CARD_RE.finditer(text))[-1]
    footer = text[last.end():]
    return header, cards, footer

def emit_card(card):
    bits = [
        f'id: "{card["id"]}"',
        f"ages: '{card['ages']}'",
        f'topic: "{card["topic"]}"',
        f's: {js_str(card["s"])}',
        "c: [" + ", ".join(js_str(x) for x in card["c"]) + "]",
        f'f: {js_str(card["f"])}',
    ]
    if card.get("keyTerm"):
        bits.append(f'keyTerm: {js_str(card["keyTerm"])}')
    bits.append(f'src: "{card["src"]}"')
    if card.get("also"):
        bits.append("also: " + json.dumps(card["also"]))
    if card.get("img"):
        bits.append(f'img: "{card["img"]}"')
    if card.get("imgAlt") is not None:
        bits.append(f'imgAlt: {js_str(card["imgAlt"])}')
    if card.get("imgAsk"):
        bits.append("imgAsk: true")
    return "    { " + ", ".join(bits) + " },"

def write_deck(path, header, cards, footer, sources):
    header = re.sub(r"practice deck \(v2[12]\)", "practice deck (v23)", header)
    m = re.search(r"\n  sources: \{.*?\n  \},", header, re.S)
    if not m:
        raise SystemExit("sources block not found")
    lines = ["\n  sources: {"]
    for k, (name, url) in sources.items():
        lines.append(f'    {js_str(k)}: [{js_str(name)}, {js_str(url)}],')
    lines.append("  },")
    header = header[:m.start()] + "\n".join(lines) + header[m.end():]
    body = "\n".join(emit_card(c) for c in cards)
    path.write_text(header + "\n" + body + footer)

LOG = []  # (id, field, action)

def setf(card, field, old, new, why):
    if field == "c":
        cur = card["c"]
    elif field in ("c0", "c1", "c2", "c3"):
        cur = card["c"][int(field[1])]
    else:
        cur = card[field]
    if cur == new:
        return
    if cur != old:
        raise SystemExit(f"{card['id']} {field}: expected current {old!r}, got {cur!r}")
    if field == "c":
        card["c"] = list(new)
    elif field in ("c0", "c1", "c2", "c3"):
        card["c"][int(field[1])] = new
    else:
        card[field] = new
    LOG.append((card["id"], field, why))

# --- named, verified edits ---
MANUAL = []  # list of callables filled below

def add(cid, **fields):
    """fields: name -> (old, new) or for topic/src just handled in apply."""
    MANUAL.append((cid, fields))

# B1
add("fe065",
    c=(["Mid-height of the section, including unsymmetric shapes", "The centroid of the area", "The mid-depth of the flange only", "The plastic neutral axis of a steel beam only"],
       ["The neutral axis of the section", "The farthest fiber from the neutral axis", "The mid-depth of the flange only", "The plastic neutral axis of every steel beam"]))
add("fe125",
    c=(["Sterilize pipes with high heat in the distribution system after a main break", "Disinfect to inactivate remaining pathogens", "Remove settleable grit in a deep tank", "Raise the pH above 12"],
       ["Sterilize pipes with high heat after a main break", "Destabilize colloids so they can flocculate and be removed", "Remove settleable grit in a deep grit chamber", "Raise the pH above 12 as a standalone process"]))
add("cb074",
    c=(["A misplaced ECG electrode on the chest wall, a different signal", "A problem in that pressure channel, cable, or transducer", "A failed pulse-oximeter probe on the same module", "A blocked suction canister on the wall outlet"],
       ["A worn drive motor, while the lid switch still reads closed", "A lid switch, latch, or interlock fault", "A speed-program typo that still shows a closed lid", "A failed brake that would still allow a start with a closed lid"]))

# M2 raw TeX
add("fe006", f=("The sample mean is 4. Squared deviations are $4+0+4=8\\(. Then \\)s=\\sqrt{8/2}=\\sqrt{4}=2$.",
                r"The sample mean is 4. Squared deviations are \(4+0+4=8\). Then \(s=\sqrt{8/2}=\sqrt{4}=2\)."))
add("fe007", f=("The upper tail is $1-\\Phi(1.00)=1-0.8413=0.1587$.",
                r"The upper tail is \(1-\Phi(1.00)=1-0.8413=0.1587\)."))
add("fe009", s=("What is the distance from $(0,0)\\( to \\)(5,12)$?",
                r"What is the distance from \((0,0)\) to \((5,12)\)?"))
add("fe113",
    s=(r"A pump moves \(0.050\,\mathrm{m}^{3}/\mathrm{s}\) of water against 20 m of head. If the pump efficiency is 80%, what input power is required? Use gamma=\(9.81\,\mathrm{kN}/\mathrm{m}^{3}\).",
       r"A pump moves \(0.050\,\mathrm{m}^{3}/\mathrm{s}\) of water against 20 m of head. If the pump efficiency is 80%, what input power is required? Use \(\gamma=9.81\,\mathrm{kN}/\mathrm{m}^{3}\)."),
    f=(r"Water power is \(\gamma QH=9.81(0.050)(20)=9.81\) kW. Shaft (input) power is $9.81/0.80=12.26$ kW, about 12.3 kW.",
       r"Water power is \(\gamma QH=9.81(0.050)(20)=9.81\) kW. Shaft (input) power is \(9.81/0.80=12.26\) kW, about 12.3 kW."))
add("fe129",
    c2=("Four times as large in this situation", "Four times as large"),
    f=(r"Because \(P_{cr}\) varies as $1/L^{2}\(, doubling L divides \)P_{cr}$ by 4. End conditions change the effective length, but here they stay pinned-pinned.",
       r"Because \(P_{cr}\) varies as \(1/L^{2}\), doubling L divides \(P_{cr}\) by 4. End conditions change the effective length, but here they stay pinned-pinned."))
add("fe132",
    c1=("Statically determinate", "Statically determinate, if the truss is stable"),
    f=(r"The test is \(m+r=2j\). Here $9+3=12\( and \)2j=12$, so the truss is statically determinate if it is properly arranged (stable).",
       r"The test is \(m+r=2j\). Here \(9+3=12\) and \(2j=12\), so the truss is statically determinate if it is properly arranged (stable)."))
add("fe152",
    s=(r"A 4.0 m layer of saturated clay has a unit weight of \(18\,\mathrm{kN}/\mathrm{m}^{3}\). The water table is at the surface. What is the effective vertical stress at the bottom of the layer? Use gamma_w=\(9.81\,\mathrm{kN}/\mathrm{m}^{3}\).",
       r"A 4.0 m layer of saturated clay has a unit weight of \(18\,\mathrm{kN}/\mathrm{m}^{3}\). The water table is at the surface. What is the effective vertical stress at the bottom of the layer? Use \(\gamma_w=9.81\,\mathrm{kN}/\mathrm{m}^{3}\)."),
    f=(r"Total stress is \(\gamma z=18(4)=72\) kPa. Pore pressure is \(9.81(4)=39.24\) kPa. Effective stress is $72-39.24=32.76$ kPa, about 32.8 kPa.",
       r"Total stress is \(\gamma z=18(4)=72\) kPa. Pore pressure is \(9.81(4)=39.24\) kPa. Effective stress is \(72-39.24=32.76\) kPa, about 32.8 kPa."))
add("fe183", f=("Lane plus shoulder is $12+6=18$ ft on that side. The opposite direction is counted separately.",
                r"Lane plus shoulder is \(12+6=18\) ft on that side. The opposite direction is counted separately."))
add("fe199", f=("Fill is the difference: $12.40-11.10=1.30$ m. Adding the elevations has no meaning here.",
                r"Fill is the difference: \(12.40-11.10=1.30\) m. Adding the elevations has no meaning here."))
add("cb009",
    s=("Two resistors, 2.0 k ohm and 2.0 k ohm, are in series with a 10 V source. What is the current?",
       r"Two resistors, \(2.0\,\mathrm{k}\Omega\) and \(2.0\,\mathrm{k}\Omega\), are in series with a 10 V source. What is the current?"),
    f=(r"Series resistance is $2.0+2.0=4.0\( k\)\Omega\(. Current is \)I=V/R=10/4000=0.0025\( A \)=2.5$ mA.",
       r"Series resistance is \(2.0+2.0=4.0\,\mathrm{k}\Omega\). Current is \(I=V/R=10/4000=0.0025\,\mathrm{A}=2.5\,\mathrm{mA}\)."))
add("cb010",
    s=("Two 100 ohm resistors are in parallel on a 10 V source. What is the total current from the source?",
       r"Two \(100\,\Omega\) resistors are in parallel on a 10 V source. What is the total current from the source?"),
    c0=("0.10 A on this assignment", "0.10 A"),
    f=(r"Each branch draws $10/100=0.10\( A, so the source current is 0.20 A. Equivalently \)R_{eq}=50\,\Omega\( and \)I=10/50=0.20$ A.",
       r"Each branch draws \(10/100=0.10\,\mathrm{A}\), so the source current is \(0.20\,\mathrm{A}\). Equivalently \(R_{\mathrm{eq}}=50\,\Omega\) and \(I=10/50=0.20\,\mathrm{A}\)."))

# m1 ASCII math
add("fe070",
    s=(r"A stress state has sigma_x=\(80\,\mathrm{MPa}\), sigma_y=\(20\,\mathrm{MPa}\), and tau_xy=0. The principal stresses are:",
       r"A stress state has \(\sigma_x=80\,\mathrm{MPa}\), \(\sigma_y=20\,\mathrm{MPa}\), and \(\tau_{xy}=0\). The principal stresses are:"),
    c0=(r"\(50\,\mathrm{MPa}\) and \(50\,\mathrm{MPa}\) on this assignment",
        r"\(50\,\mathrm{MPa}\) and \(50\,\mathrm{MPa}\)"))
add("fe155",
    s=("For a loose sand with friction angle 30° and no wall friction, Rankine active K_a is (1-sin phi)/(1+sin phi), which equals:",
       r"For a loose sand with friction angle \(30^{\circ}\) and no wall friction, Rankine active \(K_a\) is \((1-\sin\phi)/(1+\sin\phi)\), which equals:"))
add("fe156",
    s=("The resultant Rankine active force on a smooth vertical wall of height H, with level backfill of unit weight gamma, is:",
       r"The resultant Rankine active force on a smooth vertical wall of height \(H\), with level backfill of unit weight \(\gamma\), is:"))
add("fe157",
    s=(r"A 6.0 m smooth vertical wall has a level sand backfill with gamma=\(18\,\mathrm{kN}/\mathrm{m}^{3}\) and Ka=1/3. What is the active force per meter of wall?",
       r"A 6.0 m smooth vertical wall has a level sand backfill with \(\gamma=18\,\mathrm{kN}/\mathrm{m}^{3}\) and \(K_a=1/3\). What is the active force per meter of wall?"))
add("fe158", c2=("sigma tan 0 always", r"\(\sigma\tan 0\), as if friction were zero"))
add("fe160", c2=("Has no effect on the N_gamma term", r"Has no effect on the \(N_\gamma\) term"))
add("fe041", c3=("bh/12", r"\(bh/12\)"))
add("fe064", c3=("w L / 8", r"\(wL/8\)"))

# M3 + grammar + polish keys/wrongs
add("fe022",
    c=(["As optimistic as the owner prefers, if you doubt the claim", "Fair and consistent with the contract and the records", "Rounded up to help the contractor", "Left blank so the owner can fill it in later"],
       ["As optimistic as the owner prefers, even when you doubt the claim", "Objective, truthful, and within your competence", "Rounded up to help the contractor win the next job", "Left blank so the owner can fill it in later"]))
add("fe058",
    c=(["Force divided by velocity", "Force times velocity", "Mass times acceleration", "Mass times velocity"],
       ["Force divided by velocity", "The time rate of doing work", "Mass times acceleration", "Work multiplied by time"]))
add("fe139",
    c=(["Unstable, and unable to develop any moments", "Able to develop a plastic moment at a section", "A truss, carrying only axial force", "Limited to service loads below yield in every case"],
       ["Statically determinate, with only two support reactions", "Statically indeterminate", "A truss, carrying only axial force", "Unstable, and unable to develop any moments"]))
add("fe143",
    c=(["The torsional constant, and no flexural moment check on this assignment", "The plastic or nominal moment strength, including LTB", "The tensile rupture strength of a gusset plate", "The Euler load of an equivalent pinned column"],
       ["The torsional constant of the section alone", "The plastic moment capacity of the section", "The tensile rupture strength of a gusset plate", "The Euler load of an equivalent pinned column"]))
add("fe167",
    c=(["The length of a vertical curve, omitting any speed term on this assignment", "Sight distance, including a reaction time and a braking or passing term", "The number of lanes on the typical section", "The pavement structural number used in thickness design"],
       ["The length of a vertical curve, with no speed term", "Brake-reaction distance plus braking distance", "The number of lanes on the typical section", "The pavement structural number used in thickness design"]))
add("fe185",
    c=(["Start construction before design documents are issued on this assignment", "Drawings, specifications, and contract documents for bidding and construction", "A verbal scope agreed after the notice to proceed", "A contractor's means-and-methods plan only"],
       ["Start construction before the design documents are issued", "Advertise and bid the work, then award it to a contractor", "Award the work first, then finish the design with the same firm", "Ask the resident inspector to pick a contractor from the site"]))
add("fe186",
    c=(["A cost-plus fee and no agreed contract total", "A lump-sum contract for a defined scope of work", "Payment by the hour, and no defined scope of work", "A handshake and a start date"],
       ["A cost-plus fee with no agreed contract total", "A stated total price for the defined scope", "Payment by the hour, with no defined scope of work", "A handshake and a start date"]))
add("fe189",
    c=(["Can slip by any amount and leave the project finish date unchanged on this assignment", "Can delay later work if they use up float or sit on the critical path", "Affect the cost account and leave the schedule unchanged", "Are ignored if they are weather-related"],
       ["Can slip by any amount and leave the project finish date unchanged", "Has zero total float and lies on a critical path", "Affects the cost account and leaves the schedule unchanged", "Is ignored when the work is weather-related"]))
add("fe198",
    c=(["A plan view of the work from above", "A vertical slice of hidden or typical construction", "A list of bid prices in the proposal form", "A record of daily time cards in the field office"],
       ["Show a plan view of the work from above", "Show a vertical slice of hidden or typical work", "List the bid prices in the proposal form", "Record daily time cards in the field office"]))
add("cb016",
    c=(["A public address that must be unique worldwide on this assignment", "A private, non-routable address on the public Internet", "A MAC address", "A HIPAA form number"],
       ["A public address that must be unique worldwide", "A private address that is not routable on the public Internet", "A hardware MAC address burned into a network card", "A default public DNS server address"]))
add("cb087",
    c=(["Replace the endoscope light source first, though the local screen is good", "A video cable, input select, or processor setting on the display path", "Replace the patient table motor first", "Increase the ESU power as a display fix"],
       ["Replace the endoscope light source first, though the local screen is good", "Trace the video route: cables, switcher, input selection, and that display", "Replace the patient-table motor as the first display fix", "Increase the ESU power to brighten the display"]))
add("cb049",
    c=(["It can stand in for a defibrillator in an emergency", "Keep reagents and samples in a controlled temperature range", "It sterilizes steel tools by freezing them in the cabinet in this situation", "It supplies isolated power for surgical-suite outlets"],
       ["It can stand in for a defibrillator in an emergency", "It keeps reagents and samples in a controlled temperature range", "It sterilizes steel tools by freezing them in the cabinet", "It supplies isolated power for surgical-suite outlets"]))

# m2 garbled / absurd / near-duplicate
add("cb001",
    c=(["Filter waste as a kidney would through the pulmonary veins toward the left atrium", "Pump blood through the circulatory system", "Exchange gases as an alveolus would", "Store bile"],
       ["Filter waste from the blood, as the kidneys do", "Pump blood through the circulatory system", "Exchange gases between air and blood, as alveoli do", "Store and concentrate bile, as the gallbladder does"]))
add("cb022",
    c=(["Measure ECG amplitude at layer 3, as a default gateway does", "Connect Wi-Fi clients to the wired network", "Step 120 V down to 5 V for logic boards", "Sterilize probes"],
       ["Route packets between two different IP subnets, as a default gateway does", "Connect Wi-Fi clients to the wired network", "Step 120 V down to 5 V for logic boards", "Assign public IPv4 addresses to every wireless client"]))
add("cb050",
    c=(["Using a strong static magnetic field as in MRI by detecting emitted gamma rays", "Sending high-frequency sound and receiving echoes", "Using ionizing gamma cameras only", "Using a thermal camera only"],
       ["Using a strong static magnetic field and radiofrequency pulses, as in MRI", "Sending high-frequency sound and receiving echoes", "Detecting emitted gamma rays, as in a nuclear-medicine camera", "Imaging skin temperature with a thermal camera"]))
add("fe119",
    c0=("Hardness, expressed as calcium carbonate, a hardness or mineral-content style result",
        "Hardness, expressed as calcium carbonate"))
add("cb065",
    c0=("A campus-wide network collapse, skipped any check of that transmitter or its battery",
        "A campus-wide network collapse, with no check of that transmitter"))
add("cb069",
    c=(["Return it to the crash cart and hope the next shock is accurate", "Remove it from service, then investigate, repair, or escalate", "Ignore the test because the display lights work", "Leave it on the cart because the display still lights"],
       ["Return it to the crash cart for the next code", "Remove it from service, investigate, and repair or escalate per policy", "Postpone the investigation until the next scheduled PM", "Leave the failed reading in the file and keep the unit in service"]))

# leakage polish
add("cb098",
    c2=("Type BF and type CF, which share the same numeric limits",
        "Type BF and type CF, which share the same AC patient-leakage limits"))
add("cb099",
    c1=("Higher than in normal condition, but still limited",
        "Higher than in normal condition, but still limited to a stated value"))
add("cb046", topic=("function", "safety"))
add("cb097", topic=("safety", "function"))

# outlet figure alt
add("cb091",
    imgAlt=("Front view of a US-style receptacle face: hot slot on the left, wider neutral slot on the right, and a ground opening at the bottom.",
            "Front view of a US NEMA 5-15 receptacle with the ground hole down: the wider neutral slot is on the left, the narrower hot slot is on the right, and the ground hole is at the bottom."),
    c1=("Provide a low-impedance fault path so protection can operate",
        "Provide a low-impedance fault path so protection can operate and touch voltage stays low"))

# fe018 first-canon key (stem asks what comes first)
add("fe018",
    c1=("Notify the proper authority if the client will not fix the defect",
        "Hold public safety, health, and welfare paramount"))

FILLER_RX = re.compile(r'(?:,)?\s*(?:on this assignment|in this situation|for this case)\s*$', re.I)

# Keys that must not be auto-restored from v21 (intentional v22 content or already handled).
SKIP_RESTORE = {
    "fe033", "fe162", "cb046", "cb098", "cb099",
    # handled in MANUAL (including key):
    "fe022", "fe058", "fe065", "fe125", "fe132", "fe139", "fe143", "fe167",
    "fe185", "fe186", "fe189", "fe198", "cb016", "cb049", "cb069", "cb074",
    "cb087", "cb091", "fe018",
}

def strip_tex(s):
    s = re.sub(r'\\[\(\)\[\]]', '', s)
    s = re.sub(r'\\mathrm\{([^}]*)\}', r'\1', s)
    s = s.replace('\\,', ' ').replace('\\times', 'x').replace('\\cdot', '·')
    s = re.sub(r'[{}^_\\]', '', s)
    s = re.sub(r'\s+', ' ', s)
    return s.strip().lower()

FE_SOURCES = {
    "nspe-ethics": ["NSPE Code of Ethics for Engineers", "https://www.nspe.org/resources/ethics/code-ethics"],
    "openstax-calc": ["OpenStax Calculus Volume 1", "https://openstax.org/books/calculus-volume-1/pages/1-introduction"],
    "openstax-stat": ["OpenStax Introductory Statistics", "https://openstax.org/books/introductory-statistics/pages/1-introduction"],
    "openstax-up1": ["OpenStax University Physics Volume 1", "https://openstax.org/books/university-physics-volume-1/pages/1-introduction"],
    "openstax-finance": ["OpenStax Principles of Finance", "https://openstax.org/books/principles-finance/pages/1-introduction"],
    "libretexts-statics": ["LibreTexts: Engineering Statics (open textbook)", "https://eng.libretexts.org/Bookshelves/Mechanical_Engineering/Engineering_Statics_-_Open_and_Interactive_(Steinhurst_et_al)"],
    "libretexts-mom": ["LibreTexts: Introduction to Mechanics of Materials", "https://eng.libretexts.org/Bookshelves/Mechanical_Engineering/Introduction_to_Mechanics_of_Materials_(Penenik)"],
    "usgs-water": ["USGS Water Science School", "https://www.usgs.gov/special-topics/water-science-school"],
    "fhwa-hds5": ["FHWA Hydraulic Design of Highway Culverts (HDS-5)", "https://www.fhwa.dot.gov/engineering/hydraulics/pubs/08090/"],
    "fhwa-hec22": ["FHWA Urban Drainage Design Manual (HEC-22)", "https://www.fhwa.dot.gov/engineering/hydraulics/library/listing.cfm"],
    "fhwa-geom": ["FHWA Office of Safety, geometric design and sight distance", "https://highways.dot.gov/safety"],
    "fhwa-mutcd": ["FHWA: Manual on Uniform Traffic Control Devices", "https://mutcd.fhwa.dot.gov/"],
    "fhwa-contracts": ["FHWA Construction Program Guide: Contract Administration", "https://www.fhwa.dot.gov/construction/cqit/"],
    "fhwa-pavement": ["FHWA Pavement and Materials", "https://www.fhwa.dot.gov/pavement/"],
    "epa-waste": ["EPA National Pollutant Discharge Elimination System", "https://www.epa.gov/npdes"],
    "osha-const": ["OSHA Construction Industry", "https://www.osha.gov/construction"],
    "nrcs-ssm": ["USDA NRCS Soil Survey Manual", "https://www.nrcs.usda.gov/resources/guides-and-instructions/soil-survey-manual"],
    "usace-settle": ["USACE EM 1110-1-1904, Settlement Analysis", "https://www.publications.usace.army.mil/portals/76/publications/engineermanuals/em_1110-1-1904.pdf"],
    "usace-slope": ["USACE EM 1110-2-1902, Slope Stability", "https://www.publications.usace.army.mil/portals/76/publications/engineermanuals/em_1110-2-1902.pdf"],
    "awc-nds": ["American Wood Council, National Design Specification (NDS)", "https://awc.org/codes-standards/publications/nds-2024"],
    "ngs": ["NOAA National Geodetic Survey", "https://geodesy.noaa.gov/"],
    "ncees-ref": ["NCEES FE Reference Handbook (formula check; text not copied here)", "https://ncees.org/exams/exam-preparation-materials/"],
    "ncees-spec": ["NCEES FE Civil CBT Exam Specifications (effective July 2020)", "https://ncees.org/wp-content/uploads/FE-Civil-CBT-specs-1.pdf"],
}

CB_SOURCES = {
    "openstax-up2": ["OpenStax University Physics Volume 2", "https://openstax.org/books/university-physics-volume-2/pages/1-introduction"],
    "openstax-ap": ["OpenStax Anatomy and Physiology 2e", "https://openstax.org/books/anatomy-and-physiology-2e/pages/1-introduction"],
    "hhs-hipaa": ["HHS: HIPAA for Professionals", "https://www.hhs.gov/hipaa/for-professionals/index.html"],
    "nist-csf": ["NIST Cybersecurity Framework", "https://www.nist.gov/cyberframework"],
    "healthit": ["HealthIT.gov (ONC)", "https://www.healthit.gov/"],
    "osha-elec": ["OSHA Electrical Safety", "https://www.osha.gov/electrical"],
    "cdc-precautions": ["CDC: Standard Precautions for All Patient Care", "https://www.cdc.gov/infection-control/hcp/standard-precautions/index.html"],
    "cms-cops": ["CMS Conditions of Participation", "https://www.cms.gov/medicare/health-safety-standards/conditions-participation-requirements"],
    "fda-advice": ["FDA Device Advice: Comprehensive Regulatory Assistance", "https://www.fda.gov/medical-devices/device-advice-comprehensive-regulatory-assistance"],
    "fda-safety": ["FDA Medical Device Safety", "https://www.fda.gov/medical-devices/medical-device-safety"],
    "fda-infusion": ["FDA: Infusion Pumps", "https://www.fda.gov/medical-devices/general-hospital-devices-and-supplies/infusion-pumps"],
    "fda-defib": ["FDA: External Defibrillators and AEDs", "https://www.fda.gov/medical-devices/cardiovascular-devices/external-defibrillators-aeds-and-public-access-defibrillation"],
    "fda-pulseox": ["FDA: Pulse Oximeters", "https://www.fda.gov/medical-devices/general-hospital-devices-and-supplies/pulse-oximeters"],
    "fda-vent": ["FDA: Ventilators and Accessories", "https://www.fda.gov/medical-devices/products-and-medical-procedures/ventilators"],
    "fda-ultrasound": ["FDA: Ultrasound Imaging", "https://www.fda.gov/radiation-emitting-products/medical-imaging/ultrasound-imaging"],
    "fda-digital": ["FDA Digital Health Center of Excellence", "https://www.fda.gov/medical-devices/digital-health-center-excellence"],
    "nfpa-99": ["NFPA 99, Health Care Facilities Code (cited, not pasted)", "https://www.nfpa.org/codes-and-standards/nfpa-99-standard-for-health-care-facilities"],
    "iec-60601": ["IEC 60601-1 (FDA recognized consensus standard page; cited, not pasted)", "https://www.fda.gov/medical-devices/standards-and-conformity-assessment-program/recognized-consensus-standards-recognized-consensus-standards"],
    "aami-cbet": ["AAMI: Certified Biomedical Equipment Technician (CBET) exam content outline", "https://aami.org/certifications/cbet/"],
}

# id -> new src (and optional also list). Only when current src is the generic FDA homepage or a weak fit.
FDA_MAP = {
    "cb031": "fda-advice", "cb032": "fda-advice", "cb033": "fda-advice",
    "cb034": "fda-defib", "cb035": "fda-safety", "cb036": "fda-advice",
    "cb037": "fda-advice", "cb038": "fda-pulseox", "cb039": "fda-advice",
    "cb040": "fda-digital", "cb041": "fda-infusion", "cb042": "fda-infusion",
    "cb043": "fda-vent", "cb044": "fda-defib", "cb045": "fda-advice",
    "cb047": "fda-advice", "cb048": "fda-advice", "cb049": "fda-advice",
    "cb050": "fda-ultrasound", "cb051": "fda-advice", "cb052": "fda-advice",
    "cb053": "fda-advice", "cb054": "fda-advice", "cb055": "fda-advice",
    "cb056": "fda-advice", "cb057": "fda-advice", "cb058": "fda-advice",
    "cb059": "fda-advice", "cb060": "fda-advice",
}

# troubleshooting cards often also used fda-devices; map remaining later in apply.

def map_fda(card):
    if card["src"] != "fda-devices":
        return
    if card["id"] in FDA_MAP:
        card["src"] = FDA_MAP[card["id"]]
        LOG.append((card["id"], "src", "specific FDA page"))
        return
    # leftover function/troubleshooting/safety clinical-device cards
    if card["topic"] in ("function", "troubleshooting"):
        # device-specific hints
        blob = (card["s"] + " " + card["f"]).lower()
        if "infusion" in blob or "pca pump" in blob or "syringe pump" in blob:
            card["src"] = "fda-infusion"
        elif "defibrill" in blob:
            card["src"] = "fda-defib"
        elif "oximet" in blob or "spo2" in blob:
            card["src"] = "fda-pulseox"
        elif "ventilat" in blob:
            card["src"] = "fda-vent"
        elif "ultrasound" in blob:
            card["src"] = "fda-ultrasound"
        elif "network" in blob or "emr" in blob or "wireless" in blob or "telemetry" in blob:
            card["src"] = "fda-digital"
        elif "leakage" in blob or "electrical safety" in blob:
            card["src"] = "fda-safety"
        else:
            card["src"] = "fda-advice"
        LOG.append((card["id"], "src", "specific FDA page"))
    elif card["topic"] == "safety":
        card["src"] = "fda-safety"
        LOG.append((card["id"], "src", "specific FDA page"))
    elif card["topic"] == "healthit":
        card["src"] = "fda-digital"
        LOG.append((card["id"], "src", "specific FDA page"))

def remap_other(card):
    if card["id"] in ("fe185", "fe186"):
        if card["src"] != "fhwa-contracts":
            old = card["src"]
            card["src"] = "fhwa-contracts"
            also = [x for x in (card.get("also") or []) if x != "fhwa-contracts"]
            if old not in also and old != "ncees-spec":
                pass
            # keep ncees-ref as also if present; drop osha-const as primary
            also = [x for x in also if x != "osha-const"]
            if "ncees-spec" not in also:
                also.append("ncees-spec")
            card["also"] = also
            LOG.append((card["id"], "src", f"{old} -> fhwa-contracts"))
    # concrete/asphalt/slump often mis-cited libretexts-mom
    if card["src"] == "libretexts-mom" and re.search(r'slump|asphalt|concrete mix|water-cement|aggregate|pavement', card["s"] + " " + card["f"], re.I):
        card["also"] = list(dict.fromkeys((card.get("also") or []) + ["libretexts-mom"]))
        card["src"] = "fhwa-pavement"
        LOG.append((card["id"], "src", "fhwa-pavement for materials"))
    if card["id"] == "cb097":
        if card["src"] in ("cms", "fda-devices"):
            card["src"] = "cms-cops"
            LOG.append((card["id"], "src", "cms-cops"))

def apply_manual(cards_by_id):
    for cid, fields in MANUAL:
        card = cards_by_id[cid]
        for field, pair in fields.items():
            old, new = pair
            setf(card, field, old, new, "manual")

def restore_keys(cards_by_id, v21):
    for cid, now in cards_by_id.items():
        if cid in SKIP_RESTORE or cid not in v21:
            continue
        old_key = now["c"][1]
        v21_key = v21[cid]["c"][1]
        if old_key == v21_key or strip_tex(old_key) == strip_tex(v21_key):
            continue
        # typography-only already skipped by strip_tex; remaining are meaning changes
        setf(now, "c1", old_key, v21_key, "restore v21 key")

def strip_fillers(card):
    for i, ch in enumerate(card["c"]):
        if i == 1:
            continue
        m = FILLER_RX.search(ch)
        if not m:
            continue
        new = FILLER_RX.sub("", ch).rstrip(" ,")
        setf(card, f"c{i}", ch, new, "strip filler tail")

def main():
    v21 = {}
    for path in (V21_FE, V21_CB):
        _, cards, _ = load_file(path)
        for c in cards:
            v21[c["id"]] = c

    fe_header, fe_cards, fe_footer = load_file(FE)
    cb_header, cb_cards, cb_footer = load_file(CB)
    cards_by_id = {c["id"]: c for c in fe_cards + cb_cards}

    apply_manual(cards_by_id)
    restore_keys(cards_by_id, v21)
    for c in fe_cards + cb_cards:
        strip_fillers(c)
        map_fda(c)
        remap_other(c)
        # leftover cms key
        if c["src"] == "cms":
            c["src"] = "cms-cops"
            LOG.append((c["id"], "src", "cms-cops"))

    ascii_keys = {
        "fe042": ("6.67e-5 m^4", r"\(6.67\times 10^{-5}\,\mathrm{m}^{4}\)"),
        "fe056": ("m r^2", r"\(mr^{2}\)"),
        "fe061": ("pi/32 d^4", r"\(\pi d^{4}/32\)"),
        "fe064": ("w L^2 / 8", r"\(wL^{2}/8\)"),
        "fe072": ("P L^3 / (3 EI)", r"\(PL^{3}/(3EI)\)"),
        "fe092": ("gamma b h^2 / 2", r"\(\gamma bh^{2}/2\)"),
        "fe128": ("P L^3 / (48 EI)", r"\(PL^{3}/(48EI)\)"),
        "fe141": ("45 kN·m", r"\(45\,\mathrm{kN\cdot m}\)"),
        "fe156": ("0.5 Ka gamma H^2", r"\(0.5 K_a\gamma H^{2}\)"),
        "fe158": ("sigma' tan phi'", r"\(\sigma'\tan\phi'\)"),
        "fe171": ("R times Delta", r"\(R\Delta\)"),
    }
    for cid, (old, newv) in ascii_keys.items():
        setf(cards_by_id[cid], "c1", old, newv, "typeset restored key")

    write_deck(FE, fe_header, fe_cards, fe_footer, FE_SOURCES)
    write_deck(CB, cb_header, cb_cards, cb_footer, CB_SOURCES)
    print("applied", len(LOG), "field edits on", len({a[0] for a in LOG}), "cards")
    for row in LOG:
        print(f"  {row[0]} {row[1]}: {row[2]}")

if __name__ == "__main__":
    main()
