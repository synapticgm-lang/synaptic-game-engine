#!/usr/bin/env python3
"""Local structural checks for SynapticGM P3 artifacts; no external execution."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SCHEMA_PATH = ROOT / "P3_folk_voice_profile.schema.json"
FIXTURES_PATH = ROOT / "P3_eval_fixtures.json"


def read_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> None:
    schema = read_json(SCHEMA_PATH)
    fixtures_doc = read_json(FIXTURES_PATH)

    require(schema.get("$schema") == "https://json-schema.org/draft/2020-12/schema", "Unexpected JSON Schema dialect")
    require(schema.get("title") == "SynapticGM FolkVoiceProfile", "Unexpected schema title")
    require(schema.get("additionalProperties") is False, "Schema must reject unexpected root properties")

    required = set(schema.get("required", []))
    for field in ["folkId", "voiceDefaults", "socialDefaults", "kidMode", "neverLines", "precedence", "stateIsolation"]:
        require(field in required, f"Missing required schema field: {field}")

    folk_ids = schema["properties"]["folkId"]["enum"]
    require(len(folk_ids) == 18, f"Expected 18 folk IDs; found {len(folk_ids)}")
    require("orc" in folk_ids and "ledgerborn" in folk_ids and "woven" in folk_ids, "Required folk IDs missing")

    precedence = schema["properties"]["precedence"]["const"]
    require(precedence[:2] == ["CampaignContract", "NamedNpcMemory"], "Precedence must begin with CampaignContract and NamedNpcMemory")

    state_isolation = schema["properties"]["stateIsolation"]["properties"]
    require(state_isolation["mode"]["const"] == "presentation_only", "State isolation must be presentation-only")
    prohibited = state_isolation["prohibitedAuthoritativeFields"]["const"]
    for term in ["ledgerFacts", "stats", "permits", "kit", "inventory", "prices", "transactionCommit"]:
        require(term in prohibited, f"State firewall missing: {term}")

    fixtures = fixtures_doc.get("fixtures", [])
    require(len(fixtures) == 20, f"Expected exactly 20 fixtures; found {len(fixtures)}")
    fixture_ids = [fixture.get("id") for fixture in fixtures]
    require(len(set(fixture_ids)) == 20, "Fixture IDs must be unique")
    for fixture in fixtures:
        require(fixture.get("folkId") in folk_ids, f"Unknown folk ID in {fixture.get('id')}")
        require(bool(fixture.get("passConditions")), f"No pass conditions in {fixture.get('id')}")
        require(bool(fixture.get("failConditions")), f"No fail conditions in {fixture.get('id')}")

    titles = [fixture.get("title", "") for fixture in fixtures]
    require(any("Elf merchant refuses haste" in title for title in titles), "Required elf merchant refusal fixture missing")
    require(any(fixture.get("mode", {}).get("kidMode") for fixture in fixtures), "Kid Mode coverage missing")
    require(any(fixture.get("folkId") == "vampire" for fixture in fixtures), "Vampire coverage missing")
    require(any(fixture.get("folkId") == "beastfolk" for fixture in fixtures), "Beastfolk coverage missing")
    require(any("franchise" in " ".join(fixture.get("failConditions", [])).lower() for fixture in fixtures), "IP safety coverage missing")

    print("P3 validation passed")
    print(f"folk_ids={len(folk_ids)} fixtures={len(fixtures)} required_fields={len(required)}")


if __name__ == "__main__":
    main()
