#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
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
const schemaText = JSON.stringify(JSON.parse(readFileSync(schemaPath, "utf8")));

const prompt = `Review every email in ${folder} against brand/voice.md and .claude/rules/emails.md. Report only real problems.`;

const winClaudeExe = join(
  process.env.APPDATA || "",
  "npm",
  "node_modules",
  "@anthropic-ai",
  "claude-code",
  "bin",
  "claude.exe"
);
const claudeBin =
  process.platform === "win32" && existsSync(winClaudeExe)
    ? winClaudeExe
    : "claude";

const raw = execFileSync(
  claudeBin,
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
  {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 50,
  }
);

const parsed = JSON.parse(raw);
const result = Array.isArray(parsed) ? parsed[parsed.length - 1] : parsed;
const structuredOutput = result.structured_output;

if (!structuredOutput || !Array.isArray(structuredOutput.findings)) {
  console.error("No structured_output.findings found in Claude's response.");
  console.error(raw);
  process.exit(1);
}

const findings = structuredOutput.findings;

const reviewDir = join(repoRoot, "review");
mkdirSync(reviewDir, { recursive: true });
writeFileSync(
  join(reviewDir, "findings.json"),
  JSON.stringify(structuredOutput, null, 2) + "\n"
);

const counts = { high: 0, medium: 0, low: 0 };
for (const f of findings) {
  if (counts[f.severity] !== undefined) counts[f.severity]++;
}

console.log(
  `Reviewed ${folder}: ${findings.length} finding(s) — ${counts.high} high, ${counts.medium} medium, ${counts.low} low. Saved to review/findings.json`
);

process.exit(counts.high > 0 ? 1 : 0);
