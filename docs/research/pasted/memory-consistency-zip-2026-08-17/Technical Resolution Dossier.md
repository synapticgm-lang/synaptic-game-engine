# Technical Resolution Dossier
## Hybrid Solar-Wind Hydronic Micro-Climate Parasol & Architectural Smart Roof Cowl

> **Engineering status:** This is a parametric, test-gated MVP architecture—not a validated or production-certified design. The calculations are transparent screening models using the stated assumptions and the attached Python script. A qualified structural, mechanical, refrigeration, electrical, product-safety, roof/building-services, fire, and conformity team must replace screening coefficients with site-, component-, and test-specific values before any occupied, roof-mounted, grid-connected, or commercial deployment.

## Executive resolution: four design decisions

| Conflict | Final MVP resolution | What is deferred |
|---|---|---|
| Mast / rotating drive | **Stationary structural mast and stationary service spine.** Use fixed EC fan cassette for MVP; if a decorative/yaw head rotates, limit angle and use a short, accessible rotary union below a separate bearing cartridge. | Continuous rotating wet shaft, exposed high-speed rotor, wind-harvester over occupants. |
| Thermal endurance | **30 kg 6–9°C PCM + 40 kg PG/water buffer + optional external hydronic quick-connect.** Use microchiller only as a stationary base/roof recharge module after COP validation. | Claiming all-day autonomous cooling or putting refrigerant in mast/parasol. |
| Enclosure / wind | **No sealed full vinyl pod.** Use segmented, vented captive panels for low-wind amenity only; automatic stow and positive anchoring define safety. | Unanchored all-weather enclosure at 45 mph. |
| Product unification | **Universal Micro-Climate Cassette**: stationary fan, guarded inlet, coil, condensate pan, equalising plenum, diffuser module, and low-voltage controls. | Shared structural mount, wind turbine, grid-tie, and roof-cowl certification. |

---

# Section 1: 1D Mathematical Modeling & Simulation Results

## 1.1 Assumption set and model limits

| Variable | Value used | Reason / limitation |
|---|---:|---|
| Air density / heat capacity | 1.20 kg/m³ / 1.005 kJ/kg·K | Concept screening at near-sea-level conditions. |
| Glycol-water heat capacity | 3.70 kJ/kg·K | Approximate PG/water mix; selected concentration must be measured. |
| Cooling supply water | 7.5°C | Midpoint of 5–10°C requested range. |
| Air inlet conditions | 32 / 35 / 38°C | Requested ambient envelope; RH and solar/wind loads not solved by 1D model. |
| Coil effectiveness | 0.22–0.30 | Compact-coil preliminary envelope; requires coil test map. |
| Airflow | 0.11 / 0.16 m³/s | 233 / 339 CFM, appropriate to 2.5–3.0 m modules only as screening. |
| Water buffer | 40 kg, usable 10 K band | 1.48 MJ useful sensible storage. |
| PCM | 30 kg, useful 160 kJ/kg | 4.80 MJ usable latent allowance; cycle testing required. |
| Microchiller net capacity / system COP | 0.60 kW / 2.0 | Test assumption; compressor datasheet COP is not system COP. |
| Chiller auxiliaries | 0.05 kW | Pump/fans/controls allowance. |
| Wind screen | 3 m parasol; `h_cp=2.2 m`, lever=0.65 m, factor=1.5 | Not a code wind action calculation. |

## 1.2 Thermodynamic model

```text
Air-side cooling:       Qdot_air = rho_air × Q_air × cp_air × (T_air,in − T_air,out)
Effectiveness model:    Qdot = epsilon × rho_air × Q_air × cp_air × (T_air,in − T_water,in)
Water flow:             Vdot_water = Qdot / (rho_water × cp_pg × DeltaT_water)
Sensible store:          E_water = m × cp_pg × DeltaT
PCM store:               E_pcm,usable = m_pcm × latent_heat_credited
Runtime:                 t = E_store / (Q_load − Q_chiller,net)
Chiller system COP:      COP_sys = Q_chiller,net / (P_comp + P_fans + P_pump + P_controls)
```

### Cooling air-side results

| Ambient | Airflow | Coil ε | Cooling duty | Predicted outlet dry-bulb | Approx. water flow at 5 K loop ΔT | Engineering interpretation |
|---:|---:|---:|---:|---:|---:|---|
| 32°C | 0.11 m³/s | 0.22 | 0.715 kW | 26.61°C | 2.32 L/min | Can support local comfort with shade/air movement. |
| 32°C | 0.11 m³/s | 0.30 | 0.975 kW | 24.65°C | 3.16 L/min | Target 24–26°C local discharge band at low ambient; verify condensate. |
| 32°C | 0.16 m³/s | 0.22 | 1.040 kW | 26.61°C | 3.37 L/min | Good 3 m cassette test point. |
| 32°C | 0.16 m³/s | 0.30 | 1.418 kW | 24.65°C | 4.60 L/min | Requires measured coil/condensate performance. |
| 35°C | 0.11 m³/s | 0.22 / 0.30 | 0.803 / 1.094 kW | 28.95 / 26.75°C | 2.61 / 3.55 L/min | 24–26°C outlet is not credible at this water/ε condition. |
| 35°C | 0.16 m³/s | 0.22 / 0.30 | 1.167 / 1.592 kW | 28.95 / 26.75°C | 3.79 / 5.16 L/min | Shade and local air speed must carry much of comfort benefit. |
| 38°C | 0.11 m³/s | 0.22 / 0.30 | 0.890 / 1.214 kW | 31.29 / 28.85°C | 2.89 / 3.94 L/min | Do not promise 24–26°C occupant air at 38°C ambient. |
| 38°C | 0.16 m³/s | 0.22 / 0.30 | 1.295 / 1.766 kW | 31.29 / 28.85°C | 4.20 / 5.73 L/min | MVP claim must be “zonal comfort improvement,” not outdoor room conditioning. |

**Thermal conclusion:** for 32°C air, a 7.5°C loop and 0.30 effective coil can produce a 24.65°C discharge in this idealised model. At 35–38°C ambient, the same coil effectiveness produces 26.75–31.29°C discharge. Meeting 24–26°C in peak ambient requires colder fluid, higher ε/coil area, lower face velocity, larger stored/refrigerated capacity, or lower air temperature target at the diffuser—with condensate, humidity, energy, and safety consequences. The MVP acceptance target should be **measured operative-comfort improvement**, not a universal air-temperature claim.

## 1.3 Thermal endurance: water, PCM, chiller and external port

### Stored energy calculation

```text
40 kg PG/water × 3.7 kJ/kg·K × 10 K = 1,480 kJ = 0.411 kWh thermal
30 kg PCM × 160 kJ/kg useful = 4,800 kJ = 1.333 kWh thermal
Total hybrid store = 6,280 kJ = 1.744 kWh thermal
```

| Cooling strategy | 0.50 kW load | 0.75 kW load | 1.00 kW load | MVP verdict |
|---|---:|---:|---:|---|
| 40 kg water only | 0.82 h | 0.55 h | 0.41 h | Insufficient. Explains the <25 min concern at 1 kW. |
| 40 kg water + 30 kg PCM | 3.49 h | 2.33 h | 1.74 h | Best passive/base answer for 1–2 h local sessions. |
| Water only + 0.60 kW chiller | Steady in ideal model | 2.74 h | 1.03 h | Chiller must be continuously heat-rejected; not a silent battery feature. |
| Water + PCM + 0.60 kW chiller | Steady in ideal model | 11.63 h | 4.36 h | Only if actual `COP_sys`, condenser airflow, battery/mains supply and high-ambient performance validate. |
| External quick-connect supply | Determined by external chiller/ground loop. | Determined by external source. | Determined by external source. | Best endurance option for hospitality/architectural install. |

### Recommended thermal architecture

```text
Stationary base/roof utility module
  ├─ sealed PCM tank (30 kg engineered PCM cartridges; 40 kg PG/water secondary buffer)
  ├─ optional fixed micro vapor-compression chiller on dedicated condenser air path
  ├─ expansion/air separation, relief, strainer, fill/drain, leak tray
  ├─ variable-speed 24/48 V pump
  ├─ two keyed dry-break quick-connects: SUPPLY / RETURN
  └─ detachable parasol services spine
          └─ cassette coil → plenum → drain return → base reservoir
```

**Final MVP selection:** ship the *water + PCM + external quick-connect-ready* architecture as the thermal core. Add a microchiller only as a fixed-base option after calorimetric validation. Do not put refrigerant compressor/lines in the mast or rotating head.

### Hydronic flow target

At 1.0 kW and `ΔTwater=5 K`, use approximately 3.2 L/min of PG/water by the simplified model; at 1.6 kW it is approximately 5.2 L/min. Design target: **3–6 L/min** for the 2.5–3.0 m cassette, with bore/pump selected after actual coil/coupling/pipe `Δp` test. A 5–20 L/min rotary-union target is therefore unnecessary for the MVP; using a fixed mast removes that pressure-drop and leak mechanism.

## 1.4 Plenum, coil, diffuser and acoustic screen

```text
System pressure:   Delta_p_sys = Delta_p_inlet + Delta_p_coil + Delta_p_plenum + Delta_p_diffuser
Minor loss:        Delta_p_i = K_i rho v_i² / 2
Friction:          Delta_p_f = f(L/Dh) rho v² / 2
Fan power:         P_fan = Q Delta_p_sys / eta_fan
Continuous slot:   A_slot = pi D w ; v_slot = Q/A_slot
```

| Cassette diameter | Airflow | Screening system pressure | Fan electrical at η=0.45 | 10 mm ring-slot velocity | Acoustic design target |
|---:|---:|---:|---:|---:|---|
| 2.5 m | 0.11 m³/s | 60 Pa | 14.7 W ideal | 1.40 m/s | Target <45 dBA at 1 m in lowest normal mode; verify test method. |
| 3.0 m | 0.16 m³/s | 85 Pa | 30.2 W ideal | 1.70 m/s | Target <50 dBA at 1 m normal mode; no tonal blade/gear sound. |
| 3.5 m | 0.22 m³/s | 120 Pa | 58.7 W ideal | 2.00 m/s | Do not proceed without measured curve/acoustic test. |

### 2–4 inch plenum pressure profile

A 75–100 mm deep radial plenum is recommended for MVP. Design intent:

| Zone | Target condition | Control |
|---|---|---|
| Fan outlet | Highest local velocity / pressure recovery. | Diffuser cone/baffle, no coil directly in jet. |
| Coil face | ±10% velocity distribution target in bench traverse. | Perforated plate / turning baffles. |
| Annular plenum | Sector static-pressure variation <10% of mean at design point. | Taper/sector orifices. |
| Diffuser | 30–45° inward/downward direction; 1.5–3 m/s local discharge preliminary. | Replaceable insert / orifice balancing. |
| Pan | All condensate goes to low point; no standing water. | 1:50 slope minimum design intent; validate physically. |

Acoustic prediction before CFD/test is uncertain. Approximate fan sound power comes from vendor data; calculate `L_p` using measured room/outdoor propagation, then inspect blade-pass tone. Do not derive dBA from airflow only. Design mitigations: EC fan, low tip speed, broad slot area, flexible motor isolators on stiff carrier, acoustic foam only outside wet/cleanable airflow, no abrupt grille edges.

## 1.5 Structural mechanics and enclosure physics

### Wind model

```text
q = 0.5 rho V²
F = q C_f A_projected
M = F h_cp
ballast_mass_screen = gamma M / (g b)
SF_tip = W b / M  [must include uplift/sliding/substrate and code combinations in final design]
```

The following uses the same transparent 3 m screen model as the earlier dossier: `C_f=1.2`, open projected area `1.06 m²`; full enclosure `C_f=1.3`, projected area `6.3 m²`; `h_cp=2.2 m`, `b=0.65 m`, `γ=1.5`. It is a **screening demonstration**, not a ballast specification.

| Wind | q | Open canopy moment | Open ballast screen | Full vinyl moment | Full-vinyl ballast screen | Design decision |
|---:|---:|---:|---:|---:|---:|---|
| 10 mph | 12.2 Pa | 34 N·m | 8 kg | 221 N·m | 52 kg | Enclosure is a material load increase even at light wind. |
| 15 mph | 27.5 Pa | 77 N·m | 18 kg | 496 N·m | 117 kg | No automatic comfort enclosure without positive restraint. |
| 18 mph | 39.7 Pa | 111 N·m | 26 kg | 715 N·m | 168 kg | Proposed first breakaway/stow trigger band. |
| 22 mph | 59.2 Pa | 166 N·m | 39 kg | 1,068 N·m | 251 kg | All curtain panels must be released/stowed; no occupied enclosure. |
| 30 mph | 110.2 Pa | 308 N·m | 73 kg | 1,985 N·m | 467 kg | Parasol must already be mechanically stowed. |
| 35 mph | 149.9 Pa | 420 N·m | 99 kg | 2,702 N·m | 636 kg | Emergency storm condition; never operational. |
| 45 mph | 247.9 Pa | 694 N·m | 163 kg | 4,466 N·m | 1,051 kg | Confirms unanchored full enclosure is rejected. |

### All-weather enclosure solution

| Element | MVP solution | Required test |
|---|---|---|
| Curtain | Four or more narrow captive, UV-rated clear panels; bottom gap and upper louvred/mesh relief. | Wet/UV/tear/cycle/pressure test. |
| Pressure relief | Permanent high-level relief area plus low-level exhaust; do not claim a universal % until tunnel tests. Initial physical target: distributed relief on both windward/leeward paths, not one flap. | Measure internal/external pressure with panels partially open. |
| Breakaway | Each 0.6 m² segment uses calibrated primary latch at **26–39 N screening load** (18–22 mph static screen), secondary tether, protected release path. | Production tolerance/ageing/release-travel test. |
| Stow | At 15 mph sustained/18 mph 3-second gust: warning, heat/chiller stop, curtains retract/open. At 18 mph sustained/22 mph gust: automatic canopy/curtain storm stow; block redeploy until hysteresis/dwell. | Sensor fault, power loss, jammed actuator, gust test. |
| Anchoring | Portable: limited to manufacturer-defined low-wind operation with engineered base. Semi-permanent: designed ground anchors. Roof: curb/substrate-specific fixings only. | Pull-out/sliding/uplift/overturning/site survey. |

**Breakaway caveat:** the force range is an initial bench-latch pre-load target, not a release specification. Actual release depends on panel shape, `C_f`, pressure distribution, angle, ageing, rain, seam force, tether dynamics, and whether other panels are open. Breakaway is a **load-shedding layer**, not a life-safety guarantee. It must not pull a hose or cable; mechanical, electrical, and pressure boundaries are separated.

## 1.6 Mast packaging and drive conflict resolution

### Chosen MVP: stationary mast and stationary fan

```text
OUTSIDE → [110–140 mm structural 6061-T6 outer mast / service spine]
  ├─ load-bearing mast wall and lower datum flange
  ├─ protected hydronic pair: 10 mm ID EPDM lines in opposite service channel
  ├─ 24/48 V DC power trunk in isolated conduit
  ├─ shielded sensor/CAN harness in separate conduit
  ├─ low-point drain / leak-sensor path
  └─ no rotating shaft, no refrigerant, no mains IR conductors in mast
TOP → [Universal cassette on structural datum ring]
  ├─ stationary EC fan + guarded inlet
  ├─ coil / pan / plenum / diffuser
  └─ optional later yaw ring: separate bearing + limited-angle drive + short rotary union
```

| Option | Clearance / routing | Vibration / service | MVP decision |
|---|---|---|---|
| Top-mounted stationary EC fan in cassette | 110–140 mm mast gives space for structural wall plus two fluid and two electrical channels; exact tube profile needs CAD. | Lowest vibration/entanglement; all services stationary. | **Select.** |
| Top-mounted direct-drive brushless hub motor as rotating head | Needs independent bearing, containment, cable routing and service access. | Rotating mass, blade-release and weather risk. | Defer; only guarded isolated rig. |
| Hollow-shaft mast | Requires separate shaft, bearings, union, concentric services; 50 mm mast cannot safely carry all requested services with robust clearances. | High alignment/leak/fatigue complexity. | Reject for MVP. |
| Limited-angle yaw cassette | Services stay fixed to mast; rotary union below bearing only if head needs fluid rotation. | Manageable with ±90–180° service loop/end stops. | Later optional. |

### Minimum internal layout rules

1. **No IR mains circuit in mast MVP.** Place high-draw IR in a fixed, separately protected product only after electrical design; portable MVP uses low-voltage fan/pump and external power module.
2. **Separate pressure, power and signal paths.** Each has its own conduit/inspection route; no hose supports structural load or rubs shaft/fastener.
3. **No 50 mm all-in-one package.** The 50 mm concept fails packaging, bend-radius, service, thermal and vibration margin. Use a larger 110–140 mm stationary service spine or external paired service raceways under a guarded cover.
4. **Vibration separation.** Fan is elastomer-isolated on a stiff cassette carrier; mast/cassette natural frequencies must be measured and separated from fan 1×/blade-pass frequencies.

---

# Section 2: Finalized MVP System Architecture & Specifications

## 2.1 Universal Micro-Climate Cassette

| Module | Function | Portable-parasol adapter | Roof-cowl adapter |
|---|---|---|---|
| A. Guarded inlet/fan cartridge | Creates controlled air flow. | Under-shield inlet with removable guard. | Weatherhood/mesh service inlet. |
| B. Coil/condensate cartridge | Liquid-to-air exchange and liquid containment. | Dry-break service pair down mast. | Fixed hydronic pair to plant/ground loop. |
| C. Equalising plenum | Balances pressure around coil/diffuser. | Annular shallow cassette. | Rectangular-to-round plenum / duct transition. |
| D. Diffuser ring | Delivers radial local air. | 30–45° inward/downward sectors. | Roof outlet/room duct manifold/louvre. |
| E. Controller module | Local safe control, sensor conditioning, logging. | 24/48 V base battery/external supply. | Fixed building supply/low-voltage control. |
| F. Structural datum | Carries cassette, not services. | Mast collar / keyed pins / captive fasteners. | Engineered roof curb / weathered flange. |

### Cassette mechanical envelope

| Parameter | MVP target | Acceptance metric |
|---|---:|---|
| Diameter | 2.5–3.0 m parasol cassette family | One shared fan/coil/controller architecture. |
| Depth | 100–140 mm cassette excluding shield/outer skin | Coil, pan, baffles, service access fit without pinching. |
| Air | 0.11–0.16 m³/s | Measured `Q–Δp` performance and ±10% sector balance. |
| Pressure | 60–85 Pa total clean/dry screen | Fan has 20–30% measured pressure margin. |
| Cooling | 0.7–1.6 kW 1D envelope | Calorimetric results at defined ambient/RH. |
| Fluid | 3–6 L/min PG/water | Measured coil+loop Δp within pump map. |
| Condensate | Pan + 1:50 intended slope + overflow sensor | No water reaches electronics/occupied zone. |

## 2.2 Mechanical / electrical / plumbing schematic

```text
[PARASOL CANOPY + STATIONARY BLACKOUT SHIELD]
                   │ structural collar only
[UNIVERSAL CASSETTE: guard → EC fan → baffle → coil → pan → annular plenum → diffuser]
                   │
[STATIONARY 110–140 mm SERVICE SPINE]
   ├─ Channel 1: SUPPLY glycol line, isolation/check point
   ├─ Channel 2: RETURN glycol line, isolation/check point
   ├─ Channel 3: 24/48 V fused DC trunk
   ├─ Channel 4: shielded sensors / CAN / E-stop loop
   └─ drainage/leak path outside electrical conduit
                   │
[BASE UTILITY MODULE]
   ├─ PCM tank + 40 kg PG buffer + expansion/relief/air separator
   ├─ pump + strainer + variable valve + quick-connect manifold
   ├─ optional fixed microchiller / condenser airflow path
   ├─ LiFePO4/BMS/DC distribution; external mains supply if approved
   └─ controls, local E-stop, storm stow actuator supply
```

## 2.3 Condensation management

| Failure | Design response | Fail-safe |
|---|---|---|
| Coil below dew point | Sloped pan and dedicated drain, water sensor, air/water temp/RH sensing. | If pan high/overflow or drain blocked: close cooling valve, stop pump/chiller, continue ventilation-only if safe. |
| Moving parasol | Pan is inside fixed cassette; drain uses protected gravity path or small condensate pump to base. | No unverified free drain over people/electronics. |
| Hose disconnect | Dry-break couplings, drip tray, leak sensor. | Pump/chiller inhibit and alarm. |
| Freeze | PG concentration specification, min supply temperature, outdoor sensor, drain/stow procedure. | Freeze alarm, heating/recirculation only if verified safe. |

## 2.4 Multi-state control logic

```text
BOOT/SELF_TEST → VENTILATION_ONLY
VENTILATION_ONLY → SOLAR_FAN when DC power / conditions adequate
SOLAR_FAN → PCM_COOL when cooling request + water flow + condensate path + dew-point checks pass
PCM_COOL → CHILLER_ASSIST when PCM SOC low + chiller/heat rejection/battery/mains conditions valid
ANY → MAINS_IR_HEAT only in fixed approved electrical configuration with guarded emitters and high-limit
ANY → WIND_GENERATION_TEST only in guarded non-occupancy configuration
ANY → DUMP_LOAD when DC bus high and diversion path thermally safe
ANY → STORM_STOW when gust trip / sensor fault / tilt / actuator alarm
ANY → FAULT_SAFE when leak, BMS, high temperature, pump fail, blocked drain, guard open, E-stop, mode conflict
```

| Condition | Fan | Pump | Chiller | IR | Wind / dump | Curtains/canopy | State |
|---|---|---|---|---|---|---|---|
| Normal cooling | Modulate | Modulate | Off/assist | Off | Disabled in MVP occupancy | Low-wind only | PCM_COOL |
| PCM depleted | Modulate | Modulate | On if validated | Off | Disabled | Low-wind only | CHILLER_ASSIST |
| Fixed heat | Modulate | Optional recovery | Off | Guarded/on | Dump only if independently safe | No enclosure requirement | MAINS_IR_HEAT |
| Gust warning | Off after purge | Off/isolated | Off | Off | Brake/test hardware safe | Retract/open | STORM_STOW |
| Leak/drain fault | Safe ventilation only if dry | Off | Off | Off | Isolate | Stow if service risk | FAULT_SAFE |
| Sensor disagreement | Safe/limited | Off | Off | Off | Brake/disable | Stow | FAULT_SAFE |

## 2.5 Production safety boundary

The first production-intent MVP should **not** include wind-generation, Delta–Wye relay switching, full vinyl enclosure, mains IR in portable mast, roof grid-tie, or refrigerant in the detachable parasol. Each is a later engineering option with its own risk/certification path. The cassette/platform is the reuse asset; the high-risk features are not prerequisites for customer-value validation.

---

# Section 3: Final Production-Ready Bill of Materials (test-gated target)

> **BOM position:** indicative selection classes and target ranges, not approved part numbers. “Production-ready” applies only after the Phase-4 test/certification gates below. Obtain final data sheets, chemical compatibility, lead-time, traceability and certification from suppliers.

| Assembly | Target material / component class | Low-volume 10–50 units | 1,000+ units target | Supplier/distributor category |
|---|---|---:|---:|---|
| Structural mast/service spine | 6061-T6 Al extrusion/tube, 110–140 mm OD, 316 SS fasteners. | £250–£700 | £90–£250 | Aluminium extruder / contract metalwork. |
| Base/anchor interface | Powder-coated steel ballast chassis or engineered anchor plate. | £500–£1,500 | £180–£600 | Fabricator / structural hardware. |
| Cassette housing | 6061-T6 sheet/extrusion + UV-stabilised ASA/PC outer service covers. | £600–£1,800 | £180–£600 | Sheet metal / injection mould tool later. |
| Blackout shield / guard | Aluminium/composite panel, finger-safe guard, captive service fasteners. | £250–£700 | £80–£250 | Fabricator / guarding supplier. |
| EC fan cartridge | 24/48 V EC centrifugal/axial fan with documented curve. | £250–£800 | £80–£250 | ebm-papst/Delta/Ziehl-Abegg class. |
| Coil | Copper/aluminium fin coil, hydronic map supplied. | £180–£600 | £60–£220 | HVAC coil OEM. |
| Hydronic hardware | EPDM hoses, brass/316 fittings, expansion, strainer, relief, isolation. | £350–£900 | £120–£350 | Fluidics/HVAC distributor. |
| Quick connects | Keyed dry-break 8–12 mm thermal-management coupling. | £80–£250/pair | £30–£100/pair | Danfoss/Stäubli/Parker class. |
| PCM tank | Insulated HDPE/stainless outer tank, sealed PCM cartridges, 30 kg PCM. | £600–£2,000 | £200–£650 | Thermal-storage OEM. |
| Pump | Brushless variable-speed 24/48 V, 3–6 L/min at tested head. | £80–£250 | £30–£100 | Fluidics/automotive thermal. |
| Optional chiller | Fixed vapor-compression water chiller, 0.6–1.0 kW net target with condenser fan. | £800–£3,000 | £300–£1,100 | Refrigeration OEM. |
| Battery/DC | Listed LiFePO4 pack/BMS/contactors/fuses, 24/48 V. | £800–£2,500 | £300–£1,000 | Battery integrator. |
| Controls | Industrial MCU/PLC, relays, fused distribution, E-stop, HMI. | £400–£1,500 | £120–£450 | Mouser/Digi-Key/industrial controls. |
| Sensors | Wind x2, tilt, leak, water flow/temp, RH/dew, vibration, pan high level. | £400–£1,200 | £120–£400 | Industrial sensors. |
| Curtain kit | UV-rated clear PVC, 316 hardware, captive tethers, vent mesh, breakaway latches. | £400–£1,500 | £120–£450 | Marine canvas/fabricator. |
| Roof adapter later | Galvanised/Al curb, flashing, service hood/mesh, structural fixings. | £800–£3,500 | £300–£1,200 | Roofing/HVAC OEM. |
| **Hardware target** | Excludes NRE, certification, field install, warranty, IP. | **£6,740–£22,700** | **£2,010–£7,920** | Target ranges require RFQ. |

---

# Section 4: Phase-by-Phase Timeline & Adjustment Roadmap

## 4.1 52-week milestone plan

| Phase / weeks | Critical work | Deliverables | Stage-gate decision criteria |
|---|---|---|---|
| **0: Weeks 1–6** | Desktop PoC, sensor calibration, fan/coil calorimetry, PCM coupon cycles, initial hazard log. | Calibrated pressure/flow/temp/power dataset; architecture freeze v0; patent disclosure. | Air/water heat balance within ±15%; no water/electrical cross-leak; no uncontained hot/cold/rotating hazard. |
| **1: Weeks 7–14** | Parametric CAD, CFD/FEA correlation, mast/service spine layout, UK IPO priority filing with attorney. | Cassette CAD, system curve, FEA screening, claim-feature matrix, design FMEA. | CFD/1D predicts bench values within ±20%; selected 110–140 mm service spine passes packaging review; no 50 mm shaft concept remains. |
| **2: Weeks 15–26** | 2.5–3.0 m full-scale stationary fan/hydronic rig; PCM tank; quick-connect; guarded dyno only for wind R&D. | Instrumented rig, `Q–Δp` map, coil map, endurance curves, union/connection tests. | 0.11–0.16 m³/s at 60–85 Pa; branch flow ±10%; no condensate/electrical ingress; PCM runtime within ±20% model. |
| **3: Weeks 27–38** | Environmental hardening, independent structural review, wind/gust/stow tests, acoustic, ingress, UV/freeze/cycle. | Wind/stow report, latch/tether test, noise, ingress, corrosion/freeze results, revised manuals. | No uncontrolled release/overturning in approved test cases; fault safe-state proven; no unresolved P0 leak/guard/battery/drain risk. |
| **4: Weeks 39–52** | Tooling DFM, conformity matrix, technical file, pilot installs, licensee package. | Production BOM/RFQs, quality plan, installation/manual, pilot data, commercial package. | Defined SKU only; all required external testing/compliance paths scheduled/completed; field pilot meets availability/noise/comfort/service targets. |

### Gantt-style dependency view

```text
Weeks        01----06 07------14 15----------26 27----------38 39----------52
PoC/tests    ██████
CAD/CFD               ████████
IP filing              ███
Full rig                         ████████████
PCM/chiller tests                ████████████
Wind/stow R&D                    ████████████ ████████████
Hardening                                      ████████████
Compliance/tooling                                              ██████████████
Pilot/licensing                                               ██████████████
```

## 4.2 Stage gates and stop conditions

| Gate | Advance only if | Stop / redesign if |
|---|---|---|
| G0 | Pressure/thermal model closes to ±15%; sensors calibrated; no basic safety flaw. | Coil duty cannot meet required zonal comfort at acceptable power/condensation. |
| G1 | Stationary mast packaging cleanly separates load, fluid, power, signal; FMEA has mitigation. | Any need remains to run wet/high-draw/rotating hardware through 50 mm mast. |
| G2 | PCM yields ≥1.5 h at 1 kW equivalent or ≥2 h at 0.75 kW; quick connects pass cycles. | PCM mass/cost/volume or chiller COP makes hospitality use case uneconomic. |
| G3 | Full cassette meets airflow, noise, drip, vibration and safe-fault targets. | Visual/thermal performance requires unacceptably loud/high-power fan. |
| G4 | Enclosure stows before structural limits and passive state is safe; anchoring scheme verified. | Breakaway creates projectiles, hoses/cables pull, or base needs impractical ballast. |
| G5 | Pilot produces verified local-comfort and maintenance evidence. | Value depends on unvalidated wind harvest/full enclosure/every-weather claims. |

## 4.3 Required evidence file

1. Requirements traceability matrix and hazard/risk register.
2. Controlled CAD, calculation, FMEA, control software and BOM revisions.
3. Calibration certificates/test methods/raw time series.
4. Airflow, heat-balance, PCM cycle, chiller COP, noise, vibration, drain/leak results.
5. Structural and anchorage engineering review; wind/stow/latch/tether tests.
6. Electrical, battery, pressure, refrigerant, ingress, EMC and roof/building compliance matrix.
7. Operator, inspection, stow, maintenance, cleaning, emergency and installation instructions.
8. Patent disclosure/search/family tracker, supplier NDAs/RFQs, pilot agreements, product liability/insurance review.

## References

[1]: https://www.ashrae.org/technical-resources/technical-apps/ashrae-duct-fitting-database-app ; https://www.cibse.org/knowledge-research/knowledge-portal/cibse-guide-c-heating-ventilating-air-conditioning-and-refrigeration "Ductwork, HVAC and pressure-loss references"
[2]: https://www.amca.org/test/amca-lab-arlington-heights.html ; https://www.amca.org/certify/ "Fan performance testing"
[3]: https://www.iso.org/standard/39155.html "Thermal-comfort reference"
[4]: https://knowledge.bsigroup.com/products/eurocode-1-actions-on-structures-general-actions-wind-actions ; https://www.hse.gov.uk/event-safety/temporary-demountable-structures.htm "Wind actions and temporary structures"
[5]: https://www.energynetworks.org/industry/connecting-to-the-networks/connecting-generation-to-the-electricity-networks "UK microgeneration connection context"
[6]: https://electrical.theiet.org/bs-7671/ ; https://www.gov.uk/government/publications/electrical-equipment-safety-regulations-2016/electrical-equipment-safety-regulations-2016-great-britain "Electrical design context"
[7]: https://www.sciencedirect.com/science/article/pii/S2352152X25000520 ; https://www.mdpi.com/2076-3417/14/7/3069 "PCM and small cooling research"
[8]: https://www.danfoss.com/en/products/dps/hoses-and-fittings/connectors-and-quick-disconnect-couplings/danfoss-hansen-quick-disconnect-couplings/thermal-management-quick-disconnect-couplings/ ; https://www.staubli.com/global/en/fluid-connectors/products/quick-and-dry-disconnect-couplings/air-conditioning/spf-clean-break.html "Thermal-management quick-connect examples"
[9]: https://www.hse.gov.uk/work-equipment-machinery/introduction.htm ; https://www.hse.gov.uk/pressure-systems/about.htm "Machinery and pressure-system safety"
[10]: https://www.istructe.org/resources/guidance/procurement-and-use-of-demountable-structures/ "Demountable structure governance"
[11]: https://www.gov.uk/government/publications/f-gas-regulations-guidance-for-users-producers-and-importers ; https://www.gov.uk/guidance/building-regulations-and-approved-documents-index "UK F-gas and building-regulation context"
