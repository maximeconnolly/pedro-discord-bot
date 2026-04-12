import { MessageFlags } from 'discord.js';
import { logger } from '../../logger.js';
import { archiveCtfChannels } from '../../services/discord/forum.js';
import { getCtfByTextChannel, archiveCtf } from '../../db/repositories/ctfs.js';

export async function archiveCommand(interaction) {
  const ctf = await getCtfByTextChannel(interaction.guildId, interaction.channelId);
  if (!ctf) {
    await interaction.reply({
      content: 'This channel is not a tracked CTF. Run `/ctf archive` from the CTF\'s text channel.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const guild =
    interaction.guild ?? (await interaction.client.guilds.fetch(interaction.guildId));
  await archiveCtfChannels(guild, {
    categoryId: ctf.category_id,
    forumChannelId: ctf.forum_channel_id,
  });
  await archiveCtf(ctf.id);

  logger.info({ ctfId: ctf.id }, 'ctf archived');
  await interaction.editReply(`Archived CTF **${ctf.name}**.`);
}
