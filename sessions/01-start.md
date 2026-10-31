# Sessionslogg – Projektstart och baslinje

**Datum:** 2026-10-31  
**Arbetsgren:** `fu-ia-kursprojekt`  
**Projekt:** `ovningsprojekt`  
**Plan:** Huvudplan V2

## Aktuellt läge

- Etapp 1: Repository klonat och arbetsgren skapad.
- Etapp 2: Utvecklingsmiljön förberedd och de ursprungliga testerna verifierade.
- Nästa arbete: Slutföra kontrollen av Git-status och påbörja nästa etapp enligt Huvudplan V2.

## Genomfört arbete

- Klonat `Ammar-Alderhally/ovningsprojekt`.
- Skapat arbetsgrenen `fu-ia-kursprojekt`.
- Verifierat Node.js, npm, Git, Python och Docker.
- Installerat Node.js-beroenden med `npm ci`.
- Skapat `.env` från `.env.example`.
- Startat projektets PostgreSQL 16 i Docker.
- Återställt databaserna `butik` och `butik_test`.
- Skapat Python-miljön `.venv` och installerat `requirements.txt`.

## Verifierade resultat

- PostgreSQL accepterar anslutningar.
- Den äldre Python-modulen beräknar order 1042 till totalt `1187.5`.
- Ursprungliga API-tester: **16 av 16 godkända**.
- Sista testkörningen tog **3,327 sekunder** enligt Jest.

## Problem och lösningar

Första testkörningen gav 15 godkända tester och ett misslyckat test.

Orsak: TypeScript-koden använder kommandot `python3`, som inte var tillgängligt i Windows-miljön. Python-beroendet `psycopg` saknades också.

Tillfällig lokal lösning: Python-beroendena installerades i `.venv`, en lokal kopia av `python.exe` skapades med namnet `python3.exe`, och den virtuella miljöns sökväg lades först i terminalens `PATH`.

Efter detta blev samtliga 16 tester godkända.

## Beslut

- Behålla lärarens ursprungliga källkod oförändrad under baslinjekontrollen.
- Använda en separat PostgreSQL-container för kursprojektet.
- Inte ändra beroendeversionerna innan behovet har analyserats.
- Behandla Windows-lösningen för `python3` som tillfällig.

## Återstående arbete

- Kontrollera Git-status och granska eventuella lokala filer.
- Fortsätta enligt Huvudplan V2.
- Bygga och verifiera utvecklingsriggen.
- Dokumentera varje avslutat arbetspass.
- Fylla i kursens dokumentationsmall endast när respektive arbete är slutfört och verifierat.

## Dokumentationsmall

Kodbasen och valet av repository är verifierade. Övriga svar fylls i först när motsvarande arbete är färdigt och har kontrollerbar evidens.
