# Krav – Sidindelning och statusfilter

## User story

Som kund vill jag se mina beställningar sidvis och kunna filtrera på status.

## Acceptanskriterier

**1. Sidindelning**

- **Givet** att kunden har många beställningar.
- **När** kunden begär en viss sida.
- **Så** visas rätt beställningar, med de senaste först.

**2. Statusfilter**

- **Givet** att beställningarna har olika status.
- **När** kunden filtrerar på en status.
- **Så** visas endast beställningar med den statusen.

**3. Kombination**

- **Givet** att flera beställningar matchar en status.
- **När** kunden väljer både sida och status.
- **Så** filtreras beställningarna före sidindelningen.

**4. Behörighet**

- **Givet** att flera kunder har beställningar.
- **När** kunden hämtar sin lista.
- **Så** visas endast kundens egna beställningar.

**5. Tomma resultat och fel**

- **Givet** att inga beställningar matchar.
- **När** kunden skickar en giltig förfrågan.
- **Så** returneras 200 med en tom lista.
- **När** sidnumret är ogiltigt.
- **Så** returneras 400 med ett tydligt felmeddelande.

**6. Bakåtkompatibilitet**

- **Givet** att inga nya parametrar anges.
- **När** kunden hämtar sina beställningar.
- **Så** fungerar anropet som tidigare.
