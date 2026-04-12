import { AttachmentBuilder } from 'discord.js';

const MAX_DISCORD_LENGTH = 2000;

/**
 * Send an AI response, attaching it as a .md file if it exceeds Discord's
 * character limit. Works for both interaction replies and message replies.
 *
 * @param {Function} sendFn - async (payload) => void  — e.g. interaction.editReply or message.reply
 * @param {string}   text   - the full AI response
 */
export async function sendAiResponse(sendFn, text) {
  if (text.length <= MAX_DISCORD_LENGTH) {
    await sendFn({ content: text });
    return;
  }

  // Attach as a markdown file so Discord renders a preview.
  const buffer = Buffer.from(text, 'utf-8');
  const file = new AttachmentBuilder(buffer, { name: 'response.md' });
  await sendFn({
    content: `Response was too long for a message, so here it is as a file:`,
    files: [file],
  });
}
