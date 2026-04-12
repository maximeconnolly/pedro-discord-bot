import { Events, MessageFlags } from 'discord.js';
import { logger } from '../../logger.js';

export const interactionCreate = {
  name: Events.InteractionCreate,
  async execute(context, interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = context.commands.get(interaction.commandName);
        if (!command) return;
        await command.execute(interaction, context);
        return;
      }

      if (interaction.isModalSubmit()) {
        // customId convention: "<commandName>:<action>[:extras...]"
        const [commandName] = interaction.customId.split(':');
        const command = context.commands.get(commandName);
        if (!command?.handleModalSubmit) return;
        await command.handleModalSubmit(interaction, context);
        return;
      }
    } catch (err) {
      logger.error({ err, commandName: interaction.commandName }, 'interaction handler error');
      const reply = { content: 'Something went wrong handling that interaction.', flags: MessageFlags.Ephemeral };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    }
  },
};
