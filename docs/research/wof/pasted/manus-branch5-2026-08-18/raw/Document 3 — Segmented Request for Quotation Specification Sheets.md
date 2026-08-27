# Document 3 — Segmented Request for Quotation Specification Sheets

**Controlled procurement document.** Each package is a separate disclosure lot. Issue only after supplier confidentiality acknowledgement or NDA, via a controlled channel with document version/date. No package grants a licence, guarantees an award or discloses the complete system architecture.

## Common RFQ instructions

| Requirement | Supplier response requirement |
|---|---|
| Quote basis | Unit price, MOQ, NRE/tooling, sample price, currency, Incoterms, payment assumptions, validity period. |
| Delivery | Prototype and production lead times, capacity/month, critical-path components, country of manufacture. |
| Quality | ISO status if held, inspection plan, material certificates, first-article report, traceability and non-conformance process. |
| Changes | No substitution, drawing/material/process change or subcontracting without written approval. |
| Confidentiality | Use information only to quote this lot; disclose only to need-to-know personnel/subcontractors; identify supplier background IP separately. |
| Response | State every assumption, exclusion, deviation, technical risk and item requiring clarification. |

## RFQ Package A — Mechanical Mast & Structural Hardware

### Scope

Supply a prototype-capable structural subassembly consisting of an aluminium mast, internal baffle/bushing interface features, ballast-base chassis interfaces and 316 stainless fasteners. The supplier is not being provided the full thermal/power/control architecture.

| Item | Requirement | Inspection / acceptance |
|---|---|---|
| Mast tube | 6061-T6 aluminium, nominal 50.0 mm OD / 44.0 mm ID, 3.0 mm nominal wall, straightness and concentricity reported. | Certificate of conformity/material cert; OD/ID measurement at both ends and midspan; visual defect check. |
| Mast length | Quote 2.5 m and 3.0 m cut lengths; ends deburred, capped/packaged against damage. | Length tolerance stated; no sharp edge capable of damaging hose/cable insulation. |
| Internal baffle interface | Provide accessible internal retention features or defined bore/finish supporting a removable 44 mm-ID routing bushing; no uncontrolled internal burrs. | Go/no-go bushing fit; borescope/visual check. |
| Base chassis interface | Ballast-capable, corrosion-resistant chassis interface; quote weldment and bolted versions separately. | Drawing approval, weld procedure if used, dimensional check, coating system stated. |
| Fasteners | 316 stainless, tamper/service mix proposed by supplier; isolate dissimilar metals where applicable. | Material confirmation, thread gauge check, torque specification. |
| Finish | Outdoor corrosion/UV compatible finish; identify coating, preparation and salt/UV evidence available. | Coating thickness report and cosmetic criteria. |

**Supplier exclusions:** Supplier shall not design wind anchorage, structural foundation, curtain release or rotor safety. These remain system-level responsibilities until separately contracted.

## RFQ Package B — Thermal Loop & Custom Radiator Assembly

### Scope

Supply a low-profile hydronic heat-exchanger/air-distribution subassembly and selected fluid-loop components. Do not infer the overall product or power architecture from this package.

| Item | Requirement | Inspection / acceptance |
|---|---|---|
| Coil/radiator | Cu/Al or proposed compatible material, 75 mm maximum package height, annular/sector-compatible interface, pressure rating stated. | Pressure/leak test certificate; measured envelope; fin/core condition. |
| Pump | 24 Vdc or 48 Vdc brushless EC circulation pump; quote separate options; provide pump curve using stated glycol concentration/temperature. | Serial/lot traceability; functional current/flow check; datasheet. |
| Hoses | EPDM insulated fluid hose, 10 mm nominal ID, actual OD/minimum bend radius/temperature/chemical compatibility stated. | OD/ID check, bend test, lot traceability. |
| Tray | 3° sloped drain tray, corrosion-compatible, cleanable, no stagnant pockets, outlet interface specified. | Slope/flow test; visual inspection; drainage within agreed time. |
| Quick-connects | Paired auxiliary chiller service couplings, keyed/valved or supplier-proposed equivalent, compatible with selected glycol. | Mate/de-mate and leak test; connection cycle rating. |
| Instrument interfaces | Provision for coil surface RTD, water inlet/outlet RTD, flow meter and pan-level float. | Interface dimension and thread/material confirmation. |

**Required supplier data:** thermal duty versus fluid flow/temperature/airflow; pressure drop; recommended filtration; materials list; glycol compatibility; cleaning and service instructions; failure modes; qualification/test evidence; prototype and production pricing.

## RFQ Package C — Power Electronics & Sensor Harness

### Scope

Supply a low-voltage controls and sensing subassembly. This package does not authorise grid-tie, mains, battery pack or wind-machine design. The contractor shall quote a controller carrier, harness and isolated low-voltage actuator interface only.

| Item | Requirement | Inspection / acceptance |
|---|---|---|
| Carrier PCB | ESP32 carrier board, 24/48 V protected input interface, separately fused/regulated low-voltage rails, hardware default-OFF outputs. | DFM review; PCB fab/assembly data; visual/AOI and functional test. |
| Sensor interfaces | Conditioned inputs for ambient T/RH, coil/water RTDs, Hall-flow pulse, anemometer, RPM, leak and pan float. | Pinout, input range, fault/open/short behaviour and calibration method. |
| Harness | Shielded sensor pairs where specified; segregated from high-current DC; keyed locking connectors, strain relief and outdoor-rated jacket. | Continuity/insulation test, pinout verification, pull/strain-relief result. |
| Actuator breakouts | Pump/fan PWM, feather/stow command, brake command, protected dump-load command and dry-contact auxiliary permit. | Default OFF on MCU reset; output load/EMC test; no mains switching on PCB. |
| MPPT interface | Interface only to an approved external MPPT controller; expose voltage/current/status telemetry through isolated/conditioned path. | Interface-control document and bench functional test. |
| Documentation | Schematics, Gerbers, BOM, firmware flashing/test fixture procedure, revision control and change notice. | Controlled document pack with revision IDs. |

### Supplier bid-evaluation matrix

| Criterion | Weight | Evidence |
|---|---:|---|
| Technical compliance and deviations | 30% | Completed requirements matrix. |
| Quality/test capability | 20% | Process certifications, inspection plan, sample reports. |
| Lead time/capacity/resilience | 15% | Production plan and critical-component risk list. |
| Prototype/NRE/production economics | 20% | Separated costed quote. |
| Information security/change control | 15% | Controlled-data and revision process. |

The project uses functional/performance requirements and segmented lots to reduce unnecessary disclosure. Any final supplier selection must reconcile interface risk, cost, quality and support responsibility rather than merely choose the lowest quote. [1] [2]

[1]: https://www.gov.uk/government/publications/procurement-act-2023-guidance-documents-define-phase/guidance-technical-specifications-html "Functional technical specifications"
[2]: https://www.gov.uk/government/publications/procurement-act-2023-guidance-documents-define-phase/guidance-lots-html "Lots and interface considerations"
