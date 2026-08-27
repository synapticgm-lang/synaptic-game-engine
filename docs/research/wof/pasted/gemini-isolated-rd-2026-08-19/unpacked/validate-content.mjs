import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const targets = [
  "data/schemas/world-state.schema.json",
  "data/schemas/lore-package.schema.json",
  "data/lore/first-tide.lore.json",
];

const parsed = new Map();
for (const target of targets) {
  try {
    parsed.set(target, JSON.parse(await readFile(new URL(`../${target}`, import.meta.url), "utf8")));
  } catch (error) {
    console.error(`Invalid local JSON artifact: ${target}`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

const loreSchema = parsed.get("data/schemas/lore-package.schema.json");
const lore = parsed.get("data/lore/first-tide.lore.json");
const worldSchema = parsed.get("data/schemas/world-state.schema.json");

const failures = [];
if (worldSchema?.$id !== "wof://schemas/world-state/0.1.0") failures.push("World-state schema ID is missing or incorrect.");
if (loreSchema?.$id !== "wof://schemas/lore-package/0.1.0") failures.push("Lore-package schema ID is missing or incorrect.");
if (lore?.packageVersion !== "0.1.0") failures.push("Lore package version is missing or incorrect.");
if (!Array.isArray(lore?.regions) || lore.regions.length < 1) failures.push("Lore package requires at least one region.");
if (!Array.isArray(lore?.factions) || lore.factions.length < 1) failures.push("Lore package requires at least one faction.");
if (!Array.isArray(lore?.magicAxioms) || lore.magicAxioms.length < 1) failures.push("Lore package requires at least one magic axiom.");

if (failures.length > 0) {
  console.error("WOF local content validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("WOF local content validation passed: JSON artifacts are readable and baseline content is present.");
}
