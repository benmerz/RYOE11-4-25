# CSV → SQLite (teams.csv)

This repo now includes a simple script to import the large `teams.csv` into an SQLite database.

## What I created
- `convert_csv_to_sqlite.py` — Streams a CSV into SQLite using the standard library (no extra deps). It sanitizes column names and creates the table if missing.
- `teams.db` — SQLite database produced from `teams.csv`, with a `teams` table (36,250 rows on current data).

## Quick use

Run again to refresh the DB from the CSV:

```bash
python3 convert_csv_to_sqlite.py teams.csv --db teams.db --table teams --batch 5000
```

Query it with the SQLite CLI:

```bash
sqlite3 teams.db ".mode column" ".headers on" \
  "SELECT COUNT(*) AS rows FROM teams;" \
  "SELECT team_full_name, team_nickname, team_conference, team_division FROM teams LIMIT 10;"
```

Notes:
- All columns are stored as TEXT for maximum compatibility; cast in queries as needed (e.g., `CAST(week AS INTEGER)`).
- Column names are sanitized to be SQLite-safe (lowercase, non-alphanumeric → `_`).
- The script uses transactions in batches for speed and is safe to re-run; it will append/replace rows as a fresh import (table is kept, rows are inserted again). If you want a fresh table each run, drop it first: `DROP TABLE IF EXISTS teams;`.
