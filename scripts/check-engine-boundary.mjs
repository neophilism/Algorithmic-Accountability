import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const roots = [join(root, "apps"), join(root, "packages")];
const violations = [];

function scan(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", "dist", ".next", "coverage"].includes(entry.name)) scan(path);
      continue;
    }
    if (!entry.isFile() || !/\.[cm]?[jt]sx?$/.test(entry.name)) continue;
    const content = readFileSync(path, "utf8");
    const imports = [...content.matchAll(/(?:from\s*|import\s*\(|require\s*\()\s*["']([^"']+)["']/g)];
    for (const [, target] of imports) {
      if ((target.startsWith("@caiae/") && target !== "@caiae/sdk") ||
          target.includes("vendor/caiae")) {
        violations.push(relative(root, path) + " imports " + target);
      }
    }
  }
}

for (const directory of roots) scan(directory);
if (violations.length) {
  console.error("CAIAE SDK boundary violations:\n" + violations.join("\n"));
  process.exit(1);
}
console.log("CAIAE boundary verified: downstream code imports only @caiae/sdk.");
