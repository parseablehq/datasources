import { execSync } from "node:child_process";

execSync("node scripts/validate.mjs", { stdio: "inherit" });
execSync("node scripts/generate-groups.mjs", { stdio: "inherit" });
execSync("node scripts/merge.mjs", { stdio: "inherit" });
