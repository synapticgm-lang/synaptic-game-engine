import json
from pathlib import Path
import sys

ROOT = Path('/home/ubuntu/SynapticGM_own_ai_cashflow_gapfill_2026-08-18')
sys.path.insert(0, str(ROOT / 'model'))
import build_cashflow_model as m

out = {}
base_rows = []
for key, label, _ in m.SCENARIOS:
    for mau in m.A['mau_list']:
        r = m.compute(key, mau)
        base_rows.append({
            'scenario': label,
            'mau': mau,
            'monthly_gbp': r['monthly_total_gbp'],
            'annual_gbp': r['annual_total_gbp'],
            'per_mau_month_gbp': r['gbp_per_mau_month'],
            'gpu_count': r['gpu_count'],
            'gpu_idle_hours': r['gpu_idle_hours'],
        })
out['base'] = base_rows

out['cache_sensitivity_direct_1000'] = []
for h in [0.0, 0.30, 0.70]:
    r = m.compute('B_direct_cache', 1000, hit_rate=h)
    out['cache_sensitivity_direct_1000'].append({'cache_hit_rate': h, 'monthly_gbp': r['monthly_total_gbp'], 'annual_gbp': r['annual_total_gbp'], 'narrator_gbp': r['narrator_gbp']})

out['retry_sensitivity_direct_1000'] = []
for rr in [0.0, 0.05, 0.15]:
    r = m.compute('B_direct_cache', 1000, retry_rate=rr)
    out['retry_sensitivity_direct_1000'].append({'retry_rate': rr, 'monthly_gbp': r['monthly_total_gbp'], 'annual_gbp': r['annual_total_gbp'], 'narrator_gbp': r['narrator_gbp']})

out['art_skip_sensitivity'] = []
for skip in [0.0, 0.30, 0.70]:
    x = {'art_skip_rate': skip}
    for mau in [100, 1000, 10000]:
        x[str(mau)] = {
            'monthly_art_gbp': m.art_usd_month(mau, skip) * m.A['gbp_per_usd'],
            'monthly_attempts': mau * m.A['weekly_active_share'] * m.A['weekly_image_cap_per_wau'] * m.A['weeks_per_month'] * (1-skip),
        }
    out['art_skip_sensitivity'].append(x)

out['warden_vs_direct_break_even'] = []
for mau in m.A['mau_list']:
    b = m.compute('B_direct_cache', mau)
    d = m.compute('D_selfhost_warden', mau)
    premium = d['monthly_total_gbp'] - b['monthly_total_gbp']
    paid_narrator_cost = b['narrator_gbp']
    out['warden_vs_direct_break_even'].append({
        'mau': mau,
        'warden_monthly_premium_gbp': premium,
        'paid_narrator_monthly_gbp': paid_narrator_cost,
        'required_narrator_cost_reduction_pct': premium / paid_narrator_cost if paid_narrator_cost else None,
        'required_reduction_per_turn_gbp': premium / b['turns_month'],
        'warm_warden_idle_hours': d['gpu_idle_hours'],
        'serverless_active_only_gpu_gbp': d['gpu_active_hours'] * m.A['warden_serverless_usd_hour'] * m.A['gbp_per_usd'],
    })

out['full_narrator_break_even'] = []
for mau in m.A['mau_list']:
    paid = m.compute('B_direct_cache', mau)
    for scenario, fallback_key in [('E1_selfhost_7b', 'api_fallback_rate_full_7b'), ('E2_selfhost_70b', 'api_fallback_rate_full_70b')]:
        r0 = m.compute(scenario, mau)
        # Decompose fallback: current total excluding fallback then calculate maximum fallback rate at which self-host total equals direct API total.
        fixed_no_fallback = r0['monthly_total_gbp'] - r0['fallback_gbp']
        direct_cost_per_turn = m.narrator_usd_per_turn(False) * m.A['gbp_per_usd']
        threshold = (paid['monthly_total_gbp'] - fixed_no_fallback) / (paid['turns_month'] * direct_cost_per_turn)
        out['full_narrator_break_even'].append({
            'scenario': scenario,
            'mau': mau,
            'current_fallback_rate': m.A[fallback_key],
            'max_fallback_rate_to_equal_direct': threshold,
            'current_monthly_gbp': r0['monthly_total_gbp'],
            'direct_monthly_gbp': paid['monthly_total_gbp'],
            'gpu_count': r0['gpu_count'],
            'idle_hours': r0['gpu_idle_hours'],
        })

out['warden_gpu_quotes'] = {
    'runpod_warm_a5000_24gb_usd_hour': m.A['warden_gpu_usd_hour'],
    'runpod_serverless_24gb_usd_active_hour': m.A['warden_serverless_usd_hour'],
    'lambda_a100_40gb_usd_hour': 1.99,
    'lambda_a100_80gb_usd_hour': 2.79,
    'vast_marketplace_snapshot_rtx3090_24gb_usd_hour': 0.07,
    'vast_marketplace_snapshot_rtx4090_24gb_usd_hour': 0.13,
}

print(json.dumps(out, indent=2))
