# Gemini layout prompts — interior floor plans

On 28 Sep 2026 no Manus layouts for boats/ships, carts/wagons, trains, towers/keeps, mines, or sewers were found in the Manus backup or the `docs/research/` Manus folders. These prompts fill that gap: paste one block into Gemini, get back 3 variants as JSON in the exact `InteriorRoomSpec` shape from `src/game/mapEngine.ts`.

Each block below is self-contained. Copy everything inside the fence.

---

## 1. Boat / ship

```text
You are designing interior floor plans for a text RPG map engine. Output JSON only — no prose, no markdown fences, no comments.

FORMAT (TypeScript, from the engine — match it exactly):

export type InteriorEdgeKind = 'door' | 'damaged' | 'secret' | 'stairs';

export type InteriorRoomSpec = {
  id: string;
  label: string;
  /** Top-left in continuous layout units (varied footprints — not a uniform grid stamp). */
  x: number;
  y: number;
  /** -1 = B1, 0 = 1F, 1 = 2F */
  z: number;
  w: number;
  h: number;
  links: string[];
  /** Optional edge overrides (e.g. damaged gap). Defaults: door / stairs / secret. */
  edgeKinds?: Record<string, InteriorEdgeKind>;
  isSecret?: boolean;
  entry?: boolean;
};

ONE REAL EXAMPLE LAYOUT (a cathedral; shown as TypeScript — your output must be strict JSON with double-quoted keys):

  [
    // 1F: 7 rooms (narthex, nave, aisle, vestry, choir, sanctum, stairs)
    { id: 'entry', label: 'Narthex', x: 1.1, y: 2.55, z: 0, w: 1.3, h: 0.95, links: ['nave'], entry: true },
    {
      id: 'nave',
      label: 'Nave',
      x: 0.7,
      y: 1.05,
      z: 0,
      w: 2.0,
      h: 1.4,
      links: ['entry', 'aisle', 'choir', 'stairs'],
    },
    { id: 'aisle', label: 'Aisle', x: 0, y: 1.15, z: 0, w: 0.6, h: 1.35, links: ['nave', 'vestry'] },
    { id: 'vestry', label: 'Vestry', x: 0, y: 0, z: 0, w: 1.05, h: 1.0, links: ['aisle'] },
    { id: 'choir', label: 'Choir', x: 1.0, y: 0, z: 0, w: 1.4, h: 0.95, links: ['nave', 'sanctum'] },
    { id: 'sanctum', label: 'Sanctum', x: 2.55, y: 0, z: 0, w: 1.15, h: 1.05, links: ['choir'] },
    { id: 'stairs', label: 'Stairs', x: 2.85, y: 1.2, z: 0, w: 0.7, h: 0.85, links: ['nave', 'crypt', 'gallery'] },
    // B1: 6 rooms (crypt, reliquary, ossuary, tomb, vault, catacomb) — full undercroft
    { id: 'crypt', label: 'Crypt', x: 2.6, y: 1.0, z: -1, w: 1.45, h: 1.2, links: ['stairs', 'reliquary', 'ossuary'] },
    { id: 'reliquary', label: 'Reliquary', x: 1.15, y: 1.1, z: -1, w: 1.2, h: 1.0, links: ['crypt', 'vault'], isSecret: true },
    { id: 'ossuary', label: 'Ossuary', x: 2.7, y: 0, z: -1, w: 1.1, h: 0.95, links: ['crypt', 'tomb'] },
    { id: 'tomb', label: 'Tomb chamber', x: 1.0, y: 0, z: -1, w: 1.4, h: 0.9, links: ['ossuary'] },
    { id: 'vault', label: 'Vault', x: 0, y: 1.2, z: -1, w: 1.05, h: 0.95, links: ['reliquary', 'catacomb'] },
    { id: 'catacomb', label: 'Catacomb', x: 0, y: 0, z: -1, w: 0.95, h: 1.05, links: ['vault'], isSecret: true },
    // 2F: 6 rooms (gallery, belfry, organ, balcony, scriptorium, bell chamber) — full upper level
    { id: 'gallery', label: 'Gallery', x: 2.7, y: 1.05, z: 1, w: 0.55, h: 1.35, links: ['stairs', 'belfry', 'organ'] },
    { id: 'belfry', label: 'Belfry', x: 3.4, y: 1.15, z: 1, w: 1.0, h: 1.0, links: ['gallery', 'bell'] },
    { id: 'organ', label: 'Organ loft', x: 1.1, y: 1.1, z: 1, w: 1.3, h: 1.05, links: ['gallery', 'balcony'] },
    { id: 'balcony', label: 'Balcony', x: 0.7, y: 1.0, z: 1, w: 0.6, h: 1.2, links: ['organ', 'scriptorium'] },
    { id: 'scriptorium', label: 'Scriptorium', x: 0, y: 0.9, z: 1, w: 1.05, h: 1.15, links: ['balcony'] },
    { id: 'bell', label: 'Bell chamber', x: 3.5, y: 0, z: 1, w: 0.9, h: 1.0, links: ['belfry'] },
  ]

TASK: Design 3 different interior layouts for a SAILING SHIP / BOAT.

Floors:
- z: -1 (B1) = the hold (cargo, bilge, stores, brig).
- z: 0 (1F) = main deck (the entry room is here, e.g. gangway or boarding deck).
- z: 1 (2F) = upper deck or cabins (quarterdeck, captain's cabin, wheel).
- Floors connect through a hatch/ladder room; every cross-floor link uses edge kind "stairs".
- Keep the footprint long and narrow like a hull (width much greater than height on every floor).

RULES:
1. Output a JSON array of exactly 3 layouts. Each layout is an array of room objects in EXACTLY the InteriorRoomSpec format. No other fields. No wrapper object.
2. Exactly one room per layout has "entry": true, and it is on z: 0.
3. Every id is unique within its layout (short lowercase, e.g. "hold", "galley").
4. Links are symmetric: if A lists B, B lists A. Every room is reachable from the entry.
5. Sizes use the same layout units as the example (x, y, w, h roughly 0–4.5; w and h roughly 0.5–2.0). Rooms on the same floor must not overlap.
6. Use "edgeKinds" only for non-door links: "stairs" for cross-floor links, "damaged" for a broken gap, "secret" for a hidden passage. Put the same kind on both sides of the link.
7. Optional: at most one secret room per layout with "isSecret": true, connected by a link whose edgeKinds value is "secret" on both sides.
8. 6–12 rooms per layout. Labels are short (1–3 words).
9. Original content only. No names from books, films, games, or real ships.
10. Output JSON only.
```

---

## 2. Cart / wagon

```text
You are designing interior floor plans for a text RPG map engine. Output JSON only — no prose, no markdown fences, no comments.

FORMAT (TypeScript, from the engine — match it exactly):

export type InteriorEdgeKind = 'door' | 'damaged' | 'secret' | 'stairs';

export type InteriorRoomSpec = {
  id: string;
  label: string;
  /** Top-left in continuous layout units (varied footprints — not a uniform grid stamp). */
  x: number;
  y: number;
  /** -1 = B1, 0 = 1F, 1 = 2F */
  z: number;
  w: number;
  h: number;
  links: string[];
  /** Optional edge overrides (e.g. damaged gap). Defaults: door / stairs / secret. */
  edgeKinds?: Record<string, InteriorEdgeKind>;
  isSecret?: boolean;
  entry?: boolean;
};

ONE REAL EXAMPLE LAYOUT (a cathedral; shown as TypeScript — your output must be strict JSON with double-quoted keys):

  [
    // 1F: 7 rooms (narthex, nave, aisle, vestry, choir, sanctum, stairs)
    { id: 'entry', label: 'Narthex', x: 1.1, y: 2.55, z: 0, w: 1.3, h: 0.95, links: ['nave'], entry: true },
    {
      id: 'nave',
      label: 'Nave',
      x: 0.7,
      y: 1.05,
      z: 0,
      w: 2.0,
      h: 1.4,
      links: ['entry', 'aisle', 'choir', 'stairs'],
    },
    { id: 'aisle', label: 'Aisle', x: 0, y: 1.15, z: 0, w: 0.6, h: 1.35, links: ['nave', 'vestry'] },
    { id: 'vestry', label: 'Vestry', x: 0, y: 0, z: 0, w: 1.05, h: 1.0, links: ['aisle'] },
    { id: 'choir', label: 'Choir', x: 1.0, y: 0, z: 0, w: 1.4, h: 0.95, links: ['nave', 'sanctum'] },
    { id: 'sanctum', label: 'Sanctum', x: 2.55, y: 0, z: 0, w: 1.15, h: 1.05, links: ['choir'] },
    { id: 'stairs', label: 'Stairs', x: 2.85, y: 1.2, z: 0, w: 0.7, h: 0.85, links: ['nave', 'crypt', 'gallery'] },
    // B1: 6 rooms (crypt, reliquary, ossuary, tomb, vault, catacomb) — full undercroft
    { id: 'crypt', label: 'Crypt', x: 2.6, y: 1.0, z: -1, w: 1.45, h: 1.2, links: ['stairs', 'reliquary', 'ossuary'] },
    { id: 'reliquary', label: 'Reliquary', x: 1.15, y: 1.1, z: -1, w: 1.2, h: 1.0, links: ['crypt', 'vault'], isSecret: true },
    { id: 'ossuary', label: 'Ossuary', x: 2.7, y: 0, z: -1, w: 1.1, h: 0.95, links: ['crypt', 'tomb'] },
    { id: 'tomb', label: 'Tomb chamber', x: 1.0, y: 0, z: -1, w: 1.4, h: 0.9, links: ['ossuary'] },
    { id: 'vault', label: 'Vault', x: 0, y: 1.2, z: -1, w: 1.05, h: 0.95, links: ['reliquary', 'catacomb'] },
    { id: 'catacomb', label: 'Catacomb', x: 0, y: 0, z: -1, w: 0.95, h: 1.05, links: ['vault'], isSecret: true },
    // 2F: 6 rooms (gallery, belfry, organ, balcony, scriptorium, bell chamber) — full upper level
    { id: 'gallery', label: 'Gallery', x: 2.7, y: 1.05, z: 1, w: 0.55, h: 1.35, links: ['stairs', 'belfry', 'organ'] },
    { id: 'belfry', label: 'Belfry', x: 3.4, y: 1.15, z: 1, w: 1.0, h: 1.0, links: ['gallery', 'bell'] },
    { id: 'organ', label: 'Organ loft', x: 1.1, y: 1.1, z: 1, w: 1.3, h: 1.05, links: ['gallery', 'balcony'] },
    { id: 'balcony', label: 'Balcony', x: 0.7, y: 1.0, z: 1, w: 0.6, h: 1.2, links: ['organ', 'scriptorium'] },
    { id: 'scriptorium', label: 'Scriptorium', x: 0, y: 0.9, z: 1, w: 1.05, h: 1.15, links: ['balcony'] },
    { id: 'bell', label: 'Bell chamber', x: 3.5, y: 0, z: 1, w: 0.9, h: 1.0, links: ['belfry'] },
  ]

TASK: Design 3 different interior layouts for a COVERED CART / TRAVELLING WAGON (merchant wagon, caravan wagon, prison cart, etc.).

Floors:
- Single floor only: every room has z: 0. No stairs edges.
- 2–4 rooms per layout (e.g. driver's bench, main bed, rear stores, hidden compartment).
- Small footprint: the whole layout fits within about 3.0 wide by 1.2 tall.

RULES:
1. Output a JSON array of exactly 3 layouts. Each layout is an array of room objects in EXACTLY the InteriorRoomSpec format. No other fields. No wrapper object.
2. Exactly one room per layout has "entry": true.
3. Every id is unique within its layout (short lowercase, e.g. "bench", "bed").
4. Links are symmetric: if A lists B, B lists A. Every room is reachable from the entry.
5. Sizes use the same layout units as the example (w and h roughly 0.5–1.5). Rooms must not overlap.
6. Use "edgeKinds" only for non-door links: "damaged" for a broken panel, "secret" for a hidden passage. Put the same kind on both sides of the link. Never use "stairs".
7. Optional: at most one secret room per layout (e.g. false floor compartment, still z: 0) with "isSecret": true, connected by a link whose edgeKinds value is "secret" on both sides. It counts toward the 2–4 rooms.
8. Labels are short (1–3 words).
9. Original content only. No names from books, films, games, or real companies.
10. Output JSON only.
```

---

## 3. Train

```text
You are designing interior floor plans for a text RPG map engine. Output JSON only — no prose, no markdown fences, no comments.

FORMAT (TypeScript, from the engine — match it exactly):

export type InteriorEdgeKind = 'door' | 'damaged' | 'secret' | 'stairs';

export type InteriorRoomSpec = {
  id: string;
  label: string;
  /** Top-left in continuous layout units (varied footprints — not a uniform grid stamp). */
  x: number;
  y: number;
  /** -1 = B1, 0 = 1F, 1 = 2F */
  z: number;
  w: number;
  h: number;
  links: string[];
  /** Optional edge overrides (e.g. damaged gap). Defaults: door / stairs / secret. */
  edgeKinds?: Record<string, InteriorEdgeKind>;
  isSecret?: boolean;
  entry?: boolean;
};

ONE REAL EXAMPLE LAYOUT (a cathedral; shown as TypeScript — your output must be strict JSON with double-quoted keys):

  [
    // 1F: 7 rooms (narthex, nave, aisle, vestry, choir, sanctum, stairs)
    { id: 'entry', label: 'Narthex', x: 1.1, y: 2.55, z: 0, w: 1.3, h: 0.95, links: ['nave'], entry: true },
    {
      id: 'nave',
      label: 'Nave',
      x: 0.7,
      y: 1.05,
      z: 0,
      w: 2.0,
      h: 1.4,
      links: ['entry', 'aisle', 'choir', 'stairs'],
    },
    { id: 'aisle', label: 'Aisle', x: 0, y: 1.15, z: 0, w: 0.6, h: 1.35, links: ['nave', 'vestry'] },
    { id: 'vestry', label: 'Vestry', x: 0, y: 0, z: 0, w: 1.05, h: 1.0, links: ['aisle'] },
    { id: 'choir', label: 'Choir', x: 1.0, y: 0, z: 0, w: 1.4, h: 0.95, links: ['nave', 'sanctum'] },
    { id: 'sanctum', label: 'Sanctum', x: 2.55, y: 0, z: 0, w: 1.15, h: 1.05, links: ['choir'] },
    { id: 'stairs', label: 'Stairs', x: 2.85, y: 1.2, z: 0, w: 0.7, h: 0.85, links: ['nave', 'crypt', 'gallery'] },
    // B1: 6 rooms (crypt, reliquary, ossuary, tomb, vault, catacomb) — full undercroft
    { id: 'crypt', label: 'Crypt', x: 2.6, y: 1.0, z: -1, w: 1.45, h: 1.2, links: ['stairs', 'reliquary', 'ossuary'] },
    { id: 'reliquary', label: 'Reliquary', x: 1.15, y: 1.1, z: -1, w: 1.2, h: 1.0, links: ['crypt', 'vault'], isSecret: true },
    { id: 'ossuary', label: 'Ossuary', x: 2.7, y: 0, z: -1, w: 1.1, h: 0.95, links: ['crypt', 'tomb'] },
    { id: 'tomb', label: 'Tomb chamber', x: 1.0, y: 0, z: -1, w: 1.4, h: 0.9, links: ['ossuary'] },
    { id: 'vault', label: 'Vault', x: 0, y: 1.2, z: -1, w: 1.05, h: 0.95, links: ['reliquary', 'catacomb'] },
    { id: 'catacomb', label: 'Catacomb', x: 0, y: 0, z: -1, w: 0.95, h: 1.05, links: ['vault'], isSecret: true },
    // 2F: 6 rooms (gallery, belfry, organ, balcony, scriptorium, bell chamber) — full upper level
    { id: 'gallery', label: 'Gallery', x: 2.7, y: 1.05, z: 1, w: 0.55, h: 1.35, links: ['stairs', 'belfry', 'organ'] },
    { id: 'belfry', label: 'Belfry', x: 3.4, y: 1.15, z: 1, w: 1.0, h: 1.0, links: ['gallery', 'bell'] },
    { id: 'organ', label: 'Organ loft', x: 1.1, y: 1.1, z: 1, w: 1.3, h: 1.05, links: ['gallery', 'balcony'] },
    { id: 'balcony', label: 'Balcony', x: 0.7, y: 1.0, z: 1, w: 0.6, h: 1.2, links: ['organ', 'scriptorium'] },
    { id: 'scriptorium', label: 'Scriptorium', x: 0, y: 0.9, z: 1, w: 1.05, h: 1.15, links: ['balcony'] },
    { id: 'bell', label: 'Bell chamber', x: 3.5, y: 0, z: 1, w: 0.9, h: 1.0, links: ['belfry'] },
  ]

TASK: Design 3 different interior layouts for a TRAIN (steam or rune-powered — any setting that fits a fantasy or modern-fantasy world).

Floors:
- Single floor only: every room has z: 0. No stairs edges.
- The train is a chain of carriages laid out left to right in one row (same y for every carriage, increasing x). Each carriage links only to the carriage before and after it. A carriage may have at most one small side room (e.g. a compartment or washroom) hanging off it.
- 5–10 rooms per layout (e.g. engine, tender, passenger car, dining car, sleeper, baggage car, guard's van).

RULES:
1. Output a JSON array of exactly 3 layouts. Each layout is an array of room objects in EXACTLY the InteriorRoomSpec format. No other fields. No wrapper object.
2. Exactly one room per layout has "entry": true (a boarding carriage, not the engine).
3. Every id is unique within its layout (short lowercase, e.g. "car1", "dining").
4. Links are symmetric: if A lists B, B lists A. Every room is reachable from the entry.
5. Sizes use the same layout units as the example (carriages roughly w 0.9–1.6, h 0.6–0.9; side rooms smaller). Rooms must not overlap. The full train may run wider than the example (x up to about 12).
6. Use "edgeKinds" only for non-door links: "damaged" for a broken coupling or smashed door, "secret" for a hidden passage. Put the same kind on both sides of the link. Never use "stairs".
7. Optional: at most one secret room per layout (e.g. a hidden smuggling compartment, still z: 0) with "isSecret": true, connected by a link whose edgeKinds value is "secret" on both sides.
8. Labels are short (1–3 words).
9. Original content only. No names from books, films, games, or real rail companies.
10. Output JSON only.
```

---

## 4. Tower / keep

```text
You are designing interior floor plans for a text RPG map engine. Output JSON only — no prose, no markdown fences, no comments.

FORMAT (TypeScript, from the engine — match it exactly):

export type InteriorEdgeKind = 'door' | 'damaged' | 'secret' | 'stairs';

export type InteriorRoomSpec = {
  id: string;
  label: string;
  /** Top-left in continuous layout units (varied footprints — not a uniform grid stamp). */
  x: number;
  y: number;
  /** -1 = B1, 0 = 1F, 1 = 2F */
  z: number;
  w: number;
  h: number;
  links: string[];
  /** Optional edge overrides (e.g. damaged gap). Defaults: door / stairs / secret. */
  edgeKinds?: Record<string, InteriorEdgeKind>;
  isSecret?: boolean;
  entry?: boolean;
};

ONE REAL EXAMPLE LAYOUT (a cathedral; shown as TypeScript — your output must be strict JSON with double-quoted keys):

  [
    // 1F: 7 rooms (narthex, nave, aisle, vestry, choir, sanctum, stairs)
    { id: 'entry', label: 'Narthex', x: 1.1, y: 2.55, z: 0, w: 1.3, h: 0.95, links: ['nave'], entry: true },
    {
      id: 'nave',
      label: 'Nave',
      x: 0.7,
      y: 1.05,
      z: 0,
      w: 2.0,
      h: 1.4,
      links: ['entry', 'aisle', 'choir', 'stairs'],
    },
    { id: 'aisle', label: 'Aisle', x: 0, y: 1.15, z: 0, w: 0.6, h: 1.35, links: ['nave', 'vestry'] },
    { id: 'vestry', label: 'Vestry', x: 0, y: 0, z: 0, w: 1.05, h: 1.0, links: ['aisle'] },
    { id: 'choir', label: 'Choir', x: 1.0, y: 0, z: 0, w: 1.4, h: 0.95, links: ['nave', 'sanctum'] },
    { id: 'sanctum', label: 'Sanctum', x: 2.55, y: 0, z: 0, w: 1.15, h: 1.05, links: ['choir'] },
    { id: 'stairs', label: 'Stairs', x: 2.85, y: 1.2, z: 0, w: 0.7, h: 0.85, links: ['nave', 'crypt', 'gallery'] },
    // B1: 6 rooms (crypt, reliquary, ossuary, tomb, vault, catacomb) — full undercroft
    { id: 'crypt', label: 'Crypt', x: 2.6, y: 1.0, z: -1, w: 1.45, h: 1.2, links: ['stairs', 'reliquary', 'ossuary'] },
    { id: 'reliquary', label: 'Reliquary', x: 1.15, y: 1.1, z: -1, w: 1.2, h: 1.0, links: ['crypt', 'vault'], isSecret: true },
    { id: 'ossuary', label: 'Ossuary', x: 2.7, y: 0, z: -1, w: 1.1, h: 0.95, links: ['crypt', 'tomb'] },
    { id: 'tomb', label: 'Tomb chamber', x: 1.0, y: 0, z: -1, w: 1.4, h: 0.9, links: ['ossuary'] },
    { id: 'vault', label: 'Vault', x: 0, y: 1.2, z: -1, w: 1.05, h: 0.95, links: ['reliquary', 'catacomb'] },
    { id: 'catacomb', label: 'Catacomb', x: 0, y: 0, z: -1, w: 0.95, h: 1.05, links: ['vault'], isSecret: true },
    // 2F: 6 rooms (gallery, belfry, organ, balcony, scriptorium, bell chamber) — full upper level
    { id: 'gallery', label: 'Gallery', x: 2.7, y: 1.05, z: 1, w: 0.55, h: 1.35, links: ['stairs', 'belfry', 'organ'] },
    { id: 'belfry', label: 'Belfry', x: 3.4, y: 1.15, z: 1, w: 1.0, h: 1.0, links: ['gallery', 'bell'] },
    { id: 'organ', label: 'Organ loft', x: 1.1, y: 1.1, z: 1, w: 1.3, h: 1.05, links: ['gallery', 'balcony'] },
    { id: 'balcony', label: 'Balcony', x: 0.7, y: 1.0, z: 1, w: 0.6, h: 1.2, links: ['organ', 'scriptorium'] },
    { id: 'scriptorium', label: 'Scriptorium', x: 0, y: 0.9, z: 1, w: 1.05, h: 1.15, links: ['balcony'] },
    { id: 'bell', label: 'Bell chamber', x: 3.5, y: 0, z: 1, w: 0.9, h: 1.0, links: ['belfry'] },
  ]

TASK: Design 3 different interior layouts for a TOWER or KEEP (wizard's tower, watchtower, stone keep, ruined donjon).

Floors:
- Several floors connected by stairs. Use z values -1, 0, 1, and you may add 2 and 3 for higher storeys (z: 2 = 3F, z: 3 = 4F). At least 3 floors per layout.
- The entry room is on z: 0 (ground floor gate or hall). z: -1 is optional (cellar, dungeon, cistern).
- Each floor has one stair room; stair rooms on adjacent floors link to each other with edge kind "stairs" (on both sides). Stair rooms sit at the same or nearby x/y on each floor so the stack lines up.
- Keep a compact, roughly square footprint on every floor (about 2.5 by 2.5), with upper floors the same size or smaller.

RULES:
1. Output a JSON array of exactly 3 layouts. Each layout is an array of room objects in EXACTLY the InteriorRoomSpec format. No other fields. No wrapper object.
2. Exactly one room per layout has "entry": true, and it is on z: 0.
3. Every id is unique within its layout (short lowercase, e.g. "stair1", "solar").
4. Links are symmetric: if A lists B, B lists A. Every room is reachable from the entry.
5. Sizes use the same layout units as the example (w and h roughly 0.5–2.0). Rooms on the same floor must not overlap.
6. Use "edgeKinds" only for non-door links: "stairs" for cross-floor links, "damaged" for a broken gap, "secret" for a hidden passage. Put the same kind on both sides of the link.
7. Optional: at most one secret room per layout with "isSecret": true, connected by a link whose edgeKinds value is "secret" on both sides.
8. 8–16 rooms per layout, 2–5 per floor. Labels are short (1–3 words).
9. Original content only. No names from books, films, games, or real castles.
10. Output JSON only.
```

---

## 5. Mine

```text
You are designing interior floor plans for a text RPG map engine. Output JSON only — no prose, no markdown fences, no comments.

FORMAT (TypeScript, from the engine — match it exactly):

export type InteriorEdgeKind = 'door' | 'damaged' | 'secret' | 'stairs';

export type InteriorRoomSpec = {
  id: string;
  label: string;
  /** Top-left in continuous layout units (varied footprints — not a uniform grid stamp). */
  x: number;
  y: number;
  /** -1 = B1, 0 = 1F, 1 = 2F */
  z: number;
  w: number;
  h: number;
  links: string[];
  /** Optional edge overrides (e.g. damaged gap). Defaults: door / stairs / secret. */
  edgeKinds?: Record<string, InteriorEdgeKind>;
  isSecret?: boolean;
  entry?: boolean;
};

ONE REAL EXAMPLE LAYOUT (a cathedral; shown as TypeScript — your output must be strict JSON with double-quoted keys):

  [
    // 1F: 7 rooms (narthex, nave, aisle, vestry, choir, sanctum, stairs)
    { id: 'entry', label: 'Narthex', x: 1.1, y: 2.55, z: 0, w: 1.3, h: 0.95, links: ['nave'], entry: true },
    {
      id: 'nave',
      label: 'Nave',
      x: 0.7,
      y: 1.05,
      z: 0,
      w: 2.0,
      h: 1.4,
      links: ['entry', 'aisle', 'choir', 'stairs'],
    },
    { id: 'aisle', label: 'Aisle', x: 0, y: 1.15, z: 0, w: 0.6, h: 1.35, links: ['nave', 'vestry'] },
    { id: 'vestry', label: 'Vestry', x: 0, y: 0, z: 0, w: 1.05, h: 1.0, links: ['aisle'] },
    { id: 'choir', label: 'Choir', x: 1.0, y: 0, z: 0, w: 1.4, h: 0.95, links: ['nave', 'sanctum'] },
    { id: 'sanctum', label: 'Sanctum', x: 2.55, y: 0, z: 0, w: 1.15, h: 1.05, links: ['choir'] },
    { id: 'stairs', label: 'Stairs', x: 2.85, y: 1.2, z: 0, w: 0.7, h: 0.85, links: ['nave', 'crypt', 'gallery'] },
    // B1: 6 rooms (crypt, reliquary, ossuary, tomb, vault, catacomb) — full undercroft
    { id: 'crypt', label: 'Crypt', x: 2.6, y: 1.0, z: -1, w: 1.45, h: 1.2, links: ['stairs', 'reliquary', 'ossuary'] },
    { id: 'reliquary', label: 'Reliquary', x: 1.15, y: 1.1, z: -1, w: 1.2, h: 1.0, links: ['crypt', 'vault'], isSecret: true },
    { id: 'ossuary', label: 'Ossuary', x: 2.7, y: 0, z: -1, w: 1.1, h: 0.95, links: ['crypt', 'tomb'] },
    { id: 'tomb', label: 'Tomb chamber', x: 1.0, y: 0, z: -1, w: 1.4, h: 0.9, links: ['ossuary'] },
    { id: 'vault', label: 'Vault', x: 0, y: 1.2, z: -1, w: 1.05, h: 0.95, links: ['reliquary', 'catacomb'] },
    { id: 'catacomb', label: 'Catacomb', x: 0, y: 0, z: -1, w: 0.95, h: 1.05, links: ['vault'], isSecret: true },
    // 2F: 6 rooms (gallery, belfry, organ, balcony, scriptorium, bell chamber) — full upper level
    { id: 'gallery', label: 'Gallery', x: 2.7, y: 1.05, z: 1, w: 0.55, h: 1.35, links: ['stairs', 'belfry', 'organ'] },
    { id: 'belfry', label: 'Belfry', x: 3.4, y: 1.15, z: 1, w: 1.0, h: 1.0, links: ['gallery', 'bell'] },
    { id: 'organ', label: 'Organ loft', x: 1.1, y: 1.1, z: 1, w: 1.3, h: 1.05, links: ['gallery', 'balcony'] },
    { id: 'balcony', label: 'Balcony', x: 0.7, y: 1.0, z: 1, w: 0.6, h: 1.2, links: ['organ', 'scriptorium'] },
    { id: 'scriptorium', label: 'Scriptorium', x: 0, y: 0.9, z: 1, w: 1.05, h: 1.15, links: ['balcony'] },
    { id: 'bell', label: 'Bell chamber', x: 3.5, y: 0, z: 1, w: 0.9, h: 1.0, links: ['belfry'] },
  ]

TASK: Design 3 different interior layouts for a MINE (working mine, abandoned mine, collapsed dig).

Floors:
- z: 0 (1F) = surface-level adit or pithead; the entry room is here.
- z: -1 (B1) = first working level; z: -2 (B2) = deep level. Every layout uses all three floors.
- Levels connect by a shaft, ladder, or ramp room. Ladders count as stairs: every cross-floor link uses edge kind "stairs" on both sides.
- Mines are tunnel-like: mix long thin galleries (e.g. w 1.8, h 0.4) with small chambers. Use "damaged" edges for cave-ins or collapsed timbers.

RULES:
1. Output a JSON array of exactly 3 layouts. Each layout is an array of room objects in EXACTLY the InteriorRoomSpec format. No other fields. No wrapper object.
2. Exactly one room per layout has "entry": true, and it is on z: 0.
3. Every id is unique within its layout (short lowercase, e.g. "adit", "shaft1").
4. Links are symmetric: if A lists B, B lists A. Every room is reachable from the entry.
5. Sizes use the same layout units as the example (x, y roughly 0–4.5; w and h roughly 0.35–2.0). Rooms on the same floor must not overlap.
6. Use "edgeKinds" only for non-door links: "stairs" for cross-floor links (including ladders), "damaged" for a cave-in gap, "secret" for a hidden passage. Put the same kind on both sides of the link.
7. Optional: at most one secret room per layout with "isSecret": true, connected by a link whose edgeKinds value is "secret" on both sides.
8. 8–15 rooms per layout. Labels are short (1–3 words).
9. Original content only. No names from books, films, games, or real mines.
10. Output JSON only.
```

---

## 6. Sewer

```text
You are designing interior floor plans for a text RPG map engine. Output JSON only — no prose, no markdown fences, no comments.

FORMAT (TypeScript, from the engine — match it exactly):

export type InteriorEdgeKind = 'door' | 'damaged' | 'secret' | 'stairs';

export type InteriorRoomSpec = {
  id: string;
  label: string;
  /** Top-left in continuous layout units (varied footprints — not a uniform grid stamp). */
  x: number;
  y: number;
  /** -1 = B1, 0 = 1F, 1 = 2F */
  z: number;
  w: number;
  h: number;
  links: string[];
  /** Optional edge overrides (e.g. damaged gap). Defaults: door / stairs / secret. */
  edgeKinds?: Record<string, InteriorEdgeKind>;
  isSecret?: boolean;
  entry?: boolean;
};

ONE REAL EXAMPLE LAYOUT (a cathedral; shown as TypeScript — your output must be strict JSON with double-quoted keys):

  [
    // 1F: 7 rooms (narthex, nave, aisle, vestry, choir, sanctum, stairs)
    { id: 'entry', label: 'Narthex', x: 1.1, y: 2.55, z: 0, w: 1.3, h: 0.95, links: ['nave'], entry: true },
    {
      id: 'nave',
      label: 'Nave',
      x: 0.7,
      y: 1.05,
      z: 0,
      w: 2.0,
      h: 1.4,
      links: ['entry', 'aisle', 'choir', 'stairs'],
    },
    { id: 'aisle', label: 'Aisle', x: 0, y: 1.15, z: 0, w: 0.6, h: 1.35, links: ['nave', 'vestry'] },
    { id: 'vestry', label: 'Vestry', x: 0, y: 0, z: 0, w: 1.05, h: 1.0, links: ['aisle'] },
    { id: 'choir', label: 'Choir', x: 1.0, y: 0, z: 0, w: 1.4, h: 0.95, links: ['nave', 'sanctum'] },
    { id: 'sanctum', label: 'Sanctum', x: 2.55, y: 0, z: 0, w: 1.15, h: 1.05, links: ['choir'] },
    { id: 'stairs', label: 'Stairs', x: 2.85, y: 1.2, z: 0, w: 0.7, h: 0.85, links: ['nave', 'crypt', 'gallery'] },
    // B1: 6 rooms (crypt, reliquary, ossuary, tomb, vault, catacomb) — full undercroft
    { id: 'crypt', label: 'Crypt', x: 2.6, y: 1.0, z: -1, w: 1.45, h: 1.2, links: ['stairs', 'reliquary', 'ossuary'] },
    { id: 'reliquary', label: 'Reliquary', x: 1.15, y: 1.1, z: -1, w: 1.2, h: 1.0, links: ['crypt', 'vault'], isSecret: true },
    { id: 'ossuary', label: 'Ossuary', x: 2.7, y: 0, z: -1, w: 1.1, h: 0.95, links: ['crypt', 'tomb'] },
    { id: 'tomb', label: 'Tomb chamber', x: 1.0, y: 0, z: -1, w: 1.4, h: 0.9, links: ['ossuary'] },
    { id: 'vault', label: 'Vault', x: 0, y: 1.2, z: -1, w: 1.05, h: 0.95, links: ['reliquary', 'catacomb'] },
    { id: 'catacomb', label: 'Catacomb', x: 0, y: 0, z: -1, w: 0.95, h: 1.05, links: ['vault'], isSecret: true },
    // 2F: 6 rooms (gallery, belfry, organ, balcony, scriptorium, bell chamber) — full upper level
    { id: 'gallery', label: 'Gallery', x: 2.7, y: 1.05, z: 1, w: 0.55, h: 1.35, links: ['stairs', 'belfry', 'organ'] },
    { id: 'belfry', label: 'Belfry', x: 3.4, y: 1.15, z: 1, w: 1.0, h: 1.0, links: ['gallery', 'bell'] },
    { id: 'organ', label: 'Organ loft', x: 1.1, y: 1.1, z: 1, w: 1.3, h: 1.05, links: ['gallery', 'balcony'] },
    { id: 'balcony', label: 'Balcony', x: 0.7, y: 1.0, z: 1, w: 0.6, h: 1.2, links: ['organ', 'scriptorium'] },
    { id: 'scriptorium', label: 'Scriptorium', x: 0, y: 0.9, z: 1, w: 1.05, h: 1.15, links: ['balcony'] },
    { id: 'bell', label: 'Bell chamber', x: 3.5, y: 0, z: 1, w: 0.9, h: 1.0, links: ['belfry'] },
  ]

TASK: Design 3 different interior layouts for a CITY SEWER (brick drains, storm culverts, old undercity tunnels).

Floors:
- z: 0 (1F) = street-level access (grate room, drain house, or maintenance hut); the entry room is here.
- z: -1 (B1) = main sewer tunnels; z: -2 (B2) = deep outflow, cistern, or old undercity. Every layout uses all three floors.
- Levels connect by ladder or stair rooms. Ladders count as stairs: every cross-floor link uses edge kind "stairs" on both sides.
- Sewers are tunnel-like: long thin channels (e.g. w 2.0, h 0.4) meeting at junction chambers, sluice rooms, and overflow basins. Use "damaged" edges for broken grates or collapsed brickwork.

RULES:
1. Output a JSON array of exactly 3 layouts. Each layout is an array of room objects in EXACTLY the InteriorRoomSpec format. No other fields. No wrapper object.
2. Exactly one room per layout has "entry": true, and it is on z: 0.
3. Every id is unique within its layout (short lowercase, e.g. "grate", "junction1").
4. Links are symmetric: if A lists B, B lists A. Every room is reachable from the entry.
5. Sizes use the same layout units as the example (x, y roughly 0–4.5; w and h roughly 0.35–2.0). Rooms on the same floor must not overlap.
6. Use "edgeKinds" only for non-door links: "stairs" for cross-floor links (including ladders), "damaged" for a broken gap, "secret" for a hidden passage. Put the same kind on both sides of the link.
7. Optional: at most one secret room per layout with "isSecret": true, connected by a link whose edgeKinds value is "secret" on both sides.
8. 8–15 rooms per layout. Labels are short (1–3 words).
9. Original content only. No names from books, films, games, or real cities.
10. Output JSON only.
```
