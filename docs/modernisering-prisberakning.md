# Modernisering av prisberäkningen

## Syfte och avgränsning

Detta dokument kartlägger den befintliga prisberäkningen, låser observerat
beteende med karakteriseringstester och planerar tre små framtida
refaktoreringar. Ingen produktionskod eller databas har ändrats i denna etapp.

## Codemap

| Modul | Ansvar | Direkta beroenden | Utdata och sidoeffekter |
|---|---|---|---|
| `src/legacy/price_calc.py` | Hämtar en order, summerar rader, tillämpar eventuell rabatt, beräknar netto, moms och total. | `psycopg`, `Decimal`, `DATABASE_URL`, tabellerna `orders`, `order_lines` och `discounts`. | Returnerar ett `Pris`-objekt, skriver en lokal loggrad och skriver JSON vid CLI-körning. Databasanslutningen öppnas vid import. |
| `src/pricing/legacyPrice.ts` | Brygga mellan TypeScript-API:t och Python-skriptet. | `child_process.execFile`, `python3`, `price_calc.py`, `Result`. | Tolkar stdout som JSON. Alla processfel översätts till `not_found`. |
| `jobs/nightly_report.py` | Summerar dagens betalda order och skriver en textrad för cron. | Importerar `calc_price` och den globala anslutningen från `price_calc.py`; frågar `orders`. | Ett anrop till `calc_price` per order och en sammanfattning på stdout. |

### Dataflöden

```text
GET /orders/:id/price
  -> requireCustomer + getOrder (kundisolering)
  -> calcPrice(id)
  -> python3 price_calc.py <id>
  -> PostgreSQL: order -> orderrader -> eventuell rabatt
  -> Decimal-beräkning -> lokal logg -> JSON på stdout
  -> Result<Price> -> HTTP-svar

cron [datum]
  -> nightly_report.py
  -> PostgreSQL: betalda order-id för datumet
  -> calc_price(id) en gång per order
  -> summering av totaler -> textrad på stdout
```

API-routen kontrollerar ägarskap innan Python-processen startas. Nattjobbet går
direkt mot databasen och har ingen kundkontext.

## Observerade beräknings- och avrundningsregler

1. Varje orderrad beräknas som heltalskvantitet multiplicerad med databasens
   `NUMERIC`-pris och summeras med `Decimal`.
2. Om ordern har en rabattkod och koden finns används endast `percent`.
   `valid_from` och `valid_to` läses inte och påverkar därför inte resultatet.
3. En okänd rabattkod ignoreras utan fel.
4. Netto kapas till två decimaler genom `Decimal(int(x * 100)) / 100`. Detta är
   avkapning mot noll, inte normal ekonomisk avrundning.
5. Momsen är fast 25 procent och beräknas på det redan kapade nettot. Momsen
   kapas sedan separat med samma regel.
6. Totalen är exakt `net + vat` efter de två avkapningarna.
7. CLI-svaret använder `str(Decimal)`. Antalet visade decimaler är därför inte
   alltid två, exempelvis `2.5` och `12.5`.
8. En saknad order ger `None`; CLI-läget skriver `{"error": "finns inte"}` och
   avslutas med status 1.
9. Fel vid skrivning till `price_calc.log` ignoreras.

Reglerna ovan beskriver faktiskt beteende. Avvikande avkapning, rabattens
giltighetsdatum och varierande antal decimaler ska inte ändras utan ett separat
beslut.

## Karakteriseringstester

Testerna använder mockade databasanslutningar och processanrop. De ändrar inte
databasen och skapar ingen prislogg.

| Test | Verifierat originalbeteende | Resultat |
|---|---|---|
| `test_kapa_truncates_toward_zero` | `1.239 -> 1.23` och `-1.239 -> -1.23`. | Godkänt |
| `test_calc_price_sums_lines_and_truncates_vat` | Netto `10.99`, kapad moms `2.74`, total `13.73`. | Godkänt |
| `test_calc_price_applies_discount_before_truncation` | 15 procent dras före kapning; `19.99` ger `16.99 + 4.24 = 21.23`. | Godkänt |
| `test_calc_price_ignores_unknown_discount_code` | Okänd kod lämnar summan oförändrad och ger inget fel. | Godkänt |
| `test_calc_price_returns_none_when_order_is_missing` | Saknad order ger `None` och inga följdfrågor. | Godkänt |
| `test_nightly_report_sums_paid_orders_and_formats_output` | Två totaler summeras och skrivs i det befintliga svenska textformatet. | Godkänt |
| `returnerar Python-processens JSON som ett lyckat prisresultat` | Bryggan använder `python3`, skickar order-id och returnerar JSON-strängarna i `ok`. | Godkänt |
| `översätter alla processfel till not_found` | Alla fel från Python-processen blir samma `not_found`-fel. | Godkänt |

Faktiska riktade körningar:

- `.venv\Scripts\python.exe -m pytest tests\test_price_calc.py -q`:
  6 av 6 godkända på 0,58 sekunder.
- `npm test -- tests/legacyPrice.test.ts`: 1 testsvit och 2 av 2 tester
  godkända på 1,119 sekunder.
- `npm run typecheck`, `npm run lint`, `npm run format:check`, Python-kompilering
  och `git diff --check`: godkända.

Hela API-testsviten kördes inte om. Den återställer `butik_test`, medan denna
etapp uttryckligen förbjuder databasändringar. Senaste tidigare baslinje var 35
av 35 godkända tester, men den räknas inte som en ny körning i denna etapp.

## Verifierade tekniska risker

- SQL byggs med stränginterpolering i båda Python-filerna.
- `price_calc.py` öppnar en global databasanslutning redan vid import.
- Nattjobbet gör en prisberäkning med flera frågor per order, ett N+1-flöde.
- Rabattens giltighetsdatum ignoreras.
- Ett brett `except` döljer alla loggfel.
- TypeScript-bryggan skiljer inte mellan saknad order, saknad Python, databasfel
  eller annat processfel.
- Ogiltig JSON från en process som avslutas utan fel saknar kontrollerad
  felhantering.

Riskerna dokumenteras men ändras inte i karakteriseringsetappen.

## Planerade refaktoreringar

Varje steg ska börja och sluta med gröna karakteriseringstester och få en egen
commit. Ingen refaktorering genomförs innan planen har godkänts.

### 1. Extrahera ren beräkningsfunktion

- **Filer:** `src/legacy/price_calc.py`, `tests/test_price_calc.py`.
- **Ändring:** separera summering, rabatt, netto, moms och total från databas-
  och loggkod. Funktionen ska ta `Decimal`-värden och rabattprocent som indata.
- **Måste bevaras:** avkapning mot noll, 25 procents moms, beräkningsordningen
  och `Pris`-värdena.
- **Kontroll:** Python-karakteriseringstester samt nya direkta tester av den
  rena funktionen; ingen databas behövs.
- **Föreslagen commit:** `refactor: extrahera ren prisberakning`.

### 2. Isolera och parameterisera databasåtkomsten

- **Filer:** `src/legacy/price_calc.py`, `tests/test_price_calc.py`.
- **Ändring:** flytta läsning av order, rader och rabatt till små
  repositoryfunktioner, skicka värden som queryparametrar och injicera
  anslutning eller cursor i stället för att låta beräkningen använda globalen.
- **Måste bevaras:** frågeordningens funktionella resultat, `None` för saknad
  order och att okänd rabattkod ignoreras.
- **Kontroll:** fake-cursor verifierar SQL och separata parametrar; riktade
  Python-tester för alla karakteriserade fall.
- **Föreslagen commit:** `refactor: isolera legacy-databasatkomst`.

### 3. Isolera nattjobbets orkestrering

- **Filer:** `jobs/nightly_report.py`, `tests/test_price_calc.py` eller en separat
  nattjobbstestfil endast om testfilen annars blir svåröverskådlig.
- **Ändring:** extrahera en anropbar rapportfunktion och ett litet `main`, med
  explicita beroenden för anslutning och prisfunktion. CLI-formatet behålls.
- **Måste bevaras:** datumargumentets betydelse, statusfiltret `paid`,
  summeringen och exakt utskrift.
- **Kontroll:** befintligt nattjobbstest, test för standarddatum och riktad
  Python-testkörning.
- **Föreslagen commit:** `refactor: isolera nattlig prisrapport`.

En direkt omskrivning till TypeScript, ändrad avrundning och ändrade
felkoder väljs bort i dessa steg eftersom de är separata beteendebeslut.

## Reversibel databasmigreringsplan

De tre refaktoreringarna ovan kräver ingen schemaändring. Följande plan är ett
separat framtida förslag om moderniseringen senare ska lagra versionerade
prisögonblick. Förslaget måste godkännas innan migrationsfiler skapas.

### Expand

1. Ta verifierbar backup och dokumentera radantal för berörda order.
2. Lägg till en ny tabell `order_price_snapshots` med `order_id`, `net`, `vat`,
   `total`, `calculation_version` och `calculated_at`. Belopp lagras som
   `NUMERIC`; inga befintliga tabeller eller kolumner tas bort.
3. Lägg till referens och index utan att göra gamla applikationsversioner
   beroende av den nya tabellen.
4. Driftsätt skuggskrivning bakom feature flag. Den äldre beräkningen förblir
   svarskälla och nya värden jämförs men exponeras inte.

### Backfill och verifiering

1. Fyll tabellen idempotent i små batchar med den karakteriserade äldre motorn.
2. Spara beräkningsversion och jämför netto, moms och total med direkt
   legacy-resultat före varje batchmarkering.
3. Mät antal kandidater, lyckade rader, avvikelser och körtid utan att logga
   kunduppgifter. Stoppa vid avvikelse i belopp eller avkapning.
4. Normalisering till exakt två tecken i API-svar får inte smygas in i
   migreringen; nuvarande `Decimal`-strängar bevaras tills separat beslut.

### Gradvis övergång

1. Läs snapshot när den finns men fall tillbaka till legacyberäkning.
2. Öka läsandelen stegvis och följ felandel, svarstid och beloppsavvikelser.
3. Behåll dubbelberäkning under en beslutad observationsperiod.

### Contract

1. Stoppa backfill och säkerställ full täckning och noll oförklarade
   avvikelser.
2. Gör snapshot till primär läskälla men behåll ursprungliga orderrader och
   rabattkod som revisionsunderlag.
3. Ta bort dual-read och Python-beroendet först i en senare release. Ta inte
   bort gammal kod eller kompatibilitet i samma release som läsväxlingen.

### Rollback

- Före contract: stäng feature flag och läs endast från legacykoden. Den nya
  tabellen kan ligga kvar utan att påverka gamla versioner.
- Under backfill: avbryt batchen; idempotenta nycklar gör omkörning möjlig.
- Efter läsväxling: återställ flaggan och driftsätt senaste legacy-kompatibla
  version. Ursprungliga orderdata har inte tagits bort.
- Tabellen får tas bort först efter separat beslut, backup och avslutad
  rollbackperiod. En nedmigration före användning får endast ta bort den nya
  tabellen.

Ingen migration, backfill, databasfråga eller containerändring har utförts i
denna etapp.
