import { SlashCommandBuilder } from 'discord.js';
import { sendAiResponse } from '../services/ai/reply.js';

const data = new SlashCommandBuilder()
  .setName('ai')
  .setDescription('Ask Pedro, the team AI assistant')
  .addStringOption((opt) =>
    opt.setName('prompt').setDescription('Your question or request').setRequired(true),
  );

async function execute(interaction, context) {
  const prompt = interaction.options.getString('prompt', true);
  await interaction.deferReply();

  const response = await context.aiProvider.chat([{ role: 'user', content: prompt }]);
  await sendAiResponse((payload) => interaction.editReply(payload), response);
}

export const aiCommand = { data, execute };
