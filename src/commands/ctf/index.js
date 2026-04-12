import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { createCommand, handleCreateModalSubmit } from './create.js';
import { syncCommand } from './sync.js';
import { listCommand } from './list.js';
import { archiveCommand } from './archive.js';

const data = new SlashCommandBuilder()
  .setName('ctf')
  .setDescription('Manage CTF events for this team')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false)
  .addSubcommand((sc) =>
    sc.setName('create').setDescription('Create a new CTF (opens a modal for details)'),
  )
  .addSubcommand((sc) =>
    sc.setName('sync').setDescription('Sync challenges for the CTF (run inside its forum channel)'),
  )
  .addSubcommand((sc) =>
    sc.setName('list').setDescription('List active CTFs in this server'),
  )
  .addSubcommand((sc) =>
    sc.setName('archive').setDescription('Archive the current CTF (run inside its forum channel)'),
  );

async function execute(interaction, context) {
  const sub = interaction.options.getSubcommand();
  switch (sub) {
    case 'create':
      return createCommand(interaction, context);
    case 'sync':
      return syncCommand(interaction, context);
    case 'list':
      return listCommand(interaction, context);
    case 'archive':
      return archiveCommand(interaction, context);
    default:
      return interaction.reply({ content: `Unknown subcommand: ${sub}`, flags: MessageFlags.Ephemeral });
  }
}

async function handleModalSubmit(interaction, context) {
  // customId: "ctf:create"
  const [, action] = interaction.customId.split(':');
  if (action === 'create') {
    return handleCreateModalSubmit(interaction, context);
  }
}

export const ctfCommand = { data, execute, handleModalSubmit };
