from copy import deepcopy
from pathlib import Path
import json
from jsonschema import Draft202012Validator

schema_path = Path('/home/ubuntu/SynapticGM_score_boost_post_28c_2026-08-27/deliverables/SynapticGM_score_boost_post_28c_2026-08-27_T10_eval_harness_gates.schema.json')
schema = json.loads(schema_path.read_text(encoding='utf-8'))
validator = Draft202012Validator(schema)
h = 'sha256:' + 'a' * 64

positive = {
    'schemaVersion': '29a-1',
    'run': {
        'runId': 'run-42',
        'seed': 's69',
        'mode': 'DnD',
        'registryVersion': 'beats-29a-1',
        'runtimeVersion': '29a',
        'evaluatorContextId': 'eval-run-42',
        'turnsArtifactHash': h,
    },
    'resolutionGate': {
        'applicable': True,
        'status': 'pass',
        'deadlineTurn': 50,
        'encounters': [{
            'encounterId': 'enc-7',
            'spawnReceiptId': 'spawn-7',
            'spawnTurn': 6,
            'clearReceiptId': 'clear-7',
            'clearTurn': 10,
            'outcome': 'parleyResolved',
            'committedDeltaHash': h,
            'runId': 'run-42',
            'seed': 's69',
            'mode': 'DnD',
            'replayHash': h,
        }],
        'violations': [],
    },
    'branchGate': {
        'applicable': False,
        'status': 'notApplicable',
        'deadlineTurn': 30,
        'crises': [],
        'violations': [],
    },
    'hookGate': {
        'status': 'pass',
        'successDeadlineTurn': 12,
        'purgatoryCheckTurn': 15,
        'qualifyingReceipt': {
            'receiptType': 'encounterCleared',
            'receiptId': 'clear-7',
            'turn': 10,
            'runId': 'run-42',
            'seed': 's69',
            'terminalOutcome': 'parleyResolved',
            'committedDeltaHash': h,
        },
        'activeEncounterAtT15': False,
        'violations': [],
    },
    'replayGate': {
        'status': 'pass',
        'originalReplayHash': h,
        'rerunReplayHash': h,
        'normalizedReceiptsHash': h,
        'rerunNormalizedReceiptsHash': h,
        'violations': [],
    },
    'contaminationGate': {
        'status': 'pass',
        'foreignArtifacts': [],
        'violations': [],
    },
    'overallStatus': 'pass',
    'quarantineReasons': [],
}

positive_errors = sorted(validator.iter_errors(positive), key=lambda e: list(e.path))
if positive_errors:
    raise SystemExit('positive fixture rejected:\n' + '\n'.join(e.message for e in positive_errors))

missing_clear = deepcopy(positive)
del missing_clear['resolutionGate']['encounters'][0]['clearReceiptId']
if not list(validator.iter_errors(missing_clear)):
    raise SystemExit('negative fixture missing_clear was incorrectly accepted')

contaminated_but_pass = deepcopy(positive)
contaminated_but_pass['contaminationGate'] = {
    'status': 'fail',
    'foreignArtifacts': [{
        'artifactType': 'receipt',
        'observedRunId': 'run-other',
        'observedSeed': 's188',
        'evidenceHash': h,
    }],
    'violations': [{'code': 'CROSS_RUN_BLEED', 'message': 'Foreign receipt detected'}],
}
if not list(validator.iter_errors(contaminated_but_pass)):
    raise SystemExit('negative fixture contaminated_but_pass was incorrectly accepted')

print('positive fixture: accepted')
print('negative fixture missing_clear: rejected')
print('negative fixture contaminated_but_pass: rejected')
