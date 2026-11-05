// Sparar en kort projektstatus när en Codex-session avslutas.
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

async function main(): Promise<void> {
  let input = "";

  for await (const chunk of process.stdin) {
    input += chunk;
  }

  let event: unknown;

  try {
    event = JSON.parse(input) as unknown;
  } catch {
    return;
  }

  if (
    typeof event !== "object" ||
    event === null ||
    !("hook_event_name" in event) ||
    event.hook_event_name !== "SessionEnd"
  ) {
    return;
  }

  const sessionsDir = path.join(process.cwd(), "sessions");

  if (!fs.existsSync(sessionsDir)) {
    return;
  }

  const logs = fs
    .readdirSync(sessionsDir)
    .filter((name) => /^\d{2}-.+\.md$/.test(name))
    .sort();

  function git(...args: string[]): string {
    return execFileSync("git", args, {
      encoding: "utf8",
      timeout: 1000,
    }).trim();
  }

  const content = [
    "# Automatisk sessionsstatus",
    "",
    `- Datum: ${new Date().toISOString()}`,
    `- Gren: ${git("branch", "--show-current")}`,
    `- Senaste commit: ${git("rev-parse", "--short", "HEAD")}`,
    `- Senaste sessionslogg: ${logs.at(-1) ?? "Saknas"}`,
    "",
    "Arbetsresultat dokumenteras separat i sessionsloggarna.",
    "",
  ].join("\n");

  fs.writeFileSync(path.join(sessionsDir, "senaste-codex.md"), content, "utf8");
}

main().catch((error: unknown) => {
  process.stderr.write(String(error));
  process.exitCode = 1;
});
