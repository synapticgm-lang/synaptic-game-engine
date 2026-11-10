#!/usr/bin/env python3
"""Idempotent structure-only edits for the six PYOA books.

Changes links, flags, gates, and (for Umbra) an existing variant's when-clause.
Does not rewrite page prose. Safe to re-run.
"""
from __future__ import annotations

import json
from collections import deque
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

DICE = {
    "tide": {
        "path": ROOT / "content/pyoa/dice/book.json",
        "success_flag": "end-return-gently",
        "success_key": "return-gently",
    },
    "cinderfall": {
        "path": ROOT / "content/pyoa/cinderfall/book.json",
        "success_flag": "end-open-the-gate",
        "success_key": "open-the-gate",
    },
    "underlibrary": {
        "path": ROOT / "content/pyoa/underlibrary/book.json",
        "success_flag": "end-remember-all",
        "success_key": "remember-all",
    },
}

# (node that begins companionship, flag). Set on every exit of that node.
JOINS = {
    "tide": [("td-4-173", "orsolya"), ("td-5-086", "orsolya")],
    "cinderfall": [("cf-6-023", "hesper")],
    "underlibrary": [("ul-5-106", "thessaly")],
}

# Flags cleared when an exit leaves the joined cluster (tide only; the other
# two joins are the reunion / vault and the book ends with them present).
CLUSTER_CLEAR = {"tide": "orsolya"}


def load(path: Path):
    raw = path.read_text(encoding="utf-8")
    return json.loads(raw), raw.endswith("\n")


def save(path: Path, data, newline: bool):
    text = json.dumps(data, indent=1, ensure_ascii=False)
    if newline:
        text += "\n"
    path.write_text(text, encoding="utf-8")


def by_id(book):
    return {n["id"]: n for n in book["nodes"]}


def is_bottleneck(node) -> bool:
    return node.get("kind") == "bottleneck"


def cluster_rewards(by, hub):
    """Rewards reachable from this hub's non-bottleneck exits, not through another hub."""
    skip = {e["to"] for e in hub.get("exits") or [] if is_bottleneck(by[e["to"]])}
    rewards = []
    seen = set()
    q = deque(e["to"] for e in hub.get("exits") or [] if e["to"] not in skip)
    while q:
        i = q.popleft()
        if i in seen or i not in by:
            continue
        seen.add(i)
        n = by[i]
        if is_bottleneck(n):
            continue
        if n.get("kind") == "hub" and n["id"] != hub["id"]:
            continue
        if n.get("kind") == "reward":
            rewards.append(n)
        for e in n.get("exits") or []:
            if e.get("to"):
                q.append(e["to"])
    return rewards


def relink_hubs(book):
    by = by_id(book)
    hubs = [n for n in book["nodes"] if n.get("kind") == "hub"]
    plans = []
    for hub in hubs:
        skips = [e for e in hub.get("exits") or [] if e.get("to") and is_bottleneck(by[e["to"]])]
        if len(skips) != 1:
            continue
        skip = skips[0]
        bn = skip["to"]
        rewards = cluster_rewards(by, hub)
        already = []
        returns = []
        for reward in rewards:
            for e in reward.get("exits") or []:
                if e.get("to") == bn:
                    already.append(e)
                elif e.get("to") == hub["id"]:
                    returns.append(e)
        if already:
            plans.append((hub, skip, None))
        elif returns:
            plans.append((hub, skip, returns[0]))
        else:
            raise SystemExit(f"hub {hub['id']} skip {bn} has no reward to retarget")
    removed = 0
    retargeted = 0
    for hub, skip, retarget in plans:
        if retarget is not None and retarget.get("to") != skip["to"]:
            retarget["to"] = skip["to"]
            retargeted += 1
        hub["exits"] = [e for e in hub["exits"] if e is not skip]
        removed += 1
    return removed, retargeted


def selector(book):
    sels = [n for n in book["nodes"] if n.get("role") == "ending-selector"]
    if len(sels) != 1:
        raise SystemExit(f"expected one ending selector, found {len(sels)}")
    return sels[0]


def ending_key(by, node_id):
    n = by[node_id]
    return n.get("endingKey") or ""


def gate_fallback(book, success_key: str, success_flag: str):
    by = by_id(book)
    sel = selector(book)
    failure_keys = {
        "spent", "dead-steam", "misfiled", "drown-saltspire", "drown-gullmouth",
        "burn-the-line", "gate-flood", "the-burning", "great-forgetting",
    }
    success = None
    fallback = None
    for e in sel.get("exits") or []:
        if e.get("id") == "default-success":
            continue
        key = ending_key(by, e["to"])
        when = e.get("when") or {}
        if key == success_key and when.get(success_flag) is True:
            success = e
        if key in failure_keys and e.get("when") in (None, {"check-miss": True}):
            fallback = e
    # Drop a duplicate default-success that a previous run gated by mistake.
    sel["exits"] = [
        e for e in sel["exits"]
        if not (e.get("id") == "default-success" and e.get("when"))
    ]
    if success is None:
        raise SystemExit(f"selector {sel['id']} missing gated {success_flag}")
    if fallback is None:
        if not any(not e.get("when") and e.get("to") == success["to"] for e in sel["exits"]):
            sel["exits"].append({
                "id": "default-success",
                "label": success.get("label") or "Continue",
                "to": success["to"],
            })
        return "already"
    # Failure ending stays, but only after a missed check. Empty-flag route
    # reuses the existing success label and section.
    fallback["when"] = {"check-miss": True}
    if not any(not e.get("when") and e.get("to") == success["to"] for e in sel["exits"]):
        sel["exits"].append({
            "id": "default-success",
            "label": success.get("label") or "Continue",
            "to": success["to"],
        })
    return fallback["to"]


def stamp_spine_flag(book, success_flag: str):
    """Every remaining entrance to the pre-selector bottleneck earns a non-failure ending."""
    by = by_id(book)
    sel = selector(book)
    incoming = []
    for n in book["nodes"]:
        for e in n.get("exits") or []:
            if e.get("to") == sel["id"]:
                incoming.append(n["id"])
    if len(incoming) != 1:
        raise SystemExit(f"{sel['id']} incoming {incoming}")
    gate_id = incoming[0]
    stamped = 0
    for n in book["nodes"]:
        for e in n.get("exits") or []:
            if e.get("to") != gate_id:
                continue
            sf = e.setdefault("setFlags", {})
            if any(str(k).startswith("end-") for k in sf):
                continue
            if sf.get(success_flag) is not True:
                sf[success_flag] = True
                stamped += 1
    return gate_id, stamped


def stamp_misses(book):
    n = 0
    for node in book["nodes"]:
        if node.get("kind") != "check":
            continue
        for e in node.get("exits") or []:
            if e.get("result") != "miss":
                continue
            sf = e.setdefault("setFlags", {})
            if sf.get("check-miss") is not True:
                sf["check-miss"] = True
                n += 1
    return n


def set_on_exits(node, flag: str, value):
    changed = 0
    for e in node.get("exits") or []:
        sf = e.setdefault("setFlags", {})
        if sf.get(flag) is not value:
            sf[flag] = value
            changed += 1
    return changed


def presence_cluster(by, origin: str, flag: str):
    """Nodes reached from origin without passing through a bottleneck or ending leaf.

    Exits that leave this set get flag=false so the companion does not stay
    present on the next page. Ending chains (Hesper) have no such exit.
    Tide's confrontation stops at the next bottleneck.
    """
    if origin not in by:
        raise SystemExit(f"missing join dest {origin}")
    seen = set()
    q = deque([origin])
    while q:
        i = q.popleft()
        if i in seen:
            continue
        node = by[i]
        # The join destination itself is allowed to be a bottleneck (the selector).
        if i != origin and (is_bottleneck(node) or node.get("kind") == "ending"):
            continue
        seen.add(i)
        for e in node.get("exits") or []:
            if e.get("to"):
                q.append(e["to"])
    clears = 0
    for i in seen:
        node = by[i]
        for e in node.get("exits") or []:
            dest = e.get("to")
            if not dest or dest in seen:
                continue
            # Keep Thessaly's own ending able to read the flag at the selector;
            # clearing happens on the exit, which is after the when-check.
            sf = e.setdefault("setFlags", {})
            if sf.get(flag) is not False and flag == "orsolya":
                sf[flag] = False
                clears += 1
    return seen, clears


def wire_companion_read(by, nodes: set, flag: str):
    """One existing single-exit section reads the flag. No new prose.

    A failed when on a one-exit section still shows that exit (engine last resort),
    so this cannot trap a reader. Re-runs leave an existing read in place.
    """
    for i in sorted(nodes):
        for e in by[i].get("exits") or []:
            if flag in (e.get("when") or {}):
                return i
    for i in sorted(nodes):
        node = by[i]
        exits = [e for e in node.get("exits") or [] if e.get("to") and not e.get("result")]
        if len(exits) != 1 or exits[0].get("when"):
            continue
        exits[0]["when"] = {flag: True}
        return i
    return None


def companions(book, slug: str):
    by = by_id(book)
    notes = []
    for node_id, flag in JOINS.get(slug, []):
        node = by[node_id]
        set_on_exits(node, flag, True)
        dests = [e["to"] for e in node.get("exits") or [] if e.get("to")]
        if len(dests) != 1:
            raise SystemExit(f"{node_id} expected one exit, got {dests}")
        cluster, clears = presence_cluster(by, dests[0], flag)
        # Underlibrary reads thessaly on the existing ending exit, not a new when.
        read_at = None if flag == "thessaly" else wire_companion_read(by, cluster, flag)
        notes.append({"join": node_id, "flag": flag, "cluster": len(cluster), "clears": clears, "read": read_at})
    if slug == "underlibrary":
        # Thessaly is present at the selector. Read her on the existing ending exit.
        sel = selector(book)
        for e in sel.get("exits") or []:
            when = e.get("when") or {}
            if when.get("end-thessalys-way") is True:
                when = dict(when)
                when["thessaly"] = True
                e["when"] = when
                notes.append({"read_existing": sel["id"], "exit": e.get("to")})
    return notes


def patch_dice(slug: str, meta: dict):
    path = meta["path"]
    book, newline = load(path)
    removed, retargeted = relink_hubs(book)
    gate, stamped = stamp_spine_flag(book, meta["success_flag"])
    fallback = gate_fallback(book, meta["success_key"], meta["success_flag"])
    misses = stamp_misses(book)
    comp = companions(book, slug)
    save(path, book, newline)
    print(json.dumps({
        "book": slug,
        "hub_skips_removed": removed,
        "rewards_retargeted": retargeted,
        "pre_selector": gate,
        "spine_flags": stamped,
        "fallback": fallback,
        "miss_flags": misses,
        "companions": comp,
    }, indent=2))


def patch_saltglass():
    path = ROOT / "content/pyoa/saltglass/book.json"
    raw = path.read_text(encoding="utf-8")
    old = '"guide": "pell"'
    count = raw.count(old)
    if count == 0 and '"guide": "calder"' in raw:
        print(json.dumps({"book": "saltglass", "pell_to_calder": 0, "already": True}))
        return
    if count != 12:
        raise SystemExit(f"expected 12 guide:pell sites, found {count}")
    path.write_text(raw.replace(old, '"guide": "calder"'), encoding="utf-8")
    print(json.dumps({"book": "saltglass", "pell_to_calder": count, "variants": 0}))


def patch_umbra_ledger():
    """Read `ledger` from the existing ghost-road variant that already names the satchel.

    ghost-road entrances set ledger to "unused", so the extra when-key does not hide the variant.
    """
    live = ROOT / "src/data/pyoa/umbraBook.json"
    raw = live.read_text(encoding="utf-8")
    old = '{"when":{"sable":"with"},"after":"Sable walks beside you in exile'
    new = '{"when":{"sable":"with","ledger":"unused"},"after":"Sable walks beside you in exile'
    if old not in raw:
        if new in raw:
            print(json.dumps({"book": "umbra", "ledger_variant": "already"}))
        else:
            raise SystemExit("umbra satchel variant not found")
    else:
        live.write_text(raw.replace(old, new, 1), encoding="utf-8")
        print(json.dumps({"book": "umbra", "ledger_variant": "up-end-ghost-road sable/with"}))

    overlay = ROOT / "content/pyoa/umbra/overlay/v-e-ghost-road.json"
    data, newline = load(overlay)
    changed = False
    for v in data.get("variants") or []:
        when = v.get("when") or {}
        if when.get("sable") == "with" and "satchel" in (v.get("after") or ""):
            if when.get("ledger") != "unused":
                when["ledger"] = "unused"
                v["when"] = when
                changed = True
    if changed:
        save(overlay, data, newline)


def main():
    patch_saltglass()
    for slug, meta in DICE.items():
        patch_dice(slug, meta)
    patch_umbra_ledger()
    print("STRUCTURE_OK")


if __name__ == "__main__":
    main()
