#!/usr/bin/env python3
"""Sincroniza activos públicos de muestra sin usar API ni servicios externos.

Uso:
  python scripts/sync_catalog.py --check  # no escribe
  python scripts/sync_catalog.py --write  # actualiza assets/catalog.js desde JSON
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "datos" / "catalogo_demo_v2.json"
DEST = ROOT / "assets" / "catalog.js"
HEADER = "/* Catálogo estático demostrativo, corte 2026-11-16; no usa API ni credenciales. */\n"


def validate(data: dict) -> None:
    markets = data.get("markets", [])
    records = data.get("records", [])
    ids = [r.get("id") for r in records]
    market_ids = {m.get("id") for m in markets}

    if not isinstance(markets, list) or not isinstance(records, list):
        raise ValueError("markets y records deben ser listas")
    if "todos" not in market_ids or len(market_ids) != len(markets):
        raise ValueError("IDs de mercados duplicados o falta 'todos'")
    if len(ids) != len(set(ids)) or not all(isinstance(i, str) and i for i in ids):
        raise ValueError("IDs de licitación duplicados o vacíos")
    if not records:
        raise ValueError("Se requiere al menos una ficha")
    for r in records:
        if r.get("market") not in market_ids - {"todos"}:
            raise ValueError(f"Mercado desconocido en {r.get('id')}")
        if not r.get("sources") or not isinstance(r["sources"], list):
            raise ValueError(f"Sin fuentes en {r['id']}")
        for src in r["sources"]:
            if src.get("kind") not in {"oficial", "contraste"}:
                raise ValueError(f"Tipo de fuente desconocido en {r['id']}")
            url = src.get("url", "")
            if urlparse(url).scheme != "https" or not urlparse(url).netloc:
                raise ValueError(f"URL inválida en {r['id']}: {url}")
        a = r.get("amount")
        if a is not None:
            if a.get("kind") not in {"presupuesto_estimado", "presupuesto_disponible", "adjudicacion_neta", "oc_total"}:
                raise ValueError(f"Clase de monto desconocida en {r['id']}")
            if a.get("currency") not in {"CLP", "USD"} or not isinstance(a.get("value"), (int, float)):
                raise ValueError(f"Moneda/valor inválido en {r['id']}")
    as_text = json.dumps(data, ensure_ascii=False)
    if "mercadopublico_busqueda" in as_text or "D9A951DA" in as_text:
        raise ValueError("El catálogo no puede incluir referencias privadas o credenciales")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--check", action="store_true", help="Comprobar deriva sin escribir")
    mode.add_argument("--write", action="store_true", help="Regenerar catalog.js")
    args = parser.parse_args()

    data = json.loads(DATA.read_text(encoding="utf-8"))
    validate(data)
    compact = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")
    expected = HEADER + "window.OBS_CATALOG = " + compact + ";\n"

    if args.write:
        DEST.parent.mkdir(parents=True, exist_ok=True)
        DEST.write_text(expected, encoding="utf-8")
        print(f"OK: generado {DEST.relative_to(ROOT)} con {len(data['records'])} registros")
        return 0
    if not DEST.exists() or DEST.read_text(encoding="utf-8") != expected:
        print("ERROR: assets/catalog.js no coincide con datos/catalogo_demo_v2.json; ejecutar --write", file=sys.stderr)
        return 1
    print(f"OK: catálogo sincronizado, {len(data['records'])} registros y {len(data['markets'])} vistas")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
