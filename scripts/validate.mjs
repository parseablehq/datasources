import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const exists = (p) => fs.existsSync(path.join(ROOT, p));

const allowedTelemetry = new Set(
  readJson("catalog/taxonomies/telemetry_types.json")
);

const resources = readJson("catalog/taxonomies/resources.json");
const resourceIds = new Set(resources.map((r) => r.id));

const isValidId = (id) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);

const integrationsDir = path.join(ROOT, "catalog/integrations");
const files = fs
  .readdirSync(integrationsDir)
  .filter((f) => f.endsWith(".json"));

if (files.length === 0) {
  throw new Error("No integration files found in catalog/integrations/");
}

const byId = new Map();

for (const file of files) {
  const relPath = path.join("catalog/integrations", file);
  const obj = readJson(relPath);

  if (!obj.id || !isValidId(obj.id)) {
    throw new Error(`Invalid or missing id in ${relPath}`);
  }

  if (byId.has(obj.id)) {
    throw new Error(`Duplicate id "${obj.id}" found in ${relPath}`);
  }

  if (!obj.name) throw new Error(`Missing name in ${relPath}`);
  if (!obj.description) throw new Error(`Missing description in ${relPath}`);

  if (!obj.resource || !resourceIds.has(obj.resource)) {
    throw new Error(`Invalid or missing resource in ${relPath}`);
  }

  if (!Array.isArray(obj.telemetry_types) || obj.telemetry_types.length === 0) {
    throw new Error(`telemetry_types must be non-empty array in ${relPath}`);
  }
  for (const t of obj.telemetry_types) {
    if (!allowedTelemetry.has(t)) {
      throw new Error(`Invalid telemetry type "${t}" in ${relPath}`);
    }
  }

  if (!obj.links?.docs) throw new Error(`Missing links.docs in ${relPath}`);

  if (!obj.assets?.logo) throw new Error(`Missing assets.logo in ${relPath}`);
  if (typeof obj.assets.logo !== "string" || obj.assets.logo.length === 0) {
    throw new Error(`assets.logo must be a non-empty string in ${relPath}`);
  }
  if (!exists(obj.assets.logo)) {
    throw new Error(
      `Missing asset file "${obj.assets.logo}" referenced in ${relPath}`
    );
  }

  byId.set(obj.id, obj);
}

console.log(`OK: validated ${byId.size} integrations`);
