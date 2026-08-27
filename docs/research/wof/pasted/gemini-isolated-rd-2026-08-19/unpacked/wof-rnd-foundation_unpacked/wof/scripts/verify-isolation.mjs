import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const scanRoots = ["src", "tests", "scripts"];
const allowedExtensions = new Set([".ts", ".mts", ".cts", ".js", ".mjs", ".cjs", ".json"]);
const forbiddenReferences = [
  { label: "absolute production source path", pattern: /\/home\/ubuntu\/src(?:\/|$)/ },
  { label: "absolute production backend path", pattern: /\/home\/ubuntu\/supabase(?:\/|$)/ },
  { label: "deep relative production source path", pattern: /(?:\.\.\/){2,}src(?:\/|$)/ },
  { label: "deep relative production backend path", pattern: /(?:\.\.\/){2,}supabase(?:\/|$)/ },
  { label: "production backend namespace", pattern: /(?:from|import\()\s*\(?\s*["'][^"']*supabase[^"']*["']/ },
  { label: "shared application alias", pattern: /(?:from|import\()\s*\(?\s*["']@\// },
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(path));
    else if ([...allowedExtensions].some((extension) => entry.name.endsWith(extension))) files.push(path);
  }
  return files;
}

const violations = [];
for (const scanRoot of scanRoots) {
  const files = await collectFiles(join(root, scanRoot));
  for (const file of files) {
    const text = await readFile(file, "utf8");
    for (const rule of forbiddenReferences) {
      if (rule.pattern.test(text)) violations.push(`${relative(root, file)}: ${rule.label}`);
    }
  }
}

if (violations.length > 0) {
  console.error("WOF isolation check failed:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log("WOF isolation check passed: no protected namespace references found.");
}
