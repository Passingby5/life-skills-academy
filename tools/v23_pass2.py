#!/usr/bin/env python3
"""v23 pass 2: id-keyed, verified edits. Never patch by card index."""
from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("v23_apply", ROOT / "tools" / "v23_apply.py")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

# Lead-in sentences so the key's core phrase appears in the explanation.
LEADS = {
    "fe020": "Passing the FE exam is how you apply for EIT or engineer intern status in many jurisdictions.",
    "fe024": "A contract generally needs a bargained-for exchange, called consideration.",
    "fe038": "In equilibrium, the resultant force and the resultant moment are both zero.",
    "fe046": "The resultant of those equal, opposite, and collinear forces is zero.",
    "fe067": "Average axial strain is the change in length divided by original length.",
    "fe080": "The Marshall method is a laboratory design procedure for asphalt concrete.",
    "fe086": "The Bernoulli combination is mechanical energy per unit weight, also called head.",
    "fe094": "Absolute pressure equals gage pressure plus atmospheric pressure.",
    "fe111": "The gradient i in Darcy's law is the hydraulic gradient, or head loss per unit length.",
    "fe121": "A spillway is intended to pass flood flows safely so the dam is not overtopped.",
    "fe126": "Infiltration capacity drops when the soil is already wet, frozen, or sealed by intense rain.",
    "fe129": "Doubling the pinned length makes the Euler load one fourth as large.",
    "fe131": "On a statically determinate structure, reactions and internal forces can be found from equilibrium alone.",
    "fe135": "In strength design, service loads are factored, then combined using the specified load combinations.",
    "fe137": "A short column is limited by material strength, often called the squash load, not slender buckling.",
    "fe138": "Between the left support and the load, shear is P/2 on the left segment, toward the midspan load.",
    "fe139": "That beam is statically indeterminate.",
    "fe140": "Lateral-torsional buckling mainly concerns slender, unbraced steel beams bent about the strong axis.",
    "fe143": "The LRFD flexural limit for that member is the plastic moment capacity of the section.",
    "fe145": "A load path is the route loads take from where they are applied down to the foundation.",
    "fe148": "Void ratio is the volume of voids divided by volume of solids.",
    "fe151": "Effective stress is total stress minus pore-water pressure.",
    "fe159": "Terzaghi's terms are cohesion, surcharge, and soil weight, each with a bearing factor.",
    "fe160": "Increasing footing width increases the self-weight term of bearing capacity.",
    "fe161": "Primary consolidation is water leaving the voids as effective stress increases.",
    "fe163": "A common slope failure is a slip surface forming in weak soil or along a weak layer.",
    "fe166": "The liquid limit is the water content at the plastic-to-liquid boundary, from the cup or cone test.",
    "fe169": "Superelevation is used to help the vehicle change direction by tilting the roadway.",
    "fe178": "A flexible pavement is designed as layer thicknesses and materials over a prepared subgrade.",
    "fe179": "Rehabilitation is used for damage or a poor surface that hurts safety and service.",
    "fe182": "Intersection sight distance lets a driver see conflicting traffic in time to stop or enter safely.",
    "fe184": "Crash rates matter because they account for exposure, not only raw crash counts.",
    "fe185": "In design-bid-build, the owner will advertise and bid the work, then award it to a contractor.",
    "fe187": "OSHA's construction rules are meant to protect workers from recognized job-site hazards.",
    "fe188": "In a 6 ft trench, OSHA generally requires a protective system, unless a stated exception in the standard applies.",
    "fe198": "A section cut is used to show a vertical slice of hidden or typical work.",
    "fe200": "Shop drawings show how the contractor or fabricator will meet the design documents.",
    "cb002": "Gas exchange occurs in the alveoli of the lungs.",
    "cb005": "The prefix hypo- means below or lower than normal.",
    "cb013": "A UPS is used to bridge a short utility outage or transfer.",
    "cb014": "HIPAA requires staff to use or share PHI only as needed for treatment, payment, operations, or another permitted purpose.",
    "cb017": "PING is used to test whether a host is reachable and measure round-trip time.",
    "cb020": "On a dark workstation, first check power supply rails, connections, and whether the board posts.",
    "cb021": "Unpatched systems are a common path for malware and data breaches.",
    "cb022": "An access point is used to connect Wi-Fi clients to the wired network.",
    "cb024": "A default gateway is the router address a host uses to reach other networks.",
    "cb025": "A basic hardening set is unique accounts, authentication, and timely updates.",
    "cb026": "A virtual machine is a guest operating system running on a hypervisor, sharing physical hardware.",
    "cb027": "Cloud computing means using computing resources delivered over a network, often off site, under a service model.",
    "cb028": "A toner or cable tester is used to identify or verify a copper network run and its pairs.",
    "cb029": "Attacks on hospitals and clinics can disrupt care and expose PHI.",
    "cb030": "A KVM switch is used to share a keyboard, video, and mouse among computers.",
    "cb032": "Einthoven's triangle is formed by the three standard limb leads of the ECG.",
    "cb035": "A safety analyzer is used to measure leakage current, ground resistance, and similar safety points.",
    "cb036": "A physiologic simulator is used to provide known test signals, such as ECG, pressure, or SpO2, to a monitor.",
    "cb037": "Blood pressure is reported in millimeters of mercury (mmHg).",
    "cb038": "SpO2 is arterial oxygen saturation from light absorbed by a pulsatile vascular bed.",
    "cb039": "Capnography is used to follow carbon dioxide in exhaled gas, often during sedation or ventilation.",
    "cb040": "Telemetry is used to send physiologic waveforms from a mobile patient to a central station.",
    "cb042": "A PCA pump can let a patient request extra pain doses within programmed limits.",
    "cb043": "A ventilator is used to support or replace a patient's breathing.",
    "cb044": "A defibrillator is used to deliver a controlled shock for certain dangerous heart rhythms.",
    "cb045": "An electrosurgical unit is used to cut or coagulate tissue with a high-frequency current.",
    "cb047": "Steam sterilization uses saturated steam under pressure for a defined time and temperature.",
    "cb049": "A lab refrigerator or freezer keeps reagents and samples in a controlled temperature range.",
    "cb050": "Diagnostic ultrasound works by sending high-frequency sound and receiving echoes.",
    "cb051": "A DVM is used to measure voltage, current, or resistance in a circuit under test.",
    "cb052": "SCDs inflate garments on a limb in a cycle to help reduce stasis.",
    "cb054": "A suction regulator is used to control vacuum applied to a suction circuit.",
    "cb055": "A fetal monitor records fetal heart rate and uterine activity, such as a TOCO or IUP signal.",
    "cb056": "An anesthesia workstation is used to deliver a controlled mix of gases and anesthetic and support ventilation.",
    "cb058": "A fluid warmer is used to warm fluids or blood products before they are infused.",
    "cb059": "Spirometry is used to measure how much and how fast a person can move air.",
    "cb064": "If the pump is working as designed, treat the event as a use-related issue, after you confirm the pump behaves as designed.",
    "cb066": "When many units fail together, look for a shared-system problem, such as an access point, controller, or that unit's path.",
    "cb067": "If the bedside display is fine but the record is empty, confirm network settings, device ID, and the interface or middleware status.",
    "cb069": "Remove it from service, investigate, and repair or escalate per policy.",
    "cb072": "Treat it as a programming or configuration problem and keep the pump unused until it is correct.",
    "cb073": "Free-flow is a serious safety fault; take the pump out of service.",
    "cb075": "Protect the contents, take the box out of use as needed, and find why cooling and the alarm both failed.",
    "cb077": "Remove it from clinical dosing use until it is calibrated or replaced.",
    "cb080": "A good simulator reading with a bad patient waveform points to a poor peripheral signal, not a proved monitor failure.",
    "cb081": "Keep it out of service and repair or escalate it.",
    "cb084": "Keep the patient safe, use an emergency-unlock method if there is one, and do not force unknown parts.",
    "cb085": "The heater may overshoot because it does not see a true skin temperature.",
    "cb089": "Start with a fault in that pressure channel, its cable, or its transducer interface.",
    "cb090": "Before return to service, test the functions that were affected and complete the required documentation.",
    "cb091": "A protective earth conductor is there to provide a low-impedance fault path so protection can operate and touch voltage stays low.",
    "cb093": "A GFCI is designed to open the circuit when it detects a dangerous imbalance between hot and neutral current.",
    "cb094": "An SDS is used to identify chemical hazards and how to work with a product safely.",
}

# Extra explanation rewrites (full old, full new) when a lead-in is not enough or wording should change.
FULL_F = {
    "fe065": (
        "Because \\(\\sigma\\) is proportional to y, the extreme fiber (largest |y|) has the largest bending stress. The neutral axis has y=0, so \\(\\sigma=0\\) from bending.",
        "Because \\(\\sigma\\) is proportional to y, the farthest fiber from the neutral axis (the extreme fiber, largest |y|) has the largest bending stress. The neutral axis has y=0, so \\(\\sigma=0\\) from bending.",
    ),
}

# field is c0,c2,c3 or sometimes s/c1. Values are (old, new).
CHOICES = {
    # Ratio and length: FE unique-longest kept, wrongs brought within 1.3x.
    "fe092": {
        "c0": (r"\(\gamma bh\)", r"\(\gamma b^{2}h/2\)"),
        "c2": (r"\(\gamma bh^{2}\)", r"\(\gamma bh^{2}/4\)"),
        "c3": (r"\(\gamma bh/2\)", r"\(2\gamma bh^{2}\)"),
    },
    "fe134": {
        "c0": ("Occupancy load from people and furniture", "Occupancy live load from people, furniture, and movable contents"),
        "c2": ("Wind pressure on the walls", "Wind pressure on walls and other windward surfaces"),
        "c3": ("The earthquake inertial load", "The earthquake inertial load on the seismic mass"),
    },
    "fe137": {
        "c0": ("Elastic Euler buckling, as for a very slender column", "Elastic Euler buckling, the slender-column limit"),
        "c2": ("Lateral-torsional buckling of an unbraced beam", "Lateral-torsional buckling of an unbraced steel beam"),
        "c3": ("The plastic moment of a compact girder", "The plastic moment capacity of a compact girder"),
    },
    "fe147": {
        "c0": ("A high-plasticity clay", "A high-plasticity clay with low permeability"),
        "c2": ("Peat", "A peat or other highly organic soil"),
        "c3": ("A poorly graded sand", "A poorly graded clean sand with a narrow size range"),
    },
    "fe156": {
        "c0": (r"\(K_a\gamma H\)", r"\(K_a\gamma H^{2}/3\)"),
        "c2": (r"\(K_a\gamma H^{2}\)", r"\(2 K_a\gamma H^{2}\)"),
        "c3": (r"\(\gamma H/K_a\)", r"\(K_a\gamma H/2\)"),
    },
    "fe188": {
        "c0": ("No protection, treating 6 ft as a shallow excavation", "No protective system, treating a 6 ft trench as a shallow excavation"),
        "c2": ("A warning sign, and no sloping, shoring, or shield", "A warning sign only, with no sloping, shoring, or shield"),
        "c3": ("A walkway laid on the spoil pile", "A walkway laid on the spoil pile beside the trench"),
    },
    # CBET ratio: lengthen wrongs past the 1.3x floor; many also demote the key from unique-longest.
    "cb035": {
        "c0": ("Monitor a patient's bedside ECG during a procedure", "Monitor a patient's bedside ECG waveform during a clinical procedure"),
        "c2": ("Apply defibrillator energy to a patient in a code", "Apply defibrillator energy to a patient during a resuscitation code"),
        "c3": ("Sterilize surgical instruments in a steam cycle", "Sterilize surgical instruments in a timed steam sterilization cycle"),
    },
    "cb047": {
        "c0": ("Dry room air at 20 C for a timed interval", "Dry room air at 20 C circulated over the load for a timed interval"),
        "c2": ("A UV night-light mounted over a bench", "A UV night-light mounted over a bench as a substitute cycle"),
        "c3": ("A paper wrap, and no heat or steam in the cycle", "A paper wrap around the load, with no heat or steam in the cycle"),
    },
    "cb052": {
        "c0": ("Defibrillate the heart during a code", "Defibrillate the heart during a resuscitation code as if it were a therapy device"),
        "c2": ("Provide mechanical ventilation in the ICU", "Provide mechanical ventilation for an ICU patient who cannot breathe"),
        "c3": ("Measure end-tidal CO2 on a breathing circuit", "Measure end-tidal CO2 on a breathing circuit as a capnograph would"),
    },
    "cb057": {
        "c0": ("Measure SpO2 on a finger probe at the bedside", "Measure SpO2 with a finger probe at the bedside as a pulse oximeter would"),
        "c2": ("Warm IV fluids as its function in the OR", "Warm IV fluids as its designed function in the operating room"),
        "c3": ("Replace a steam sterilizer in central sterile", "Replace a steam sterilizer in the central sterile processing department"),
    },
    "cb072": {
        "c0": ("Tell the patient to ignore the lockout and keep using the pump", "Tell the patient to ignore the lockout interval and keep using the pump for demand doses"),
        "c2": ("Raise the limit yourself, past the ordered dose, and leave it in use", "Raise the lockout limit yourself, past the ordered dose, and leave the pump in clinical use"),
        "c3": ("Leave it in service because the motor still runs and the screen is lit", "Leave it in clinical service because the motor still runs and the screen is still lit"),
    },
    "cb075": {
        "c0": ("Leave the reagents in place until the next scheduled check", "Leave the reagents and samples in place until the next scheduled temperature check"),
        "c2": ("Turn the box into a backup room warmer for the lab", "Turn the failed box into a backup room warmer for the laboratory workspace"),
        "c3": ("Disable the remaining alarms so the display looks normal", "Disable the remaining temperature alarms so the display looks normal to staff"),
    },
    "cb082": {
        "c0": ("Finish a scheduled scale check before you go to the bedside", "Finish a scheduled scale performance check before you go to the bedside emergency"),
        "c2": ("Open the drive-gas circuit to confirm a tank size before you arrive", "Open the drive-gas circuit to confirm a tank size before you arrive at the bedside"),
        "c3": ("Reset the pump's preventive-maintenance interval in the CMMS first", "Reset the pump's preventive-maintenance interval in the CMMS before going to the bedside"),
    },
    "cb084": {
        "c0": ("Force the frame with a large pry bar as a first move", "Force the table frame with a large pry bar as a first repair move"),
        "c2": ("Cut the main structural weld as a first move", "Cut the main structural weld on the table as a first repair move"),
        "c3": ("Leave the room and skip telling the clinical team", "Leave the room and skip telling the clinical team that the table will not unlock"),
    },
    "cb092": {
        "c0": ("Macroshock applies to appliances, and microshock is a static-electricity term", "Macroshock applies only to large appliances, and microshock is merely a static-electricity term"),
        "c2": ("Microshock is a radio-frequency interference term used in telemetry", "Microshock is a radio-frequency interference term used in telemetry and wireless monitors"),
        "c3": ("They are two names for the same floor-outlet wiring test", "They are two names for the same floor-outlet wiring and grounding test"),
    },
    "cb096": {
        "c0": ("Skip hand hygiene when gloves are in the room", "Skip hand hygiene whenever gloves are already available in the room"),
        "c2": ("Reuse single-use needles to save money in the supply room", "Reuse single-use needles to save money in the clean supply room"),
        "c3": ("Eat in a soiled utility room to save time between cases", "Eat in a soiled utility room to save time between patient cases"),
    },
    "cb100": {
        "c0": ("The room is a quiet reading area for visitors", "The room is a quiet reading and waiting area set aside for visitors"),
        "c2": ("The room is equivalent to a waiting area for visitor safety", "The room is equivalent to a public waiting area from a visitor-safety standpoint"),
        "c3": ("The sign is decorative, for wayfinding only", "The sign is decorative and is posted only for hallway wayfinding"),
    },
    # More CBET unique-longest demotions / ratio-adjacent lengthening.
    "cb014": {
        "c0": ("Post patient records on a public website to aid a research study", "Post identifiable patient records on a public website to aid a research study"),
        "c2": ("Store PHI on a personal phone for convenience, off the hospital record system", "Store PHI on a personal phone for convenience, off the hospital record system entirely"),
        "c3": ("Share a password so a coworker can finish a chart after hours", "Share a login password so a coworker can finish a chart after hours"),
    },
    "cb016": {
        "c0": ("A public address that must be unique worldwide", "A public address that must be unique worldwide on the routed Internet"),
        "c2": ("A hardware MAC address burned into a network card", "A hardware MAC address burned into a network interface card"),
        "c3": ("A default public DNS server address", "A default public DNS server address used on the open Internet"),
    },
    "cb027": {
        "c0": ("A guarantee that HIPAA no longer applies once data leave the building", "A guarantee that HIPAA no longer applies once the data leave the building"),
        "c2": ("A requirement to keep every server in the same exam room", "A requirement to keep each hospital server in the same exam room"),
        "c3": ("A method for sterilizing instruments in a data center", "A method for sterilizing surgical instruments inside a data center"),
    },
    "cb038": {
        "c0": ("End-tidal carbon dioxide from exhaled gas on a breathing circuit", "End-tidal carbon dioxide measured from exhaled gas on a breathing circuit"),
        "c2": ("Core body temperature from a skin probe", "Core body temperature estimated from a skin-surface probe"),
        "c3": ("Invasive arterial pressure from a flush bag", "Invasive arterial pressure obtained from a pressurized flush bag"),
    },
    "cb039": {
        "c0": ("Take the place of pulse-oximeter readings on every case", "Take the place of pulse-oximeter readings on each monitored case"),
        "c2": ("Measure core temperature with a bladder or esophageal probe", "Measure core temperature with a bladder or esophageal temperature probe"),
        "c3": ("Deliver a controlled electrical shock during defibrillation", "Deliver a controlled electrical shock during defibrillation of a patient"),
    },
    "cb044": {
        "c0": ("Pace a chronic low heart rate as a permanent implant", "Pace a chronic low heart rate as a permanently implanted pacemaker"),
        "c2": ("Measure oxygen saturation", "Measure oxygen saturation with a pulse-oximeter probe"),
        "c3": ("Replace a wall suction regulator", "Replace a wall suction regulator on the headwall outlet"),
    },
    "cb048": {
        "c0": ("Ventilate a patient in an ICU bay", "Ventilate a patient in an ICU bay as a life-support ventilator would"),
        "c2": ("Deliver an IV bolus with a syringe", "Deliver an IV medication bolus with a handheld syringe"),
        "c3": ("Image a joint with X-rays in radiology", "Image a joint with diagnostic X-rays in the radiology department"),
    },
    "cb053": {
        "c0": ("Record an ECG as its only function", "Record a diagnostic ECG waveform as its designed function"),
        "c2": ("Measure only urine volume", "Measure urine volume in a drainage bag as its designed function"),
        "c3": ("Provide suction", "Provide continuous wall suction for airway clearance"),
    },
    "cb056": {
        "c0": ("Wash and sterilize instruments after a case", "Wash and sterilize surgical instruments after an operating-room case"),
        "c2": ("Store medical records for the anesthesia service", "Store medical records and anesthetic charts for the anesthesia service"),
        "c3": ("Measure a newborn's weight in the nursery after delivery", "Measure a newborn's weight on a scale in the nursery after delivery"),
    },
    "cb066": {
        "c0": ("A single patient's electrode pack, when several beds failed at once", "A single patient's electrode pack, even though several beds failed at once"),
        "c2": ("A single bed scale", "A single bed scale in one room, which would not take down the unit"),
        "c3": ("A single cracked otoscope bulb", "A single cracked otoscope bulb, which would affect only one exam tool"),
    },
    "cb067": {
        "c0": ("Replace the patient's IV catheter as a first technical step", "Replace the patient's IV catheter as a first technical step for a charting fault"),
        "c2": ("Increase the defibrillator energy", "Increase the defibrillator energy as a first step for a documentation fault"),
        "c3": ("Disable all logging", "Disable interface logging so the gap in the record is no longer visible"),
    },
    "cb069": {
        "c0": None,  # filled below if needed
    },
    "cb080": {
        "c0": ("A failed simulator, because it showed 98%", "A failed simulator, because the simulator still showed 98%"),
        "c2": ("A need to ignore oximetry alarms in the unit", "A need to ignore oximetry alarms at the bedside in the unit"),
        "c3": ("A steam leak", "A steam leak from a nearby sterilizer, unrelated to the oximeter"),
    },
    "cb083": {
        "c0": ("Start the case and hope the leak is small enough to ignore", "Start the case and hope the leak is small enough that it can be ignored"),
        "c2": ("Bypass the check because the last case was fine", "Bypass the leak check because the last case on that machine was fine"),
        "c3": ("Cover the leak with tape and proceed, skipping a leak test", "Cover the leak with tape and proceed to the case, skipping a leak test"),
    },
    "cb086": {
        "c0": ("Turn the power up to make up for a worn applicator", "Turn the output power up to make up for a worn or damaged applicator"),
        "c2": ("Let treatments continue with a note on the door", "Let scheduled treatments continue with a handwritten note on the door"),
        "c3": ("Ignore the test because the timer still works", "Ignore the failed output test because the treatment timer still works"),
    },
    "cb090": {
        "c0": ("Send it back and skip a function test, to save time", "Send it back to the floor and skip a function test, to save time"),
        "c2": ("Erase the work-order history so no one sees the fault", "Erase the work-order history in the CMMS so no one sees the fault"),
        "c3": ("Skip electrical safety checks that policy requires for that repair", "Skip the electrical safety checks that policy still requires for that repair"),
    },
    "cb091": {
        "c0": ("Carry the normal load current in place of the hot conductor, by design", "Carry the normal load current in place of the hot conductor, by design of the cord"),
        "c2": ("Make insulation unnecessary on each conductor", "Make insulation unnecessary on each current-carrying conductor"),
        "c3": ("Hold the plug in the outlet so it cannot be pulled out", "Hold the plug in the wall outlet so it cannot be pulled out"),
    },
    "cb093": {
        "c0": ("Increase leakage to the patient on purpose, as a monitor feature", "Increase leakage current to the patient on purpose, as a monitor feature"),
        "c2": ("Replace the equipment grounding conductor in a medical device power cord", "Replace the equipment grounding conductor in a medical device power cord entirely"),
        "c3": ("Measure ECG amplitude on a diagnostic recorder", "Measure ECG amplitude on a diagnostic electrocardiograph recorder"),
    },
    "cb094": {
        "c0": ("Record a patient's diagnosis in the chart", "Record a patient's clinical diagnosis in the medical chart"),
        "c2": ("Set a ventilator tidal volume for a new admission", "Set a ventilator tidal volume for a newly admitted ICU patient"),
        "c3": ("Assign an IP address to a bedside monitor", "Assign an IP address to a bedside physiologic monitor"),
    },
    "cb097": {
        "c0": ("It manufactures infusion pumps and sells them to hospital programs", "It manufactures infusion pumps and sells them directly to hospital programs"),
        "c2": ("It writes Ohm's law for electrical safety programs", "It writes Ohm's law as a regulation for hospital electrical safety programs"),
        "c3": ("It issues state PE licenses for hospital engineers", "It issues state PE licenses for hospital clinical engineers"),
    },
    "cb099": {
        "c0": None,
    },
    # Polish / ambiguity / grammar / remaining absurds.
    "cb098": {
        "s": (
            "Under IEC 60601-1, patient leakage current limits are tightest for which applied-part type?",
            "Under IEC 60601-1, which applied-part type has the tightest patient leakage current limits?",
        ),
        "c2": (
            "Type BF and type CF, which share the same AC patient-leakage limits",
            "Type B, which has tighter patient-leakage limits than type CF",
        ),
        "c3": (
            "A single chassis limit used for all applied parts, and no type distinction",
            "A single chassis limit used for every applied part, with no type distinction",
        ),
    },
    "cb002": {
        "c3": ("Skin surface only", "The dry outer skin surface, which is not a gas-exchange membrane"),
    },
    "cb003": {
        "c0": ("The digestive system only", "The digestive system"),
        "c2": ("The urinary system only", "The urinary system"),
        "c3": ("The integumentary system only", "The integumentary system"),
    },
    "cb015": {
        "c0": ("Subnet mask only", "The subnet mask by itself"),
        "c2": ("Default gateway only", "The default gateway by itself"),
        "c3": ("SSID only", "The wireless SSID by itself"),
    },
    "cb021": {
        "c2": ("Updates should be installed only after a breach is already underway", "Updates should be delayed until a breach is already underway"),
        "c3": ("Clinical systems should never be patched, even with a tested process", "Clinical systems should be left unpatched, even when a tested process exists"),
    },
    "cb023": {
        "c0": ("Always broadcasts every frame to every port, by design of a modern switch", "Broadcasts each frame to each port, by design of a modern switch"),
    },
    "cb025": {
        "c2": ("An always-open session that never locks", "An unlocked session that stays open on a shared workstation"),
        "c3": ("Administrator rights for every shared workstation login", "Administrator rights for each shared workstation login"),
    },
    "cb029": {
        "c2": ("Ransomware is only a concern for retail stores", "Ransomware is a concern for retail stores, not hospitals"),
    },
    "cb039": {
        # c0 already rewritten above if both; merge later
    },
}

# Numeric near-miss redistributions. Keys stay the same; only wrongs move.
# Make key the MIN (wrongs all larger) or MAX (wrongs all smaller).
NUMERIC = {
    # key MIN
    "fe001": {"c0": ("24", "28"), "c3": ("14", "52")},  # 6x+2=26; 6x=24 leftover, 2x^2 at 4=32 not used; 52=13*4
    "fe006": {"c3": ("1", "3")},  # pop sd vs sample; 3 is a plausible miss
    "fe015": {"c2": ("0", "8")},  # 0 was a mid/low; 3*2+4*1 typo
    "fe036": {"c2": (r"\(5\,\mathrm{kN}\)", r"\(25\,\mathrm{kN}\)")},
    "fe048": {"c2": (r"\(4\,\mathrm{kN}\)", r"\(18\,\mathrm{kN}\)"), "c3": (r"\(6\,\mathrm{kN}\)", r"\(16\,\mathrm{kN}\)")},
    "fe105": {"c2": ("2%", "6%")},
    "fe133": {"c0": ("2 m", "6 m"), "c3": ("0 m", "10 m")},
    "fe009": {"c3": ("8.5", "26")},  # 5+12=17 already; 5^2+1=26 slip
    "fe025": {"c0": ("$1,400", "$1,550"), "c2": ("$1,080", "$1,800")},
    "fe054": {"c0": ("20 J", "60 J"), "c2": ("10 J", "80 J")},
    # key MAX
    "fe002": {"c2": ("18", "8")},  # forgot to subtract / used 2*3^2? 18 was 2*9; 8 is 2*4 slip
    "fe005": {"c2": ("8", "4"), "c3": ("30", "3")},  # 30 is the sum, a useful miss for MIN actually... changing 30 removes a classic error. Use 4 and 3? 3 is median-ish. For MAX need both <6: 4 and 3. Lose the "forgot to divide" 30. Alternative: keep 30 for a MIN card instead. I'll keep fe005 as MAX with 4 and 5 already, change 30->3 and 8->4.
    "fe012": {"c2": ("4", "1"), "c3": ("100", "0")},
    "fe016": {"c3": ("20", "12")},
    "fe027": {"c2": ("$4,000", "$2,800")},
    "fe037": {"c2": (r"\(30\,\mathrm{kN}\)", r"\(10\,\mathrm{kN}\)")},
    "fe052": {"c2": ("48 m", "16 m")},
    "fe059": {"c2": (r"\(500\,\mathrm{MPa}\)", r"\(20\,\mathrm{MPa}\)")},
    "fe083": {"c2": ("98.1 kPa", "24.5 kPa")},  # half depth or 2.5 m
    "fe089": {"c0": (r"\(2.40\,\mathrm{m}^{3}/\mathrm{s}\)", r"\(0.90\,\mathrm{m}^{3}/\mathrm{s}\)") , "c3": (r"\(3.00\,\mathrm{m}^{3}/\mathrm{s}\)", r"\(0.40\,\mathrm{m}^{3}/\mathrm{s}\)")},
    "fe110": {"c3": (r"\(12.5\,\mathrm{m}^{3}/\mathrm{s}\)", r"\(2.40\,\mathrm{m}^{3}/\mathrm{s}\)")},
    "fe130": {"c3": (r"\(1,970\,\mathrm{kN}\)", r"\(500\,\mathrm{kN}\)")},
    "fe141": {"c0": (r"\(90\,\mathrm{kN\cdot m}\)", r"\(30\,\mathrm{kN\cdot m}\)") , "c2": (r"\(60\,\mathrm{kN\cdot m}\)", r"\(36\,\mathrm{kN\cdot m}\)")},
    "fe168": {"c3": ("200 m", "80 m")},
}


def apply_leads(cards_by_id):
    for cid, lead in LEADS.items():
        card = cards_by_id[cid]
        old = card["f"]
        if old.startswith(lead):
            continue
        new = lead.rstrip() + " " + old
        m.setf(card, "f", old, new, "echo key in explanation")


def apply_full_f(cards_by_id):
    for cid, (old, new) in FULL_F.items():
        m.setf(cards_by_id[cid], "f", old, new, "echo key in explanation")


def apply_map(cards_by_id, table, why):
    for cid, fields in table.items():
        card = cards_by_id[cid]
        for field, pair in fields.items():
            if not pair:
                continue
            old, new = pair
            if old == new:
                continue
            m.setf(card, field, old, new, why)


def main():
    m.LOG.clear()
    fe_header, fe_cards, fe_footer = m.load_file(m.FE)
    cb_header, cb_cards, cb_footer = m.load_file(m.CB)
    cards_by_id = {c["id"]: c for c in fe_cards + cb_cards}
    apply_leads(cards_by_id)
    apply_full_f(cards_by_id)
    # Merge numeric into a choice-like table
    apply_map(cards_by_id, CHOICES, "length, absolute, or wording")
    apply_map(cards_by_id, NUMERIC, "numeric spread")
    m.write_deck(m.FE, fe_header, fe_cards, fe_footer, m.FE_SOURCES)
    m.write_deck(m.CB, cb_header, cb_cards, cb_footer, m.CB_SOURCES)
    print("applied", len(m.LOG), "field edits on", len({a[0] for a in m.LOG}), "cards")
    for row in m.LOG:
        print(f"  {row[0]} {row[1]}: {row[2]}")


if __name__ == "__main__":
    main()
