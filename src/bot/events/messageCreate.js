import { Events } from 'discord.js';
import { logger } from '../../logger.js';
import { sendAiResponse } from '../../services/ai/reply.js';

export const messageCreate = {
  name: Events.MessageCreate,
  async execute(context, message) {
    // Ignore bots, DMs, and messages that don't mention the bot.
    if (message.author.bot) return;
    if (!message.guild) return;
    if (!message.mentions.has(message.client.user)) return;

    // Skip if AI is the noop stub — don't pollute chat with "not configured" replies.
    if (context.aiProvider.name === 'noop') return;

    // Strip the @mention to get the actual prompt.
    const prompt = message.content
      .replace(new RegExp(`<@!?${message.client.user.id}>`, 'g'), '')
      .trim();

    if (!prompt) {
      await message.reply('Hey! Ask me something and I\'ll do my best to help.');
      return;
    }

    try {
      await message.channel.sendTyping();
      const response = await context.aiProvider.chat([{ role: 'user', content: prompt }]);
      await sendAiResponse((payload) => message.reply(payload), response);
    } catch (err) {
      logger.error({ err }, 'ai @mention handler error');
      await message.reply('Something went wrong talking to the AI. Try again in a moment.').catch(() => {});
    }
  },
};
