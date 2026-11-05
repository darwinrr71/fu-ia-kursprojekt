// Stoppar försök att ta bort eller inaktivera befintliga tester.
import process from "node:process";

type ToolEvent = {
  hook_event_name?: string;
  tool_name?: string;
  tool_input?: { command?: string };
};

async function main(): Promise<void> {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;

  let event: ToolEvent;
  try {
    event = JSON.parse(input) as ToolEvent;
  } catch {
    return;
  }
  if (event.hook_event_name !== "PreToolUse") return;

  const command = event.tool_input?.command ?? "";
  const testPath = /(?:^|[\\/])(?:tests?|__tests__)[\\/]|(?:^|[\\/])[^\\/\s]+\.(?:test|spec)\.[cm]?[jt]sx?\b/i;
  const deletesFile = /^\*\*\* Delete File:\s*(.+)$/gim;
  const deleteTest = [...command.matchAll(deletesFile)].some((m) => testPath.test(m[1]));
  const shellDelete = /\b(?:git\s+rm|rm|Remove-Item|del|erase)\b/i.test(command) && testPath.test(command);
  const patchChangesTest = event.tool_name === "apply_patch" && testPath.test(command);
  const removesTest = patchChangesTest && /^-\s*(?:it|test|describe)\s*\(/m.test(command);
  const disablesTest = patchChangesTest && /^\+\s*(?:(?:it|test|describe)\.(?:skip|only)|x(?:it|test|describe))\s*\(/m.test(command);

  if (deleteTest || shellDelete || removesTest || disablesTest) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "Befintliga tester får inte tas bort eller inaktiveras.",
      },
    }));
  }
}

void main().catch(() => { process.stderr.write("Fel i testskyddet.\n"); process.exitCode = 2; });
