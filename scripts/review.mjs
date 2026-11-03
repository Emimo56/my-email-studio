#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

const folder = process.argv[2];
if (!folder) {
  console.error("Usage: node scripts/review.mjs <campaign-folder>");
  process.exit(1);
}

const schemaPath = join(repoRoot, "review", "findings.schema.json");
// Minified to a single line: avoids shell-quoting issues with embedded newlines on Windows.
const schemaText = JSON.stringify(JSON.parse(readFileSync(schemaPath, "utf8")));

const prompt =
  `Review every email in ${folder} against brand/voice.md and .claude/rules/emails.md. ` +
  `Report only real problems.`;

// On Windows, `claude` resolves to a .cmd shim; invoking it needs shell:true,
// which skips arg-escaping and corrupts the JSON schema argument. The shim's
// underlying .exe can be called directly, with shell:false, avoiding that.
const claudeCommand =
  process.platform === "win32"
    ? join(
        process.env.APPDATA,
        "npm",
        "node_modules",
        "@anthropic-ai",
        "claude-code",
        "bin",
        "claude.exe"
      )
    : "claude";

const result = spawnSync(
  claudeCommand,
  [
    "-p",
    prompt,
    "--output-format",
    "json",
    "--json-schema",
    schemaText,
    "--allowedTools",
    "Read,Glob,Grep",
  ],
  { cwd: repoRoot, encoding: "utf8", shell: false }
);

if (result.error) {
  console.error("Failed to run claude:", result.error.message);
  process.exit(1);
}

if (result.status !== 0 && !result.stdout) {
  console.error(`claude exited with code ${result.status}`);
  console.error(result.stderr);
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(result.stdout);
} catch (err) {
  console.error("Could not parse claude output as JSON:", err.message);
  console.error(result.stdout);
  process.exit(1);
}

// claude -p --output-format json can return either a single result object,
// or a list of streamed messages where the last item is the final result.
const resultObject = Array.isArray(parsed) ? parsed[parsed.length - 1] : parsed;

const structuredOutput = resultObject?.structured_output;
if (!structuredOutput || !Array.isArray(structuredOutput.findings)) {
  console.error("No structured_output.findings found in claude's response.");
  console.error(JSON.stringify(resultObject, null, 2));
  process.exit(1);
}

const outPath = join(repoRoot, "review", "findings.json");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(structuredOutput, null, 2) + "\n");

const { findings } = structuredOutput;
const highCount = findings.filter((f) => f.severity === "high").length;
const mediumCount = findings.filter((f) => f.severity === "medium").length;
const lowCount = findings.filter((f) => f.severity === "low").length;

console.log(
  `Reviewed ${folder}: ${findings.length} finding(s) ` +
    `(${highCount} high, ${mediumCount} medium, ${lowCount} low). ` +
    `Saved to review/findings.json`
);

process.exit(highCount > 0 ? 1 : 0);
