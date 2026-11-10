#!/usr/bin/env python3
"""Path lint for the six authored PYOA books.

Static checks (CI): dice checks skippable to an ending or across a region,
fallback failure endings reachable with no missed check, companion/NPC flags
set but never read, misnamed flag values, unreachable sections, dead ends.

Heuristic prose findings are written to content/pyoa/PROSE-TODO.json.
They do not fail CI. Known hard issues, if any, live in
content/pyoa/path-lint-baseline.json; a fingerprint that is not listed fails CI.

No model calls. Does not edit books.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict, deque
from pathlib import Path

ROOT_DEFAULT = Path(__file__).resolve().parents[2]

BOOKS = [
    ("saltglass", "content/pyoa/saltglass/book.json", "pick"),
    ("vesperhold", "content/pyoa/vesperhold/book.json", "pick"),
    ("tide", "content/pyoa/dice/book.json", "dice"),
    ("cinderfall", "content/pyoa/cinderfall/book.json", "dice"),
    ("underlibrary", "content/pyoa/underlibrary/book.json", "dice"),
    ("umbra", "src/data/pyoa/umbraBook.json", "pick"),
]

# Hard failures. Anything else is prose / heuristic and goes to the TODO.
HARD_KINDS = {
    "dice_skippable_to_ending",
    "dice_skippable_in_region",
    "hub_skip_to_bottleneck",
    "fallback_is_default_route",
    "flag_set_never_read",
    "flag_read_never_set",
    "flag_value_absent_from_prose",
    "unreachable_section",
    "dead_end",
    "missing_link",
}

FAILURE_KEYS = {
    "spent", "dead-steam", "misfiled", "drown-saltspire", "drown-gullmouth",
    "burn-the-line", "gate-flood", "the-burning", "great-forgetting",
}

# Adjective / state values, not character names. "calder" and "biscuit" are not here.
VALUE_SKIP = {
    "alone", "true", "false", "yes", "no", "none", "public", "burned", "unused",
    "sold", "forged", "allied", "known", "unknown", "dead", "gone", "tailor",
    "livery", "open", "closed", "seen", "hidden", "owed", "sworn", "free", "lit",
    "dark", "whole", "cracked", "clear", "with", "left", "betrayed", "bought",
    "dropped", "usher", "cloak", "bare", "y", "n",
}

COMPANIONS = {
    "saltglass": [{"name": "Calder", "aliases": ["glass-diver"], "flag": "guide", "present": ["calder"], "absent": ["alone"]}],
    "vesperhold": [{"name": "Biscuit", "aliases": ["the mule"], "flag": "mule", "present": ["biscuit"], "absent": ["alone"]}],
    "tide": [{"name": "Orsolya", "aliases": ["Orsolya Venn"], "flag": "orsolya", "present": [True], "absent": [False]}],
    "cinderfall": [{"name": "Hesper", "aliases": ["Hesper Quill"], "flag": "hesper", "present": [True], "absent": [False]}],
    "underlibrary": [{"name": "Thessaly", "aliases": ["Thessaly Marr"], "flag": "thessaly", "present": [True], "absent": [False]}],
    "umbra": [
        {"name": "Valerius", "aliases": [], "flag": "valerius", "present": ["allied"], "absent": ["betrayed", "_"]},
        {"name": "Rigg", "aliases": [], "flag": "rigg", "present": ["allied"], "absent": ["betrayed", "_"]},
        {"name": "Sable", "aliases": [], "flag": "sable", "present": ["with"], "absent": ["left", "_"]},
    ],
}

STOCK = [
    ("decision_must_be_made", re.compile(r"\ba decision must be made\b", re.I)),
    ("you_must_decide", re.compile(r"\byou must decide\b", re.I)),
    ("you_must_choose", re.compile(r"\byou must choose\b", re.I)),
    ("the_choice_is_yours", re.compile(r"\bthe choice is yours\b", re.I)),
    ("what_do_you_do", re.compile(r"\bwhat do you do\??\b", re.I)),
    ("every_x_offers", re.compile(r"\bevery [a-z][a-z' \-]{0,40} offers\b", re.I)),
    ("a_choice_lies", re.compile(r"\ba choice lies before you\b", re.I)),
    ("you_have_a_choice", re.compile(r"\byou have a (?:choice|decision) to make\b", re.I)),
    ("now_you_must_choose", re.compile(r"\bnow you must (?:choose|decide)\b", re.I)),
]
DANGER_LABEL = re.compile(
    r"\b(reckless|danger|dangerous|deadly|death|die|fatal|plunge|drop|chute|"
    r"sinkhole|unstable|collapse|collapsing|crevasse|thin ice|no way back|"
    r"certain death|leap|jump|lethal)\b",
    re.I,
)
DANGER_PAGE = re.compile(
    r"\b(die|death|kill(?:s|ed)? you|will not survive|no way back|bottomless|"
    r"sinkhole|the crust (?:is|looks) (?:thin|hollow)|it will not hold|"
    r"one (?:wrong )?step|plunge|fatal|deadly|you would fall|"
    r"unstable|collaps(?:e|ing)|crevasse|thin ice|certain death)\b",
    re.I,
)
# "on your own strength/rations/lantern" is not "you are alone". The audit's
# Vesperhold hits on those phrases were wording false positives.
ALONE = re.compile(
    r"\b(you (?:are|travel|walk|go|set (?:off|out)|cross|continue) alone|"
    r"by yourself|without (?:a |any )?(?:guide|companion|friend|mule)|"
    r"you have no (?:guide|companion|company)|"
    r"on your own(?!\s+[A-Za-z]))\b",
    re.I,
)
WAKE = re.compile(
    r"\b(you (?:wake|awaken|come to|open your eyes)|"
    r"the first thing that wakes you|"
    r"you (?:sit|push yourself) up from your (?:cot|bed|bunk))\b",
    re.I,
)
RESERVED = {"not", "any"}
BOUNDARY_KINDS = {"in", "out", "choke", "bottleneck", "prologue", "final"}
BOUNDARY_ROLES = {"region-gate", "gate", "ending-selector"}


def cond_flags(cond, out=None):
    if out is None:
        out = set()
    if not isinstance(cond, dict):
        return out
    for key, want in cond.items():
        if key == "not":
            cond_flags(want, out)
        elif key == "any":
            for branch in want or []:
                cond_flags(branch, out)
        elif key not in RESERVED:
            out.add(key)
    return out


def flag_matches(actual, want) -> bool:
    wants = want if isinstance(want, list) else [want]
    for w in wants:
        if w is True:
            if actual not in (None, False, ""):
                return True
        elif w == "_" or w is False:
            if actual in (None, False, ""):
                return True
        elif actual is not None and str(actual) == str(w):
            return True
    return False


def cond_holds(cond, flags) -> bool:
    if not isinstance(cond, dict) or not cond:
        return True
    for key, want in cond.items():
        if want is None:
            continue
        if key == "not":
            if cond_holds(want, flags):
                return False
        elif key == "any":
            branches = want if isinstance(want, list) else []
            if branches and not any(cond_holds(b, flags) for b in branches):
                return False
        elif not flag_matches(flags.get(key), want):
            return False
    return True


def load_book(path: Path):
    raw = json.loads(path.read_text(encoding="utf-8"))
    nodes = raw["nodes"]
    by = {n["id"]: n for n in nodes}
    start = raw.get("start") or raw.get("startId")
    return raw, nodes, by, start


def is_doom(node) -> bool:
    kind = node.get("kind") or ""
    eid = str(node.get("endingId") or "")
    return kind == "doom" or bool(eid and re.match(r"^doom", eid, re.I))


def is_ending_leaf(node) -> bool:
    if is_doom(node):
        return False
    kind = node.get("kind") or ""
    exits = [e for e in (node.get("exits") or []) if e.get("to")]
    if kind == "ending" and not exits:
        return True
    if node.get("ending") and not exits:
        return True
    if node.get("endingId") and not exits and kind not in ("endingpart", "ending-part", "doom", "prologue"):
        return True
    return False


def is_terminal(node) -> bool:
    return is_doom(node) or is_ending_leaf(node)


def issue(kind, message, sections, extra=None):
    return {
        "kind": kind,
        "message": message,
        "sections": [s for s in sections if s],
        "extra": extra or {},
    }


def fingerprint(slug, item):
    secs = ",".join(item["sections"][:12])
    flag = item["extra"].get("flag") or item["extra"].get("value") or ""
    return f"{slug}|{item['kind']}|{flag}|{secs}"


def reachable(by, start):
    seen = set()
    q = deque([start])
    while q:
        i = q.popleft()
        if i in seen or i not in by:
            continue
        seen.add(i)
        for e in by[i].get("exits") or []:
            if e.get("to"):
                q.append(e["to"])
    return seen


def path_avoiding_checks(by, start, goals):
    seen = set()
    q = deque([start])
    while q:
        i = q.popleft()
        if i in goals and i != start:
            return True
        if i in seen or i not in by:
            continue
        seen.add(i)
        node = by[i]
        if node.get("kind") == "check" and i != start:
            continue
        for e in node.get("exits") or []:
            dest = e.get("to")
            if not dest or dest not in by:
                continue
            if by[dest].get("kind") == "check":
                continue
            q.append(dest)
    return False


def default_route_reaches_failure(by, start):
    """Ungated exits only. Checks follow full/mixed, never miss."""
    seen = set()
    q = deque([start])
    while q:
        i = q.popleft()
        if i in seen or i not in by:
            continue
        seen.add(i)
        node = by[i]
        key = (node.get("endingKey") or "").lower()
        if is_ending_leaf(node) and (key in FAILURE_KEYS or re.search(r"spent|misfiled|dead-steam|drown", key)):
            return node["id"]
        if node.get("kind") == "check" or node.get("check"):
            for e in node.get("exits") or []:
                if e.get("result") in ("full", "mixed") and e.get("to"):
                    q.append(e["to"])
            continue
        for e in node.get("exits") or []:
            if e.get("when") or e.get("result") or not e.get("to"):
                continue
            q.append(e["to"])
    return None


def failure_reachable_via_miss(by, start):
    seen = set()
    q = deque([start])
    while q:
        i = q.popleft()
        if i in seen or i not in by:
            continue
        seen.add(i)
        node = by[i]
        key = (node.get("endingKey") or "").lower()
        if is_ending_leaf(node) and key in FAILURE_KEYS:
            return True
        for e in node.get("exits") or []:
            if e.get("to"):
                q.append(e["to"])
    return False


def page_text(node) -> str:
    return node.get("page") or node.get("brief") or ""


def resolved_text(node, flags) -> str:
    parts = [page_text(node)]
    for variant in node.get("variants") or []:
        if cond_holds(variant.get("when"), flags):
            parts.append(variant.get("before") or "")
            parts.append(variant.get("after") or "")
            parts.append(variant.get("replace") or "")
    return " ".join(p for p in parts if p)


def name_in(text, comp) -> bool:
    for nm in [comp["name"], *comp.get("aliases", [])]:
        if nm and re.search(r"\b" + re.escape(nm) + r"\b", text, re.I):
            return True
    return False


def is_boundary(node) -> bool:
    return (node.get("kind") in BOUNDARY_KINDS) or (node.get("role") in BOUNDARY_ROLES)


def companion_present(comp, flags) -> bool:
    val = flags.get(comp["flag"])
    if val in (None, False, ""):
        return False
    absent = {str(x).lower() for x in comp.get("absent") or []}
    if str(val).lower() in absent:
        return False
    present = comp.get("present")
    if present is None:
        return True
    return any(val is p or val == p or str(val) == str(p) for p in present)


def when_allows(cond, flags, tracked) -> bool:
    """Companion flags must match. Other flags are ignored so the TODO over-approximates."""
    if not isinstance(cond, dict) or not cond:
        return True
    for key, want in cond.items():
        if key == "not":
            if not isinstance(want, dict):
                continue
            # A not-branch fails the exit only when every tracked flag inside it holds.
            if tracked.intersection(want) and all(
                flag_matches(flags.get(k), w) for k, w in want.items() if k in tracked
            ) and not any(k not in tracked and k not in RESERVED for k in want):
                return False
        elif key == "any":
            branches = want if isinstance(want, list) else []
            relevant = [b for b in branches if isinstance(b, dict) and tracked.intersection(cond_flags(b))]
            if relevant and not any(when_allows(b, flags, tracked) for b in relevant):
                return False
        elif key in tracked and not flag_matches(flags.get(key), want):
            return False
    return True


def audit(slug, path: Path, book_type: str):
    _raw, nodes, by, start = load_book(path)
    hard = []
    prose = []
    if not start or start not in by:
        hard.append(issue("dead_end", "Book has no start section", [start or ""]))
        return hard, prose

    seen = reachable(by, start)
    for node in nodes:
        if node["id"] not in seen:
            hard.append(issue("unreachable_section", "Section is not reachable from the start", [node["id"]]))
        for e in node.get("exits") or []:
            if e.get("to") and e["to"] not in by:
                hard.append(issue("missing_link", f"Exit points at missing section {e['to']}", [node["id"]], {"to": e["to"]}))
        if node["id"] in seen and not is_terminal(node):
            exits = [e for e in (node.get("exits") or []) if e.get("to")]
            if node.get("kind") != "check" and not node.get("check") and not exits:
                hard.append(issue("dead_end", "Non-terminal section has no exits", [node["id"]]))

    # Flags
    sets = defaultdict(list)
    reads = defaultdict(list)
    for node in nodes:
        for variant in node.get("variants") or []:
            for fl in cond_flags(variant.get("when")):
                reads[fl].append(node["id"])
        for e in node.get("exits") or []:
            for fl in cond_flags(e.get("when")):
                reads[fl].append(node["id"])
            for key, val in (e.get("setFlags") or {}).items():
                sets[key].append((node["id"], val, e.get("to")))
    for fl in sorted(set(sets) - set(reads)):
        hard.append(issue(
            "flag_set_never_read",
            f"Flag '{fl}' is set but never read by a when-gate or page variant",
            [s[0] for s in sets[fl][:8]],
            {"flag": fl},
        ))
    for fl in sorted(set(reads) - set(sets)):
        hard.append(issue(
            "flag_read_never_set",
            f"Flag '{fl}' is read but never set",
            reads[fl][:8],
            {"flag": fl},
        ))
    prose_blob = " ".join(page_text(n) for n in nodes)
    reported_values = set()
    for node in nodes:
        for e in node.get("exits") or []:
            for key, val in (e.get("setFlags") or {}).items():
                if not isinstance(val, str) or not re.match(r"^[A-Za-z][a-z]{3,}$", val):
                    continue
                if val.lower() in VALUE_SKIP or (key, val) in reported_values:
                    continue
                cap = val[:1].upper() + val[1:]
                if not re.search(r"\b" + re.escape(cap) + r"\b", prose_blob, re.I):
                    reported_values.add((key, val))
                    hard.append(issue(
                        "flag_value_absent_from_prose",
                        f"Flag {key} is set to '{val}' but that name is not in the book",
                        [node["id"]],
                        {"flag": key, "value": val},
                    ))

    if book_type == "dice":
        ends = {n["id"] for n in nodes if is_ending_leaf(n)}
        if path_avoiding_checks(by, start, ends):
            hard.append(issue(
                "dice_skippable_to_ending",
                "A path from the start reaches an ending without entering a check",
                [start],
            ))
        gates = sorted(
            [n for n in nodes if n.get("role") == "region-gate"],
            key=lambda n: (n.get("region") is None, n.get("region") or 0, n["id"]),
        )
        for a, b in zip(gates, gates[1:]):
            if path_avoiding_checks(by, a["id"], {b["id"]}):
                hard.append(issue(
                    "dice_skippable_in_region",
                    f"Region {a.get('region')} can be crossed from {a['id']} to {b['id']} with no check",
                    [a["id"], b["id"]],
                    {"region": a.get("region")},
                ))
        for node in nodes:
            if node.get("kind") != "hub":
                continue
            for e in node.get("exits") or []:
                dest = by.get(e.get("to"))
                if dest and dest.get("kind") == "bottleneck":
                    hard.append(issue(
                        "hub_skip_to_bottleneck",
                        "Hub exits straight to a bottleneck, skipping this cluster's checks",
                        [node["id"], dest["id"]],
                    ))
                    break
        hit = default_route_reaches_failure(by, start)
        if hit:
            hard.append(issue(
                "fallback_is_default_route",
                "The failure ending is reachable on the ungated full-success route",
                [hit],
            ))

    # Prose TODO (not CI failures)
    for node in nodes:
        text = page_text(node)
        if not text:
            continue
        hits = [name for name, pat in STOCK if pat.search(text)]
        if hits:
            prose.append({
                "section": node["id"],
                "reason": "stock_closer",
                "detail": "Stock decision-closer: " + ", ".join(hits),
            })
        region = node.get("region")
        opening = (node.get("role") == "region-gate" and (region or 0) >= 1) or node.get("kind") == "in"
        if opening and (region or 0) >= 1 and WAKE.search(text):
            prose.append({
                "section": node["id"],
                "reason": "second_wake_up",
                "detail": "Region opening uses wake-up language. Relinking off this page would orphan it; the wake is the page itself.",
            })

    inc = defaultdict(list)
    for node in nodes:
        for e in node.get("exits") or []:
            if e.get("to"):
                inc[e["to"]].append((node, e))
    for node in nodes:
        if not is_doom(node):
            continue
        for src, ex in inc.get(node["id"], []):
            label = ex.get("label") or ex.get("intent") or ""
            page = page_text(src)
            generic = bool(re.search(r"\breckless way\b", label, re.I)) and not DANGER_PAGE.search(page)
            if not DANGER_LABEL.search(label) and not DANGER_PAGE.search(page):
                prose.append({
                    "section": src["id"],
                    "reason": "death_not_foreshadowed",
                    "detail": f"Exit to {node['id']} has no danger cue. Label: {label}",
                })
            elif generic:
                prose.append({
                    "section": src["id"],
                    "reason": "death_not_foreshadowed",
                    "detail": f"Exit to {node['id']} is only a generic reckless way. Label: {label}",
                })

    comps = COMPANIONS.get(slug, [])
    tracked = {c["flag"] for c in comps}
    if comps:
        # (node id, frozen companion state)
        state0 = tuple(sorted((c["flag"], None) for c in comps))
        q = deque([(start, state0)])
        visited = set()
        noted = set()
        while q:
            nid, state = q.popleft()
            key = (nid, state)
            if key in visited or nid not in by:
                continue
            visited.add(key)
            flags = dict(state)
            node = by[nid]
            text = resolved_text(node, flags)
            for comp in comps:
                if not companion_present(comp, flags):
                    continue
                if nid == start:
                    continue
                if is_boundary(node) and not name_in(text, comp):
                    mark = (node["id"], "companion_callback_missing", comp["name"])
                    if mark not in noted:
                        noted.add(mark)
                        prose.append({
                            "section": node["id"],
                            "reason": "companion_callback_missing",
                            "detail": f"{comp['name']} is present ({comp['flag']}) but this boundary does not name them",
                        })
                if ALONE.search(text) and not name_in(text, comp):
                    mark = (node["id"], "says_alone_while_companion_present", comp["name"])
                    if mark not in noted:
                        noted.add(mark)
                        prose.append({
                            "section": node["id"],
                            "reason": "says_alone_while_companion_present",
                            "detail": f"{comp['name']} is present but the page says the reader is alone",
                        })
            for e in node.get("exits") or []:
                dest = e.get("to")
                if not dest or dest not in by:
                    continue
                if not when_allows(e.get("when"), flags, tracked):
                    continue
                nxt = dict(flags)
                for k, v in (e.get("setFlags") or {}).items():
                    if k in tracked:
                        nxt[k] = v
                q.append((dest, tuple(sorted(nxt.items()))))

    # Stable, de-duplicated prose rows
    dedup = []
    seen_rows = set()
    for row in prose:
        key = (row["section"], row["reason"], row["detail"])
        if key in seen_rows:
            continue
        seen_rows.add(key)
        dedup.append(row)
    dedup.sort(key=lambda r: (r["reason"], r["section"]))
    return hard, dedup


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=str(ROOT_DEFAULT))
    ap.add_argument("--check", action="store_true", help="Fail if a hard issue is not in the baseline")
    ap.add_argument("--write-todo", action="store_true")
    ap.add_argument("--write-baseline", action="store_true")
    args = ap.parse_args()
    root = Path(args.root)
    baseline_path = root / "content/pyoa/path-lint-baseline.json"
    todo_path = root / "content/pyoa/PROSE-TODO.json"

    all_hard = []
    todo_books = {}
    totals = Counter()
    for slug, rel, book_type in BOOKS:
        path = root / rel
        hard, prose = audit(slug, path, book_type)
        for item in hard:
            item["book"] = slug
            item["fingerprint"] = fingerprint(slug, item)
            all_hard.append(item)
        counts = Counter(row["reason"] for row in prose)
        todo_books[slug] = {
            "counts": dict(counts),
            "total": len(prose),
            "items": prose,
        }
        totals.update(counts)
        print(f"{slug}: hard={len(hard)} prose={len(prose)} {dict(counts)}", flush=True)

    if args.write_baseline:
        payload = {
            "note": "Hard structural issue fingerprints that CI allows. A new fingerprint fails the lint. Empty means the books are clean on the hard rules.",
            "hard": sorted({item["fingerprint"] for item in all_hard}),
        }
        baseline_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        print(f"wrote {baseline_path} ({len(payload['hard'])} fingerprints)")

    notes = {
        "saltglass": "guide:\"pell\" is now guide:\"calder\" (set at sg-1-c1, read by the existing gates). Saltglass has no page variants, so those gates cannot change the paragraph.",
        "vesperhold": "Biscuit was already set at vh-1-c1 (mule:\"biscuit\") and cleared at vh-4-c2 (mule:\"alone\").",
        "tide": "Orsolya is set at the two meetings (td-4-173, td-5-086) and cleared on the exit that leaves each cluster. td-1-001 still wakes the reader; skipping it orphans the only region gate, and the wake is the page text.",
        "cinderfall": "Hesper has no join before the reunion at cf-6-023. The flag is set on that exit and read on cf-6-024. Earlier pages have nothing to callback until a join exists.",
        "underlibrary": "Thessaly is set on the exit from ul-5-106 and read by the existing Thessaly's Way gate. She is not present on earlier boundaries.",
        "umbra": "ledger is read by the existing ghost-road variant that already mentions the satchel (sable with, ledger unused). No other variant states what was done with the ledger.",
    }
    for slug, note in notes.items():
        todo_books[slug]["note"] = note
        todo_books[slug]["unique_sections"] = len({row["section"] for row in todo_books[slug]["items"]})

    if args.write_todo:
        payload = {
            "note": "Sections that still need new prose. This pass changed only links, flags, gates, and one existing Umbra variant condition.",
            "reasons": [
                "companion_callback_missing",
                "says_alone_while_companion_present",
                "death_not_foreshadowed",
                "stock_closer",
                "second_wake_up",
            ],
            "totals": dict(totals),
            "total": sum(totals.values()),
            "unique_sections": len({(slug, row["section"]) for slug, book in todo_books.items() for row in book["items"]}),
            "books": todo_books,
        }
        todo_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        print(f"wrote {todo_path} total={payload['total']}")

    if args.check:
        if not baseline_path.exists():
            print("missing baseline", baseline_path, file=sys.stderr)
            return 1
        allowed = set(json.loads(baseline_path.read_text(encoding="utf-8")).get("hard") or [])
        fresh = [item for item in all_hard if item["fingerprint"] not in allowed]
        if fresh:
            print(f"NEW hard issues: {len(fresh)}", file=sys.stderr)
            for item in fresh[:30]:
                print(f"  {item['fingerprint']} {item['message']}", file=sys.stderr)
            return 1
        print(f"OK hard={len(all_hard)} allowed={len(allowed)}")
        if todo_path.exists():
            on_disk = json.loads(todo_path.read_text(encoding="utf-8"))
            fresh_todo = {
                "note": "Sections that still need new prose. This pass changed only links, flags, gates, and one existing Umbra variant condition.",
                "reasons": [
                    "companion_callback_missing",
                    "says_alone_while_companion_present",
                    "death_not_foreshadowed",
                    "stock_closer",
                    "second_wake_up",
                ],
                "totals": dict(totals),
                "total": sum(totals.values()),
                "unique_sections": len({(slug, row["section"]) for slug, book in todo_books.items() for row in book["items"]}),
                "books": todo_books,
            }
            if on_disk != fresh_todo:
                print("PROSE-TODO.json is stale. Re-run with --write-todo.", file=sys.stderr)
                return 1
            print(f"OK todo={on_disk['total']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
