import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} from 'discord.js';
import { logger } from '../../logger.js';
import { createCtfdClient, CtfdError } from '../../services/ctfd/client.js';
import { createCtfChannels } from '../../services/discord/forum.js';
import { createCtf } from '../../db/repositories/ctfs.js';

export async function createCommand(interaction) {
  const modal = new ModalBuilder().setCustomId('ctf:create').setTitle('Create CTF');

  const nameInput = new TextInputBuilder()
    .setCustomId('name')
    .setLabel('CTF name')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(80);

  const urlInput = new TextInputBuilder()
    .setCustomId('url')
    .setLabel('CTFd base URL (e.g. https://ctf.example.com)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(200);

  const tokenInput = new TextInputBuilder()
    .setCustomId('token')
    .setLabel('CTFd API token (team account)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(200);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(urlInput),
    new ActionRowBuilder().addComponents(tokenInput),
  );

  await interaction.showModal(modal);
}

export async function handleCreateModalSubmit(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const name = interaction.fields.getTextInputValue('name').trim();
  const url = interaction.fields.getTextInputValue('url').trim();
  const token = interaction.fields.getTextInputValue('token').trim();

  if (!/^https?:\/\//i.test(url)) {
    await interaction.editReply('CTFd URL must start with http:// or https://');
    return;
  }

  const ctfd = createCtfdClient({ baseUrl: url, token });

  try {
    await ctfd.getMe();
  } catch (err) {
    if (err instanceof CtfdError) {
      logger.warn({ status: err.status, body: err.body }, 'ctfd token validation failed');
      await interaction.editReply(
        `Could not authenticate against CTFd (status ${err.status}). Double-check the URL and token.`,
      );
      return;
    }
    throw err;
  }

  let team = null;
  try {
    team = await ctfd.getMyTeam();
  } catch (err) {
    logger.warn({ err }, 'failed to fetch team info (continuing without team id)');
  }
  const ctfdTeamId = team?.id ?? null;

  const guild =
    interaction.guild ?? (await interaction.client.guilds.fetch(interaction.guildId));
  const { category, textChannel, voiceChannel, forumChannel } = await createCtfChannels(
    guild,
    name,
  );

  const ctf = await createCtf({
    guildId: interaction.guildId,
    name,
    ctfdUrl: url,
    ctfdToken: token,
    ctfdTeamId,
    categoryId: category.id,
    textChannelId: textChannel.id,
    voiceChannelId: voiceChannel.id,
    forumChannelId: forumChannel.id,
    createdBy: interaction.user.id,
  });

  logger.info({ ctfId: ctf.id, guildId: interaction.guildId }, 'ctf created');

  await interaction.editReply(
    `Created CTF **${name}**.\n` +
      `• Commands + chat: <#${textChannel.id}>\n` +
      `• Voice: <#${voiceChannel.id}>\n` +
      `• Challenges: <#${forumChannel.id}>\n\n` +
      `Run \`/ctf sync\` in <#${textChannel.id}> to pull challenges.`,
  );
}
