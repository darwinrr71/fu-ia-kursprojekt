## API-kontrakt

**Endpoint:** `GET /customers/me/orders`

**Autentisering:** Headern `X-Customer-Id` krävs.

### Parametrar

- `page`: valfritt positivt heltal, första sidan är 1.
- `status`: valfritt filter på beställningens status.
- Sidstorlek: 10 beställningar.
- Utan `page` används ingen sidindelning, så befintligt beteende bevaras.
- `status` kan användas med eller utan `page`.

### Svar

- `200 OK`: JSON-lista med kundens beställningar.
- Varje beställning innehåller `id`, `status` och `createdAt`.
- Sortering: nyaste först, därefter högsta id.
- Tomt resultat: `[]`.
- `400 Bad Request`: ogiltigt sidnummer eller tom statusparameter.
- `401 Unauthorized`: `X-Customer-Id` saknas eller är ogiltigt.

### Exempel

`GET /customers/me/orders?page=2&status=new`

Returnerar högst 10 beställningar med status `new`
från den andra sidan, endast för aktuell kund.

### Bakåtkompatibilitet

`GET /customers/me/orders` utan parametrar behåller
det befintliga JSON-formatet och beteendet.

### Databas

Ingen schemaändring planeras för denna funktion.
