# Raccoon Discord Bot

Discord bot for a CTF team that competes in external CTFs. For each event the team enters, the bot creates a Discord forum channel, pulls challenges from that event's CTFd instance, and creates one forum post per challenge so the team can collaborate on it. "Solved" challenges are tagged based on the team's solves on CTFd.

## Features

- `/ctf create` — opens a modal for CTF name + CTFd URL + CTFd API token, creates a forum channel, validates the token
- `/ctf sync` — pulls challenges from the CTFd instance for the current CTF (run inside the CTF's forum channel)
- `/ctf list` — lists active CTFs
- `/ctf archive` — archives the current CTF's forum channel
- AI chatbot — stubbed (`noop` provider); pluggable interface to add a real provider later

All `/ctf` subcommands require the **Manage Server** permission.

## Running locally

1. Copy `.env.example` to `.env` and fill in Discord credentials.
2. `docker compose up --build` — Postgres starts, the bot runs migrations, then connects to Discord.
3. Publish slash commands once: `docker compose run --rm bot node src/bot/registerCommands.js` (set `DISCORD_GUILD_ID` in `.env` during development for instant registration).

## Tests

```
npm test
```

## Layout

- `src/bot/` — discord.js client, event wiring, slash-command registration
- `src/commands/ctf/` — `/ctf` slash commands and the modal flow
- `src/services/ctfd/` — CTFd REST client (per-CTF credentials) and challenge diff logic
- `src/services/discord/forum.js` — forum channel + post helpers
- `src/services/ai/` — pluggable AI provider interface (noop stub)
- `src/db/` — `pg` pool, migrations, repositories
