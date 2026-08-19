#!/usr/bin/env python3
"""Local structural checks for SynapticGM P4 content banks; no external execution."""
from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIALOGUE_PATH = ROOT / "P4_dialogue_beats.csv"
REWRITES_PATH = ROOT / "P4_stereotype_rewrite_pairs.md"
REQUIRED_ACTS = {"ask", "refuse", "bargain", "insult", "thank"}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> None:
    with DIALOGUE_PATH.open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))

    require(len(rows) == 80, f"Expected exactly 80 dialogue beats; found {len(rows)}")
    ids = [row["id"] for row in rows]
    require(len(set(ids)) == 80, "Dialogue IDs must be unique")
    acts = {row["act"] for row in rows}
    require(acts == REQUIRED_ACTS, f"Expected acts {sorted(REQUIRED_ACTS)}; found {sorted(acts)}")
    folk_counts: dict[str, int] = {}
    for row in rows:
        require(row["kid_mode_safe"] == "true", f"Beat {row['id']} must declare Kid Mode safety")
        require(row["dialogue_beat"].strip(), f"Beat {row['id']} has no dialogue")
        folk_counts[row["folk"]] = folk_counts.get(row["folk"], 0) + 1
    require(len(folk_counts) == 18, f"Expected 18 folk represented; found {len(folk_counts)}")

    rewrite_text = REWRITES_PATH.read_text(encoding="utf-8")
    rewrite_count = sum(1 for line in rewrite_text.splitlines() if line.startswith("| RW"))
    require(rewrite_count == 40, f"Expected exactly 40 rewrite rows; found {rewrite_count}")
    require("Stereotype to reject" in rewrite_text and "Good individual rewrite" in rewrite_text, "Rewrite table headers missing")

    print("P4 validation passed")
    print(f"dialogue_beats={len(rows)} folk_covered={len(folk_counts)} acts={len(acts)} rewrite_pairs={rewrite_count}")


if __name__ == "__main__":
    main()
