"""PostgreSQL connection pool + schema management (replaces the old MongoDB/motor layer)."""
import os
import asyncpg

_pool: asyncpg.Pool | None = None

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
    identifier TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0,
    first_at DOUBLE PRECISION,
    locked_until DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    cat TEXT NOT NULL,
    description TEXT NOT NULL,
    hi TEXT NOT NULL DEFAULT '',
    tech TEXT NOT NULL DEFAULT '[]',
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    img TEXT NOT NULL DEFAULT '',
    features TEXT NOT NULL DEFAULT '[]',
    outcome TEXT NOT NULL DEFAULT '',
    gh TEXT NOT NULL DEFAULT '',
    live TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    items TEXT NOT NULL DEFAULT '[]',
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS testimonials (
    id TEXT PRIMARY KEY,
    body TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS enquiries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL,
    replied_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries (created_at DESC);

CREATE TABLE IF NOT EXISTS pageviews (
    id TEXT PRIMARY KEY,
    path TEXT NOT NULL,
    sid TEXT NOT NULL,
    ref TEXT NOT NULL DEFAULT '',
    ua TEXT NOT NULL DEFAULT '',
    at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pageviews_at ON pageviews (at);

CREATE TABLE IF NOT EXISTS rate_hits (
    id BIGSERIAL PRIMARY KEY,
    ip TEXT NOT NULL,
    at DOUBLE PRECISION NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_hits_ip_at ON rate_hits (ip, at);

CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    filename TEXT,
    content_type TEXT NOT NULL,
    data BYTEA NOT NULL,
    created_at TEXT NOT NULL
);

-- Safe to re-run: adds columns introduced after a table already existed.
ALTER TABLE pageviews ADD COLUMN IF NOT EXISTS ua TEXT NOT NULL DEFAULT '';
ALTER TABLE rate_hits ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'contact';
CREATE INDEX IF NOT EXISTS idx_rate_hits_kind_ip_at ON rate_hits (kind, ip, at);
"""


async def init_pool() -> asyncpg.Pool:
    global _pool
    _pool = await asyncpg.create_pool(
        host=os.environ.get("POSTGRES_HOST", "localhost"),
        port=int(os.environ.get("POSTGRES_PORT", "5432")),
        user=os.environ["POSTGRES_USER"],
        password=os.environ["POSTGRES_PASSWORD"],
        database=os.environ["POSTGRES_DB"],
        min_size=1,
        max_size=int(os.environ.get("POSTGRES_POOL_MAX", "10")),
    )
    return _pool


async def init_schema() -> None:
    assert _pool is not None
    await _pool.execute(SCHEMA_SQL)


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("DB pool not initialized — did startup run?")
    return _pool
