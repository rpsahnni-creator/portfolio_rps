"""Points the app at a throwaway '<db>_test' database and wipes it once per
test session, so the suite never touches real data and is safe to re-run."""
import asyncio
import os
import sys
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

load_dotenv(BACKEND_DIR / ".env")

_base_db = os.environ.get("POSTGRES_DB", "rps_portfolio")
if not _base_db.endswith("_test"):
    os.environ["POSTGRES_DB"] = _base_db + "_test"
os.environ.setdefault("JWT_SECRET", "test-secret-do-not-use-in-production")
os.environ.setdefault("ADMIN_EMAIL", "admin@example.com")
os.environ.setdefault("ADMIN_PASSWORD", "TestAdmin123!")
os.environ.setdefault("OWNER_EMAIL", "owner@example.com")
os.environ.setdefault("EMAIL_FROM_NAME", "Test Suite")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")


async def _reset_test_database() -> None:
    db_name = os.environ["POSTGRES_DB"]
    conn_args = dict(
        host=os.environ.get("POSTGRES_HOST", "localhost"),
        port=int(os.environ.get("POSTGRES_PORT", "5432")),
        user=os.environ["POSTGRES_USER"],
        password=os.environ["POSTGRES_PASSWORD"],
    )
    sys_conn = await asyncpg.connect(database="postgres", **conn_args)
    try:
        exists = await sys_conn.fetchval("SELECT 1 FROM pg_database WHERE datname=$1", db_name)
        if not exists:
            await sys_conn.execute(f'CREATE DATABASE "{db_name}"')
    finally:
        await sys_conn.close()

    conn = await asyncpg.connect(database=db_name, **conn_args)
    try:
        await conn.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
    finally:
        await conn.close()


asyncio.run(_reset_test_database())
