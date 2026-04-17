import { query } from '../pool.js';

export async function getCtftimeEvent(guildId, ctftimeId) {
  const { rows } = await query(
    `SELECT * FROM ctftime_events WHERE guild_id = $1 AND ctftime_id = $2 LIMIT 1`,
    [guildId, ctftimeId],
  );
  return rows[0] ?? null;
}

export async function insertCtftimeEvent({ guildId, ctftimeId, discordEventId }) {
  const { rows } = await query(
    `INSERT INTO ctftime_events (guild_id, ctftime_id, discord_event_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [guildId, ctftimeId, discordEventId],
  );
  return rows[0];
}

export async function listTrackedEvents(guildId) {
  const { rows } = await query(
    `SELECT ctftime_id, discord_event_id FROM ctftime_events WHERE guild_id = $1 ORDER BY created_at DESC`,
    [guildId],
  );
  return rows;
}
