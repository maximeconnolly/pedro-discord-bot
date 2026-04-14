CREATE TABLE IF NOT EXISTS ctftime_events (
    id                SERIAL PRIMARY KEY,
    guild_id          TEXT        NOT NULL,
    ctftime_id        INTEGER     NOT NULL,
    discord_event_id  TEXT        NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (guild_id, ctftime_id)
);

CREATE INDEX IF NOT EXISTS ctftime_events_guild_idx ON ctftime_events (guild_id);
