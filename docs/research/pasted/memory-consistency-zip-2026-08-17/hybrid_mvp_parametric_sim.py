#!/usr/bin/env python3
"""Preliminary parametric screening model for the hybrid micro-climate cassette.
All inputs are conceptual assumptions, not validated design data or certifications.
"""
from math import pi

RHO_AIR = 1.20
CP_AIR = 1005.0
CP_PG = 3700.0
RHO_WIND = 1.225
G = 9.80665

# Cooling assumptions: 40 kg PG/water with a usable 10 K band, PCM useful latent capacity,
# and a net chiller capacity that rejects heat outside the base.
water_mass = 40.0
water_delta_t = 10.0
water_store_kj = water_mass * CP_PG * water_delta_t / 1000.0
pcm_mass = 30.0
pcm_usable_kj_kg = 160.0
pcm_store_kj = pcm_mass * pcm_usable_kj_kg
storage = {
    "water_40kg_10K": water_store_kj,
    "water_plus_30kg_pcm": water_store_kj + pcm_store_kj,
}
loads_kw = [0.50, 0.75, 1.00]
chiller_net_kw = 0.60
cop_system = 2.0
aux_kw = 0.05

print("THERMAL_STORAGE_RUNTIME")
print("strategy,load_kW,storage_kJ,net_storage_draw_kW,runtime_h,electrical_draw_kW")
for name, e_kj in storage.items():
    for load in loads_kw:
        runtime = e_kj / (load * 3600.0)
        print(f"{name},{load:.2f},{e_kj:.0f},{load:.2f},{runtime:.2f},0.00")
        net_draw = max(load - chiller_net_kw, 0.0)
        runtime_chiller = (e_kj / (net_draw * 3600.0)) if net_draw > 0 else float('inf')
        electric = chiller_net_kw / cop_system + aux_kw
        text_runtime = "infinite_steady_state" if runtime_chiller == float('inf') else f"{runtime_chiller:.2f}"
        print(f"{name}_plus_chiller,{load:.2f},{e_kj:.0f},{net_draw:.2f},{text_runtime},{electric:.2f}")

print("\nCOOLING_AIR_SIDE")
print("Q_m3s,eps,Qcool_kW,Tair_out_C,water_flow_Lmin_at_5K")
for q in [0.10, 0.16, 0.22]:
    for eps in [0.22, 0.30]:
        t_in = 35.0
        tw = 7.5
        qcool_w = eps * RHO_AIR * q * CP_AIR * (t_in - tw)
        t_out = t_in - qcool_w / (RHO_AIR * q * CP_AIR)
        water_lmin = qcool_w / (CP_PG * 5.0) * 60.0
        print(f"{q:.2f},{eps:.2f},{qcool_w/1000:.3f},{t_out:.2f},{water_lmin:.2f}")

print("\nAMBIENT_ENVELOPE")
print("ambient_C,Q_m3s,eps,Qcool_kW,Tair_out_C")
for ambient in [32.0, 35.0, 38.0]:
    for q in [0.11, 0.16]:
        for eps in [0.22, 0.30]:
            tw=7.5
            qcool_w=eps*RHO_AIR*q*CP_AIR*(ambient-tw)
            tout=ambient-qcool_w/(RHO_AIR*q*CP_AIR)
            print(f"{ambient:.0f},{q:.2f},{eps:.2f},{qcool_w/1000:.3f},{tout:.2f}")

print("\nPLENUM_DIFFUSER")
print("D_m,Q_m3s,dp_system_Pa,fan_input_W,slot_velocity_mps")
for d, q, dp in [(2.5,0.11,60),(3.0,0.16,85),(3.5,0.22,120)]:
    fan_w = q * dp / 0.45
    slot_area = pi * d * 0.010
    print(f"{d:.1f},{q:.2f},{dp:.0f},{fan_w:.1f},{q/slot_area:.2f}")

print("\nWIND_SCREENING")
print("mph,V_mps,q_Pa,F_open_N,M_open_Nm,ballast_open_kg,F_enclosure_N,M_enclosure_Nm,ballast_enclosure_kg")
# 3 m parasol: open projected area 1.06m2/Cf1.2; enclosure projected 6.3m2/Cf1.3;
# hcp 2.2m, effective base lever .65m, screening factor 1.5.
for mph in [10,15,18,22,30,35,45]:
    v = mph * 0.44704
    q = 0.5 * RHO_WIND * v * v
    f_open = q * 1.2 * 1.06
    m_open = f_open * 2.2
    b_open = 1.5 * m_open / (G * .65)
    f_enc = q * 1.3 * 6.3
    m_enc = f_enc * 2.2
    b_enc = 1.5 * m_enc / (G * .65)
    print(f"{mph},{v:.2f},{q:.1f},{f_open:.1f},{m_open:.1f},{b_open:.1f},{f_enc:.1f},{m_enc:.1f},{b_enc:.1f}")

print("\nBREAKAWAY_PRELOAD")
print("mph,q_Pa,F_on_0p6m2_at_Cf1p1_N")
for mph in [10,15,18,20,22]:
    v=mph*.44704
    q=.5*RHO_WIND*v*v
    f=q*1.1*.6
    print(f"{mph},{q:.1f},{f:.1f}")

print("\nMVP_HEAT_MODE")
print("airflow_m3s,thermal_kW,air_rise_C,water_flow_Lmin_at_5K")
for q in [0.10,0.16,0.22]:
    heat_w=1800.0
    dt=heat_w/(RHO_AIR*q*CP_AIR)
    flow=heat_w/(CP_PG*5.0)*60.0
    print(f"{q:.2f},{heat_w/1000:.1f},{dt:.2f},{flow:.2f}")
