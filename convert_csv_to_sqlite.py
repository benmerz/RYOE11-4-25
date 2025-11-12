#!/usr/bin/env python3
import argparse
import csv
import os
import re
import sqlite3
from typing import List

# Small helper to sanitize column names into valid SQLite identifiers
identifier_re = re.compile(r"[^a-zA-Z0-9_]")

def sanitize(name: str) -> str:
    name = name.strip()
    name = name.replace("\ufeff", "")  # strip BOM if present
    # collapse spaces/odd chars to underscore
    name = identifier_re.sub("_", name)
    # cannot start with digit
    if name and name[0].isdigit():
        name = f"c_{name}"
    # avoid empty names
    return name or "unnamed"


def ensure_unique(names: List[str]) -> List[str]:
    seen = {}
    unique = []
    for n in names:
        base = n
        i = 1
        while n in seen:
            i += 1
            n = f"{base}_{i}"
        seen[n] = True
        unique.append(n)
    return unique


def create_table(conn: sqlite3.Connection, table: str, columns: List[str]):
    cols_sql = ",\n  ".join([f'"{c}" TEXT' for c in columns])
    sql = f"CREATE TABLE IF NOT EXISTS \"{table}\" (\n  {cols_sql}\n);"
    conn.execute(sql)
    # simple index for common id-like columns, if present
    for candidate in ("id", "game_id", "play_id"):
        if candidate in columns:
            conn.execute(
                f'CREATE INDEX IF NOT EXISTS idx_{table}_{candidate} ON "{table}" ("{candidate}");'
            )
    conn.commit()


def import_csv(db_path: str, csv_path: str, table: str, batch_size: int = 1000):
    if not os.path.exists(csv_path):
        raise FileNotFoundError(csv_path)

    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")

    with open(csv_path, "r", newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        # join broken header cells if some lines were wrapped? rely on csv module
        sanitized = [sanitize(h) for h in header]
        sanitized = ensure_unique(sanitized)

        create_table(conn, table, sanitized)

        placeholders = ",".join(["?"] * len(sanitized))
        insert_sql = f'INSERT INTO "{table}" VALUES ({placeholders})'

        batch = []
        total = 0
        cur = conn.cursor()
        try:
            for row in reader:
                # pad or trim row to header length
                if len(row) < len(sanitized):
                    row = row + [None] * (len(sanitized) - len(row))
                elif len(row) > len(sanitized):
                    row = row[: len(sanitized)]
                batch.append(row)
                if len(batch) >= batch_size:
                    cur.executemany(insert_sql, batch)
                    conn.commit()
                    total += len(batch)
                    print(f"Inserted {total} rows...")
                    batch = []
            if batch:
                cur.executemany(insert_sql, batch)
                conn.commit()
                total += len(batch)
        finally:
            cur.close()
    conn.close()
    print(f"Done. Inserted {total} rows into table '{table}' in {db_path}.")


def main():
    p = argparse.ArgumentParser(description="Import a CSV into an SQLite database.")
    p.add_argument("csv", help="Path to CSV file (UTF-8)")
    p.add_argument("--db", default="nfl.db", help="Output SQLite database path (default: nfl.db)")
    p.add_argument("--table", default="teams", help="Destination table name (default: teams)")
    p.add_argument("--batch", type=int, default=2000, help="Insert batch size (default: 2000)")
    args = p.parse_args()

    import_csv(args.db, args.csv, args.table, args.batch)


if __name__ == "__main__":
    main()
