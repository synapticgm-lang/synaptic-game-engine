# Final Engineering, Regulatory, Operations & Grant Asset Suite

> **Controlled draft — review before use.** This suite is an engineering-development and regulatory-planning record, not a UKCA/CE declaration, accredited test report, installation release, grant eligibility decision, safety certification or legal advice. The system must be reviewed by competent mechanical, structural, electrical, battery, EMC/radio, HVAC and product-compliance professionals before manufacture, field testing, supply or grant submission.

# 2. Electrical Loom & Wiring Harness Specification

## Harness architecture

The mast bushing is divided into four controlled passages: two fluid channels for 10 mm-ID EPDM hoses, one high-current direct-current passage, and one shielded low-energy sensor/data passage. The power and sensor passages are separated by continuous baffle material and exit at opposite sides of the bushing. No analogue sensor pair or radio feed may share a power passage; no cable tie may force an analogue/sensor cable into contact with a high-current conductor. Crossings outside the bushing are short and nominally perpendicular.

| Harness ID | Source connector | Target pinout | Wire / insulation | Colour | Terminal / connector | Shielding / routing | Max continuous current |
|---|---|---|---|---|---|---|---:|
| H-PWR-01 | Battery/BMS fused output | DC distribution + / – | 8 AWG / 8.4 mm² XLPE, 90°C minimum | Red / black | IP68 high-current bulkhead, manufacturer-qualified | Power passage only; abrasion sleeve, 25 mm service loop. | 60 A design limit pending derating. |
| H-PWR-02 | DC distribution | Pump branch + / – | 16 AWG / 1.3 mm² XLPE | Red / black | Deutsch DT or equivalent sealed 2-way | Power passage; twisted pair. | 10 A. |
| H-PWR-03 | DC distribution | Fan / blower + / – | 16 AWG / 1.3 mm² XLPE | Orange / black | Deutsch DT or equivalent | Power passage; twisted pair. | 10 A. |
| H-PWR-04 | Controller | Feather/brake/dump driver low-voltage outputs | 18 AWG / 0.82 mm² XLPE | Yellow / black | Sealed 2–4 way | Power passage; protected branch, no direct mains. | 5 A. |
| H-SEN-01 | Ambient sensor | ESP32 ADC/I²C conditioned input | 24 AWG / 0.20 mm² shielded twisted pair, Tefzel | White/blue pair | JST-GH internal; IP68 external transition | Sensor passage only; shield terminated at controller-end designated EMC point. | 0.25 A. |
| H-SEN-02 | Coil/water RTDs | AFE RTD+ / RTD– / sense | 24 AWG / 0.20 mm² shielded twisted pairs | White/red, white/green | JST-GH internal | Sensor passage; separate pairs; no shared return with PWM. | 0.10 A. |
| H-SEN-03 | Hall flow / anemometer / RPM | Conditioned digital inputs | 22 AWG / 0.33 mm² twisted/shielded | Violet/grey | Deutsch DTM or equivalent | Sensor passage; shield termination per interface test. | 0.25 A. |
| H-SEN-04 | Leak/pan float | Digital safety inputs | 22 AWG / 0.33 mm² twisted | Brown/white | Sealed 2-way | Sensor passage; normally-safe fault logic. | 0.25 A. |
| H-COM-01 | ESP32 service port | USB/serial service interface | 28 AWG shielded USB/serial cable | Standard USB | Sealed service bulkhead | Separate from DC power; cap when not in service. | 0.5 A. |
| H-IR-01 | Controller permit | Certified auxiliary interlock dry contact | 22 AWG / 0.33 mm², 300 V rated control cable | Blue/white | Isolated relay/terminal | No mains in controller harness; dry-contact only. | 0.25 A. |

**Harness acceptance:** 100% continuity and pinout test; insulation-resistance test appropriate to selected circuit; pull/strain relief test; visual check for seal, pin lock and label; resistance/voltage-drop check for high-current branches; shield termination check; controlled routing photograph. High-current source protection is placed close to the source; wire and protective device ratings are selected from actual current, inrush, bundling, ambient, voltage drop and prospective short-circuit current—not nominal 24/48 V alone. [1]

# 5. Comprehensive Design FMEA

Scoring is a development screening method: Severity (S), Occurrence (O) and Detection (D) are 1–10; `RPN = S×O×D`. Residual ratings require evidence after corrective action.

| Subsystem | Failure mode | Potential cause | Effect | S | O | D | Initial RPN | Corrective engineering action | Target residual RPN |
|---|---|---|---|---:|---:|---:|---:|---|---:|
| Pump/loop | Pump dry-run | Airlock, leak, empty reservoir, seized inlet. | Coil damage/no comfort; possible heat rise. | 8 | 4 | 4 | 128 | Flow prove timer, reservoir level, pump-current diagnosis, thermal cutoff, dry-run test. | 32 |
| Moisture control | Dew-point sensor drift | RH contamination, ageing, calibration loss. | Condensation outside tray. | 7 | 5 | 5 | 175 | Dual plausibility check, calibration interval, coil-margin conservatism, fault inhibit. | 42 |
| Drainage | Drain clogging | Biofilm/debris/kink/freeze. | Pan overflow/water into enclosure. | 8 | 5 | 4 | 160 | Cleanout, coarse screen, high-float latch, drain flush maintenance, overflow test. | 40 |
| Curtain/wind | Gust breakaway fails to release | Corrosion, wrong latch force, fabric snag. | Overturning/debris/structural overload. | 10 | 3 | 6 | 180 | Engineered release test, inspection tag, independent stow, retention/debris assessment. | 60 |
| Mast routing | Hose abrasion | Bushing failure, burr, vibration, bend violation. | Glycol leak / electrical contamination. | 9 | 4 | 5 | 180 | Radiused bushing, abrasion sleeve, fixed clamp spacing, endurance vibration test. | 45 |
| Battery | BMS communication loss | Harness damage, firmware fault, BMS reset. | Loss of monitoring/unsafe source availability. | 9 | 3 | 5 | 135 | Hardwired BMS fault output, default contactor-open, watchdog, safe-state verification. | 36 |
| Rotor | Generator overspeed in storm | Load loss, brake failure, sensor bias, turbulent gust. | Rotor damage/projectile hazard. | 10 | 3 | 6 | 180 | Independent mechanical/aerodynamic stow plus electrical brake/dump layers; overspeed test. | 50 |
| Power | DC branch short/arc | Chafe, wet connector, incorrect fuse. | Fire/burn/source collapse. | 10 | 3 | 4 | 120 | Source-adjacent DC-rated protection, insulated barriers, IP/strain relief, fault-current test. | 30 |
| Coil | Freeze or overtemperature | Faulty setpoint, chiller/hot loop failure. | Burst/leak or hot-surface damage. | 8 | 3 | 4 | 96 | Fluid selection, RTD plausibility, thermal cutouts, freeze/heat soak tests. | 24 |
| Electronics | PWM drive stuck ON | MOSFET/driver fail, reset-glitch. | Pump/fan/dump runs unintentionally. | 8 | 3 | 5 | 120 | Default-OFF hardware, watchdog, redundant enable, current monitoring, fault injection. | 32 |
| Structure | Base/anchor overload | Incorrect ballast/site/wind assumption. | Tip-over or structural damage. | 10 | 3 | 6 | 180 | Site-specific structural design, anchor inspection, operating limits, stow interlock. | 60 |
| Radio/diagnostics | Unauthorised service command | Weak BLE/serial protocol or browser misuse. | Unsafe override / loss of evidence. | 8 | 4 | 5 | 160 | Read-only default, authenticated sessions, physical service mode, command allowlist, audit log. | 40 |
| Condensate | Float switch stuck low | Fouling/cable fault. | Continued cooling during overflow. | 7 | 4 | 6 | 168 | Normally-safe input, periodic self-test, redundant level/flow evidence, cleaning schedule. | 42 |

# 6. UKCA / CE Technical Construction File Outline & Compliance Matrix

## Technical construction file index

| TCF section | Controlled content | Owner / retention |
|---|---|---|
| Product definition | Variant list, intended use, foreseeable misuse, markets, serialisation. | Product manager; revision-controlled. |
| Risk file | ISO 12100-style hazard/risk record, safeguarding, residual-risk warnings. | Systems safety lead. |
| Design record | Drawings, CAD, P&ID, wiring, PCB, BOM, critical components. | Engineering configuration manager. |
| Software | Firmware source/binary hash, diagnostic protocol, safety-state matrix, update procedure. | Firmware lead. |
| Verification | Structural, thermal, drainage, electrical, EMC/radio, ingress, environmental, field test reports. | Test lead. |
| Compliance | Applicable-regime rationale, standards list/current editions, declarations, marking/labels. | Compliance lead. |
| Manufacturing | Supplier controls, inspections, change control, traceability, non-conformance. | Operations lead. |
| Instructions | Installation, operation, maintenance, service, warnings, spare parts. | Technical publications lead. |

| Regime / standard family | Applicability screening | Required evidence / test method | External role |
|---|---|---|---|
| Supply of Machinery (Safety) Regulations 2008 / BS EN ISO 12100 | Likely if supplied as linked moving assembly with driven parts. Confirm final classification. | Risk assessment; guarding; emergency stop/control reliability; moving/hot/cold/water/maintenance hazards; instructions. | Competent machinery-safety engineer; Approved Body only if route requires. |
| Electrical Equipment (Safety) Regulations 2016 / LVD | Nominal 24/48 V DC alone is below 75 Vdc scope, but reassess if product includes higher-voltage/mains equipment. | Isolation/fault energy/thermal/ingress evidence; component and interface assessment. | Electrical engineer/test lab. |
| EMC Regulations 2016 / BS EN 61000-6-1 / -6-3 | Likely for electronic apparatus; exact environment/standards require selection. | Emissions/immunity pre-compliance and accredited test plan: ESD, RF immunity, EFT, surge, conducted/radiated emissions. | UKAS-accredited EMC lab preferred. |
| Radio Equipment Regulations 2017 | Likely if ESP32 Bluetooth/Wi-Fi is enabled for supply. | Module/host/radio assessment; spectrum, EMC, safety, antenna/software/configuration evidence; English instructions. | Radio test/compliance specialist. |
| IP / environmental | IP code and environmental claims only if tested on assembled product. | IEC 60529 test plan; temperature/humidity/UV/corrosion/vibration sequence selected to use case. | Accredited lab / environmental engineer. |

For GB, assess all applicable regimes cumulatively, compile controlled technical documentation and declarations, provide appropriate identification/instructions, and retain records for the required period. EMC/radio guidance explicitly states 10-year retention for technical documentation and declarations; re-check marking and standards status at market release. [2] [3] [4]

# 7. User Operation, Installation & Winterization Manual

## Safety and operating boundaries

Operate only after the base is installed to the approved site plan and inspected. Do not operate with curtains deployed above **18 mph measured gust threshold** or with canopy open above **35 mph measured gust threshold**; these are screening controls, not structural ratings. Stow and isolate before lightning, severe weather, unusual vibration, damage, leak, pan overflow, failed brake/stow, smoke, burning smell, hot battery enclosure or alarm. Keep people clear of moving components. Never bypass fuses, BMS, emergency isolation, guards, leak/pan devices or service interlocks.

## Assembly and base setup

1. Inspect delivery for damage and verify serial number/configuration against the controlled installation record.
2. Position base only on the approved level, load-bearing surface. Fit specified ballast or anchors exactly to the project-specific structural instruction; do not substitute mass or attachment method.
3. Insert mast, verify bushing seating and ensure hoses/power/sensor harness follow their designated passages without pinch, abrasion or bend violation.
4. Connect only keyed, dry, clean low-voltage connectors; inspect seals and strain relief. Do not connect auxiliary AC/IR equipment except through the approved physically interlocked enclosure.
5. Fit canopy/cassette/guards, perform a manual stow and check no curtain, cable or object can foul moving components.
6. Energise in service mode, inspect for alarms and prove flow/leak/pan inputs before normal operation.

## Hydronic fluid charging and air bleed

Use only the approved inhibited propylene-glycol mix and concentration for the expected minimum temperature and listed materials. With pump power isolated, inspect filter, tray and drain. Connect the controlled fill apparatus, fill slowly, vent through designated high-point air bleed, run pump at minimum service command only after liquid is present, and repeat venting until stable flow/noise-free circulation is confirmed. Check every fitting for leakage. Record fluid type, batch, concentration, date, pH/condition and freeze point where applicable. Never use automotive antifreeze or incompatible sealants.

## Winter mode and storage

Winter mode disables chilling, maintains only approved low-power monitoring and, where installed, uses auxiliary IR only through the certified interlocked power path. Before storage: stow canopy, isolate all energy sources, drain or protect loop to the approved freeze condition, flush condensate tray/drain, inspect and cap service ports, clean/dry filters, store battery in accordance with manufacturer instructions, and log maintenance. Do not leave a partially drained loop where trapped fluid can freeze.

## Maintenance schedule

| Interval | Activity | Pass / action |
|---|---|---|
| Before each use | Inspect mast, base, guards, connectors, drain, curtains and alarms. | Remove from service for crack, leak, corrosion, damaged cable or alarm. |
| Monthly in season | Clean filter, flush pan/drain, inspect hose/bushing, check flow and leak/pan input. | Record result; replace damaged components. |
| Quarterly | Inspect slip-ring/rotor guard per manufacturer procedure; verify stow/brake test; check fasteners. | Competent service person only. |
| Six-monthly | Verify sensor calibration checks, battery/BMS records, connector seals and firmware version. | Recalibrate/update only under controlled procedure. |
| Annually / after severe event | Structural/anchor review, wind/curtain inspection, full thermal/drain and fault function check. | Qualified engineer/service provider decision. |

# 9. Clean-Tech Grant Funding Proposal Draft — Innovate UK Smart-Grant Model

## Project vision and innovation

The project will develop and validate a modular outdoor micro-climate cassette that combines a low-profile radial air plenum, hydronic thermal loop, closed-loop thermal store, safeguarded 24/48 V nominal DC controls and sensor-based environmental control. The innovation is the integrated system architecture: an isolated 75 mm plenum with a 35° radial diffuser, engineered condensate management, segregated mast routing, dew-point-aware throttling, and controlled recovery/diversion of available thermal energy. The project is aimed at reducing the seasonal underuse of outdoor commercial space without assuming that a nominal low-voltage bus, energy-harvesting component or concept model is itself a safety or decarbonisation claim.

## Technical feasibility and roadmap

| Work package | Months | Technical question | Deliverable / gate |
|---|---:|---|---|
| WP1 Requirements and risk architecture | 1–3 | Can system boundaries, hazards and test metrics be frozen? | Controlled requirements, FMEA, risk file, verification matrix. |
| WP2 Plenum/thermal proof | 2–7 | Can slot velocity, pressure, thermal duty and drainage be made repeatable? | Phase 0 rig data with uncertainty and pass/fail record. |
| WP3 Control and energy routing | 4–10 | Can dew-point/flow/gust/fault logic fail safe and remain observable? | Hardware-in-loop and fault-injection evidence. |
| WP4 Full-scale engineering prototype | 8–15 | Can mechanical, hydronic, electrical and service interfaces coexist outdoors? | Integrated prototype and pre-compliance test plan. |
| WP5 Pilot and exploitation | 14–18 | Is there credible operator/OEM value and a manufacturable licence route? | Pilot evidence, OEM diligence pack, IP/commercial plan. |

## Market potential and UK impact

The first commercial route is through contract-canopy, hospitality, glamping/luxury patio and selected architectural-cowl partners rather than direct mass consumer sales. The project targets UK economic benefit through design engineering, specialist fabrication, control/electronics integration, testing, service capability and exportable licensing/know-how. Customer evidence must be obtained through structured discovery and pilot letters; the proposal should not assert hospitality revenue uplift or decarbonisation outcomes until measured against a defined baseline.

## Risk management and financial justification

The largest risks are mechanical wind/anchor safety, battery/source fault energy, unproven comfort performance, condensation, EMC/radio integration, supplier lead time, product liability and market adoption. Grant funding is justified only for genuine experimental development: instrumented prototypes, controlled trials, environmental/fault validation, scalability work and field-pilot evidence—not routine product finishing. The budget should separate labour, subcontracted specialist test work, materials, prototype tooling, travel and indirect costs, with records sufficient for claim substantiation.

**Smart Grants status:** Innovate UK guidance states Smart Grants were paused from January 2025 while tailored support was developed. A submission must therefore be made only against a live published opportunity and current question set, eligibility and cost rules. The last published rules are not an entitlement for a future call. [5] [6]

## References

[1]: https://webstore.iec.ch/en/publication/71256 "IEC 60204-1 machinery electrical equipment"
[2]: https://www.gov.uk/guidance/placing-ukca-or-ce-marked-products-on-the-market-in-great-britain "GB UKCA/CE guidance"
[3]: https://www.gov.uk/government/publications/electromagnetic-compatibility-regulations-2016/electromagnetic-compatibility-regulations-2016-great-britain "GB EMC Regulations guidance"
[4]: https://www.gov.uk/government/publications/radio-equipment-regulations-2017/radio-equipment-regulations-2017-great-britain "GB Radio Equipment Regulations guidance"
[5]: https://www.ukri.org/councils/innovate-uk/guidance-for-applicants/guidance-for-specific-funds/smart-innovation-funding-guidance/ "Smart funding status and guidance"
[6]: https://www.ukri.org/councils/innovate-uk/guidance-for-applicants/general-guidance/categories-of-research-and-development/ "Innovate UK R&D categories"
