# Sessionslogg – Mätningar och underlag för Väl godkänt

**Datum:** 2026-11-08

**Gren:** `fu-ia-kursprojekt`

**Plan:** Huvudplan V3 – Etapp 11

## Evidensprincip

Värden märks som **uppmätta** endast när de finns i sessionsloggar, verifierade
Codex-usageposter eller annan beständig evidens. **Beräknade** värden visar
formel och underlag. Övriga uppgifter markeras som **saknas**.

Kontextfönstrets storlek och användningsprocent används inte som förbrukade
tokens. Git-commitars tidsstämplar används inte som aktiv arbetstid.
`sessions/verktygskontroller.jsonl` visar endast att kommandon anropades och
saknar tokenmängd, körtid, exitstatus och testresultat.

## 1. Metod för historisk tokenanvändning

Den installerade Codex-miljöns lokala rolloutfiler innehåller strukturerade
`token_usage_record`-poster. Kontrollen läste endast projektanknutna rubriker,
tidsmetadata, modellmetadata, `turn_id`, `root_turn_id` och usagefält. Inga råa
meddelanden eller känsliga uppgifter kopierades till projektet.

Följande regler förhindrar dubbelräkning:

1. Varje `turn_id` räknas en gång, även när samma turn återges i flera rollouts.
2. `turn_token_usage` är kumulativ inom en turn. Endast posten med högst
   `total_tokens` används; enskilda responseposters `usage` summeras inte.
3. `cached_input_tokens` ingår redan i `input_tokens` och adderas inte till
   totalen igen.
4. `reasoning_output_tokens` är en delmängd av `output_tokens` och adderas inte
   igen.
5. En subagent med ett eget `turn_id` räknas separat när dess `root_turn_id`
   kan kopplas till arbetets moderturn. Samma child-turn räknas aldrig både som
   child och som en del av en konstruerad modellsumma.

För varje turn gäller: `total_tokens = input_tokens + output_tokens`.

## 2. Turnkarta

Tidsstämplarna är registrerade turnstarter i Codex metadata. Innehållet har
klassificerats genom uppgiftens projektrubrik och uttryckliga arbetssteg. Korta
turn-id-prefix anges för spårbarhet utan att råa loggar återges.

### Etapp 8 – statusfiltrering och sidindelning

| Start | Turn | Kopplat arbete | Modell/effort |
|---|---|---|---|
| 2026-11-05 19:00:36 | `01a1ad15-99ac` | 8A, statusfilter | Sol/high |
| 2026-11-05 19:46:45 | `01a1ad3f-da68` | 8A, fortsatt statusfilter | Sol/high |
| 2026-11-05 20:18:34 | `01a1ad5c-f888` | 8B, sidindelning TDD | Sol/high |
| 2026-11-06 19:47:09 | `01a1b266-958f` | 8B, RED | Sol/high |
| 2026-11-06 19:51:05 | `01a1b26a-2e2d` | 8B, GREEN | Sol/high |
| 2026-11-06 20:03:26 | `01a1b275-7c5a` | 8B, RED | Sol/high |
| 2026-11-06 20:12:25 | `01a1b27d-b697` | 8B, GREEN | Sol/high |
| 2026-11-06 21:06:36 | `01a1b2af-50b6` | 8B, RED | Sol/high |
| 2026-11-06 21:33:48 | `01a1b2c8-35c0` | 8B, GREEN | Sol/high |
| 2026-11-06 21:49:57 | `01a1b2d6-ff3a` | 8B, GREEN | Sol/high |
| 2026-11-06 21:52:20 | `01a1b2d9-3158` | 8B, RED | Sol/high |
| 2026-11-06 22:01:31 | `01a1b2e1-985d` | 8B, GREEN | Sol/high |
| 2026-11-06 22:06:30 | `01a1b2e6-269d` | 8B, RED | Sol/high |
| 2026-11-06 22:43:36 | `01a1b308-1ee4` | 8B, slutförande och verifiering | Sol/high |
| 2026-11-06 22:44:55 | `01a1b309-4e1c` | 8C–8E, läsande granskarsubagent | Sol/medium |

Den sista turnen har eget `turn_id` och `root_turn_id` som pekar på
moderuppgiften. Den är därför inkluderad en gång som subagentarbete.

### Etapp 10 – modernisering

| Start | Turn | Kopplat arbete | Modell/effort |
|---|---|---|---|
| 2026-11-07 23:43:22 | `01a1b865-32d5` | Karakterisering och refaktoreringsplan | Sol/high |
| 2026-11-07 23:43:41 | `01a1b865-7cbe` | Subagentanalys för samma plan | Sol/medium |
| 2026-11-08 09:34:37 | `01a1ba82-7fe7` | Slutgranskning av karakterisering och plan | Sol/high |
| 2026-11-08 09:51:50 | `01a1ba92-45a8` | Tre README-rättelser efter granskning | Sol/high |
| 2026-11-08 11:24:06 | `01a1bae6-babf` | Refaktorering 1 | Sol/high |
| 2026-11-08 11:39:39 | `01a1baf4-f899` | Refaktorering 2 och 3 | Sol/high |
| 2026-11-08 11:39:53 | `01a1baf5-3244` | Subagentarbete för refaktorering 2 och 3 | Sol/medium |
| 2026-11-08 11:48:13 | `01a1bafc-d3f2` | Slutgranskning | Sol/high |
| 2026-11-08 17:12:06 | `01a1bc25-557c` | Avslutande rättelser efter granskning | Sol/high |

De två child-turnerna har egna usageposter och räknas en gång vardera.
Uppgifter som nämner en subagent men saknar en separat verifierbar child-post
har inte tilldelats någon påhittad extra tokenmängd.

### Utelämnade och osäkra turns

- En delegerad endpointkartläggning 2026-11-03 tillhör etapp 6 och har
  utelämnats från etapp 8 trots att sidindelning nämns i senare kontext.
- Etapp 11-turnen 2026-11-08 17:40:09 har utelämnats från etapp 10. Den
  refererar till etapp 8 och 10 som mätunderlag men utför inte deras arbete.
- Luna-subagenten 2026-11-08 18:33:10 tillhör den senare modellkontrollen och
  ingår inte i utvecklingsarbetet.
- Reproducerade turn-contextposter kan ha senare replaytidsstämplar. Den
  tidigaste verifierbara originalstarten per unikt `turn_id` används.

## 3. Tokens per arbete

Följande är **uppmätta usagevärden** från sista kumulativa post per unik turn,
summerade enligt arbetsindelningen ovan.

| Arbete | Turns | Input | Därav cachad input | Output | Totalt |
|---|---:|---:|---:|---:|---:|
| 8A, statusfilter | 2 | 388 574 | 377 472 | 8 996 | **397 570** |
| 8B, sidindelning med TDD | 12 | 7 313 164 | 7 183 744 | 58 965 | **7 372 129** |
| 8C–8E, hooks och granskning | 1 | 605 717 | 487 040 | 3 207 | **608 924** |
| 10, karakterisering och planering inklusive child-turn | 2 | 1 073 975 | 912 512 | 5 484 | **1 079 459** |
| 10, slutgranskning av underlag och README-rättelser | 2 | 1 742 145 | 1 565 952 | 6 188 | **1 748 333** |
| 10, refaktorering 1 | 1 | 4 426 981 | 4 414 976 | 10 475 | **4 437 456** |
| 10, refaktorering 2–3 inklusive child-turn | 2 | 1 730 148 | 1 570 688 | 8 732 | **1 738 880** |
| 10, slutgranskning och avslutande rättelser | 2 | 3 659 637 | 3 386 112 | 27 602 | **3 687 239** |

Tokenmängderna visar resursanvändning. De bevisar inte i sig kvalitet,
produktivitet eller ekonomisk besparing.

## 4. Modelljämförelse Luna/Terra/Sol

Samma avgränsade, läsande endpointkartläggning genomfördes en gång per modell.
Ingen jämförelse har körts om för denna logg.

| Modell | Effort | Input | Cachad input | Output | Därav reasoning | Totalt |
|---|---|---:|---:|---:|---:|---:|
| `gpt-5.6-luna` | low | 35 861 | 0 | 825 | 101 | **36 686** |
| `gpt-5.6-terra` | low | 37 153 | 7 936 | 549 | 0 | **37 702** |
| `gpt-5.6-sol` | low | 38 168 | 0 | 830 | 66 | **38 998** |

Registrerad turnstart till sista usagepost ger de **beräknade
väggklocksintervallen** 15,847 s för Luna, 14,335 s för Terra och 16,062 s för
Sol. De är inte uppmätt aktiv arbetstid eller ren modell-latens och redovisas
därför separat.

Jämförelsen visar likvärdigt korrekt endpointunderlag i de tre rapporterna.
Urvalet är ett enda litet läsfall och räcker inte för en generell
kvalitetsrangordning.

## 5. Modellkonfiguration

Tidigare utvecklingsarbete i etapp 8 och 10 genomfördes med den äldre
Sol-konfigurationen, vilket verifieras av turnernas modellmetadata.

| Subagent | Nuvarande modell | Effort | Evidens |
|---|---|---|---|
| `utforskare` | `gpt-5.6-luna` | `low` | Commit `eff40df` och praktiskt startad subagent |
| `arkitekt` | `gpt-5.6-sol` | `medium` | `.codex/agents/arkitekt.toml` |
| `testare` | `gpt-5.6-sol` | `medium` | `.codex/agents/testare.toml` |
| `granskare` | `gpt-5.6-sol` | `medium` | `.codex/agents/granskare.toml` |

Luna är rimligt för `utforskare` eftersom rollen gör korta, avgränsade och
läsande kartläggningar. Den begränsade jämförelsen stödjer att rollen kan ge
korrekt underlag, men bevisar inte en generell kostnads- eller tidsbesparing.

## 6. Tid per arbete

Följande är **uppmätta testkörningstider**, inte total utvecklingstid:

| Moment | Resultat | Uppmätt testtid | Källa |
|---|---|---:|---|
| Ursprunglig API-baslinje | 16 av 16 Jest-tester godkända | **3,327 s** | `sessions/01-start.md` |
| Python-karakterisering | 6 av 6 tester godkända | **0,58 s** | `sessions/08-modernisering.md` |
| TypeScript-bryggans karakterisering | 2 av 2 tester godkända | **1,119 s** | `sessions/08-modernisering.md` |

Sidindelningen har 26 av 26 riktade tester och 35 av 35 i hela Jest-sviten,
men ingen beständig körtid. Total aktiv analys-, utvecklings-, gransknings- och
dokumentationstid saknas för samtliga arbeten.

## 7. API-prisekvivalent och faktisk kostnad

Prisunderlaget som verifierades 2026-11-08 för standard-API:t är för
`gpt-5.6-sol`: USD 4 per miljon icke-cachade inputtokens, USD 0,40 per miljon
cachade inputtokens och USD 20 per miljon outputtokens. Källa:
[OpenAI API Pricing](https://developers.openai.com/api/docs/pricing?latest-pricing=standard).

Beräkningen är:

`(input - cached) × 4/1 000 000 + cached × 0,40/1 000 000 + output × 20/1 000 000`

| Arbete | Beräknad API-prisekvivalent |
|---|---:|
| 8A, statusfilter | **USD 0,375317** |
| 8B, sidindelning med TDD | **USD 4,570478** |
| 8C–8E, hooks och granskning | **USD 0,733664** |
| 10, karakterisering och planering | **USD 1,120537** |
| 10, granskning och README-rättelser | **USD 1,454913** |
| 10, refaktorering 1 | **USD 2,023510** |
| 10, refaktorering 2–3 | **USD 1,440755** |
| 10, slutgranskning och rättelser | **USD 3,000585** |
| Sol i modelljämförelsen | **USD 0,169272** |

Dessa är **beräknade standard-API-ekvivalenter**, inte faktisk fakturering.
Abonnemang, tjänstenivå och faktureringsunderlag saknas. Tillförlitligt
prisunderlag saknas för `gpt-5.6-luna` och `gpt-5.6-terra`; deras kostnader
beräknas därför inte.

## 8. Upptäckta fel och fynd

Kategorierna hålls isär för att samma problem inte ska räknas flera gånger.

### Avsiktliga TDD-RED

Tre dokumenterade RED-observationer drev sidparameterns implementation:

1. `page=0` gav negativ `OFFSET`, databasfel och test-timeout.
2. `page=01` gav HTTP 200 när testet förväntade HTTP 400.
3. `page=1&page=2` gav HTTP 200 när testet förväntade HTTP 400.

De är avsiktliga RED-steg och räknas inte som granskningsfynd.

### Kvalitetskontroller och hooks

- **Lint:** ett grundfynd, felaktiga namn; `STATUS` och `SCRIPT` är två exempel
  på samma regelbrott.
- **Typkontroll:** noll dokumenterade typfel.
- **Format/diffkontroll:** två grundfynd, avslutande blanksteg och ett gemensamt
  CRLF-problem som gav 15 varningar.
- **Hooks:** en verifierad preventiv händelse där `PreToolUse` nekade ett
  simulerat försök att ta bort tester. Det är inte ett produktionsfel.

### Kodgranskning

Sju separata verifierade fynd dokumenterades och rättades:

1. API-översikten saknade `page`, `status` och HTTP 400.
2. README beskrev legacykoden som odokumenterad och utan tester.
3. README hade ett föråldrat fast testantal.
4. README beskrev `tests/` som enbart API-tester.
5. Karakteriseringstestet saknade kontroll av separata SQL-parametrar för
   orderradsfrågan.
6. Nattjobbets datum interpolerades i SQL.
7. Moderniseringsdokumentet beskrev redan parameteriserade frågor som
   stränginterpolerade.

Sex dokumenterade legacy-risker i moderniseringsplanen är kvarstående risker,
inte nya kontrollfynd, och ingår inte i antalet sju.

## 9. Två motiverade besparingsbeslut

### A. Riktade karakteriseringstester med fakes och mockar

De berörda Python- och TypeScript-testerna kördes i stället för hela API-sviten,
som återställer testdatabasen. De uppmätta tiderna var 0,58 s och 1,119 s.
Beslutet undvek irrelevant databasåterställning och containerkontakt.

Kvalitetsavvägningen är att isolerade tester inte verifierar verklig
databasanslutning eller hela API-integrationen. Ingen total tids- eller
kostnadsbesparing kan kvantifieras eftersom en jämförbar full körning inte
gjordes.

### B. Luna low för avgränsad läsande utforskning

`utforskare` flyttades i commit `eff40df` till Luna low och startades praktiskt
med den konfigurationen. Endpointjämförelsen gav korrekt underlag och en
uppmätt tokenmängd på 36 686.

Kvalitetsavvägningen är att evidensen omfattar ett enda litet läsfall. Luna kan
inte därifrån antas vara rätt val för arkitektur, testanalys eller
säkerhetsgranskning. Prisunderlag för Luna saknas, så ingen ekonomisk besparing
påstås.

## 10. Kursmallens sida 6 och 8

### Sida 6 – Orkestrering och modellval

**Modell per subagent, och varför:**

- `utforskare`: `gpt-5.6-luna`, low. Rollen gör korta, avgränsade och läsande
  kartläggningar. Den praktiska endpointkontrollen gav korrekt underlag, men är
  för liten för en generell kvalitetsrangordning.
- `arkitekt`: `gpt-5.6-sol`, medium. Rollen behöver väga struktur, alternativ
  och risker mot varandra.
- `testare`: `gpt-5.6-sol`, medium. Rollen behöver sammanföra krav, felvägar
  och testtäckning.
- `granskare`: `gpt-5.6-sol`, medium. Rollen behöver nyanserad kontroll av
  säkerhet, kodstandard och kravspårning.

**Kostnad med modellvalet och med en större modell:**

- De verifierade Sol-turnernas beräknade standard-API-ekvivalenter finns per
  arbete i avsnitt 7. De är inte faktisk fakturering.
- Som en kontrollerad prisreferens kostar en miljon icke-cachade inputtokens
  plus en miljon outputtokens **USD 24** med Sol-priserna i avsnitt 7.
- Den tidigare verifierade standard-API-referensen för den större modellen
  `gpt-6-astra` är USD 10 per miljon inputtokens och USD 50 per miljon
  outputtokens. Samma konstruerade tokenmängd kostar då **USD 60**, eller 2,5
  gånger Sol-referensen. Källan är samma officiella prislista som i avsnitt 7.
- Detta är en prisjämförelse vid exakt lika tokenmängd, inte en uppmätt kostnad
  för att utföra projektet med Astra. Den visar inte hur kvalitet eller
  tokenbehov skulle förändras.
- En fullständig kostnadsjämförelse för det nuvarande modellvalet saknas,
  eftersom tillförlitligt prisunderlag för Luna saknas. Faktisk fakturering,
  abonnemangsform och tjänstenivå saknas också.

### Sida 8 – Mätningar

**Tokens per arbete:** fylls med de uppmätta, deduplicerade värdena i avsnitt
3. Modelljämförelsens separat uppmätta värden är Luna 36 686, Terra 37 702 och
Sol 38 998 tokens enligt avsnitt 4.

**Tid per arbete:** fylls med de tre uppmätta testtiderna i avsnitt 6: 3,327 s,
0,58 s och 1,119 s. De beräknade väggklocksintervallen för
modelljämförelsen redovisas separat. Total aktiv arbetstid och körtid för
sidindelningssviten och de enskilda refaktoreringsstegen saknas.

**Kostnad per arbete:** fylls med Sol-turnernas beräknade
standard-API-ekvivalenter i avsnitt 7. De ska märkas som beräknade och får inte
beskrivas som faktisk fakturering. Luna- och Terra-kostnader saknas eftersom
tillförlitligt prisunderlag saknas.

**Vad kontrollerna fångade – antal och exempel:**

- tre avsiktliga TDD-RED-observationer, exempelvis `page=0` som gav negativ
  `OFFSET`; de redovisas separat från fel som hittades vid granskning,
- ett lintgrundfynd med `STATUS` och `SCRIPT` som konkreta exempel,
- noll dokumenterade typfel,
- två format/diff-grundfynd: avslutande blanksteg och ett gemensamt
  CRLF-problem,
- en preventiv hookhändelse där `PreToolUse` nekade ett simulerat försök att
  ta bort tester,
- sju verifierade kodgranskningsfynd, exempelvis saknade queryparametrar i
  API-översikten och ett datum som interpolerades i SQL.

De sex kvarstående legacy-riskerna är riskinventering, inte ytterligare
kontrollfynd, och räknas därför inte in i de sju.

**Två besparingar, och vad de kostar i kvalitet:**

1. Riktade karakteriseringstester med fakes och mockar undvek irrelevant
   databasåterställning och containerkontakt. Kvalitetskostnaden är att verklig
   databasanslutning och hela API-integrationen inte verifierades. Besparingen
   kan inte kvantifieras utan en jämförbar full körning.
2. Luna low för avgränsad läsande utforskning gav korrekt underlag i det
   verifierade endpointfallet. Kvalitetskostnaden är svagare evidens för breda,
   komplexa eller säkerhetskritiska uppgifter. Ingen ekonomisk besparing
   påstås eftersom Luna-pris saknas och tokenantal ensamt inte bevisar en
   besparing.

### Uppgifter som fortfarande saknas

- Total aktiv arbetstid per arbete.
- Faktisk fakturerad kostnad, abonnemangsform och tjänstenivå.
- Tillförlitliga Luna- och Terra-priser och därmed en fullständig
  kostnadsjämförelse för det nuvarande modellvalet.
- Körtid för sidindelningssviten och enskilda refaktoreringssteg.
- Kodtäckning, last- och prestandamätningar.

## Slutsats

Etapp 8, etapp 10 och modelljämförelsen har nu spårbara, deduplicerade
tokenvärden. Testtider och granskningsfynd är separerade från beräknade
väggklocksintervall och API-prisekvivalenter. Uppgifter som saknar evidens har
inte ersatts med uppskattningar.
