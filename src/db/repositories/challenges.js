import { query } from '../pool.js';

export async function listChallengesByCtf(ctfId) {
  const { rows } = await query(
    `SELECT * FROM challenges WHERE ctf_id = $1 ORDER BY ctfd_challenge_id`,
    [ctfId],
  );
  return rows;
}

export async function insertChallenge({
  ctfId,
  ctfdChallengeId,
  name,
  category,
  points,
  solved,
  forumPostId,
}) {
  const { rows } = await query(
    `INSERT INTO challenges (ctf_id, ctfd_challenge_id, name, category, points, solved, forum_post_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [ctfId, ctfdChallengeId, name, category, points, solved, forumPostId],
  );
  return rows[0];
}

export async function updateChallenge(id, { name, category, points, solved }) {
  await query(
    `UPDATE challenges
     SET name = $1, category = $2, points = $3, solved = $4, last_synced_at = now()
     WHERE id = $5`,
    [name, category, points, solved, id],
  );
}
