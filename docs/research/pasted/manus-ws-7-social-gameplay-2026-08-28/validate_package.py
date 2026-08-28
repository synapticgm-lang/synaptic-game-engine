from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ERRORS: list[str] = []
WARNINGS: list[str] = []


def load_json(name: str):
    path = ROOT / name
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        ERRORS.append(f"{name}: invalid JSON: {exc}")
        return None


def validate_json_schema(instance_name: str, schema_name: str) -> None:
    instance = load_json(instance_name)
    schema = load_json(schema_name)
    if instance is None or schema is None:
        return
    try:
        import jsonschema
    except ImportError:
        WARNINGS.append("jsonschema package unavailable; structural checks only")
        return
    try:
        jsonschema.Draft202012Validator(schema).validate(instance)
    except Exception as exc:
        ERRORS.append(f"{instance_name}: schema validation failed: {exc}")


def check_catalog() -> None:
    catalog = load_json("social-crisis-catalog.json")
    if not catalog:
        return
    patterns = catalog.get("patterns", [])
    if len(patterns) != 15:
        ERRORS.append(f"crisis catalog: expected 15 patterns, found {len(patterns)}")
    ids = [p.get("id") for p in patterns]
    if len(set(ids)) != len(ids):
        ERRORS.append("crisis catalog: duplicate IDs")
    for pattern in patterns:
        pid = pattern.get("id", "unknown")
        modes = {row.get("mode") for row in pattern.get("genre_filters", [])}
        if modes != {"dnd", "rpg", "pyoa", "litrpg"}:
            ERRORS.append(f"{pid}: incomplete genre filters {sorted(modes)}")
        for band in ("success", "partial", "failure"):
            if not pattern.get("resolution", {}).get(band):
                ERRORS.append(f"{pid}: missing {band} resolution")
        if len(pattern.get("stakes", [])) < 2:
            ERRORS.append(f"{pid}: fewer than two stakes")
        if len(pattern.get("prose_example", "")) < 80:
            ERRORS.append(f"{pid}: prose example too short")


def check_relationship_example() -> None:
    example = load_json("npc-relationship.example.json")
    if not example:
        return
    betrayals = [m for m in example.get("milestones", []) if m.get("type") == "betrayal"]
    if not any(m.get("turn") == 50 for m in betrayals):
        ERRORS.append("relationship example: missing turn-50 betrayal")
    if example.get("lastInteractionTurn", 0) < 100:
        ERRORS.append("relationship example: does not demonstrate turn-100 persistence")


def check_backlog() -> None:
    path = ROOT / "implementation-backlog.csv"
    try:
        with path.open(newline="", encoding="utf-8") as handle:
            rows = list(csv.DictReader(handle))
    except Exception as exc:
        ERRORS.append(f"backlog: unreadable CSV: {exc}")
        return
    expected = ["ID", "Priority", "Task", "Complexity", "Integration", "Notes"]
    if not rows:
        ERRORS.append("backlog: no rows")
        return
    if list(rows[0].keys()) != expected:
        ERRORS.append(f"backlog: columns differ from {expected}")
    if not 30 <= len(rows) <= 40:
        ERRORS.append(f"backlog: expected 30-40 rows, found {len(rows)}")
    ids = [row["ID"] for row in rows]
    if len(ids) != len(set(ids)):
        ERRORS.append("backlog: duplicate IDs")
    priorities = {row["Priority"] for row in rows}
    if priorities != {"P0", "P1", "P2"}:
        ERRORS.append(f"backlog: priorities incomplete {sorted(priorities)}")


def check_gates() -> None:
    gates = load_json("validation-gates.json")
    if not gates:
        return
    ids = [gate.get("gateId") for gate in gates.get("gates", [])]
    if ids != ["G1", "G2", "G3", "G4", "G5"]:
        ERRORS.append(f"validation gates: expected G1-G5, found {ids}")
    for gate in gates.get("gates", []):
        for field in ("criterion", "measurementMethod", "passThreshold", "failureEvidence"):
            if field not in gate:
                ERRORS.append(f"{gate.get('gateId')}: missing {field}")


def check_manifest_and_citations() -> None:
    required = [
        "WS-7-Social-Gameplay-Non-Combat-Systems.md",
        "social-gameplay-constitution.md",
        "social-crisis-catalog.schema.json",
        "social-crisis-catalog.json",
        "socialSkills.ts",
        "leverageMechanics.ts",
        "npcRelationships.ts",
        "npc-relationship.schema.json",
        "npc-relationship.example.json",
        "socialStakes.ts",
        "socialProgression.ts",
        "competitor-social-mechanics-analysis.md",
        "implementation-backlog.csv",
        "validation-gates.json",
        "evalHarness.ts",
    ]
    for name in required:
        if not (ROOT / name).exists():
            ERRORS.append(f"missing artifact: {name}")
    for name in ("WS-7-Social-Gameplay-Non-Combat-Systems.md", "social-gameplay-constitution.md", "competitor-social-mechanics-analysis.md"):
        path = ROOT / name
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        if "## References" not in text:
            ERRORS.append(f"{name}: missing References section")
        used = {int(x) for x in re.findall(r"\[(\d+)\](?!:)", text)}
        defined = {int(x) for x in re.findall(r"^\[(\d+)\]:", text, flags=re.MULTILINE)}
        if not used.issubset(defined):
            ERRORS.append(f"{name}: undefined citations {sorted(used - defined)}")


def main() -> int:
    validate_json_schema("social-crisis-catalog.json", "social-crisis-catalog.schema.json")
    validate_json_schema("npc-relationship.example.json", "npc-relationship.schema.json")
    check_catalog()
    check_relationship_example()
    check_backlog()
    check_gates()
    check_manifest_and_citations()
    result = {
        "status": "PASS" if not ERRORS else "FAIL",
        "errors": ERRORS,
        "warnings": WARNINGS,
    }
    output = ROOT / "validation-report.json"
    output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if not ERRORS else 1


if __name__ == "__main__":
    sys.exit(main())
