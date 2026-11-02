#!/usr/bin/env node
// PreToolUse guard for the Resend MCP: blocks any send that could reach real people.

const BLOCKED_TOOLS = new Set([
  "send-broadcast",
  "create-automation",
  "send-inbox-draft",
  "send-new-inbox-email",
]);

function toolShortName(toolName) {
  const idx = toolName.lastIndexOf("__");
  return idx === -1 ? toolName : toolName.slice(idx + 2);
}

function collectAddresses(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.flat().filter((v) => typeof v === "string");
}

function isAllowed(address, myEmail) {
  const addr = address.trim().toLowerCase();
  const match = addr.match(/<([^>]+)>/);
  const email = (match ? match[1] : addr).trim();
  if (email.endsWith("@resend.dev")) return true;
  if (myEmail && email === myEmail.trim().toLowerCase()) return true;
  return false;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

const input = await readStdin();
let payload;
try {
  payload = JSON.parse(input);
} catch {
  process.exit(0);
}

const toolName = payload.tool_name || "";
const toolInput = payload.tool_input || {};
const shortName = toolShortName(toolName);

if (BLOCKED_TOOLS.has(shortName)) {
  console.error(`Blocked: ${shortName} can reach a whole list of people, not just approved test addresses.`);
  process.exit(2);
}

if (shortName === "send-email" || shortName === "send-batch-emails") {
  const myEmail = process.env.MY_EMAIL || "";
  const items = shortName === "send-batch-emails" && Array.isArray(toolInput.emails)
    ? toolInput.emails
    : [toolInput];

  for (const item of items) {
    const addresses = [
      ...collectAddresses(item.to),
      ...collectAddresses(item.cc),
      ...collectAddresses(item.bcc),
    ];
    for (const address of addresses) {
      if (!isAllowed(address, myEmail)) {
        console.error(`Blocked: ${address} is not a resend.dev test address or your own email.`);
        process.exit(2);
      }
    }
  }
}

process.exit(0);
