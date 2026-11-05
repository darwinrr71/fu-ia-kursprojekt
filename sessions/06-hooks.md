# Etapp 7 – Hooks och sessionsminne

## Git
- Gren: `fu-ia-kursprojekt`
- Commit: `0a22e67`
- Commitmeddelande: `feat: konfigurera och verifiera fem Codex-hooks`

## Genomförande
Fem TypeScript-hooks har konfigurerats i
`.codex/hooks.json` och `.codex/hooks/`.

Även `tsconfig.json` ingår i samma commit.

## Verifierade hooks

### SessionStart
Återläser sessionsinformation från den senaste
sessionsloggen och `sessions/senaste-codex.md`.

Återläsningen bekräftades i en riktig Codex-session
utan manuell filläsning.

### SessionEnd
Skriver automatiskt projektstatus när en Codex-session
avslutas. Automatisk körning har observerats.

### PreToolUse
Ett simulerat försök att ta bort tester gav
`permissionDecision: deny`.

Skyddet omfattar identifierade mönster, men inte
alla tänkbara sätt att ändra tester.

### PostToolUse
Registrerade verktygsanrop för `git status` och
`npm run typecheck` i
`sessions/verktygskontroller.jsonl`.

Loggen visar att verktygen anropades, inte
nödvändigtvis att de lyckades.

### Stop
Ett test utan väntande ändringar gav `{}`.

Reaktionen på relevanta kodändringar återstår
att verifiera.

## Automatiska kontroller
- `npm run typecheck`: godkänd.
- `npm test`: 16 av 16 tester godkända.
- Tidigare ts-jest-varningar försvann efter
  justeringen av `tsconfig.json`.
- `git diff --cached --check`: inga fel
  före commit.

## Kvarstående begränsningar
- Skyddet mot ändring av tester täcker inte
  alla möjliga angreppssätt.
- Stop-hookens reaktion på kodändringar är
  ännu inte verifierad.
- Verktygsloggen bevisar inte att varje
  registrerat kommando lyckades.
- De automatiskt genererade sessionsfilerna
  ingår inte i detta commit.

## Slutsats
Fem hooks har konfigurerats och testats.
Den automatiska sessionskedjan har bekräftats.

Etappen har verifierade funktioner men också
dokumenterade begränsningar.
