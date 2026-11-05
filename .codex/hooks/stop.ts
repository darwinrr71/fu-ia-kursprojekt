// Påminner om kontroller som inte har observerats efter ändringar i kodbasen.
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

type StopEvent = { hook_event_name?: string; stop_hook_active?: boolean };
type CheckLog = { tid?: string; kommando?: string };

const requiredChecks = ["npm test", "npm run lint", "npm run typecheck", "npm run format:check"];

async function main(): Promise<void> {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;

  let event: StopEvent;
  try { event = JSON.parse(input) as StopEvent; } catch { return; }
  if (event.hook_event_name !== "Stop") return;
  if (event.stop_hook_active) { process.stdout.write("{}"); return; }

  const changes = execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], {
    encoding: "utf8", timeout: 2000,
  }).split(/\r?\n/).filter(Boolean).map((row) => row.slice(3).replaceAll("\\", "/"));
  const codeFiles = changes.filter((file) => /^(src|tests|scripts)\//.test(file));
  if (codeFiles.length === 0) { process.stdout.write("{}"); return; }

  const newestChange = Math.max(...codeFiles.map((name) => {
    const file = path.join(process.cwd(), name);
    return fs.existsSync(file) ? fs.statSync(file).mtimeMs : Date.now();
  }));
  const logFile = path.join(process.cwd(), "sessions", "verktygskontroller.jsonl");
  const logs: CheckLog[] = fs.existsSync(logFile)
    ? fs.readFileSync(logFile, "utf8").split(/\r?\n/).filter(Boolean).flatMap((line) => {
        try { return [JSON.parse(line) as CheckLog]; } catch { return []; }
      })
    : [];
  const missing = requiredChecks.filter((name) => !logs.some((item) =>
    item.kommando === name && Date.parse(item.tid ?? "") >= newestChange));

  if (missing.length) {
    process.stdout.write(JSON.stringify({
      systemMessage: `Ändrade kodfiler upptäcktes. Inga registrerade körningar efter senaste ändringen för: ${missing.join(", ")}. Kontrollera och redovisa resultaten före commit.`,
    }));
  } else {
    process.stdout.write("{}");
  }
}

void main().catch(() => { process.stderr.write("Stop-kontrollen kunde inte slutföras.\n"); process.exitCode = 1; });
