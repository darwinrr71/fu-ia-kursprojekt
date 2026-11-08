# price_calc.py
# prisberakning for ordrar. skriven 2019, flyttad hit fran gamla admin-systemet.
# OBS rör inte avrundningen, ekonomi har stämt av mot den.

import os, sys, json, datetime
from decimal import Decimal
import psycopg
from typing import cast

DB = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/butik")
conn = psycopg.connect(DB, autocommit=True)

MOMS = 25
LOGG = os.path.join(os.path.dirname(__file__), "price_calc.log")
_INGEN_RABATT = object()


class Pris:
    def __init__(self, net, vat, total):
        self.net = net
        self.vat = vat
        self.total = total


def _kapa(x):
    # två decimaler
    return Decimal(int(x * 100)) / 100


def _berakna_pris(rader, rabattprocent=_INGEN_RABATT):
    summa = Decimal(0)
    for q, p in rader:
        summa = summa + q * p

    if rabattprocent is not _INGEN_RABATT:
        summa = summa - summa * cast(Decimal, rabattprocent) / 100

    net = _kapa(summa)
    vat = _kapa(net * MOMS / 100)
    return Pris(net, vat, net + vat)


def _hamta_order(cur, order_id):
    cur.execute("select discount_code from orders where id = %s", (order_id,))
    return cur.fetchone()


def _hamta_orderrader(cur, order_id):
    cur.execute("select quantity, unit_price from order_lines where order_id = %s", (order_id,))
    return cur.fetchall()


def _hamta_rabattprocent(cur, kod):
    if not kod:
        return _INGEN_RABATT

    cur.execute("select percent from discounts where code = %s", (kod,))
    rad = cur.fetchone()
    return rad[0] if rad else _INGEN_RABATT


def calc_price(order_id, anslutning=None):
    aktiv_anslutning = conn if anslutning is None else anslutning
    cur = aktiv_anslutning.cursor()
    rad = _hamta_order(cur, order_id)
    if rad == None:
        return None

    rader = _hamta_orderrader(cur, order_id)
    rabattprocent = _hamta_rabattprocent(cur, rad[0])

    pris = _berakna_pris(rader, rabattprocent)

    try:
        f = open(LOGG, "a")
        f.write("%s %s %s\n" % (datetime.datetime.now().isoformat(), order_id, pris.total))
        f.close()
    except:
        pass

    return pris


if __name__ == "__main__":
    p = calc_price(int(sys.argv[1]))
    if p is None:
        print(json.dumps({"error": "finns inte"}))
        sys.exit(1)
    print(json.dumps({"net": str(p.net), "vat": str(p.vat), "total": str(p.total)}))
