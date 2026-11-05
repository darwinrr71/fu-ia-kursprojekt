## Plan – sidindelning och statusfilter

### Omfattning

Utöka GET /customers/me/orders med de valfria queryparametrarna page och status.

Funktionen ska:

- filtrera på kund i PostgreSQL;
- filtrera på status före sidindelning;
- använda 10 order per sida när page anges;
- returnera samtliga matchande order när page saknas;
- sortera med created_at DESC, id DESC;
- behålla befintligt JSON-format;
- behålla befintlig autentisering genom requireCustomer;
- inte ändra databasschemat.

### Berörda filer

- tests/customers.test.ts
  - Utökas med karakteriserings- och acceptanstester.
  - Inga befintliga tester tas bort eller hoppas över.
- src/routes/customers.ts
  - Läser och validerar page och status.
  - Returnerar standardiserade 400-svar vid ogiltiga parametrar.
- src/services/customerService.ts
  - Utökar listOrdersForCustomer med filter- och sidalternativ.
  - Utför filtrering, sortering och sidindelning i PostgreSQL.
- docs/api-sidindelning.md
  - Förtydligar sidnumrets format, upprepade parametrar och exakt statusmatchning.
- docs/api.md
  - Synkroniseras med queryparametrarna och möjliga 400-svar.
- docs/plan-sidindelning.md
  - Denna genomförandeplan.

db/schema.sql, db/seed.sql, src/auth.ts och ADR:n ska normalt inte behöva ändras.

### Beslut och motiveringar

#### Status

- status är valfri.
- En statusparameter med tomt värde ger 400.
- Ett okänt men icke-tomt värde är giltigt och ger normalt en tom lista.
- Matchningen är exakt och skiftlägeskänslig.
- Inget värde trimmas eller ändras automatiskt.
- Upprepad status bör avvisas med 400 eftersom kontraktet beskriver ett enda filtervärde.

Motivering: databasen har ingen sluten statusdomän och kontraktet anger endast tom status som fel. Exakt matchning undviker odokumenterad normalisering.

#### Sida

- page är valfri.
- Giltigt format är en enda sträng som matchar ^[1-9]\d*$.
- 0, negativa tal, decimaler, exponentialform, inledande nollor, tomt värde och upprepade parametrar ger 400.
- Talet och beräknad offset måste kunna representeras säkert; annars returneras 400.
- Sida efter sista resultatet ger 200 [].

Motivering: strikt format ger förutsägbar validering. Tomma resultat är förenliga med kravet att giltiga sökningar returnerar 200.

#### Kundidentifiering

- requireCustomer och AuthedRequest.customerId återanvänds utan ändring.
- Kund-id tas aldrig från body eller query.
- En syntaktiskt giltig men obefintlig kund fortsätter att få en tom lista.

Motivering: autentisering ligger utanför funktionens omfattning och befintligt beteende ska bevaras.

#### Svarsformat

- Svaret förblir en JSON-lista.
- Varje element innehåller id, status och createdAt.
- Ingen sidmetadata läggs till.
- status utan page filtrerar hela listan utan tiopostsgräns.
- Utan page och status bevaras nuvarande beteende, förutom kontraktsenlig sekundär sortering vid identiska tidsstämplar.

### Testfall i TDD-ordning

1. Karakterisera standardanropet:
   - 200 och JSON-lista;
   - endast inloggad kunds order;
   - fälten id, status och createdAt;
   - inga nya omslutande fält eller sidmetadata.
2. Verifiera befintlig autentisering:
   - saknad header ger 401;
   - syntaktiskt ogiltig header ger 401;
   - annan kunds order exponeras inte.
3. Statusfiltrering:
   - känd status returnerar endast matchande order;
   - okänd status ger 200 [];
   - skiftlägesvariant normaliseras inte;
   - tom och upprepad status ger 400;
   - status utan sida returnerar alla matchningar.
4. Sidindelning:
   - första sidan innehåller högst 10 order;
   - andra sidan innehåller nästa poster;
   - sida efter sista resultatet ger [];
   - ingen page ger den fullständiga listan.
5. Sidvalidering:
   - avvisa tomt värde, 0, negativt tal, decimal, exponentialform, 01, text och upprepad parameter;
   - avvisa tal vars sida eller offset inte kan representeras säkert;
   - kontrollera standardiserad felstruktur och tydligt felmeddelande.
6. Kombination:
   - status filtreras före LIMIT och OFFSET;
   - sida två räknas inom den filtrerade mängden;
   - kundisolering gäller samtidigt med status och sida.
7. Stabil sortering:
   - senaste createdAt kommer först;
   - lika createdAt sorteras med högsta id först.

Testerna ska skapa tillräckligt många deterministiska order i testet eller dess lokala setup. Den globala seed-filen bör inte utökas om det går att undvika.

### Minsta implementationssteg

1. Lägg till typer för listalternativen, exempelvis page?: number och status?: string.
2. Lägg till små valideringsfunktioner i kundrouten.
3. Avvisa queryvärden som inte är en enda sträng eller bryter mot besluten ovan.
4. Beräkna offset först efter godkänd och säker sidvalidering.
5. Skicka validerade alternativ och req.customerId till tjänstelagret.
6. Utöka listOrdersForCustomer med en fast, parametriserad SQL-fråga.
7. Använd exakt statusmatchning, ORDER BY created_at DESC, id DESC samt villkorad LIMIT och OFFSET.
8. Behåll befintlig projektion och listformat.
9. Uppdatera API-dokumenten med de beslutade preciseringarna.

SQL får inte byggas genom strängsammanslagning eller interpolerade användarvärden.

### Automatiska kontroller

Kör efter implementation:

1. Riktade tester för tests/customers.test.ts.
2. npm test
3. npm run typecheck
4. npm run lint
5. npm run format:check
6. git diff --check

Testdatabasen måste vara tillgänglig. Inget test får tas bort, hoppas över eller försvagas för att kontrollerna ska bli gröna.

### Granskning

Granskningen ska kontrollera att:

- implementationen följer krav, API-kontrakt och ADR;
- status filtreras före sidindelning;
- all SQL är parametriserad;
- kund-id endast kommer från requireCustomer;
- autentiseringen och databasschemat är oförändrade;
- standardanropet fortfarande returnerar samma listformat;
- inga sidmetadata har lagts till;
- alla fel använder projektets standardiserade felstruktur;
- testfallen täcker gränsvärden, kundisolering och stabil sortering;
- ändringarna är begränsade till beslutad omfattning.

### Kriterier för avslut

Arbetet är klart när:

- samtliga acceptanskriterier har verifierande tester;
- befintliga och nya tester passerar;
- typkontroll, lint, formatkontroll och git diff --check passerar;
- API-dokumentationen motsvarar implementationen;
- ingen schema- eller autentiseringsändring har införts;
- kodgranskningen inte har några kvarstående blockerande anmärkningar.

Inga filer har ändrats och inga tester har körts. Jag väntar på godkännande.
