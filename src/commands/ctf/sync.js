import { MessageFlags } from 'discord.js';
import { logger } from '../../logger.js';
import { createCtfdClient, CtfdError } from '../../services/ctfd/client.js';
import { diffChallenges } from '../../services/ctfd/challenges.js';
import {
  createChallengePost,
  updateChallengePost,
} from '../../services/discord/forum.js';
import { getCtfByTextChannel, setCtfdTeamId } from '../../db/repositories/ctfs.js';
import {
  listChallengesByCtf,
  insertChallenge,
  updateChallenge,
} from '../../db/repositories/challenges.js';

export async function syncCommand(interaction) {
  const ctf = await getCtfByTextChannel(interaction.guildId, interaction.channelId);
  if (!ctf) {
    await interaction.reply({
      content:
        'This channel is not a tracked CTF. Run `/ctf create` first, then run `/ctf sync` in the CTF\'s text channel (the one inside the CTF category, not the forum channel).',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const ctfd = createCtfdClient({ baseUrl: ctf.ctfd_url, token: ctf.ctfd_token });

  let teamId = ctf.ctfd_team_id;
  if (teamId == null) {
    try {
      const team = await ctfd.getMyTeam();
      if (team?.id) {
        teamId = team.id;
        await setCtfdTeamId(ctf.id, teamId);
      }
    } catch (err) {
      logger.warn({ err }, 'failed to fetch team during sync');
    }
  }

  let remote;
  try {
    remote = await ctfd.listChallenges();
  } catch (err) {
    if (err instanceof CtfdError) {
      await interaction.editReply(`Failed to list challenges from CTFd (status ${err.status}).`);
      return;
    }
    throw err;
  }

  let solvedIds = new Set();
  if (teamId != null) {
    try {
      solvedIds = await ctfd.listTeamSolves(teamId);
    } catch (err) {
      logger.warn({ err }, 'failed to list team solves; skipping solved tag updates');
    }
  }

  const localRows = await listChallengesByCtf(ctf.id);
  const { toCreate, toUpdate, toMarkSolved, unchanged } = diffChallenges(
    localRows,
    remote,
    solvedIds,
  );

  const guild =
    interaction.guild ?? (await interaction.client.guilds.fetch(interaction.guildId));
  const forumChannel = await guild.channels.fetch(ctf.forum_channel_id);

  let created = 0;
  let updated = 0;
  let markedSolved = 0;

  for (const { remote: r, solved } of toCreate) {
    const full = (await safe(() => ctfd.getChallenge(r.id))) ?? {
      id: r.id,
      name: r.name,
      category: r.category,
      value: r.value,
      description: '',
      files: [],
    };
    const challengeData = {
      name: full.name,
      category: full.category,
      points: full.value,
      description: full.description,
      files: full.files,
    };
    const thread = await createChallengePost(forumChannel, challengeData, { solved });
    await insertChallenge({
      ctfId: ctf.id,
      ctfdChallengeId: r.id,
      name: full.name,
      category: full.category ?? null,
      points: full.value ?? null,
      solved,
      forumPostId: thread.id,
    });
    created += 1;
  }

  for (const { local, remote: r, solved } of toUpdate) {
    const full = (await safe(() => ctfd.getChallenge(r.id))) ?? {
      id: r.id,
      name: r.name,
      category: r.category,
      value: r.value,
      description: '',
      files: [],
    };
    const challengeData = {
      name: full.name,
      category: full.category,
      points: full.value,
      description: full.description,
      files: full.files,
    };
    await updateChallengePost(forumChannel, local.forum_post_id, challengeData, { solved });
    await updateChallenge(local.id, {
      name: full.name,
      category: full.category ?? null,
      points: full.value ?? null,
      solved,
    });
    updated += 1;
  }

  for (const { local, remote: r, solved } of toMarkSolved) {
    const challengeData = {
      name: local.name,
      category: local.category,
      points: local.points,
      description: '',
      files: [],
    };
    // updateChallengePost will no-op on identical name/content; only the tag flips.
    // To avoid wiping the existing starter message body, re-fetch full data:
    const full = await safe(() => ctfd.getChallenge(r.id));
    if (full) {
      challengeData.description = full.description;
      challengeData.files = full.files;
    }
    await updateChallengePost(forumChannel, local.forum_post_id, challengeData, { solved });
    await updateChallenge(local.id, {
      name: local.name,
      category: local.category,
      points: local.points,
      solved,
    });
    markedSolved += 1;
  }

  await interaction.editReply(
    `Sync complete for **${ctf.name}**:\n` +
      `• Created: ${created}\n` +
      `• Updated: ${updated}\n` +
      `• Marked solved: ${markedSolved}\n` +
      `• Unchanged: ${unchanged}`,
  );
}

async function safe(fn) {
  try {
    return await fn();
  } catch (err) {
    logger.warn({ err }, 'ctfd fetch failed, continuing with minimal data');
    return null;
  }
}
