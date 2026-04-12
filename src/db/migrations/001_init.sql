CREATE TABLE IF NOT EXISTS ctfs (
    id                SERIAL PRIMARY KEY,
    guild_id          TEXT        NOT NULL,
    name              TEXT        NOT NULL,
    ctfd_url          TEXT        NOT NULL,
    ctfd_token        TEXT        NOT NULL,
    ctfd_team_id      INTEGER,
    category_id       TEXT        NOT NULL,
    text_channel_id   TEXT        NOT NULL,
    voice_channel_id  TEXT        NOT NULL,
    forum_channel_id  TEXT        NOT NULL,
    created_by        TEXT        NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived_at       TIMESTAMPTZ,
    UNIQUE (guild_id, text_channel_id)
);

CREATE INDEX IF NOT EXISTS ctfs_guild_idx ON ctfs (guild_id) WHERE archived_at IS NULL;

CREATE TABLE IF NOT EXISTS challenges (
    id                 SERIAL PRIMARY KEY,
    ctf_id             INTEGER     NOT NULL REFERENCES ctfs(id) ON DELETE CASCADE,
    ctfd_challenge_id  INTEGER     NOT NULL,
    name               TEXT        NOT NULL,
    category           TEXT,
    points             INTEGER,
    solved             BOOLEAN     NOT NULL DEFAULT false,
    forum_post_id      TEXT        NOT NULL,
    last_synced_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (ctf_id, ctfd_challenge_id)
);

CREATE INDEX IF NOT EXISTS challenges_ctf_idx ON challenges (ctf_id);
