import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';
import { logger } from '../../logger.js';
import { addCtftimeEvent } from '../../services/ctftime/sync.js';
import { CtftimeError } from '../../services/ctftime/client.js';

const data = new SlashCommandBuilder()
  .setName('ctftime')
  .setDescription('Manage CTFtime competition events')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
  .setDMPermission(false)
  .addSubcommand((sc) =>
    sc
      .setName('sync')
      .setDescription('Add a CTFtime event as a Discord scheduled event')
      .addIntegerOption((opt) =>
        opt
          .setName('event_id')
          .setDescription('The numeric CTFtime event ID (from the URL: ctftime.org/event/<id>)')
          .setRequired(true)
          .setMinValue(1),
      ),
  );

async function execute(interaction) {
  const ctftimeId = interaction.options.getInteger('event_id');
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const guild =
    interaction.guild ?? (await interaction.client.guilds.fetch(interaction.guildId));

  let result;
  try {
    result = await addCtftimeEvent(guild, ctftimeId);
  } catch (err) {
    if (err instanceof CtftimeError) {
      const msg =
        err.status === 404
          ? `Event #${ctftimeId} was not found on CTFtime.`
          : `Failed to fetch event #${ctftimeId} from CTFtime (status ${err.status}).`;
      await interaction.editReply(msg);
      return;
    }
    logger.error({ err, ctftimeId }, 'unexpected error during ctftime sync');
    await interaction.editReply('An unexpected error occurred. Please try again later.');
    return;
  }

  if (result.added) {
    await interaction.editReply(`Discord scheduled event created for CTFtime event #${ctftimeId}.`);
  } else {
    await interaction.editReply(
      `CTFtime event #${ctftimeId} is already tracked in this server.`,
    );
  }
}

export const ctftimeCommand = { data, execute };
