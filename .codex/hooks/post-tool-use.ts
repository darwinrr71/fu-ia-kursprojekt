// Loggar utförda kvalitets- och Git-kontroller utan kommandoutdata eller hemligheter.
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

type ToolEvent = {
  hook_event_name?: string;
  tool_input?: { command?: string };
};

const commands = [
  "npm test", "npm run lint", "npm run typecheck", "npm run format:check",
  "git status", "git diff",
];

async function main(): Promise<void> {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;

  let event: ToolEvent;
  try { event = JSON.parse(input) as ToolEvent; } catch { return; }
  if (event.hook_event_name !== "PostToolUse") return;

  const command = event.tool_input?.command ?? "";
  const found = commands.filter((name) => command.includes(name));
  if (found.length === 0) return;

  const logFile = path.join(process.cwd(), "sessions", "verktygskontroller.jsonl");
  if (!fs.existsSync(path.dirname(logFile))) return;
  for (const name of found) {
    fs.appendFileSync(logFile, JSON.stringify({
      tid: new Date().toISOString(),
      kommando: name,
      anropat: true,
    }) + "\n", "utf8");
  }
}

void main().catch(() => { process.stderr.write("Kunde inte logga verktygskontrollen.\n"); process.exitCode = 1; });
