# Document 6 — Procurement & Bill of Materials Tracker

**Cost basis:** All values below are **non-binding planning allowances in GBP excluding VAT, freight, duties, test-house cost and installation**. They are not quotations, market prices or supplier commitments. Replace each allowance with controlled RFQ evidence before approval. Estimated lead times are planning windows only.

## Phase 0 — 300–500 mm benchtop proof-of-concept

| Part description | Exact specification | Manufacturer/distributor category | Estimated unit cost (£) | Lead time | Critical inspection criteria |
|---|---|---|---:|---|---|
| Printed plenum sector | 300–500 mm revision-controlled PETG/ASA/engineering polymer, 10 mm equivalent slot, 3° tray. | Local additive manufacturer / in-house FDM. | 80–250 | 1–2 weeks | Dimension, warpage, crack-free walls, slot area, tray slope, material batch. |
| Low-voltage blower | 24 Vdc centrifugal blower, PWM/tach capable, known fan curve. | Industrial fan distributor. | 45–120 | 1–4 weeks | Fan curve, current, tach response, vibration/noise, connector. |
| Prototype coil | Compact Cu/Al heat exchanger within 75 mm package height. | Thermal prototype supplier. | 120–350 | 2–6 weeks | Leak/pressure test, envelope, fin condition, material declaration. |
| DC circulation pump | 24 Vdc brushless, glycol-compatible, controllable; curve suitable for test head. | Pump/HVAC distributor. | 60–180 | 1–4 weeks | Pump curve, start current, dry-run limit, fluid compatibility. |
| EPDM hose | 10 mm ID insulated EPDM, compatible fittings. | HVAC/fluid distributor. | 35–80 | 1–2 weeks | ID/OD, bend radius, insulation, chemical compatibility. |
| Filter + fittings | Inline serviceable filter, barbs/threads compatible with hose. | Fluid handling distributor. | 40–100 | 1–2 weeks | Mesh size, pressure rating, seals, leak check. |
| Bench chiller/thermal source | Controlled chilled-fluid source sized only for test duty; no unguarded refrigerant work. | Laboratory/HVAC hire or supplier. | 300–1,200 | 1–6 weeks | Output range, flow, electrical safety, calibration/service status. |
| Laboratory PSU | Isolated 24 Vdc current-limited bench supply. | Test-equipment distributor. | 150–400 | 1–3 weeks | Current-limit function, calibration, leads and emergency isolation. |
| ESP32 carrier proto | Protected carrier with default-OFF actuator outputs. | PCB prototype assembler. | 180–600 | 3–8 weeks | Schematic/BOM rev, AOI, insulation/clearance review, functional test. |
| RTD set | Coil, water-in/water-out probes with compatible interface. | Instrumentation distributor. | 80–250 | 1–3 weeks | Calibration certificate or check, response time, waterproofing. |
| Ambient T/RH sensor | Conditioned T/RH assembly. | Instrumentation distributor. | 35–120 | 1–3 weeks | Comparison calibration, response time, enclosure. |
| Flow sensor | Hall/pulse or calibrated low-flow sensor. | Fluid/instrumentation distributor. | 30–120 | 1–3 weeks | Pulses/litre calibration, leak integrity, flow range. |
| Pressure transducer | Differential range matched to plenum test. | Test instrumentation distributor. | 100–350 | 2–5 weeks | Range, zero, calibration, tubing interface. |
| Anemometer | Vane/hot-wire appropriate to slot velocity. | Metrology distributor. | 150–700 | 1–4 weeks | Calibration status, probe geometry, resolution. |
| Leak/pan sensors | Conductive leak pad and float switch. | Industrial controls distributor. | 20–80 | 1–2 weeks | Fail-state logic, wet test, connector seal. |
| Safety/containment | Drip tray, guards, fuses, emergency isolation, labels, PPE. | Laboratory safety supplier. | 150–500 | 1–2 weeks | Functional isolation, coverage, inspection record. |

**Phase 0 planning subtotal:** £1,805–£5,400 excluding labour, freight, external calibration, chiller hire deposit and contingency. The range is the sum of the individual planning allowances and is not a quote.

## Phase 2 — Full-scale 2.5–3.0 m rig

| Part description | Exact specification | Manufacturer/distributor category | Estimated unit cost (£) | Lead time | Critical inspection criteria |
|---|---|---|---:|---|---|
| 6061-T6 mast | 50 mm OD / 44 mm ID, 2.5–3.0 m, deburred and protected. | Aluminium tube fabricator. | 180–450 | 3–8 weeks | Material cert, OD/ID/straightness, surface/burr inspection. |
| Mast separator bushings | 44 mm fit, two 10 mm-ID hose channels plus segregated power/sensor channels. | Additive manufacturer/moulding supplier. | 80–300 | 2–8 weeks | Fit, channel dimensions, vibration/thermal material suitability. |
| Structural base chassis | Ballast/anchor interface, corrosion protection, engineered load path. | Metal fabricator. | 700–2,500 | 6–12 weeks | Weld/coating report, dimensions, fastener interfaces; engineering sign-off separate. |
| Annular cassette/plenum | 2.5–3.0 m modular sectors, nominal 75 mm plenum, guide vanes/slot interface. | Sheet-metal/composite fabricator. | 1,500–5,000 | 8–16 weeks | Sector fit, slot area, seals, drainage, coating, assembly inspection. |
| Full-scale coil | Low-profile Cu/Al coil matched to plenum and selected fluid. | Custom heat-exchanger OEM. | 600–2,000 | 8–16 weeks | Pressure test, duty/ΔP report, material compatibility. |
| Thermal reservoir/PCM | Insulated serviceable reservoir, expansion, containment and PCM provision. | Thermal-management fabricator. | 600–2,500 | 6–14 weeks | Leak/pressure, insulation, serviceability, PCM documents. |
| EC pump + service loop | 24/48 V brushless pump, filter, quick-connects, EPDM hose. | HVAC/fluid OEM/distributor. | 400–1,200 | 4–10 weeks | Pump curve at actual glycol/temp, hose/fitting test, leak test. |
| PV canopy module set | Outdoor PV module(s), mounting, protection interface. | Solar hardware distributor. | 500–1,800 | 4–12 weeks | Module data, mounting interface, traceability, damage inspection. |
| PMSG/rotor guarded module | Controlled prototype rotating assembly; independent brake/stow retained. | Specialist wind/mechatronics fabricator. | 2,000–8,000 | 10–24 weeks | Guarding, balance, overspeed test evidence, vibration inspection. |
| MPPT/rectifier/DC-DC | Rated external power-conditioning modules. | Power-electronics OEM. | 500–2,000 | 6–16 weeks | Ratings, thermal test evidence, fault behaviour, documentation. |
| LiFePO4/BMS pack | Enclosed pack with chemistry-specific BMS and protection. | Battery-system integrator. | 1,200–4,500 | 8–20 weeks | Cell/BMS traceability, protection functions, enclosure/transport docs. |
| Dump-load/immersion path | Protected switching and reservoir-compatible heater. | Industrial heating/control supplier. | 350–1,200 | 4–10 weeks | Thermal cutoff, switching test, insulation and leak interface. |
| Controls/harness | Production PCB/carrier, shielded harness, outdoor connectors, sensors. | EMS and harness supplier. | 900–3,500 | 8–16 weeks | ICT/functional test, pinout, strain relief, documentation. |
| Validation test budget | Metrology, environmental/vibration/EMC pre-compliance, specialist review. | Accredited laboratory / engineering consultant. | 8,000–35,000 | 8–28 weeks | Scope, methods, calibrated records, reports and deviations. |

**Phase 2 planning subtotal:** £18,810–£69,950 excluding labour, shipping, installation, formal certification, structural foundation/anchorage, insurance, outdoor site works and contingency. This is a bottom-up planning range, not a valuation or purchase recommendation.

## Procurement controls and stage gates

| Gate | Required evidence before release |
|---|---|
| Phase 0 purchase release | Approved test protocol, risk assessment, controlled schematic, supplier quote comparison and bench isolation plan. |
| Thermal subsystem release | Fluid/material compatibility, pressure/flow basis, condensation/drain design review. |
| Electronics release | Pinout, default-OFF design review, fault matrix, EMC/pre-compliance plan and change-control owner. |
| Full-scale mechanical release | Signed structural load-path / anchorage review; wind/curtain/rotor hazard review; interface drawing freeze. |
| Rotor/power release | Independent overspeed/braking concept, source-isolation strategy, battery/BMS review and controlled test plan. |
| Pilot-site release | Installation method, weather limits, maintenance/rescue plan, operator training, insurance and local permissions confirmed. |

| Supplier risk | Control |
|---|---|
| Single-source component | Identify a qualified alternate, lifecycle status and last-time-buy risk before design freeze. |
| Counterfeit/untraceable electronics | Buy through authorised channels; retain lot/serial traceability. |
| Uncontrolled substitution | Written engineering change request, risk review and regression test before use. |
| IP leakage | Segmented RFQs, NDA/confidentiality acknowledgement, disclosure log and controlled drawing set. |
| Long-lead custom coil/cassette | Issue early market sounding; validate DFM, tooling/NRE, minimum order and sample gate. |

The tracker separates quoted data from planning allowances because supplier economics, lead time and availability are configuration- and date-dependent. RFQ outputs, not these assumptions, become the purchasing baseline.
