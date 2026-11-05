## API-kontrakt

**Endpoint:** `GET /customers/me/orders`

**Autentisering:** Headern `X-Customer-Id` krävs.

### Parametrar

- `page`: valfritt positivt heltal i decimalform utan inledande nollor, första sidan är 1.
- Om `page` anges får parametern förekomma endast en gång och får inte vara tomt. Exempelvis ger `01`, `0`, `1.0`, `1e0`, ett tomt värde eller en upprepad parameter `400 Bad Request`.
- Såväl sidnumret som den beräknade offseten måste vara säkra heltal.
- `status`: valfritt filter som matchas exakt och skiftlägeskänsligt mot beställningens status, utan automatisk normalisering.
- Om `status` anges får parametern förekomma endast en gång och får inte vara tomt. Ett tomt värde eller en upprepad parameter ger `400 Bad Request`; en okänd men icke-tom status är ett giltigt filter.
- Sidstorlek: 10 beställningar.
- Utan `page` används ingen sidindelning, så befintligt beteende bevaras.
- `status` kan användas med eller utan `page`.

### Svar

- `200 OK`: JSON-lista med kundens beställningar.
- Varje beställning innehåller `id`, `status` och `createdAt`.
- Sortering: nyaste först, därefter högsta id.
- Tomt resultat: `[]`.
- `400 Bad Request`: ogiltigt, tomt eller upprepat sidnummer, eller tom eller upprepad statusparameter.
- `401 Unauthorized`: `X-Customer-Id` saknas eller är ogiltigt.

### Exempel

`GET /customers/me/orders?page=2&status=new`

Returnerar högst 10 beställningar med status `new`
från den andra sidan, endast för aktuell kund.

### Bakåtkompatibilitet

`GET /customers/me/orders` utan parametrar behåller
befintlig autentisering, JSON-listans format och beteendet.

### Databas

Ingen schemaändring planeras för denna funktion.
