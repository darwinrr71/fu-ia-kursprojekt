# nattlig rapport: summerar dagens betalda ordrar. körs av cron på driftservern.
import os, sys, datetime
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src", "legacy"))
from price_calc import calc_price, conn


def skapa_rapport(dag, anslutning, prisfunktion):
    cur = anslutning.cursor()
    cur.execute(
        "select id from orders where status = 'paid' and created_at::date = %s",
        (dag,),
    )
    summa = 0
    antal = 0
    for (oid,) in cur.fetchall():
        p = prisfunktion(oid)
        summa += p.total
        antal += 1
    return "%s: %d betalda ordrar, totalt %s kr" % (dag, antal, summa)


def main(argv=None, anslutning=conn, prisfunktion=calc_price):
    argument = sys.argv if argv is None else argv
    dag = argument[1] if len(argument) > 1 else datetime.date.today().isoformat()
    print(skapa_rapport(dag, anslutning, prisfunktion))


if __name__ == "__main__":
    main()
