"""DO NOT RE-RUN as a deck writer. v23 forbids whole-array or unscoped string patches; edits must be keyed by card id and verified against the current text.

#!/usr/bin/env python3
"""v22 engineer deck repairs: math delimiters, sources, rewrites, typesetting."""
import json, re, sys
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]
FE = ROOT / "src/content/decks/eng_fecivil.js"
CB = ROOT / "src/content/decks/eng_cbet.js"
CARD_RE = re.compile(r"\{ id: \"((?:fe|cb)\d+)\",.*? \},", re.S)
STR_RE = re.compile(r'"(?:\\.|[^"\\])*"')

# --- parse / emit ---
def js_str(s):
    return json.dumps(s, ensure_ascii=False)

def parse_string_field(body, key):
    m = re.search(rf'{key}: ("(?:\\.|[^"\\])*")', body)
    if not m:
        return None
    return json.loads(m.group(1))

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
    deck = re.search(r'deck: "([^"]+)"', body)
    if deck:
        card["deck"] = deck.group(1)
    return card

def emit_card(card, deck_id):
    parts = [
        f'id: "{card["id"]}"',
        f'deck: "{card.get("deck") or deck_id}"' if (card.get("deck") or True) and 'deck: "' in card.get("body", "deck: ") else None,
    ]
    # Match original field order as much as possible: id, ages?, topic, s, c, f, src, img...
    # Simpler consistent order:
    bits = [f'id: "{card["id"]}"']
    if card.get("deck") or deck_id:
        # original FE cards often omit deck because the file sets it? Check...
        pass
    if "ages: '" in card["body"][:80] or "ages:" in card["body"]:
        # place ages early if original had it early
        pass
    # Use a stable order used by many CBET cards: id, ages, topic, s, c, f, src, img...
    bits = [
        f'id: "{card["id"]}"',
        f"ages: '{card['ages']}'",
        f'topic: "{card["topic"]}"',
        f's: {js_str(card["s"])}',
        "c: [" + ", ".join(js_str(x) for x in card["c"]) + "]",
        f'f: {js_str(card["f"])}',
        f'src: "{card["src"]}"',
    ]
    if card.get("also"):
        bits.append("also: " + json.dumps(card["also"]))
    if card.get("img"):
        bits.append(f'img: "{card["img"]}"')
    if card.get("imgAlt") is not None:
        bits.append(f'imgAlt: {js_str(card["imgAlt"])}')
    if card.get("imgAsk"):
        bits.append("imgAsk: true")
    return "    { " + ", ".join(bits) + " },"

def load_file(path):
    text = path.read_text()
    start = text.index("cards: [")
    # header is everything through cards: [
    header = text[: start + len("cards: [")]
    # find sources block in header to allow replacement later
    cards = []
    for m in CARD_RE.finditer(text):
        cards.append(parse_card(m.group(0), m.group(1)))
    # footer after last card
    last = list(CARD_RE.finditer(text))[-1]
    footer = text[last.end():]
    return header, cards, footer

def replace_sources_block(header, sources: dict):
    # sources: { ... },
    m = re.search(r"\n  sources: \{.*?\n  \},", header, re.S)
    if not m:
        raise SystemExit("sources block not found")
    lines = ["\n  sources: {"]
    for k, (name, url) in sources.items():
        lines.append(f'    {js_str(k)}: [{js_str(name)}, {js_str(url)}],')
    lines.append("  },")
    return header[:m.start()] + "\n".join(lines) + header[m.end():]

# --- math conversion ---
def is_math_inner(inner):
    if re.fullmatch(r"[\d,.\s$]*", inner or ""):
        return False
    return bool(re.search(r"[A-Za-z\\^_{}=]|\\\\", inner))


def is_money_dollar(s, i):
    """True if s[i] is a $ that starts currency like $2,000 or $-4, not math like $3x or $6(4)."""
    j = i + 1
    if j >= len(s):
        return False
    if s[j] == "-" and j + 1 < len(s) and s[j + 1].isdigit():
        j += 1
    if j >= len(s) or not s[j].isdigit():
        return False
    while j < len(s) and (s[j].isdigit() or s[j] in ",."):
        j += 1
    if j < len(s) and (s[j].isalpha() or s[j] in "\\^{("):
        return False
    return True


def convert_dollars(s):
    if s is None:
        return s
    out, i = [], 0
    while i < len(s):
        if s.startswith("$$", i):
            j = s.find("$$", i + 2)
            if j < 0:
                out.append(s[i:]); break
            inner = re.sub(r"(?<!\\)%", r"\\%", s[i+2:j])
            out.append("\\[" + inner + "\\]")
            i = j + 2
        elif s[i] == "$":
            if is_money_dollar(s, i):
                out.append(s[i]); i += 1
                continue
            j = s.find("$", i + 1)
            if j < 0:
                out.append(s[i:]); break
            inner = s[i+1:j]
            if is_math_inner(inner):
                inner = re.sub(r"(?<!\\)%", r"\\%", inner)
                out.append("\\(" + inner + "\\)")
                i = j + 1
            else:
                out.append(s[i])
                i += 1
        else:
            out.append(s[i]); i += 1
    return "".join(out)

# Typeset leftover ASCII math outside existing \( \)
UNIT_RE = re.compile(
    r"(?<![\w\\{^])((?:\d[\d,]*\.?\d*|\d+\.\d+e[+\-]?\d+|\d+e[+\-]?\d+)\s*)"
    r"(m\^3/s|m\^3/h|kN/m\^3|kN/m\^2|m/s\^2|cm\^3/s|mm\^2|cm\^2|m\^4|m\^3|m\^2|mm|kN|MPa|GPa|kg/m\^3)"
)

UNIT_TEX = {
    "m^3/s": r"\mathrm{m}^{3}/\mathrm{s}",
    "m^3/h": r"\mathrm{m}^{3}/\mathrm{h}",
    "kN/m^3": r"\mathrm{kN}/\mathrm{m}^{3}",
    "kN/m^2": r"\mathrm{kN}/\mathrm{m}^{2}",
    "m/s^2": r"\mathrm{m}/\mathrm{s}^{2}",
    "cm^3/s": r"\mathrm{cm}^{3}/\mathrm{s}",
    "mm^2": r"\mathrm{mm}^{2}",
    "cm^2": r"\mathrm{cm}^{2}",
    "m^4": r"\mathrm{m}^{4}",
    "m^3": r"\mathrm{m}^{3}",
    "m^2": r"\mathrm{m}^{2}",
    "mm": r"\mathrm{mm}",
    "kN": r"\mathrm{kN}",
    "MPa": r"\mathrm{MPa}",
    "GPa": r"\mathrm{GPa}",
    "kg/m^3": r"\mathrm{kg}/\mathrm{m}^{3}",
}

EXPR_CHOICE = [
    (re.compile(r"^P L\^3 / \(48 EI\)$"), r"\(PL^{3}/(48EI)\)"),
    (re.compile(r"^P L\^3 / \(8 EI\)$"), r"\(PL^{3}/(8EI)\)"),
    (re.compile(r"^P L\^3 / \(3 EI\)$"), r"\(PL^{3}/(3EI)\)"),
    (re.compile(r"^P L\^3 / EI$"), r"\(PL^{3}/EI\)"),
    (re.compile(r"^P L\^2 / \(2 EI\)$"), r"\(PL^{2}/(2EI)\)"),
    (re.compile(r"^P L\^2 / \(16 EI\)$"), r"\(PL^{2}/(16EI)\)"),
    (re.compile(r"^w L\^2 / 8$"), r"\(wL^{2}/8\)"),
    (re.compile(r"^w L\^2 / 4$"), r"\(wL^{2}/4\)"),
    (re.compile(r"^w L\^2 / 2$"), r"\(wL^{2}/2\)"),
    (re.compile(r"^bh\^3/12$"), r"\(bh^{3}/12\)"),
    (re.compile(r"^bh\^3/3$"), r"\(bh^{3}/3\)"),
    (re.compile(r"^b\^3 h/12$"), r"\(b^{3}h/12\)"),
    (re.compile(r"^pi/64 d\^4$"), r"\(\pi d^{4}/64\)"),
    (re.compile(r"^pi/32 d\^4$"), r"\(\pi d^{4}/32\)"),
    (re.compile(r"^pi/16 d\^4$"), r"\(\pi d^{4}/16\)"),
    (re.compile(r"^pi/4 d\^4$"), r"\(\pi d^{4}/4\)"),
    (re.compile(r"^m r\^2$"), r"\(mr^{2}\)"),
    (re.compile(r"^m/r\^2$"), r"\(m/r^{2}\)"),
    (re.compile(r"^m r\^3$"), r"\(mr^{3}\)"),
    (re.compile(r"^E alpha Delta T$"), r"\(E\alpha\Delta T\)"),
    (re.compile(r"^alpha Delta T$"), r"\(\alpha\Delta T\)"),
    (re.compile(r"^E Delta T$"), r"\(E\Delta T\)"),
    (re.compile(r"^gamma b h\^2 / 2$"), r"\(\gamma bh^{2}/2\)"),
    (re.compile(r"^gamma b h\^2$"), r"\(\gamma bh^{2}\)"),
    (re.compile(r"^gamma b h / 2$"), r"\(\gamma bh/2\)"),
    (re.compile(r"^gamma b h$"), r"\(\gamma bh\)"),
    (re.compile(r"^0\.5 Ka gamma H\^2$"), r"\(0.5 K_a\gamma H^{2}\)"),
    (re.compile(r"^Ka gamma H\^2$"), r"\(K_a\gamma H^{2}\)"),
    (re.compile(r"^Ka gamma H$"), r"\(K_a\gamma H\)"),
    (re.compile(r"^gamma H / Ka$"), r"\(\gamma H/K_a\)"),
    (re.compile(r"^sigma' tan phi'$"), r"\(\sigma'\tan\phi'\)"),
    (re.compile(r"^2 pi R, always, for any Delta$"), r"\(2\pi R\), for any deflection angle"),
    (re.compile(r"^2 pi R$"), r"\(2\pi R\)"),
    (re.compile(r"^R times Delta$"), r"\(R\Delta\)"),
    (re.compile(r"^R / Delta$"), r"\(R/\Delta\)"),
    (re.compile(r"^Delta / R$"), r"\(\Delta/R\)"),
    (re.compile(r"^P/sqrt\(2\)$"), r"\(P/\sqrt{2}\)"),
    (re.compile(r"^P/2$"), r"\(P/2\)"),
    (re.compile(r"^P/8$"), r"\(P/8\)"),
    (re.compile(r"^P/4$"), r"\(P/4\)"),
    (re.compile(r"^PL/4$"), r"\(PL/4\)"),
    (re.compile(r"^PL/2$"), r"\(PL/2\)"),
    (re.compile(r"^wL/2$"), r"\(wL/2\)"),
]

SCI = re.compile(r"\b(\d+\.\d+|\d+)e(-?\d+)\b")

def split_math(s):
    parts, i = [], 0
    while i < len(s):
        if s.startswith("\\(", i):
            j = s.find("\\)", i + 2)
            if j < 0:
                parts.append(("t", s[i:])); break
            parts.append(("m", s[i:j+2])); i = j + 2
        elif s.startswith("\\[", i):
            j = s.find("\\]", i + 2)
            if j < 0:
                parts.append(("t", s[i:])); break
            parts.append(("m", s[i:j+2])); i = j + 2
        else:
            n1, n2 = s.find("\\(", i), s.find("\\[", i)
            n = min([x for x in (n1, n2) if x >= 0], default=-1)
            parts.append(("t", s[i:] if n < 0 else s[i:n]))
            i = len(s) if n < 0 else n
    return parts

def typeset_text(s):
    if not s:
        return s
    for rx, rep in EXPR_CHOICE:
        if rx.fullmatch(s.strip()):
            return rep
    out = []
    for kind, chunk in split_math(s):
        if kind == "m":
            out.append(chunk)
            continue
        def sci(m):
            return "\\(" + m.group(1) + "\\\\times 10^{" + m.group(2) + "}\\)"
        chunk = SCI.sub(sci, chunk)
        def unit(m):
            num = m.group(1).replace(" ", "")
            # if already inside we wouldn't be here
            if "e" in num.lower() and "times" not in num:
                # already replaced? 6.67e-5 might remain if SCI missed because of being inside
                sm = re.fullmatch(r"(\d+\.?\d*)e(-?\d+)", num, re.I)
                if sm:
                    num_tex = sm.group(1) + "\\times 10^{" + sm.group(2) + "}"
                else:
                    num_tex = num
            else:
                num_tex = num
            return "\\(" + num_tex + "\\," + UNIT_TEX[m.group(2)] + "\\)"
        chunk = UNIT_RE.sub(unit, chunk)
        out.append(chunk)
    return "".join(out)

def typeset_stem_formulas(s):
    # common stem formulas
    repls = [
        (r"\be\+f=V\^2/\(gR\)", r"\\(e+f=V^{2}/(gR)\\)"),
        (r"\bsigma_x=80 MPa, sigma_y=20 MPa, and tau_xy=0", r"\\(\\sigma_x=80\\,\\mathrm{MPa}\\), \\(\\sigma_y=20\\,\\mathrm{MPa}\\), and \\(\\tau_{xy}=0\\)"),
        (r"\bV=IR\b", r"\\(V=IR\\)"),
        (r"Use Ohm's law \\(V=IR\\)", r"Use Ohm's law \\(V=IR\\)"),
    ]
    for a, b in repls:
        s = re.sub(a, b, s)
    return s

# --- sources ---
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
    "cms": ["Centers for Medicare and Medicaid Services, Conditions of Participation", "https://www.cms.gov/"],
    "fda-devices": ["FDA Medical Devices", "https://www.fda.gov/medical-devices"],
    "nfpa-99": ["NFPA 99, Health Care Facilities Code (cited, not pasted)", "https://www.nfpa.org/codes-and-standards/nfpa-99-standard-for-health-care-facilities"],
    "iec-60601": ["IEC 60601-1 (FDA recognized consensus standard page; cited, not pasted)", "https://www.fda.gov/medical-devices/standards-and-conformity-assessment-program/recognized-consensus-standards-recognized-consensus-standards"],
    "aami-cbet": ["AAMI: Certified Biomedical Equipment Technician (CBET) exam content outline", "https://aami.org/certifications/cbet/"],
}

FE_TOPIC_SRC = {
    "math": "openstax-calc",
    "ethics": "nspe-ethics",
    "econ": "openstax-finance",
    "statics": "libretexts-statics",
    "dynamics": "openstax-up1",
    "mom": "libretexts-mom",
    "materials": "libretexts-mom",
    "fluids": "openstax-up1",
    "surveying": "ngs",
    "water": "fhwa-hds5",
    "structural": "libretexts-mom",
    "geotech": "nrcs-ssm",
    "trans": "fhwa-geom",
    "construction": "osha-const",
}
FE_ALSO = {
    "math": ["ncees-ref"],
    "ethics": ["ncees-spec"],
    "econ": ["ncees-ref"],
    "statics": ["openstax-up1", "ncees-ref"],
    "dynamics": ["ncees-ref"],
    "mom": ["ncees-ref"],
    "materials": ["ncees-ref"],
    "fluids": ["ncees-ref"],
    "surveying": ["ncees-spec"],
    "water": ["usgs-water", "ncees-ref"],
    "structural": ["ncees-ref"],
    "geotech": ["usace-settle", "ncees-ref"],
    "trans": ["ncees-ref"],
    "construction": ["ncees-spec"],
}

def map_sources(card, kind):
    topic = card["topic"]
    if kind == "fe":
        # keep special-case sources when they actually support the item
        special = {
            "osha-const": "osha-const",
            "fhwa-mutcd": "fhwa-mutcd",
            "epa-waste": "epa-waste",
            "nspe-ethics": "nspe-ethics",
        }
        # topic overrides
        src = FE_TOPIC_SRC[topic]
        # wood
        if card["id"] == "fe079":
            src = "awc-nds"
        # hydrology/drainage more specific
        if card["id"] in ("fe110", "fe111", "fe113", "fe114"):
            src = "fhwa-hds5"
        if card["id"] in ("fe115", "fe116"):
            src = "fhwa-hec22"
        if card["id"] in ("fe117", "fe118") or (topic == "water" and "well" in (card["s"] or "").lower()):
            src = "usgs-water"
        if card["id"] in ("fe122", "fe123", "fe124", "fe125", "fe126"):
            src = "epa-waste"
        if "MUTCD" in (card["s"] or "") or "center line" in (card["s"] or "") or card["id"] in ("fe175", "fe176"):
            src = "fhwa-mutcd"
        if "trench" in (card["s"] or "").lower() or card["id"] == "fe188":
            src = "osha-const"
        if topic == "geotech" and card["id"] in ("fe161", "fe162"):
            src = "usace-settle"
        if card["id"] in ("fe163",):
            src = "usace-slope"
        if topic == "math" and any(w in (card["s"] or "").lower() for w in ("probability", "mean", "standard deviation", "normal", "histogram")):
            src = "openstax-stat"
        card["src"] = src
        also = list(FE_ALSO.get(topic, []))
        also = [k for k in also if k != src]
        card["also"] = also or None
    else:
        special_keep = {
            "hhs-hipaa": "hhs-hipaa",
            "nist-csf": "nist-csf",
            "cms": "cms",
            "cdc-precautions": "cdc-precautions",
        }
        topic_src = {
            "anatomy": "openstax-ap",
            "electricity": "openstax-up2",
            "healthit": "healthit",
            "function": "fda-devices",
            "troubleshooting": "fda-devices",
            "safety": "nfpa-99",
        }
        src = topic_src[topic]
        if card["id"] in ("cb014",) or "HIPAA" in (card["s"] or "") or "PHI" in (card["s"] or ""):
            src = "hhs-hipaa"
        if "CSF" in (card["s"] or "") or "NIST" in (card["s"] or ""):
            src = "nist-csf"
        if card["id"] in ("cb097",) or "CMS" in (card["s"] or ""):
            src = "cms"
        if "Standard precautions" in (card["s"] or "") or card["id"] == "cb096":
            src = "cdc-precautions"
        if card["id"] in ("cb091", "cb092", "cb093", "cb098", "cb099") or "leakage" in (card["s"] or "").lower() or "IEC" in (card["s"] or "") or "GFCI" in (card["s"] or "") or "microshock" in (card["s"] or "").lower():
            src = "iec-60601"
        if "SDS" in (card["s"] or "") or "Safety Data Sheet" in (card["s"] or ""):
            src = "cdc-precautions"  # not perfect; OSHA hazcom? keep cdc or osha-elec
            src = "osha-elec"
        card["src"] = src
        also = []
        if src == "iec-60601":
            also = ["nfpa-99"]
        elif topic == "safety" and src != "nfpa-99":
            also = ["nfpa-99"]
        elif topic == "healthit" and src != "nist-csf":
            also = ["nist-csf"]
        card["also"] = also or None
    if card.get("also") == []:
        card["also"] = None

if __name__ == "__main__":
    print("library ok", len(FE_SOURCES), len(CB_SOURCES))

TAIL = re.compile(
    r"(?:,\s*)?(?:which (?:is|are|has|have|would|misses|leaves|confuses|ignores|tests|governs|relates|rather)\b.*|as if\b.*|even (?:if|when|though|after|while)\b.*)$",
    re.I,
)

def strip_tail(s):
    t = TAIL.sub("", s).strip().rstrip(",")
    return t if t else s

def apply_card(card, rw):
    for k, v in rw.items():
        if k == "img" and v is None:
            card.pop("img", None)
            card.pop("imgAsk", None)
            card.pop("imgAlt", None)
        elif v is not None:
            card[k] = v

def convert_card(card):
    card["s"] = typeset_stem_formulas(typeset_text(convert_dollars(card["s"])))
    card["f"] = typeset_text(convert_dollars(card["f"]))
    card["c"] = [typeset_text(convert_dollars(x)) for x in card["c"]]
    if card.get("imgAlt"):
        card["imgAlt"] = card["imgAlt"]

def write_deck(path, header, cards, footer, sources, kind):
    header = replace_sources_block(header, sources)
    header = header.replace("practice deck (v21)", "practice deck (v22)")
    body = "\n".join(emit_card(c, kind) for c in cards)
    # header ends at 'cards: ['
    path.write_text(header + "\n" + body + footer)

def main():
    import importlib.machinery
    rw = importlib.machinery.SourceFileLoader(
        "v22_rewrites", str(ROOT / "tools/v22_rewrites.py")
    ).load_module().REWRITES

    # extra alts
    rw.setdefault("fe148", {})["imgAlt"] = "Soil phase diagram with volumes of air, water, and solids on the left and corresponding weights on the right."
    rw.setdefault("fe149", {})["imgAlt"] = "Soil phase diagram with volumes of air, water, and solids on the left and corresponding weights on the right."
    rw.setdefault("fe069", {})["imgAlt"] = "Mohr's circle with the normal-stress axis labeled to the right of the origin and shear vertical, and a marked X-face point."
    rw.setdefault("fe070", {})["imgAlt"] = "Mohr's circle axes with a marked stress point; the normal-stress axis is labeled to the right of the origin."

    for path, sources, kind in ((FE, FE_SOURCES, "fe"), (CB, CB_SOURCES, "cb")):
        header, cards, footer = load_file(path)
        for card in cards:
            for i in (0, 2, 3):
                card["c"][i] = strip_tail(card["c"][i])
            if card["id"] in rw:
                apply_card(card, rw[card["id"]])
            convert_card(card)
            map_sources(card, kind)
        write_deck(path, header, cards, footer, sources, kind)
        print("wrote", path, "cards", len(cards))

if __name__ == "__main__" and "--apply" in sys.argv:
    main()
