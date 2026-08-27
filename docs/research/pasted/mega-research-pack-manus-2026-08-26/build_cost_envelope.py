#!/usr/bin/env python3
import csv
from decimal import Decimal, ROUND_HALF_UP, getcontext
from pathlib import Path

getcontext().prec = 28
root = Path('/home/ubuntu/SynapticGM_mega_research_pack_2026-08-25')

lookup_date = '2026-08-25'
model_id = 'deepseek/deepseek-v4-flash-0731'
input_rate = Decimal('0.035')   # USD / 1M tokens
output_rate = Decimal('0.10')   # USD / 1M tokens
fx_gbp_per_usd = Decimal('0.85550') / Decimal('1.1662')
platform_fee_rate = Decimal('0.055')
min_purchase_fee_usd = Decimal('0.80')
billed_attempt_multiplier = Decimal('1.05')
opening_calls_per_mau = Decimal('1')

scenarios = [
    {
        'name': 'lean_context',
        'input_tokens_per_turn': Decimal('2000'),
        'output_tokens_per_turn': Decimal('500'),
        'opening_input_tokens': Decimal('4000'),
        'opening_output_tokens': Decimal('800'),
        'status': 'SPECULATIVE',
        'notes': 'Short-context sensitivity; requires production token telemetry before adoption.'
    },
    {
        'name': 'planning_base',
        'input_tokens_per_turn': Decimal('6000'),
        'output_tokens_per_turn': Decimal('800'),
        'opening_input_tokens': Decimal('8000'),
        'opening_output_tokens': Decimal('1200'),
        'status': 'SPECULATIVE',
        'notes': 'Recommended planning case until production p50/p90 input and output token logs are supplied.'
    },
    {
        'name': 'long_context',
        'input_tokens_per_turn': Decimal('20000'),
        'output_tokens_per_turn': Decimal('1200'),
        'opening_input_tokens': Decimal('24000'),
        'opening_output_tokens': Decimal('1600'),
        'status': 'SPECULATIVE',
        'notes': 'Long-context sensitivity showing cost exposure if prompts grow materially.'
    },
]

def money(x: Decimal) -> str:
    return str(x.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))

def money4(x: Decimal) -> str:
    return str(x.quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP))

fields = [
    'price_lookup_date','model_id','token_scenario','evidence_status','free_mau',
    'player_turns_per_mau','monthly_player_turns','opening_calls_per_mau',
    'input_tokens_per_turn','output_tokens_per_turn','opening_input_tokens',
    'opening_output_tokens','billed_attempt_multiplier','inference_cost_usd',
    'platform_fee_rate','platform_fee_usd_prorata','minimum_fee_usd_if_one_purchase',
    'total_usd_prorata_fee_ex_tax','total_usd_one_purchase_ex_tax',
    'fx_gbp_per_usd','total_gbp_prorata_fee_ex_tax','total_gbp_one_purchase_ex_tax',
    'gbp_per_mau_one_purchase','hook_plus_8_extra_turns_included','notes'
]
with (root / 'free_cost_envelope.csv').open('w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    for s in scenarios:
        turn_unit = (s['input_tokens_per_turn'] * input_rate + s['output_tokens_per_turn'] * output_rate) / Decimal('1000000')
        opening_unit = (s['opening_input_tokens'] * input_rate + s['opening_output_tokens'] * output_rate) / Decimal('1000000')
        for mau in [100, 1000, 10000]:
            dmau = Decimal(mau)
            for turns in [20, 40, 80]:
                dturns = Decimal(turns)
                monthly_player_turns = dmau * dturns
                inference = billed_attempt_multiplier * (
                    monthly_player_turns * turn_unit + dmau * opening_calls_per_mau * opening_unit
                )
                fee_prorata = inference * platform_fee_rate
                fee_one_purchase = max(fee_prorata, min_purchase_fee_usd)
                total_prorata = inference + fee_prorata
                total_one_purchase = inference + fee_one_purchase
                gbp_prorata = total_prorata * fx_gbp_per_usd
                gbp_one_purchase = total_one_purchase * fx_gbp_per_usd
                w.writerow({
                    'price_lookup_date': lookup_date,
                    'model_id': model_id,
                    'token_scenario': s['name'],
                    'evidence_status': s['status'],
                    'free_mau': mau,
                    'player_turns_per_mau': turns,
                    'monthly_player_turns': int(monthly_player_turns),
                    'opening_calls_per_mau': str(opening_calls_per_mau),
                    'input_tokens_per_turn': int(s['input_tokens_per_turn']),
                    'output_tokens_per_turn': int(s['output_tokens_per_turn']),
                    'opening_input_tokens': int(s['opening_input_tokens']),
                    'opening_output_tokens': int(s['opening_output_tokens']),
                    'billed_attempt_multiplier': str(billed_attempt_multiplier),
                    'inference_cost_usd': money4(inference),
                    'platform_fee_rate': str(platform_fee_rate),
                    'platform_fee_usd_prorata': money4(fee_prorata),
                    'minimum_fee_usd_if_one_purchase': money(min_purchase_fee_usd),
                    'total_usd_prorata_fee_ex_tax': money(total_prorata),
                    'total_usd_one_purchase_ex_tax': money(total_one_purchase),
                    'fx_gbp_per_usd': str(fx_gbp_per_usd.quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)),
                    'total_gbp_prorata_fee_ex_tax': money(gbp_prorata),
                    'total_gbp_one_purchase_ex_tax': money(gbp_one_purchase),
                    'gbp_per_mau_one_purchase': money4(gbp_one_purchase / dmau),
                    'hook_plus_8_extra_turns_included': 'NO',
                    'notes': s['notes'] + ' One opening call per MAU is included. The founder-supplied +8 text allowance after New Game is not assumed fully consumed; model it as eight additional turns when measuring actual uptake. VAT/GST, hosting, database, observability, image generation, support, refunds, and ad costs are excluded.'
                })

# Price reference for all founder-specified writer tiers.
price_rows = [
    {
        'tier': 'Free player tier',
        'retail_price_gbp': '0.00',
        'model_id': 'deepseek/deepseek-v4-flash-0731',
        'input_usd_per_million': '0.035',
        'output_usd_per_million': '0.10',
        'cache_read_usd_per_million': 'routing-dependent; provider table observed from 0.008',
        'context_tokens': '1000000',
        'price_lookup_date': lookup_date,
        'evidence_status': 'PUBLICLY EVIDENCED model price; EVIDENCED founder retail price',
    },
    {
        'tier': 'Mid',
        'retail_price_gbp': '14.99',
        'model_id': 'anthropic/claude-haiku-4.5',
        'input_usd_per_million': '1.00',
        'output_usd_per_million': '5.00',
        'cache_read_usd_per_million': '0.10 standard listed provider rows',
        'context_tokens': '200000',
        'price_lookup_date': lookup_date,
        'evidence_status': 'PUBLICLY EVIDENCED model price; EVIDENCED founder retail price',
    },
    {
        'tier': 'High',
        'retail_price_gbp': '29.99',
        'model_id': 'anthropic/claude-sonnet-4.6',
        'input_usd_per_million': '3.00',
        'output_usd_per_million': '15.00',
        'cache_read_usd_per_million': '0.30 standard listed provider rows',
        'context_tokens': '1000000',
        'price_lookup_date': lookup_date,
        'evidence_status': 'PUBLICLY EVIDENCED model price; EVIDENCED founder retail price',
    },
]
with (root / 'model_price_reference.csv').open('w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=list(price_rows[0].keys()))
    w.writeheader()
    w.writerows(price_rows)

print(root / 'free_cost_envelope.csv')
print(root / 'model_price_reference.csv')
