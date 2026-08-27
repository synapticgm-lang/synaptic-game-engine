# Document 4 — Phase 0 Benchtop Testing Protocol & Run-Sheet

**Status:** Controlled prototype test protocol. This is not a product-safety certification, site risk assessment or permission to energise an unreviewed prototype. A competent person must approve the local method of work before testing.

## 1. Objective and test article

The Phase 0 test article is a 300–500 mm diameter 3D-printed plenum sector or annular section with a representative 10 mm-equivalent slot, guide vanes, low-voltage blower, water/propylene-glycol coil, 3° condensate tray and non-hazardous instrumented fluid loop. No rotating wind assembly, lithium battery, PV source, mains circuit, grid interface or 1.5 kW IR element is permitted in this phase.

| Test parameter | Nominal value | Controlled limit |
|---|---:|---|
| DC supply | 24 Vdc laboratory source | Current-limited, fused, isolated low-voltage source. |
| Rig diameter | 300–500 mm | Printed geometry marked with revision. |
| Slot | 10 mm equivalent | Measure actual area before each test set. |
| Tray slope | 3° | Verify with digital inclinometer. |
| Coolant | Water or inhibited propylene-glycol mix | Record concentration, temperature and material compatibility. |
| Chiller input | 0.6 kW screening model only | Actual bench duty measured, never assumed. |

## 2. Assembly and safety procedure

1. Confirm current test-plan revision, rig ID, firmware revision, wiring diagram and risk assessment.
2. Inspect printed structure for cracks, sharp edges, loose fasteners, leaks, unprotected conductors and blocked tray/drain paths.
3. Fit the rig in a spill-contained, guarded area with clear access to an emergency-isolation switch. Keep electrical source above potential water path; use drip loops and strain relief.
4. Verify the laboratory DC source is de-energised before wiring. Fit branch fuse/current limit and confirm polarity with a meter.
5. Fill the hydronic loop, purge air, check connectors, inspect for leaks at static pressure, and establish a dry-run prohibition for the pump.
6. Install calibrated sensors and record instrument ID, range, calibration due date and measurement uncertainty. Use only suitable probes and leads for the environment.
7. Power only the controller first. Confirm all actuator commands are default OFF and that leak/pan/low-flow input states are visible.
8. Start pump at minimum command; prove flow before energising blower. Begin with ambient fluid and no cooling.
9. Run each test condition in the approved sequence. A second person observes any test that includes chilled fluid, a fault injection or water near electrical equipment.
10. Stop immediately for leak, unexpected heat/smell/noise, unstable structure, pump dry-run/no-flow, pan overflow, uncontrolled condensation outside tray, unexpected actuator start, sensor loss or any reading outside the run limit.
11. De-energise supply, discharge stored energy, allow surfaces to equilibrate, inspect and log condition before changing configuration.

HSE guidance supports planning work to be dead where practicable and tightly controlling any necessary live measurement; instruments must be appropriate and maintained. [1] [2]

## 3. Calibration checklist

| Instrument | Method | Acceptance before test |
|---|---|---|
| Anemometer | Compare against a traceable reference or controlled air source at three points. | Error within project test-plan tolerance; record correction factor. |
| Differential pressure | Zero with ports open; apply known pressure or laboratory reference. | Zero stable; range/correction recorded. |
| RTDs | Ice-point and controlled warm-point comparison with reference thermometer. | Record as-found deviation and correction; reject damaged/open probes. |
| T/RH sensor | Compare against calibrated chamber/reference where available. | RH/temperature offset logged; sensor dry and settled. |
| Flow sensor | Timed gravimetric or volumetric collection at three flows. | Pulses-per-litre factor entered in run sheet. |
| Electrical meter | Verify against known/reference source appropriate to range. | Current/voltage range and calibration status current. |
| Inclinometer | Compare against level/reference angle. | Tray slope confirmation documented. |

## 4. Eight-point experimental matrix

| Test | Objective | Controlled variables | Measurements | Pass criterion |
|---:|---|---|---|---|
| 1 | Fan PWM vs slot velocity. | 20/40/60/80/100% PWM; fixed coil obstruction. | PWM, supply V/I, slot velocity at 8 radial points, sound. | Repeatable velocity trend; no abnormal vibration. |
| 2 | Pressure drop. | Same fan points; inlet geometry recorded. | Differential pressure across plenum/slot. | Stable readings; no structural deflection/leak path. |
| 3 | Thermal duty versus flow. | Chilled-fluid setpoint; 3–5 flow rates; fixed fan PWM. | In/out water T, flow, air in/out T/RH, electrical input. | Calculate Q = m-dot × Cp × ΔT; report uncertainty. |
| 4 | Air Delta-T map. | Selected cooling conditions. | Air dry-bulb/RH at defined spatial grid. | Temperature pattern recorded; no unsupported whole-zone claim. |
| 5 | Condensation onset. | Step coil supply temperature toward dew point. | Ambient T/RH, calculated Magnus dew point, coil surface T, pan mass/level. | Pump throttle/inhibit activates before uncontrolled external wetting. |
| 6 | Leak fault latch. | Trigger leak sensor at safe condition. | Fault latency, output states, log entry. | Pump/fan outputs go safe per controller design; manual reset required. |
| 7 | Pan overflow latch. | Raise float to high level. | Fault latency, cooling output, drain behaviour. | Cooling/pump state complies with controlled fault response; no overflow. |
| 8 | Low-flow latch. | Restrict loop safely or simulate sensor loss. | Flow, commanded PWM, time-to-fault. | Fault occurs after allowed proving time; restart requires requalification. |

## 5. Data logging run-sheet

| Run ID | Date/time | Rig/FW rev | Test no. | Ambient T/RH | Dew point | Water in/out | Coil T | Flow L/min | Fan/Pump PWM | Slot velocity | ΔP | Input W | Calculated Q | Condensate | Fault/state | Pass/fail | Notes/reviewer |
|---|---|---|---:|---|---|---|---|---:|---|---|---:|---:|---:|---|---|---|---|
| | | | | | | | | | | | | | | | | | |
| | | | | | | | | | | | | | | | | | |
| | | | | | | | | | | | | | | | | | |

### Calculation definitions

| Measure | Formula | Notes |
|---|---|---|
| Dew point | Magnus formula using ambient dry-bulb and RH. | Record constants/firmware version used. |
| Hydronic duty | `Q = m-dot × Cp × (T_return − T_supply)`. | Use actual glycol concentration/temperature Cp and density. |
| Air-side ΔT | `T_air,in − T_air,out`. | Use defined, repeatable probe locations. |
| Fan electrical input | `Vdc × Idc`. | Record supply meter uncertainty. |
| Thermal effectiveness | `Q_measured / Q_input` where input boundary is defined. | Do not call efficiency without a defined energy boundary. |

## 6. Records and disposition

Each run requires raw logger files, calibrated-instrument record, photos of rig/configuration, firmware checksum, deviation report, pass/fail decision and review signature. Any out-of-tolerance instrument, uncontrolled leak, electrical anomaly, structural crack, unexpected wetting, repeated fault or unexplained discrepancy places the rig in **hold** pending corrective action and repeat test.

[1]: https://www.hse.gov.uk/pubns/indg354.htm "Electrical safety at work"
[2]: https://www.npl.co.uk/products-services/calibration "Calibration traceability"
