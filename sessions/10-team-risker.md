# Sessionslogg – Team, risker och lärdomar

**Datum:** 2026-11-09

**Gren:** `fu-ia-kursprojekt`

**Plan:** Huvudplan V3 – Etapp 12

**Kursmall:** Sida 9

## Avgränsning och evidens

Underlaget beskriver hur riggen **skulle** införas i ett team med fem
utvecklare. Den har inte använts av ett verkligt fempersonsteam.

Bedömningen bygger på:

- kodstandard och arbetssätt i `docs/standard.md`, de tre skillsen i
  `.agents/skills/` och commit `e6fe930`,
- subagentrollerna i `.codex/agents/`, commit `3ad3785` och Luna-ändringen
  för `utforskare` i commit `eff40df`,
- fem hooks i `.codex/hooks.json` och commit `0a22e67`,
- behörighetsreglerna i `.codex/rules/behorigheter.rules` samt commits
  `4fc6eff`, `5005271` och `0668ca8`,
- verifierade erfarenheter och begränsningar i `sessions/03-kodstandard.md`,
  `sessions/06-hooks.md`, `sessions/07-sidindelning.md`,
  `sessions/08-modernisering.md` och `sessions/09-matningar.md`.

## Införande i ett team med fem utvecklare

### Första steget

Kör en tidsbegränsad pilot på en liten, avgränsad ändring i samma repository.
Alla fem får samma `docs/standard.md`, skills och agentroller, men två
utvecklare ansvarar för piloten medan övriga granskar resultat och friktion.
Baslinjen ska omfatta befintliga tester, lint, typkontroll och formatkontroll
samt en gemensam genomgång av vilka åtgärder som kräver godkännande.

Detta återanvänder det arbetssätt som verifierades för sidindelningen:
krav och ADR, TDD, begränsad implementation, automatiska kontroller och en
läsande granskare. Commits `08d78b9`, `0fce6dd` och dokumentationen i
`sessions/07-sidindelning.md` är konkret evidens.

### Vad vi väntar med och varför

- Obligatorisk användning för alla ändringar väntar tills hooks har verifierats
  på fler än de hittills observerade fallen. Testskyddet är mönsterbaserat och
  Stop-hooken är inte praktiskt verifierad efter relevanta kodändringar.
- Automatisk commit eller publicering väntar. Nuvarande verifierade regler kräver godkännande
  för git commit och förbjuder git push.
- Bredare legacy- och databasmigrering väntar. Den reversibla planen i
  `docs/modernisering-prisberakning.md` är ett framtida förslag och har inte
  körts.
- Modellval generaliseras inte från den enda Luna/Terra/Sol-jämförelsen.
  Den omfattade en liten, läsande endpointkartläggning.

### Ansvar och granskning

En utsedd **riggansvarig** förvaltar skills, agentinstruktioner, hooks och
behörighetsregler under piloten. Rollen bör rotera mellan teammedlemmarna för
att undvika personberoende.

Varje ändring av riggen görs i en separat pull request med:

1. motiv och avgränsning,
2. exempel på tillåtet och nekat beteende,
3. verifiering av att befintliga skydd fortfarande fungerar,
4. granskning av minst en utvecklare som inte skrev ändringen.

Ändringar av säkerhetsregler eller publiceringsbehörigheter kräver dessutom
granskning av repositoryägaren. En agentgranskning kan ge underlag men ersätter
inte mänskligt godkännande.

### Vad som kan återanvändas vid modell- eller verktygsbyte

Följande är i huvudsak verktygsoberoende och kan återanvändas:

- `docs/standard.md`, krav, ADR:er och API-kontrakt,
- TDD-, planerings- och granskningsstegen i skillsen,
- rollernas ansvar för utforskning, arkitektur, test och granskning,
- testerna, kvalitetskommandona och principen om mänsklig granskning,
- sessionsloggarnas evidensprincip och uppdelningen mellan uppmätt, beräknat
  och saknat.

`.codex/hooks.json`, TypeScript-hookarnas eventformat,
`.codex/rules/behorigheter.rules` och modellnamnen är Codex-specifika. Vid
verktygsbyte behöver de översättas till det nya verktygets hook-, policy- och
modellformat och verifieras på nytt.

## Exakt fem risker

| Risk                                                         | Vad kan hända?                                                                                                                                                                                    | Hur upptäcks problemet?                                                                                                                 | Vad gör riggen redan?                                                                                                                                                                                                                                         | Vad behöver förbättras?                                                                                                                                                                       |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Mönsterbaserat testskydd kan kringgås                     | Ett test kan tas bort, skrivas om eller inaktiveras med en syntax eller ett verktyg som regexreglerna inte känner igen.                                                                           | Pull request-diff, ändrat testantal, oväntad täckningsminskning eller ett negativt hooktest.                                            | `PreToolUse` nekar identifierad radering, `.skip`/`.only` och vissa ändringar; TDD-skillen förbjuder försvagade tester. Ett simulerat borttagningsförsök nekades.                                                                                             | Kontrollera den faktiska diffen eller syntaxträdet, lägg till regressionstester för förbikopplingsfall och verifiera samma regel i CI.                                                        |
| 2. Anropad kontroll kan misstolkas som godkänd               | Ett misslyckat test-, lint- eller typkontrollkommando kan finnas i loggen och ändå uppfattas som grönt. Stop-hooken kan då ge falsk trygghet.                                                     | Jämför loggposten med exitstatus, komplett CI-resultat och commit-SHA. Avvikelsen syns när “anropat” saknar verifierat utfall.          | `PostToolUse` loggar tid och kommandonamn; Stop-hooken letar efter kontroller efter senaste kodändring. Sessionsloggen säger uttryckligen att detta inte bevisar framgång.                                                                                    | Logga exitstatus och kodrevision utan känslig utdata, knyt resultatet till aktuell commit och låt skyddad CI vara den slutliga spärren.                                                       |
| 3. Sessionsminnet kan bli ofullständigt eller inaktuellt     | Senare beslut i en lång logg kan saknas när nästa session startar, vilket kan leda till att gammal status eller gamla begränsningar används.                                                      | Jämför startkontexten med senaste numrerade sessionslogg, Git-status och aktuella konfigurationer.                                      | `SessionStart` läser senaste numrerade logg och automatisk status; `SessionEnd` sparar gren, commit och senaste logg.                                                                                                                                         | Använd ett kort strukturerat överlämningsformat med status, beslut, risker och öppna punkter i stället för att förlita sig på de första 3 000 tecknen. Validera att commit och logg hör ihop. |
| 4. Lokala behörigheter ger inte samma skydd för alla verktyg | En utvecklare eller ett annat AI-verktyg kan sakna Codex-reglerna och då kunna publicera, radera eller stagea utan samma kontroll. Reglerna skyddar inte heller uttryckligen alla känsliga filer. | Installationskontroll på varje arbetsstation, policytest i CI och granskning av försök mot skyddade operationer eller hemligheter.      | Reglerna tillåter läsande Git-kommandon, kräver godkännande för git commit och förbjuder git push och git reset --hard. PreToolUse blockerar vissa identifierade försök att ta bort tester. Kodstandarden förbjuder hemligheter och personuppgifter i loggar. | Flytta kritiska regler till repository- och CI-nivå, lägg till secret scanning och dokumentera motsvarande policy för varje godkänt verktyg.                                                  |
| 5. Agentresultat kan övertolkas                              | Ett korrekt resultat i ett litet fall kan leda till att samma modell eller roll används för komplex arkitektur, säkerhet eller databasändringar utan tillräcklig evidens.                         | Mänsklig granskning, verifierbara filhänvisningar, tester och jämförelse mot krav. Följ upp kvalitet per uppgiftstyp, inte bara tokens. | Roller har avgränsade instruktioner, läsande roller får inte ändra filer och modelljämförelsen redovisar sina begränsningar. `granskare` skiljer verifierade fel från misstankar.                                                                             | Skapa små evalfall för varje roll, definiera eskaleringskriterier och kräva starkare modell samt extra mänsklig granskning för hög risk.                                                      |

Risk 1–3 är **dokumenterade begränsningar i den nuvarande implementationen**.
Risk 4–5 är **konkreta införanderisker** härledda från de lokala reglerna och
den begränsade modelljämförelsen. Förbättringarna i sista kolumnen är
**framtida förslag** och är inte implementerade.

## Prioritering vid ytterligare en arbetsvecka

Första prioritet skulle vara en **resultatmedveten verifieringskedja i CI**.
Den ska registrera exitstatus och commit-SHA för test, lint, typkontroll och
formatkontroll, köra regressionstester för hooks och göra godkända resultat
till krav före merge.

Prioriteringen grundas på två verifierade erfarenheter:

1. `PostToolUse` visar endast att ett kommando anropades, inte att det lyckades.
2. Stop-hookens beteende efter relevanta kodändringar är fortfarande inte
   praktiskt verifierat.

För ett team med fem utvecklare är en gemensam serverkontroll mer tillförlitlig
än fem lokala installationer. Arbetet bör börja med karakteriseringstester för
nuvarande hooks, därefter kompletterad resultatmetadata och sist en pilot med
skyddad merge. Secret scanning och det strukturerade sessionsöverlämnandet är
nästa prioriteringar om veckan räcker.

Detta är ett framtida förslag. Ingen CI-policy, hook eller behörighetsregel har
ändrats i etapp 12.

## Täckning av kursmallens sida 9

- **Införande i ett team:** första steg, uppskjutna delar, ansvar,
  granskningsflöde och återanvändning vid modell- eller verktygsbyte är
  dokumenterade.
- **Risker:** exakt fem risker beskriver händelse, upptäckt, befintligt skydd
  och kvarstående förbättring.
- **Ytterligare en vecka:** en första prioritet och motivering från verifierad
  projekterfarenhet är dokumenterade.
- **Statusgränser:** implementerat och verifierat, dokumenterade begränsningar
  och framtida förslag hålls isär.

## Slutsats

Riggen har verifierade byggdelar för standarder, skills, roller, hooks,
behörigheter och spårbar dokumentation. Ett införande i ett fempersonsteam
kräver fortfarande pilot, gemensam CI-verifiering och mänskligt ägarskap.
Dokumentet beskriver ett införandeförslag och gör inget påstående om verklig
teamanvändning.
