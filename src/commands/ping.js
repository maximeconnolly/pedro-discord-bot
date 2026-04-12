import { SlashCommandBuilder, MessageFlags } from 'discord.js';

const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Health-check command; replies with pong.');

async function execute(interaction) {
  await interaction.reply({ content: 'pong', flags: MessageFlags.Ephemeral });
}

export const pingCommand = { data, execute };
