import { query } from '../pool.js';

export async function createCtf({
  guildId,
  name,
  ctfdUrl,
  ctfdToken,
  ctfdTeamId,
  categoryId,
  textChannelId,
  voiceChannelId,
  forumChannelId,
  createdBy,
}) {
  const { rows } = await query(
    `INSERT INTO ctfs
       (guild_id, name, ctfd_url, ctfd_token, ctfd_team_id,
        category_id, text_channel_id, voice_channel_id, forum_channel_id, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      guildId,
      name,
      ctfdUrl,
      ctfdToken,
      ctfdTeamId,
      categoryId,
      textChannelId,
      voiceChannelId,
      forumChannelId,
      createdBy,
    ],
  );
  return rows[0];
}

export async function getCtfByTextChannel(guildId, textChannelId) {
  const { rows } = await query(
    `SELECT * FROM ctfs
     WHERE guild_id = $1 AND text_channel_id = $2 AND archived_at IS NULL
     LIMIT 1`,
    [guildId, textChannelId],
  );
  return rows[0] ?? null;
}

export async function listActiveCtfs(guildId) {
  const { rows } = await query(
    `SELECT * FROM ctfs
     WHERE guild_id = $1 AND archived_at IS NULL
     ORDER BY created_at DESC`,
    [guildId],
  );
  return rows;
}

export async function archiveCtf(id) {
  await query(
    `UPDATE ctfs SET archived_at = now() WHERE id = $1 AND archived_at IS NULL`,
    [id],
  );
}

export async function setCtfdTeamId(id, ctfdTeamId) {
  await query(`UPDATE ctfs SET ctfd_team_id = $1 WHERE id = $2`, [ctfdTeamId, id]);
}
