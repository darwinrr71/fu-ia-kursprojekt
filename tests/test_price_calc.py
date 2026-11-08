from decimal import Decimal
import importlib.util
from pathlib import Path
import runpy
import sys
from types import SimpleNamespace
from unittest.mock import mock_open

import psycopg


ROOT = Path(__file__).resolve().parents[1]
PRICE_CALC_PATH = ROOT / "src" / "legacy" / "price_calc.py"
NIGHTLY_REPORT_PATH = ROOT / "jobs" / "nightly_report.py"


class PriceCursor:
    def __init__(self, order_row, lines=None, discount_row=None):
        self.order_row = order_row
        self.lines = lines or []
        self.discount_row = discount_row
        self.queries = []
        self.last_query = ""

    def execute(self, query, params=None):
        self.last_query = query
        self.queries.append((query, params))

    def fetchone(self):
        if "from orders" in self.last_query:
            return self.order_row
        if "from discounts" in self.last_query:
            return self.discount_row
        raise AssertionError(f"Oväntad fråga: {self.last_query}")

    def fetchall(self):
        return self.lines


class FakeConnection:
    def __init__(self, cursor):
        self._cursor = cursor

    def cursor(self):
        return self._cursor


def load_price_calc(monkeypatch, cursor):
    monkeypatch.setattr(psycopg, "connect", lambda *_args, **_kwargs: FakeConnection(cursor))
    spec = importlib.util.spec_from_file_location("characterized_price_calc", PRICE_CALC_PATH)
    assert spec is not None
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    monkeypatch.setattr(module, "open", mock_open(), raising=False)
    return module


def test_kapa_truncates_toward_zero(monkeypatch):
    module = load_price_calc(monkeypatch, PriceCursor(None))

    assert module._kapa(Decimal("1.239")) == Decimal("1.23")
    assert module._kapa(Decimal("-1.239")) == Decimal("-1.23")


def test_calc_price_sums_lines_and_truncates_vat(monkeypatch):
    cursor = PriceCursor(
        order_row=(None,),
        lines=[(1, Decimal("10.00")), (1, Decimal("0.99"))],
    )
    module = load_price_calc(monkeypatch, cursor)

    price = module.calc_price(42)

    assert price.net == Decimal("10.99")
    assert price.vat == Decimal("2.74")
    assert price.total == Decimal("13.73")


def test_calc_price_applies_discount_before_truncation(monkeypatch):
    cursor = PriceCursor(
        order_row=("GAMMAL15",),
        lines=[(1, Decimal("19.99"))],
        discount_row=(15,),
    )
    module = load_price_calc(monkeypatch, cursor)

    price = module.calc_price(1045)

    assert price.net == Decimal("16.99")
    assert price.vat == Decimal("4.24")
    assert price.total == Decimal("21.23")
    assert cursor.queries[-1] == (
        "select percent from discounts where code = %s",
        ("GAMMAL15",),
    )


def test_calc_price_ignores_unknown_discount_code(monkeypatch):
    cursor = PriceCursor(
        order_row=("SAKNAS",),
        lines=[(2, Decimal("5.00"))],
        discount_row=None,
    )
    module = load_price_calc(monkeypatch, cursor)

    price = module.calc_price(7)

    assert price.net == Decimal("10")
    assert price.vat == Decimal("2.5")
    assert price.total == Decimal("12.5")


def test_calc_price_returns_none_when_order_is_missing(monkeypatch):
    cursor = PriceCursor(order_row=None)
    module = load_price_calc(monkeypatch, cursor)

    assert module.calc_price(9999) is None
    assert cursor.queries == [
        ("select discount_code from orders where id = %s", (9999,))
    ]


def test_nightly_report_sums_paid_orders_and_formats_output(monkeypatch, capsys):
    class ReportCursor:
        def __init__(self):
            self.query = ""

        def execute(self, query):
            self.query = query

        def fetchall(self):
            return [(11,), (12,)]

    cursor = ReportCursor()
    totals = {11: Decimal("10.25"), 12: Decimal("20.50")}
    fake_module = SimpleNamespace(
        conn=FakeConnection(cursor),
        calc_price=lambda order_id: SimpleNamespace(total=totals[order_id]),
    )
    monkeypatch.setitem(sys.modules, "price_calc", fake_module)
    monkeypatch.setattr(sys, "argv", [str(NIGHTLY_REPORT_PATH), "2026-11-08"])

    runpy.run_path(str(NIGHTLY_REPORT_PATH), run_name="__main__")

    assert cursor.query == (
        "select id from orders where status = 'paid' "
        "and created_at::date = '2026-11-08'"
    )
    assert capsys.readouterr().out == "2026-11-08: 2 betalda ordrar, totalt 30.75 kr\n"
