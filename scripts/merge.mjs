import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const writeJson = (p, data, pretty = true) => {
  const outPath = path.join(ROOT, p);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify(data, null, pretty ? 2 : 0) + "\n",
    "utf8"
  );
};

const tokenize = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const resources = readJson("catalog/taxonomies/resources.json");
const resourceLabelById = Object.fromEntries(
  resources.map((r) => [r.id, r.label])
);
const resourceOrderById = Object.fromEntries(
  resources.map((r) => [r.id, r.order ?? 999])
);

const integrationsDir = path.join(ROOT, "catalog/integrations");
const files = fs
  .readdirSync(integrationsDir)
  .filter((f) => f.endsWith(".json"));

const rawIntegrations = files.map((f) =>
  readJson(path.join("catalog/integrations", f))
);

// Enrich for UI
const integrations = rawIntegrations
  .map((i) => ({
    ...i,
    resource_label: resourceLabelById[i.resource] ?? i.resource,
    resource_order: resourceOrderById[i.resource] ?? 999,
  }))
  .sort((a, b) => {
    if (a.resource_order !== b.resource_order)
      return a.resource_order - b.resource_order;
    return a.name.localeCompare(b.name);
  });

const integrationsIndex = Object.fromEntries(
  integrations.map((i) => [i.id, i])
);

const searchIndex = integrations.map((i) => ({
  id: i.id,
  name: i.name,
  resource: i.resource,
  telemetry_types: i.telemetry_types,
  tokens: Array.from(
    new Set([
      ...tokenize(i.name),
      ...tokenize(i.description),
      ...tokenize(i.resource_label),
      ...(i.telemetry_types ?? []),
    ])
  ),
}));

const itemsByResource = integrations.reduce((acc, i) => {
  (acc[i.resource] ??= []).push(i);
  return acc;
}, {});

for (const rid of Object.keys(itemsByResource)) {
  itemsByResource[rid].sort((a, b) => a.name.localeCompare(b.name));
}

const resourcesList = resources
  .slice()
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
  .map((r) => ({
    id: r.id,
    label: r.label,
    order: r.order ?? 999,
    items: itemsByResource[r.id] ?? [],
  }));

const resourcesIndex = Object.fromEntries(
  resourcesList.map((r) => [r.id, r.items])
);

writeJson("dist/integrations.json", integrations, true);
writeJson("dist/integrations.min.json", integrations, false);
writeJson("dist/integrations-index.json", integrationsIndex, true);
writeJson("dist/search-index.json", searchIndex, true);
writeJson("dist/resources.json", resourcesList, true);
writeJson("dist/resources-index.json", resourcesIndex, true);

console.log(
  `Wrote dist outputs: ${integrations.length} integrations, ${resourcesList.length} resources`
);
