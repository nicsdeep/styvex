"""Verify existing catalog mappings against CJ; never guess color/size or alter prices.

Requires STYVEX_AUDIT_DB and CJDROPSHIPPING_API_KEY in the environment.
Dry-run by default. --apply updates only verified IDs, in one transaction.
"""
import argparse
import json
import os
import re
import time
import urllib.request
from pathlib import Path
import psycopg
from psycopg.rows import dict_row

parser = argparse.ArgumentParser()
parser.add_argument("--apply", action="store_true")
args = parser.parse_args()
base = "https://developers.cjdropshipping.com/api2.0/v1"

def request(endpoint, body=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["CJ-Access-Token"] = token
    req = urllib.request.Request(base + endpoint, headers=headers,
        data=json.dumps(body).encode() if body is not None else None)
    with urllib.request.urlopen(req, timeout=40) as response:
        return json.load(response)

auth = request("/authentication/getAccessToken", {"apiKey": os.environ["CJDROPSHIPPING_API_KEY"]})
token = (auth.get("data") or {}).get("accessToken")
if not token:
    raise SystemExit(f"CJ authentication failed: code {auth.get('code')}")
connection = psycopg.connect(os.environ["STYVEX_AUDIT_DB"], row_factory=dict_row, autocommit=True)
products = connection.execute("SELECT id, slug, supplier, supplier_product_id FROM products ORDER BY slug").fetchall()
variants = connection.execute("SELECT id, product_id, sku, color, size, supplier_variant_id FROM product_variants").fetchall()
report = {"applied": False, "products": [], "unresolved": [], "variant_updates": []}
for product in products:
    if product["supplier"] not in ("manual", "cj"):
        continue
    match = re.search(r"-([0-9]{16,22}|[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12})$", product["slug"])
    if not match:
        report["unresolved"].append({"slug": product["slug"], "reason": "No verifiable CJ product ID"})
        continue
    pid = match.group(1)
    time.sleep(1.1)
    try:
        result = request("/product/query?pid=" + pid, token=token)
    except Exception as error:
        report["unresolved"].append({"slug": product["slug"], "reason": type(error).__name__})
        continue
    detail = result.get("data") or {}
    local = [v for v in variants if v["product_id"] == product["id"]]
    remote = detail.get("variants") or []
    sku = detail.get("productSku")
    # Require returned ID and existing SKU provenance, not a name resemblance.
    if str(detail.get("pid", "")).lower() != pid.lower() or not sku or not any(v["sku"] == sku or v["sku"].startswith(sku + "-") or any(v["sku"] == rv.get("variantSku") for rv in remote) for v in local):
        report["unresolved"].append({"slug": product["slug"], "reason": "Supplier ID/SKU provenance not verified", "code": result.get("code")})
        continue
    report["products"].append({"id": str(product["id"]), "slug": product["slug"], "supplier_product_id": str(detail["pid"]), "previous_supplier": product["supplier"], "previous_supplier_product_id": product["supplier_product_id"]})
    for variant in local:
        matches = [rv for rv in remote if rv.get("variantSku") == variant["sku"]]
        if not matches and len(remote) == 1 and not variant["color"] and not variant["size"] and variant["sku"] == sku + "-DEFAULT":
            matches = remote
        if len(matches) != 1 or not matches[0].get("vid"):
            report["unresolved"].append({"slug": product["slug"], "variant_id": str(variant["id"]), "sku": variant["sku"], "reason": "Placeholder variant is ambiguous; requires actual option import", "supplier_variant_count": len(remote)})
            continue
        vid = str(matches[0]["vid"])
        if variant["supplier_variant_id"] not in (None, vid):
            raise RuntimeError("Existing mapping conflicts with verified supplier variant")
        report["variant_updates"].append({"id": str(variant["id"]), "product_id": str(product["id"]), "supplier_variant_id": vid, "previous_supplier_variant_id": variant["supplier_variant_id"]})
    print(f"Verified {product['slug']}: {len(remote)} supplier variants", flush=True)

if args.apply:
    with connection.transaction():
        for product in report["products"]:
            updated = connection.execute("UPDATE products SET supplier='cj', supplier_product_id=%s WHERE id=%s AND supplier=%s AND supplier_product_id IS NOT DISTINCT FROM %s", (product["supplier_product_id"], product["id"], product["previous_supplier"], product["previous_supplier_product_id"]))
            if updated.rowcount != 1:
                raise RuntimeError("Concurrent product edit detected; rollback")
        for variant in report["variant_updates"]:
            updated = connection.execute("UPDATE product_variants SET supplier_variant_id=%s WHERE id=%s AND product_id=%s AND supplier_variant_id IS NOT DISTINCT FROM %s", (variant["supplier_variant_id"], variant["id"], variant["product_id"], variant["previous_supplier_variant_id"]))
            if updated.rowcount != 1:
                raise RuntimeError("Concurrent variant edit detected; rollback")
    report["applied"] = True
    report["verified_counts"] = connection.execute("SELECT supplier,count(*) AS count FROM products GROUP BY supplier").fetchall()
connection.close()
Path("docs/cj-mapping-audit.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"applied": report["applied"], "verified_products": len(report["products"]), "verified_variants": len(report["variant_updates"]), "unresolved": len(report["unresolved"])}))
