import { MessageFlags } from 'discord.js';
import { listActiveCtfs } from '../../db/repositories/ctfs.js';

export async function listCommand(interaction) {
  const rows = await listActiveCtfs(interaction.guildId);
  if (rows.length === 0) {
    await interaction.reply({
      content: 'No active CTFs. Use `/ctf create` to add one.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const lines = rows.map(
    (r) =>
      `• **${r.name}** — <#${r.text_channel_id}> / <#${r.forum_channel_id}> — ${r.ctfd_url}`,
  );
  await interaction.reply({
    content: `Active CTFs:\n${lines.join('\n')}`,
    flags: MessageFlags.Ephemeral,
  });
}
