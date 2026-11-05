// Läser den senaste sessionsloggen och ger Codex tidigare arbetskontext vid sessionsstart.
import * as fs from "node:fs";
import path from "node:path";
import process from "node:process";

const sessionsDir = path.join(process.cwd(), "sessions");

if (!fs.existsSync(sessionsDir)) {
  process.exit(0);
}

const files = fs
  .readdirSync(sessionsDir)
  .filter((name) => /^\d{2}-.+\.md$/.test(name))
  .sort();

const latest = files.at(-1);

if (!latest) {
  process.exit(0);
}

const content = fs.readFileSync(path.join(sessionsDir, latest), "utf8");

// Läser även den automatiskt sparade sessionsstatusen.
const statusFile = path.join(sessionsDir, "senaste-codex.md");

const savedStatus = fs.existsSync(statusFile)
  ? fs.readFileSync(statusFile, "utf8")
  : "Ingen tidigare sessionsstatus finns.";

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext:
        `Senaste sessionslogg: sessions/${latest}\n\n` +
        content.slice(0, 3000) +
        `\n\nSenaste automatiska sessionsstatus:\n` +
        savedStatus.slice(0, 1000),
    },
  }),
);
