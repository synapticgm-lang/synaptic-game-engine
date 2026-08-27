from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt

OUT = Path('/home/ubuntu/synapticgm_comic_research')

KLEIN = 0.014
PRO = 0.030

# Planning assumptions, not observed production data.
tiers = [
    {
        'tier': 'Classic + Memorable baseline',
        'eligible_turn_rate': 3/25,
        'avg_panels_per_eligible_turn': 1.0,
        'klein_share': 1.0,
        'pro_share': 0.0,
        'paid_retry_rate': 0.10,
    },
    {
        'tier': 'Free comic-lite',
        'eligible_turn_rate': 0.20,
        'avg_panels_per_eligible_turn': 1.0,
        'klein_share': 1.0,
        'pro_share': 0.0,
        'paid_retry_rate': 0.10,
    },
    {
        'tier': 'Mid balanced',
        'eligible_turn_rate': 0.50,
        'avg_panels_per_eligible_turn': 1.4,
        'klein_share': 1.0,
        'pro_share': 0.0,
        'paid_retry_rate': 0.12,
    },
    {
        'tier': 'High selective premium',
        'eligible_turn_rate': 0.70,
        'avg_panels_per_eligible_turn': 1.8,
        'klein_share': 0.80,
        'pro_share': 0.20,
        'paid_retry_rate': 0.15,
    },
]

rows = []
for t in tiers:
    blended = t['klein_share'] * KLEIN + t['pro_share'] * PRO
    base_panels_per_turn = t['eligible_turn_rate'] * t['avg_panels_per_eligible_turn']
    paid_jobs_per_turn = base_panels_per_turn * (1 + t['paid_retry_rate'])
    cost_per_turn = paid_jobs_per_turn * blended
    row = dict(t)
    row.update({
        'blended_model_cost_per_1mp_panel_usd': blended,
        'base_panels_per_turn': base_panels_per_turn,
        'paid_jobs_per_turn_including_retries': paid_jobs_per_turn,
        'raw_model_cost_per_turn_usd': cost_per_turn,
        'raw_model_cost_per_25_turn_session_usd': cost_per_turn * 25,
        'raw_model_cost_per_100_turns_usd': cost_per_turn * 100,
    })
    rows.append(row)

df = pd.DataFrame(rows)
df.to_csv(OUT / 'cost_model_tier_scenarios.csv', index=False)

retry_rows = []
for model, cost in [('Klein 4B', KLEIN), ('FLUX.2 Pro', PRO)]:
    for panels in [1, 2, 3, 4, 6]:
        for retry in [0.05, 0.10, 0.20, 0.30]:
            retry_rows.append({
                'model': model,
                'panels': panels,
                'paid_retry_rate': retry,
                'raw_cost_per_eligible_turn_usd': panels * cost * (1 + retry),
            })
retry_df = pd.DataFrame(retry_rows)
retry_df.to_csv(OUT / 'cost_model_panel_retry_matrix.csv', index=False)

# Plot cost per 100 turns under tier assumptions and a 25% operating reserve.
plot_df = df.copy()
plot_df['with_25pct_operating_reserve'] = plot_df['raw_model_cost_per_100_turns_usd'] * 1.25

plt.style.use('seaborn-v0_8-whitegrid')
fig, ax = plt.subplots(figsize=(10, 5.8), dpi=180)
x = range(len(plot_df))
raw = plot_df['raw_model_cost_per_100_turns_usd']
reserve = plot_df['with_25pct_operating_reserve']
width = 0.36
ax.bar([i - width/2 for i in x], raw, width, label='Raw model cost', color='#335C81')
ax.bar([i + width/2 for i in x], reserve, width, label='With 25% operating reserve', color='#D97A3A')
ax.set_xticks(list(x))
ax.set_xticklabels(plot_df['tier'], rotation=15, ha='right')
ax.set_ylabel('USD per 100 turns')
ax.set_title('SynapticGM comic presentation cost scenarios\n(1 MP outputs; planning assumptions, not observed production data)')
ax.legend(frameon=False)
ax.set_ylim(0, max(reserve) * 1.22)
for i, (r, v) in enumerate(zip(raw, reserve)):
    ax.text(i - width/2, r + max(reserve)*0.02, f'${r:.2f}', ha='center', va='bottom', fontsize=8)
    ax.text(i + width/2, v + max(reserve)*0.02, f'${v:.2f}', ha='center', va='bottom', fontsize=8)
fig.tight_layout()
fig.savefig(OUT / 'cost_model_per_100_turns.png', bbox_inches='tight')

print(df.to_string(index=False))
print('\nWrote:', OUT / 'cost_model_tier_scenarios.csv')
print('Wrote:', OUT / 'cost_model_panel_retry_matrix.csv')
print('Wrote:', OUT / 'cost_model_per_100_turns.png')
