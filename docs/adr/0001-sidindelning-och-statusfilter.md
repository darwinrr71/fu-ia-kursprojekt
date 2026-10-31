# ADR 0001 – Sidindelning och statusfilter

**Status:** Föreslagen
**Beslut:** Utöka befintligt API för kundens beställningar.

## Bakgrund

API:t har redan `GET /customers/me/orders`, som listar kundens beställningar. Den valda user storyn kräver sidindelning och filtrering på status.

## Beslut

- Behålla befintlig endpoint och lägga till valfria parametrar `page` och `status`.
- Använda 10 beställningar per sida när `page` anges.
- Utföra filtrering och sidindelning i PostgreSQL med parametriserade SQL-frågor.
- Behålla befintligt svar när `page` och `status` saknas.
- Inte ändra databasschemat för denna funktion.

## Alternativ som valdes bort

1. **Ny endpoint:** Skulle skapa onödig duplicering av befintlig funktionalitet.
2. **Sidindelning i TypeScript:** Skulle kräva att fler beställningar hämtas från databasen än vad som behövs.

## Konsekvenser

- Befintliga API-anrop ska fortsätta fungera.
- Fler testfall behövs för filter, sidindelning, fel och kundisolering.
- Sidindelning med OFFSET kan bli långsammare vid mycket stora datamängder.

## Planerad verifiering

- Skriva tester före implementationen enligt TDD.
- Kontrollera acceptanskriterierna i `docs/krav-sidindelning.md`.
- Kontrollera API-kontraktet i `docs/api-sidindelning.md`.
- Köra befintliga och nya tester.

**Kodreferenser:** `src/routes/customers.ts`, `src/services/customerService.ts`.
