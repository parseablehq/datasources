import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const writeJson = (p, data) => {
  const outPath = path.join(ROOT, p);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2) + "\n", "utf8");
};

const integrationsDir = path.join(ROOT, "catalog/integrations");
const files = fs
  .readdirSync(integrationsDir)
  .filter((f) => f.endsWith(".json"));

const integrations = files.map((f) =>
  readJson(path.join("catalog/integrations", f))
);

const resources = readJson("catalog/taxonomies/resources.json")
  .slice()
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

const itemsByResource = integrations.reduce((acc, i) => {
  (acc[i.resource] ??= []).push(i);
  return acc;
}, {});

// Sort integrations inside each resource by name
for (const rid of Object.keys(itemsByResource)) {
  itemsByResource[rid].sort((a, b) => a.name.localeCompare(b.name));
}

// groups.json format: resource + sources (sources do not include "resource")
const groups = resources.map((r) => ({
  resource: r.id,
  sources: (itemsByResource[r.id] ?? []).map((i) => {
    const { resource, ...rest } = i;
    return rest;
  }),
}));

writeJson("catalog/groups.json", groups);

console.log(`Generated catalog/groups.json with ${groups.length} groups`);
