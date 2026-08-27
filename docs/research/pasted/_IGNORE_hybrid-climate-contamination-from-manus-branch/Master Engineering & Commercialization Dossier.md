# Master Engineering & Commercialization Dossier
## Hybrid Solar-Wind Hydronic Micro-Climate Parasol & Architectural Smart Roof Cowl

> **Status — conceptual pre-design, not construction drawings or a safety certification.** The two deployment models share subsystems but must be engineered, certified, insured, and commercialized as **separate products**. A freestanding public-access parasol with rotating hardware, liquid, batteries, and enclosure fabric is a safety-critical temporary structure; a roof cowl is a building-interface product. A UK structural engineer, electrical engineer, product-safety/conformity specialist, fire/roofing specialist, and patent attorney must sign off the actual design before manufacture, public occupancy, grid interconnection, or market claims. Numerical values below are transparent screening calculations based on stated assumptions, not product ratings.

## System architecture and feasibility position

| Product | Recommended product definition | What must not be claimed before testing |
|---|---|---|
| **Portable micro-climate parasol** | Low-voltage, shaded, fan-assisted zonal comfort device with a closed hydronic loop; PV offsets parasitic electrical demand; optional kinetic harvester is a tightly guarded secondary subsystem. | “45 mph safe” without site/configuration rating; whole-space HVAC; guaranteed temperature drop; dependable wind generation. |
| **Architectural smart roof cowl** | Roof-mounted ventilation terminal / fan-assisted cowl with optional PV and hydronic thermal integration, sold only with engineered curb/load path/site assessment. | Predictable rooftop wind harvest; passive ventilation at every wind direction; grid connection without DNO/product route. |

### Design recommendation before any PoC spend

1. **Decouple value from wind generation.** The first customer value is shade + quiet radial air movement + optional chilled/warmed hydronic coil. PV and battery can supply low-voltage fan/pump/control loads. Treat wind harvesting as an R&D option, not the primary energy case.
2. **Do not place unguarded rotating blades above occupants.** The stationary shield is helpful for shade and strobing, but it does not replace full guarding, containment, redundant overspeed protection, or a failure-safe stow state.
3. **Do not use a full vinyl enclosure in winds approaching 45 mph.** Screening moment calculations below show that it becomes a large sail requiring more than a tonne of unanchored equivalent ballast in some configurations. Product concept should use wind-limited removable panels or purpose-designed, anchored enclosure modules.
4. **Use a 24 V or 48 V SELV DC microgrid for the first parasol rig.** Keep mains/grid-tie/inverter work out of Phase 0–2. Use an approved external power supply/battery protection enclosure and a separate dump resistor rig.
5. **Make active rectifier/DC-DC control the baseline, not Delta–Wye switching.** Delta–Wye is a credible experimental differentiation path but introduces contactor-transient, fault-current, insulation, torque, and control risks. It does not create energy.

---

# Section 1 — Detailed Mechanical & Thermodynamic Engineering Specifications

## 1.1 Design assumptions used for preliminary calculations

| Parameter | Parasol screening assumption | Reason / limit |
|---|---:|---|
| Diameter, `D` | 2.0 / 2.5 / 3.0 / 3.5 m | Requested product span. |
| Airflow, `Q` | 0.07 / 0.11 / 0.16 / 0.22 m³/s | Conceptual quiet zonal-air envelope; verify by fan curve. |
| Total system static pressure, `Δp` | 40 / 60 / 85 / 120 Pa | Includes coil, plenum, diffuser and entry/exit loss allowance; not a final loss calculation. |
| Fan total efficiency, `ηfan` | 0.45 | Conservative small-system electrical-to-air estimate; measure final fan curve. |
| Perimeter slot width | 10 mm continuous equivalent | Sets a low first-order radial discharge velocity; final diffuser needs CFD/test balancing. |
| Ambient / coil-water temperature | 32°C / 7.5°C | Midpoint of requested 5–10°C cooling-fluid band. |
| Air density / specific heat | 1.20 kg/m³ / 1.005 kJ/kg·K | Screening values. |
| Coil effectiveness, `ε` | 0.22–0.30 | Preliminary compact-coil range only; supplier map or lab test supersedes. |
| Winter thermal input | 1.8 kW total | 1.5 kW IR plus illustrative 0.3 kW recoverable electrical heat; not a guaranteed wind-harvest value. |
| Wind screening speed | 20.12 m/s = 45 mph | Dynamic pressure `q = 248 Pa` at 1.225 kg/m³; distinguish mean vs gust in real design. |
| Centre of pressure height | 2.2 m | Example public-parasol geometry. |
| Ballast lever arm | 0.65 m | Example base radius/effective resultant; final base geometry changes result. |
| Screening factor | 1.5 | Concept-stage multiplier only; engineer applies code combinations. |

## 1.2 Airflow, plenum and diffuser model

### Governing relationships

```text
Continuity:              Q = A v
Fan/system operating point: Δp_fan(Q,N) = Δp_system(Q)
First system curve:      Δp_system = K Q²
Local loss:              Δp_loss = K_i (ρv²/2)
Straight-duct loss:      Δp_f = f(L/D_h)(ρv²/2)
Fan shaft/electrical:    P_electrical ≈ Q Δp_total / ηfan
Fan affinity (similar):  Q ∝ N D³ ; Δp ∝ ρN²D² ; P ∝ ρN³D⁵
```

The plenum must not be assumed to “compress” air in the pneumatic-storage sense. It is a **low-pressure distribution chamber**. Its design objective is uniform static pressure around the coil and diffuser, low recirculation, accessible condensate drainage, and predictable pressure loss. Fan catalogue free-air CFM must not be used as installed performance; AMCA identifies inlet/outlet system effects as material sources of fan-performance error. [1] [2]

| Diameter | Plan area | Screening `Q` | CFM | `Δp` | Fan electrical input at η=0.45 | Continuous 10 mm slot velocity | Interpretation |
|---:|---:|---:|---:|---:|---:|---:|---|
| 2.0 m | 3.14 m² | 0.07 m³/s | 148 | 40 Pa | 6.2 W | 1.11 m/s | Fan motor selection must include coil and guard loss; expect 20–60 W input after real system and control margin. |
| 2.5 m | 4.91 m² | 0.11 m³/s | 233 | 60 Pa | 14.6 W | 1.40 m/s | Good first full-scale comfort-rig point. |
| 3.0 m | 7.07 m² | 0.16 m³/s | 339 | 85 Pa | 30.2 W | 1.69 m/s | Central plenum and coil face area become decisive. |
| 3.5 m | 9.62 m² | 0.22 m³/s | 466 | 120 Pa | 58.6 W | 2.00 m/s | Requires low-noise, tested fan and active balancing; do not assume an axial fan can meet it. |

**How to calculate final diffuser area.** For `n` identical circular holes of diameter `d`, start from `A_open = nπd²/4`; select a target exit velocity `v_out` from comfort/noise/throw testing, then `A_open = Q/v_out`. Add discharge coefficient `C_d` experimentally: `Q = C_d A_open sqrt(2Δp/ρ)`. For a ring slot, `A_open = πD w φ`, where `w` is slot width and `φ` is open-area fraction. Use multiple sectors with measured pressure taps; tune each sector with replaceable balancing inserts.

### Recommended plenum cross-section

| Feature | Engineering recommendation |
|---|---|
| Fan location | Stationary central fan or impeller; do not rely on roof/rotor blades as the main comfort-air mover. |
| Coil position | Broad coil face downstream of fan only if flow is uniform; otherwise use an annular coil or baffle/straightener. |
| Plenum height | 75–125 mm is more credible than 50–100 mm for a serviceable coil/drain/baffle package; validate packaging and guard clearance. |
| Diffuser | Annular slot or repeated perforated sectors angled 30–45° inward/downward; sector zones need removable inserts. |
| Condensate | Sloped stainless/aluminium pan, isolated drain path, overflow sensor, removable clean-out; no drip path over occupants/electronics. |
| Noise | Target low tip speed, broad diffuser area, vibration isolation, and no nearby sharp inlet bend; verify sound pressure/sound power. |

## 1.3 Hydronic cooling model

### Heat-exchanger equations

```text
Air-side duty:    Qdot_air = m_dot_air cp_air (T_air,in − T_air,out)
Water-side duty:  Qdot_water = m_dot_water cp_water (T_w,out − T_w,in)
LMTD method:      Qdot = U A ΔT_lm F
ε–NTU method:     Qdot = ε C_min (T_hot,in − T_cold,in)
C_air = m_dot_air cp_air; C_water = m_dot_water cp_water
Pump input:       P_pump = V_dot_water Δp_water / ηpump
```

For `Tair,in=32°C`, `Tw,in=7.5°C`, density 1.2 kg/m³, and compact-coil effectiveness 0.22–0.30, the preliminary sensible capacity is:

| Airflow | `Qdot` at ε=0.22 | `Qdot` at ε=0.30 | Air outlet at ε=0.22 / 0.30 | Design implication |
|---:|---:|---:|---:|---|
| 0.07 m³/s | 0.441 kW | 0.612 kW | 26.6°C / 24.7°C | Local comfort assist; shade and air speed likely dominate. |
| 0.11 m³/s | 0.710 kW | 0.955 kW | 26.6°C / 24.7°C | Practical 2.5 m parasol test point. |
| 0.16 m³/s | 1.029 kW | 1.396 kW | 26.6°C / 24.7°C | Requires coil, reservoir, and condensate system sized for sustained duty. |
| 0.22 m³/s | 1.421 kW | 1.935 kW | 26.6°C / 24.7°C | Not a whole-patio cooling claim; crosswind/radiant load can erase perceived drop. |

The same calculated leaving temperature follows the assumed effectiveness, so it is **not validation**. Use an instrumented coil test matrix across `Tair`, RH/dew point, `Qair`, `Tw,in`, water flow, and wind. If coil surface drops below local dew point, design for condensate; 5–10°C water in hot/humid weather will commonly cross dew point. The thermal loop needs propylene glycol compatibility, expansion volume, air separator, pressure relief/vent strategy, fill/drain points, leak sensing, freeze logic, and accessible sanitation/cleaning procedure.

### Reservoir thermal-buffer example

```text
Thermal storage energy = m_water cp ΔT
For 40 kg of 30% PG/water, cp ≈ 3.7 kJ/kg·K, usable 10 K span:
E ≈ 40 × 3.7 × 10 = 1,480 kJ = 0.41 kWh thermal.
At 1.0 kW coil duty, that span lasts <25 minutes before recharge/losses.
```

A base reservoir therefore supports **short comfort bursts**, not a claim of all-day chilled operation, unless ice, mains/chiller, much larger mass, or an external thermal source is added. The first prototype should use an external chiller/ice bath for controlled performance testing; do not disguise charging energy.

## 1.4 Winter heat and waste-heat recovery

| Source | Thermal behaviour | Engineering constraint |
|---|---|---|
| 1.5 kW IR panels | Near-direct electrical-to-radiant heat. | Surface temperature, guarding, weather rating, fault isolation, glare and combustible-clearance design. |
| Generator/controller copper loss | `P_loss = I²R + switching/core losses`. | Valuable only when generation/motoring occurs; cannot be counted as independent renewable heat. |
| Dump-load immersion element | Converts surplus DC electricity to reservoir heat. | Must have independent high-limit, flow/stagnation/freeze logic; reservoir cannot be the only overspeed sink. |
| Hydronic coil | Delivers convective heat into radial airstream. | Low airflows can cause high discharge temperature; guard hot surfaces/occupant exposure. |

At 1.8 kW thermal into the stated airflows, the ideal dry-air temperature rise is `ΔT = Qdot/(ρQcp)`:

| Airflow | Ideal air rise at 1.8 kW | Interpretation |
|---:|---:|---|
| 0.07 m³/s | 22.50°C | Too hot/stratified for general occupant comfort; use lower heat/fan mixing. |
| 0.11 m³/s | 13.84°C | Still a local heater condition. |
| 0.16 m³/s | 9.47°C | Plausible local warm-air contribution. |
| 0.22 m³/s | 6.89°C | More uniform, higher fan/noise/power demand. |

For public hardware, thermal comfort should be evaluated using globe temperature, solar irradiance, air speed, RH, dry-bulb temperature, and user feedback—not only outlet air temperature. [3]

## 1.5 Structural/aerodynamic screening at 45 mph

```text
q = 0.5 ρ V² = 0.5 × 1.225 × 20.12² = 248 Pa
F = q C_f A_projected
M_overturn = F h_cp
Screening ballast mass = γ M_overturn / (g b)
```

The table below uses `C_f=1.2` and projected area `0.15 × plan area` as an **open, porous-canopy screening assumption**, versus `C_f=1.3` and `A_projected = D × 2.1 m` for a full-height vinyl enclosure. It assumes `h_cp=2.2 m`, `b=0.65 m`, and `γ=1.5`. It excludes gust/terrain/orography, vertical uplift, dynamic/vortex loading, anchor/paving failure, mast/rib strength, and fabric tear. A structural engineer must replace it with Eurocode wind actions and actual geometry. [4]

| Diameter | Screening unanchored ballast, open canopy | Screening unanchored ballast, full vinyl enclosure | Engineering conclusion |
|---:|---:|---:|---|
| 2.0 m | 72.5 kg | 700.9 kg | Full enclosure cannot be treated as a normal weighted parasol. |
| 2.5 m | 113.4 kg | 876.2 kg | Requires engineered anchorage or a lower wind/no-enclosure operating limit. |
| 3.0 m | 163.3 kg | 1,051.4 kg | A 3 m public pod requires engineered base/anchors and automatic stow well below storm conditions. |
| 3.5 m | 222.3 kg | 1,226.7 kg | Do not pursue freestanding enclosed SKU without structural redesign/anchoring. |

### Structural requirements

| Subsystem | Required analysis / test |
|---|---|
| Mast / hub / ribs | Combined bending, torsion, buckling, fatigue, local bearing, joint/prying and vibration modes. |
| Base / ballast | Sliding, overturning, uplift, bearing/punching, water/ice slosh, transport lock, vandalism, wheel lock. |
| Curtain system | All-open/all-closed/one-panel-open/missing panel/wet fabric/gust/repeated flex; tear and breakaway behavior. |
| Rotating layer | Guard containment, blade-release energy, bearing life, overspeed, balance, resonance, rain/UV/corrosion. |
| Roof cowl | Roof-zone wind suction, curb/fixings/load path, flashing, fire stopping, duct pressure, rain ingress, maintenance access. |

**Non-negotiable operating rule:** a freestanding parasol must have a deliberately engineered stow/lock state and a conservative measured-gust shutdown/stow threshold. “Operates to 45 mph” must not appear in marketing or instructions until site/configuration-specific engineering and test evidence exists.

---

# Section 2 — Electrical Engineering, Power Electronics & Smart Controls

## 2.1 Recommended electrical architecture

```text
           [Fixed PV canopy / optional rotating PV via sealed slip ring]
                                      │
                                  MPPT DC/DC
                                      │
 [PMSG / wind rotor]─rectifier/active converter─DC bus 24/48 V─fuse/contactors/pre-charge─LiFePO4 BMS pack
        │                                  │                        │                         │
 overspeed sensors                    diversion/dump load      DC fan/pump        isolated DC/DC controls
 mechanical/aero brake                      │                        │                         │
 independent E-stop                     thermal tank          coil / valves   sensors + controller + logging
                                      │
                         optional certified inverter / ATS / mains supplement
                                      │
                          IR panels / mains-only high draw (separate protection)
```

### Architecture decision table

| Block | Recommended beta specification | Notes |
|---|---|---|
| Bus | 24 V DC PoC; 48 V DC beta if conductors/current justify it. | SELV reduces shock exposure but not battery/fire/mechanical risk. |
| Motor/fan | Stationary EC axial or centrifugal fan, 24/48 V, tested curve at installed system resistance. | Do not use exposed roof rotor as comfort fan. |
| Kinetic harvester | Small PMSG + guarded rotor only in isolated Phase-2 rig. | Separate from parasol occupancy test. |
| Rectifier | Active rectifier preferred; robust 3-phase diode bridge acceptable PoC. | Measure heat/current/EMC; size for fault current. |
| Delta–Wye | Experimental three-pole/contactor network with break-before-make, current/speed inhibition and hardware interlock. | Active DC/DC control is baseline; Delta–Wye must not be sole power regulation. |
| Battery | LiFePO4 module with certified BMS, fuse, contactor/pre-charge, temperature sensors, IP-rated ventilated/serviceable enclosure. | Never place in unvented hot reservoir compartment. |
| Dump load | External guarded finned resistor bank first; later immersion element with independent high limit. | Thermal-load failure cannot remove overspeed protection. |
| PV | Fixed flexible/rigid modules with MPPT. | Rotating PV needs sealed rated slip ring and fatigue testing; avoid in PoC. |
| Inverter/grid | Not in PoC. Beta only with certified equipment, wiring, DNO route and competent design. | UK connection needs G98/G99/G100 assessment when grid-parallel. [5] |

## 2.2 Component-level electrical specification

| Component | PoC target | Beta target | Safety requirement |
|---|---|---|---|
| BLDC/EC fan controller | 24 V, 10–20 A continuous, tach/PWM control. | IP-rated 48 V controller, current/thermal telemetry. | Fuse close to source; locked connector; fault-off. |
| PMSG | Bench 3-phase 100–300 W class. | Engineered generator based on measured torque/speed/load case. | Guarded shaft; no public rotating proof before overspeed test. |
| Active rectifier/DC-DC | Bench current-limited module. | Custom/industrial module with current/voltage/temp telemetry. | Reverse-current, overvoltage, short-circuit, EMC validation. |
| Delta–Wye relays/contactors | 3-pole break-before-make, coil suppression. | Rated switching hardware with mechanical/electrical interlock. | Switch only under inhibited current/speed condition. |
| Slip ring | Avoid for initial rig. | Sealed multi-channel unit: power channels sized ≥125% continuous current, signal isolation, speed/IP/lifetime documented. | Emergency shutdown independent of ring. |
| MPPT | PV-input voltage/current per selected modules, load dump behavior specified. | Certified outdoor MPPT with telemetry. | No uncontrolled battery charge on communications fault. |
| BMS | Off-the-shelf protected pack. | Listed enclosure/system with cell taps, contactor, pre-charge and logging. | Cell temperature/voltage limits, fuse interrupt rating, service isolation. |
| IR | Bench low-voltage element for proof only. | Weather-rated guarded 1.5 kW panels on mains branch. | Independent overtemperature/RCD/earth/clearance design. |
| Sensors | Temp/RH, water temp/flow, leak, RPM, vibration, wind/rain, SOC. | Redundant overspeed sensor and independent thermal high-limit. | Single sensor failure produces safe state. |

## 2.3 Delta–Wye and braking decision

For a balanced three-phase winding:

```text
Wye:   V_LL = √3 V_phase ; I_L = I_phase
Delta: V_LL = V_phase    ; I_L = √3 I_phase
```

This switching changes usable voltage/current characteristics; it does not improve the wind resource or bypass generator heating. State transition must be:

```text
IF rotor speed/current outside safe switching envelope: HOLD current topology
ELSE command inverter/rectifier current to zero → confirm Iphase < threshold
→ inhibit gate drive / discharge transient path → open topology A
→ verify auxiliary contact open → close topology B (break-before-make)
→ verify auxiliary contact closed → wait settling time → enable controlled rectification
→ compare VLL, Iphase, temperature, vibration against expected window
→ revert to safe load / mechanical shutdown on any mismatch.
```

### State machine

```text
SAFE_STOW
  → SELF_TEST (water/leak/fuse/BMS/sensor/guard checks)
  → SOLAR_AIR_MODE if PV/battery adequate and wind below parasol operating threshold
  → HYDRONIC_COOL if coil water temp, flow, condensate path, dew-point logic valid
  → HYDRONIC_HEAT if user demand, guarded IR source, flow/high-limit valid
  → WIND_HARVEST_TEST only in guarded configuration and wind envelope valid
  → DUMP_DIVERSION if battery/loads cannot accept energy
  → MAINS_SUPPLEMENT_HEAT only with approved fixed installation and electrical interlock
  → FAULT_SAFE on overspeed, gust, vibration, leak, high temp, low flow, isolation, BMS, sensor disagreement
FAULT_SAFE → fan/pump stop or safe purge as required; generator brake/aero stow; isolated IR; preserve fault log.
```

### Minimum control pseudocode

```text
read sensors; validate sensor freshness and cross-check redundant overspeed inputs
if e_stop || guard_open || leak || BMS_fault || insulation_fault: enter FAULT_SAFE
if mode == parasol && gust > deploy_limit: command STOW; inhibit wind mode; notify user
if generator_rpm > rpm_trip || vibration > trip: activate independent braking layers; enter FAULT_SAFE
if battery_soc > max || dc_bus > max: enable dump load; if temperature/load invalid, mechanical/aero shutdown
if cooling_request && water_flow > min && coil_temp > freeze_limit && condensate_drain_ok:
    modulate pump/fan to comfort setpoint and dew-point constraint
else if heating_request && high_limit_ok && guard/temp_clearance_ok:
    sequence fan/pump/IR; cap output by surface and outlet-air temperature
else: run ventilation-only or off
commit time-series data; never make control safety dependent on cloud connectivity
```

## 2.4 Critical electrical caveats

1. Battery disconnect, full battery, inverter fault, pump failure, and communications loss are separate fault cases. The dump load and overspeed strategy must survive each one.
2. A shorted-generator electrical brake may create destructive copper/diode torque and heat. It is a layer, not the only layer.
3. A hydronic thermal tank is not a guaranteed dump load: it may be full, hot, frozen, leaking, stagnant, or unpumped.
4. Grid-tie and automatic transfer switch design materially change the product’s legal/electrical route. Keep beta behind-the-meter/mains-isolated until reviewed. [5] [6]

---

# Section 3 — Comprehensive Bill of Materials & Component Sourcing

> **Cost basis:** planning ranges in GBP, ex-VAT, low-volume 2026 estimates; not supplier quotes. Obtain three written quotations before a purchase decision. Supplier names below are category examples, not endorsements or availability representations.

## 3.1 Desktop functional PoC BOM

| Subsystem | Recommended component/material | Qty | Est. unit £ | Est. extended £ | Supplier category |
|---|---|---:|---:|---:|---|
| Structure | 3D-printed PETG/ASA plenum segments; aluminium tube stand. | 1 | 80–180 | 80–180 | Local FDM / McMaster-type hardware. |
| Fan | 120–200 mm 12/24 V EC axial or centrifugal blower with curve. | 1 | 30–120 | 30–120 | Electronics/fan distributor. |
| Coil | PC AIO radiator, copper/brass or aluminium, 120/240 mm. | 1 | 35–120 | 35–120 | PC cooling specialist. |
| Pump/reservoir | 12/24 V brushless pump + 5–10 L insulated reservoir. | 1 | 40–120 | 40–120 | Fluidics/PC cooling. |
| Fluid loop | EPDM/silicone hose, clamps, propylene glycol mix, small drain pan. | 1 | 35–100 | 35–100 | Laboratory/fluidics. |
| Power | 24 V bench supply, fuses, DC breakers, inline watt meter. | 1 | 100–300 | 100–300 | Lab electronics. |
| Controls | Microcontroller, temp/RH, flow, leak, tach, pressure sensor. | 1 | 50–150 | 50–150 | Mouser/Digi-Key class. |
| Air measurement | Pitot/anemometer, manometer, smoke wand. | 1 | 100–350 | 100–350 | Test instrumentation. |
| Wind bench | Small PMSG/BLDC test motor, rectifier, resistor bank. | 1 | 80–250 | 80–250 | Motion-control/electronics. |
| Safety | Mesh guard, E-stop, clear shield, fire-safe test tray. | 1 | 80–250 | 80–250 | Safety/lab supplier. |
| **PoC estimate** | Excludes CAD/software/time. |  |  | **£630–£1,940** |  |

**PoC success is not visual resemblance.** It must measure: `Q–Δp`, diffuser uniformity, coil duty from both air/water side, condensate onset, fan/pump electrical input, control faults, and a guarded generator/dump-load demonstration.

## 3.2 Full-scale beta prototype BOM

| Subsystem | Specification | Qty | Est. extended £ | Build note |
|---|---|---:|---:|---|
| Mast/base | 6061-T6 aluminium or galvanised steel engineered mast; fabricated steel/ballast base or anchor interface. | 1 | £1,500–£6,000 | Actual sections/fixings only after structural design. |
| Canopy/shield | UV-stable coated fabric/composite canopy; rigid stationary blackout shield; 316 SS/Al fasteners. | 1 | £1,000–£4,000 | Shield must be fully guarded and serviceable. |
| Plenum/diffuser | Powder-coated aluminium/ASA composite annular plenum, baffles, drain pan, replaceable diffuser inserts. | 1 | £1,500–£5,000 | Avoid water traps and sharp acoustic edges. |
| Fan module | Tested EC fan/blower, isolators, inlet guard, service hatch. | 1 | £500–£2,000 | Select after system curve. |
| Coil/pump | Copper/aluminium coil, EC pump, expansion/air separator, EPDM hoses, valves, glycol. | 1 | £800–£3,000 | Material compatibility and drainability mandatory. |
| Battery/PV | Fixed modules, MPPT, listed LiFePO4 pack/enclosure, DC protection. | 1 | £1,500–£6,000 | PV area/geometry and fire route drive cost. |
| Wind R&D package | PMSG, guarded rotor/containment, rectifier/controller, brake/dump resistor. | 1 | £2,000–£10,000 | Keep isolated from public-use beta until proven. |
| Sensors/control | Industrial controller, weather/RPM/vibration/leak/flow sensors, local HMI, logging. | 1 | £1,500–£6,000 | Local fail-safe logic; no cloud dependency. |
| Heating | Guarded, rated IR panels, contactors, high limits, mains enclosure. | 1 | £800–£3,000 | Separate qualified electrical scope. |
| Enclosure | Marine clear vinyl, UV-rated zips/rails, engineered vents/breakaways. | 1 | £1,000–£4,000 | Treat as low-wind-only accessory. |
| Test/certification | Fabrication jigs, instrumentation, engineering/structural/electrical/testing. | 1 | £15,000–£80,000+ | Often exceeds hardware BOM. |
| **Beta hardware** | Excludes certification, IP and field installation. |  | **£12,100–£49,000** | R&D wind/roof route can multiply this. |

## 3.3 Material and manufacturing choices

| Component | Preferred material | Why | Avoid / watch |
|---|---|---|---|
| Structural mast/plenum | 6061-T6 aluminium, stainless fasteners, powder coat/anodising. | Weight/corrosion/manufacturability. | Galvanic couples; fatigue at welded joints. |
| High-load hub/blade | Qualified aluminium/composite only with analysis and test. | Stiffness/weight. | Amateur carbon layup for occupied-area rotor. |
| Hydronic loop | Copper/brass or compatible aluminium coil; EPDM hose; PG coolant. | Thermal/temperature compatibility. | Mixed-metal corrosion, incompatible glycol additives. |
| Seals | EPDM/silicone depending temperature/fluid. | Weather/heat resistance. | PVC hardening, unsupported claims. |
| Shield | Aluminium/composite fire/weather-rated panel. | Shade/guard/durability. | Clear/reflective surfaces causing glare/strobe. |
| Curtain | Marine-grade clear PVC only as low-wind accessory, UV/tear tested. | Visibility/weather. | Treating it as structural diaphragm. |

---

# Section 4 — Prototyping Roadmap: Phase 0 to Production-Ready MVP

| Phase | Objective | Build/test scope | Gate to proceed |
|---|---|---|---|
| 0 — Desktop PoC | Prove air/hydronic physics. | 0.5–1.0 m plenum; fan curve; coil balance; drainage; basic control faults; guarded motor/dump resistor. | Air and water duty agree within ±15%; no unsafe temperature/leak/control fault. |
| 1 — CAD/CFD / FEA | Select geometry and reject bad architectures. | Parametric plenum/diffuser, coil face/baffle, canopy/guard; CFD with turbulence sensitivity; structural/modal screening. | CFD predicts measured PoC within pre-set tolerance; no unguarded rotor concept persists. |
| 2 — Full-scale functional rig | Measure real installed performance. | 2.5–3.0 m stationary fan/shield/plenum/hydronic rig; no public occupancy; instrumented base. | `Q–Δp`, coil, noise, drainage, vibration, base loads meet design envelope. |
| 3 — Environmental hardening | Prove weather/service/fault tolerance. | IP/rain/spray, UV/freeze-thaw, corrosion, gust/stow, fabric cycle, sensor/battery/dump-load failures. | Hazard log residual risks acceptable to engineers. |
| 4 — Controlled field beta | Validate comfort/value and operations. | Anchored supervised sites, no enclosure above defined wind, seasonal measurement, user study. | Verified comfort, availability, maintenance and cost data. |
| 5 — Production MVP | Productize one use case. | Separate parasol or roof-cowl SKU, technical file, conformity route, install/manual/service design. | External testing, insurer/channel/technical file complete. |

### Instrumentation pack

- Differential pressure taps: inlet, coil face, plenum quadrants, diffuser sectors.
- Air velocity traverse / hot-wire or vane anemometry; smoke visualisation.
- Air dry-bulb/RH/dew point upstream/downstream and comfort zone; globe temperature and solar irradiance outdoors.
- Water inlet/outlet temperature, flow, pressure, reservoir mass/temperature, leak/condensate mass.
- Power analyser on PV, battery, fan, pump, heater, rectifier/dump load.
- RPM, vibration/accelerometer, strain/load cell at mast/base, wind speed/direction/gust.
- Acoustic measurement with documented distance/background/wind conditions.

### Phase-0 test matrix

| Test | Independent variable | Acceptance example |
|---|---|---|
| Fan system curve | Fan PWM × diffuser insert × coil state. | Stable operating point; no surge/stall; sector flow CV within target. |
| Coil | Water temp/flow × air flow × ambient RH. | Air- and water-side `Qdot` energy balance within ±15%. |
| Condensate | RH/dew point × coil temp × drain slope. | No overflow/drip to occupied/electrical zone. |
| Heating | IR/hydronic power × airflow. | Guard/surface/outlet temperatures below defined safe values. |
| Controls | Sensor disconnect/stuck/out-of-range. | Safe state within defined response time. |
| Wind electrical | Load/battery/dump topology × rotor speed. | No overvoltage/thermal excursion; stopping mode tested. |

# Section 5 — Intellectual Property Strategy, Prior Art & Legal Runway

> **IP disclaimer:** This is a research and drafting framework, not a patentability, freedom-to-operate, infringement, validity, regulatory, or legal opinion. Novelty is judged claim-by-claim against prior art and often turns on material not found in a quick public search. Instruct a UK/European patent attorney before disclosure, sale, crowdfunding, trade-show demo, non-confidential pitch, or detailed public video.

## 5.1 Claimable invention architecture

Do not attempt to own “a solar umbrella,” “a wind turbine,” “a radiator,” or “a roof cowl” broadly. Individual categories are crowded. Build a claim chart around **specific cooperating interfaces** and **safety/control results**.

| Candidate claim family | Potential technical nucleus | Evidence needed before filing/continuation |
|---|---|---|
| Protected micro-climate plenum | Stationary opaque shield under a rotating/air-moving layer, sized plenum, radial diffuser geometry, coil location and condensate path producing verified distributed comfort flow. | CFD + measured sector pressure/flow, shielding/strobe evidence, thermal/drain test. |
| Hybrid hydronic energy routing | Control logic routes generator/controller/IR/dump heat into an isolated PG loop/reservoir while enforcing water-flow, temperature, fault and demand constraints. | State diagrams, thermal test, fault table, sensor/actuator evidence. |
| Kinetic conversion protection | Defined independent overspeed layers and safe electrical transition coupled to wind/rotor state and thermal diversion. | Dyno/fault-injection data; brake/dump/transition tests. |
| Modular parasol-to-cowl platform | Shared power/thermal/control cassette with different structural/air interfaces and installation constraints. | Interface drawings, serviceability, product split. |
| Comfort/safety controller | Local conditions choose fan/pump/heat/stow state, not simply ambient temperature; fails safe on sensor disagreement/condensation/gust. | Sensor calibration, false-state tests, measured comfort map. |
| Visual/industrial design | Distinct shield, plenum rim, base, canopy/curtain language, roof silhouette. | CAD render/drawings; date-controlled design record. |

**Patent drafting caution:** “Delta–Wye switching” is potentially a narrow dependent implementation. An active rectifier/controller may be more commercially robust, and dependent claims should cover alternative winding/control arrangements rather than making a relay sequence the core of the platform.

## 5.2 Relevant CPC / IPC search classes

| Area | Illustrative CPC / IPC starting codes | Search use |
|---|---|---|
| Umbrellas/parasol structures | A45B 11/00 and related umbrella/canopy subclasses | Canopy, mast, shade, base, deployment. |
| Wind motors/turbines | F03D 1/00, F03D 3/00, F03D 9/00 and related control/support subclasses | Rotor, vertical-axis, overspeed, building integration. |
| Ventilation / air handling | F24F 7/00, F24F 13/00 and related fan/duct/outlet classes | Roof cowl, plenum, diffuser, ventilation terminal. |
| Heating / heat exchange | F24H, F24D, F28D/F28F families | Hydronic loop, radiant/thermal store, coil/heat exchanger. |
| Electrical machines | H02K; motor-generator and control subclasses | PMSG, motor drive, winding connection. |
| Power management/storage | H02J 7/00; H01M; H02P | Battery charging, conversion, dump/control. |
| PV | H01L 31/00 families | PV canopy/solar collection. |
| Sensor/control | G05B / G01P / G01K-related classes | Sensor-assisted stow, wind/thermal control. |

Classification labels change and are not a legal conclusion. Verify codes through Espacenet/WIPO/UK IPO search interfaces at the time of search. [7] [8]

## 5.3 Prior-art search protocol

### Search strings

| Cluster | Boolean / keyword concept |
|---|---|
| Solar parasol | `(solar OR photovoltaic OR PV) AND (umbrella OR parasol OR canopy) AND (fan OR battery OR cooling)` |
| Wind parasol | `(umbrella OR parasol OR canopy) AND (wind turbine OR vertical axis OR generator OR rotor)` |
| Hydronic comfort canopy | `(outdoor OR patio OR pergola OR canopy) AND (hydronic OR liquid cooled OR radiator OR heat exchanger OR thermal storage)` |
| Plenum ring | `(annular plenum OR radial plenum OR perimeter diffuser OR ring diffuser) AND (umbrella OR canopy OR outdoor)` |
| Roof cowl generator | `(roof cowl OR roof ventilator OR turbine ventilator OR wind cowl) AND (generator OR solar OR heat exchanger)` |
| Overspeed/connection | `(permanent magnet generator) AND (wye OR star OR delta) AND (switching OR braking OR diversion load)` |
| Thermal dump | `(wind generator OR PV) AND (dump load OR diversion load OR immersion heater OR thermal store)` |
| Safety/control | `(parasol OR roof cowl) AND (wind sensor OR stow OR gust OR overspeed OR emergency shutdown)` |

### Search workflow

| Step | Action | Output |
|---:|---|---|
| 1 | Write a one-page invention disclosure with dated diagrams, alternatives, problem/benefit, inventors and no public disclosure. | Controlled disclosure record. |
| 2 | Search Espacenet, WIPO PATENTSCOPE, Google Patents, UK IPO, USPTO; use keyword + classification + citation families. | Search log with database/date/query/hits. |
| 3 | Read claims and drawings, not only title/abstract; capture priority date, legal status, family, assignee, relevant claim elements. | Claim-feature matrix. |
| 4 | Search non-patent literature: catalogues, manuals, papers, videos, trade shows, standards, archived web. | NPL evidence log. |
| 5 | Map each candidate independent claim against one disclosure and combinations; identify differentiators and design-around options. | Preliminary novelty/risk map. |
| 6 | Commission attorney-led novelty/FTO search for target countries only after architecture is stable. | Opinion / filing strategy. |

### Public examples to place in a search log, not as FTO conclusions

Public patent databases show photovoltaic umbrella concepts and solar/wind integrated systems, while commercial roof cowls and turbine ventilators are established categories. [9] [10] [11] These references validate a crowded landscape. They do **not** establish that the present combination is unpatentable or clear to practice.

## 5.4 UK priority filing and international roadmap

| Stage | Action | Owner | Critical rule |
|---|---|---|---|
| Before disclosure | Assign IP, inventor agreements, lab notebook/CAD versioning, NDA template, mark confidential. | Founder + Legal-verify | NDA is helpful but not a substitute for filing; avoid public disclosure. |
| UK priority | File a UK patent application with claims, description and drawings appropriate to support later amendments; consider search/examination requests/timing with counsel. | Patent attorney | Filing quality determines support; do not submit a vague pitch deck as the specification. |
| 0–12 months | Test/iterate without publicly disclosing unsupported improvements; track follow-on inventions. | Founder + Engineering | New matter may require separate/priority filing. |
| By 12 months | File PCT claiming priority if international option value justifies cost; select ISA with counsel. | Founder + Attorney | Missing priority deadline can forfeit options. |
| 18 months | Anticipate publication; remove confidential manufacturing/process details from public materials if trade secret is better. | Founder | Patent publication changes disclosure posture. |
| 30/31 months | National phase: choose UK/EPO/US and target manufacturing/market territories based on licensee and FTO. | Founder + Attorney | Jurisdiction selection is a commercial decision. |
| Registered design | File UK design registration for visible appearance before public launch where appearance is distinctive. | Attorney/design lead | Design registration protects appearance, not technical function. |
| Trade secret | Keep manufacturing tolerances, controller tuning, test fixtures, supplier terms and service diagnostics confidential. | Founder + Ops | Use access control, not merely a confidentiality label. |

The UK IPO and WIPO publish current official application/PCT guidance; fees, forms, timelines and eligibility require current official verification. [7] [12]

## 5.5 Disclosure and NDA rules

| Do | Do not |
|---|---|
| Use dated version-controlled drawings, inventor signatures, access-controlled data room, mutual NDA for detailed nonpublic design. | Publish CAD, detailed control sequence, field-test video, crowdfunding page, unprotected trade show demo, or an unrestricted supplier RFQ before attorney advice. |
| Disclose only what a supplier needs; divide critical features across suppliers where practical. | Assume an NDA cures a public disclosure or gives patent rights. |
| Keep a list of every disclosed document/version/recipient/date. | Treat a provisional-looking sketch as adequate legal support without attorney review. |

---

# Section 6 — Commercialization, Valuation & Licensing Playbook

> **Commercial / financial disclaimer:** The model below is a decision framework, not a valuation, fundraising, tax, accounting, or investment recommendation. It contains explicit illustrative formulas rather than forecasts. Use supplier quotes, test data, target-country duty/tax, insurance, legal, certification and channel data before committing capital.

## 6.1 Commercial wedge

| Wedge | Customer | Value proposition | Why first / why not |
|---|---|---|---|
| Premium hospitality parasol | Resorts, rooftop bars, hospitality groups, glamping operators. | Measured shade/air comfort and distinctive experience. | Best willingness-to-pay; requires strong safety/service and site anchoring. |
| Commercial outdoor furniture | Contract furniture/canopy OEMs. | Differentiated comfort cassette/plenum/controls. | Licensing-friendly; OEM controls structural manufacturing. |
| Architectural roof cowl | HVAC/roofing/ventilation integrator. | Engineered ventilation/thermal/PV option for defined building class. | Longer sales/approval cycle; separate technical route. |
| Residential consumer | Homeowners. | Aspirational garden comfort. | **Not first.** Highest misuse/liability/install variability. |
| Microgeneration | Energy-focused buyer. | Only a measured secondary benefit. | **Do not lead with it** until site-measured energy economics are credible. |

## 6.2 Licensing versus direct manufacturing

| Dimension | License to OEM | Direct hardware company | Recommended sequence |
|---|---|---|---|
| Capital | Lower; OEM funds tooling/operations. | High: tooling, inventory, service, insurance, certification. | Start license-ready after field-verified demonstrator. |
| Control | Lower over UX/channel/quality. | High control. | Retain reference design/control IP and certification spec. |
| Margin | 3–7% of **defined net sales** is a common negotiating band, but deal-specific. | Gross margin can be higher but absorbs warranty/channel/working capital. | Use royalty + minimums/milestones, not royalty alone. |
| Speed | Faster through installed channels if OEM engaged. | Slower; build sales/service competence. | Pilot with 1–2 strategic partners. |
| Risk | IP/design-around/audit risk. | Product liability, inventory, recalls, cash burn. | De-risk core system before selecting route. |
| Data | Licensee may own customer data. | Direct owner captures field data. | Contract rights to anonymized reliability/performance data. |

### Licensing term sheet checklist

| Term | Recommended position |
|---|---|
| Field/territory | Narrow defined field, geography, product configuration, channel. |
| Exclusivity | Conditional on minimum annual royalties, milestones, quality and launch dates; convert to nonexclusive on miss. |
| Royalty base | “Net sales” precisely defined; limit deductions; no affiliate transfer-price loophole. |
| Royalty | 3–7% gross royalty range is a negotiation starting point; use product margin, IP strength, and OEM contribution to set rate. |
| Minimums | Upfront fee, development milestones, annual minimum guarantee after launch. |
| Audit | Annual report/audit rights; interest for underpayment; data-security obligations. |
| Improvements | Licensee improvements defined; inventor ownership/rights-back; no blanket assignment of platform. |
| Quality / safety | Required test/certification/manual/recall/insurance; right to suspend unsafe product. |
| IP enforcement | Who decides/pays; cooperation, settlement and recovery allocation. |
| Termination | Quality/safety breach, milestone miss, insolvency, nonpayment, change of control. |

## 6.3 Direct-manufacturing unit economics framework

```text
Net revenue/unit = MSRP × (1 − channel_discount) − sales_returns
COGS/unit = purchased_parts + fabrication + assembly + test + packaging + inbound_freight + warranty_reserve
Gross_profit/unit = Net revenue/unit − COGS/unit
Contribution/unit = Gross_profit − variable_install − payment/fulfilment − field_service
Break-even units = Fixed launch cost / contribution per unit
License royalty/year = OEM net sales × royalty rate
```

| Cost category | Direct manufacturer must model | Licensing diligence question |
|---|---|---|
| NRE | Engineering, CFD/FEA, prototypes, jigs/tooling, certification, IP. | Who pays/reimburses NRE; milestone treatment? |
| COGS | Fan/coil/controller/battery/PV/structure/fabric, scrap/yield, test time. | Can OEM source at scale while preserving performance? |
| Warranty | Motor, battery, pump, seals, corrosion, fabric, water ingress, installer error. | Who carries field warranty/recall cost? |
| Compliance | Test house, technical file, labels, manuals, market-specific variant. | OEM responsible for conformity/installation evidence? |
| Working capital | Inventory, deposits, lead time, spares, seasonal demand. | Not borne by licensor if pure license. |
| Liability/insurance | Public occupancy, moving parts, electrical, roof leaks, water damage. | Indemnity and minimum insurance coverage. |

## 6.4 Stage-gate valuation logic

| Evidence stage | What is being valued | Indicative negotiation logic |
|---|---|---|
| Concept / search | Idea and filing option. | Low leverage; do not overprice with untested claims. |
| Bench proof | Measured air/thermal/electrical subsystem performance. | Demonstrates feasibility; still no field/product proof. |
| Full-scale controlled rig | Installed fan curve, coil duty, safety/stow and maintenance evidence. | First credible OEM technical conversation. |
| Field pilot | Comfort, noise, reliability, site/install and willingness-to-pay data. | Supports option fee/development agreement. |
| Certified production design | Tested conformity/insurance/channel readiness. | Supports license/minimum guarantee or direct launch valuation. |

## 6.5 Target licensee categories

| Category | What they bring | What to pitch | Diligence concern |
|---|---|---|---|
| Contract outdoor furniture/canopy OEM | Frame/fabric, hospitality channels, service. | Micro-climate cassette + safety/stow design. | They may resist battery/water complexity. |
| HVAC/ventilation OEM | Fans, ducting, compliance, installers. | Roof-cowl/plenum controls and validated airflow interface. | Long qualification and limited appetite for novelty. |
| Luxury patio/glamping | Premium aesthetic/customer experience. | Zoned comfort + visual signature + field data. | Seasonal/low-volume economics. |
| Clean-tech/microgeneration | Power electronics, energy partners. | Only measured hybrid storage/control IP. | Avoid speculative wind-yield story. |
| Roof/architectural systems | Curb/flashing/building-envelope expertise. | Separate engineered roof cowl, not parasol novelty. | Liability, fire/weather warranty constraints. |

## 6.6 Pitch deck and invention disclosure package

| Slide / document | Evidence required |
|---|---|
| 1. Problem | Measured outdoor comfort/ventilation pain and buyer interviews. |
| 2. Product | Clear parasol vs roof-cowl SKUs; no conflated claim. |
| 3. Why now | Outdoor hospitality/comfort/energy context with sourced data. |
| 4. How it works | Safe high-level block diagram; do not disclose trade secret before NDA/filing. |
| 5. Measured proof | Fan curve, coil duty, noise, wind/stow, power balance with test conditions. |
| 6. Safety/compliance roadmap | Hazards, independent test plan, operating boundaries. |
| 7. IP | Filing status, claim families, search status; never say “patented” before grant. |
| 8. Customer/pilot | LOIs, paid pilot interest, user value data. |
| 9. Unit economics | Transparent COGS/risk/sensitivity, not only retail price. |
| 10. Partnership ask | Licence field, development project, pilot sites, NRE/minimums. |

---

# Section 7 — Digital Toolkit & AI Resource Matrix

| Phase | Tool category | Recommended examples | Use / guardrail |
|---|---|---|---|
| CAD | Parametric CAD | Fusion 360, SolidWorks, Onshape, FreeCAD. | Lock drawing revisions; do not rely on generative geometry without load verification. |
| Structural / FEA | FEA & modal analysis | Ansys Mechanical, SolidWorks Simulation, SimScale, CalculiX. | Engineer-owned boundary/load cases. |
| CFD / thermal | CFD + heat exchanger analysis | Ansys Fluent, SimScale, OpenFOAM, Autodesk CFD where available. | Calibrate against anemometry/thermal tests; CFD is not certification. |
| System simulation | 1D thermal/electrical | MATLAB/Simulink, Modelica/OpenModelica, LTspice. | Use controlled parameter studies; retain assumptions. |
| EDA | Schematic/PCB | KiCad, Altium, LTspice, PSpice. | Design review, creepage/clearance/EMC, no unreviewed AI-generated PCB release. |
| Firmware | Embedded development | PlatformIO, STM32Cube, Zephyr, ESP-IDF. | Hardware watchdog, local fail-safe, versioned config. |
| Data capture | Test logging | NI DAQ, Pico, MQTT/Influx/Grafana, calibrated meters. | Time sync/calibration/immutable raw data. |
| Prototype fabrication | 3D print/CNC/sheet metal | Local FDM/SLS, Xometry/Hubs/Protolabs-class, sheet-metal shops. | Prototype label and design-change traceability. |
| Components | Electronics/mechanical distributors | Mouser/Digi-Key/RS/Farnell-class; McMaster/RS/fastener suppliers; radiator/pump OEMs. | Qualify alternates, certificates, lead time and traceability. |
| Patent research | Official databases | UK IPO, Espacenet, WIPO PATENTSCOPE, Google Patents, USPTO. | Search claims/families/legal status; attorney-led FTO. |
| Patent analytics | Paid landscape tools | Derwent/Orbit/PatSnap/LexisNexis-type services. | Validate coverage/status against official register. |
| Documentation | PLM/QMS | Git + issue tracker, Notion/Confluence, lightweight PLM, controlled PDFs. | Record design inputs, risk files, tests, changes, BOM revision. |
| AI assistance | Drafting/coding/data analysis | LLMs for test plans, data scripts, document summarization. | No AI output is an engineering calculation, patent opinion or safety sign-off without qualified review. |

## Source and standards notes

The technical principles in this dossier draw on public references to fan testing/system effects, ventilation and heat-exchanger practice, Eurocode wind actions, small-wind design, UK electrical/install connection guidance, and UK IP/PCT pathways. Normative standards are copyright works and must be acquired in the current edition for design work. [1] [2] [4] [5] [6] [7] [12]

## References

[1]: https://www.amca.org/test/amca-lab-arlington-heights.html ; https://www.amca.org/certify/ "AMCA fan testing and certification"
[2]: https://www.ashrae.org/technical-resources/technical-apps/ashrae-duct-fitting-database-app ; https://www.cibse.org/knowledge-research/knowledge-portal/guide-b2-ventilation-and-ductwork-2016 "Duct/fan-system design resources"
[3]: https://www.iso.org/standard/39155.html "ISO 7730 thermal comfort reference"
[4]: https://knowledge.bsigroup.com/products/eurocode-1-actions-on-structures-general-actions-wind-actions ; https://www.hse.gov.uk/construction/safetytopics/temporary-works.htm "UK wind actions and temporary structures"
[5]: https://www.energynetworks.org/industry/connecting-to-the-networks/connecting-generation-to-the-electricity-networks ; https://www.ena-eng.org/ "UK electricity network generation connection"
[6]: https://electrical.theiet.org/bs-7671/ ; https://www.gov.uk/government/publications/electrical-equipment-safety-regulations-2016/electrical-equipment-safety-regulations-2016-great-britain "UK electrical installation and product safety"
[7]: https://www.gov.uk/government/organisations/intellectual-property-office ; https://www.ipo.gov.uk/patent "UK IPO patent guidance"
[8]: https://worldwide.espacenet.com/ ; https://patentscope.wipo.int/ "Patent search databases"
[9]: https://patents.google.com/patent/US20070283987A1/en "Public photovoltaic umbrella example"
[10]: https://patents.google.com/patent/US20120080884A1/en ; https://patents.google.com/patent/US20170055653A1/en "Public solar/wind integration examples"
[11]: https://trivent.co.uk/products/horizontal-roof-cowls ; https://www.efans.co.uk/collections/roof-cowls-weatherproof-vent-cowls "Established roof-cowl category examples"
[12]: https://www.wipo.int/pct/en/ "WIPO PCT guidance"
[13]: https://webstore.iec.ch/en/publication/5433 "IEC 61400-2 small wind turbine standard"
[14]: https://www.gov.uk/government/publications/structure-approved-document-a "UK Approved Document A"
