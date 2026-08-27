#!/usr/bin/env python3
import csv
from decimal import Decimal, ROUND_HALF_UP, getcontext
from pathlib import Path
getcontext().prec = 28
root = Path(__file__).resolve().parent
input_rate = Decimal('0.035')
output_rate = Decimal('0.10')
input_tokens = Decimal('6000')
output_tokens = Decimal('800')
turn_unit = (input_tokens * input_rate + output_tokens * output_rate) / Decimal('1000000')
attempt_multiplier = Decimal('1.05')
platform = Decimal('0.055')
fx = Decimal('0.85550') / Decimal('1.1662')

def q(x, places='0.01'):
    return str(x.quantize(Decimal(places), rounding=ROUND_HALF_UP))
rows=[]
for mau in [100,1000,10000]:
    raw = Decimal(mau) * Decimal('8') * turn_unit * attempt_multiplier
    total = raw * (Decimal('1') + platform)
    rows.append({
        'assumption_status':'SPECULATIVE uptake; EVIDENCED eight-turn allowance',
        'free_mau':mau,
        'new_games_per_mau':'1',
        'bonus_turns_per_new_game':'8',
        'incremental_billed_attempts':int(Decimal(mau)*Decimal('8')*attempt_multiplier),
        'incremental_inference_usd':q(raw,'0.0001'),
        'incremental_usd_with_prorata_platform_fee':q(total,'0.01'),
        'incremental_gbp_with_prorata_platform_fee':q(total*fx,'0.01'),
        'notes':'Planning-base token size. Excludes the $0.80 minimum because the main monthly credit purchase is already modeled; excludes tax and non-model costs.'
    })
out=root/'hook_plus_8_sensitivity.csv'
with out.open('w',newline='',encoding='utf-8') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0].keys()))
    w.writeheader(); w.writerows(rows)
print(out)
