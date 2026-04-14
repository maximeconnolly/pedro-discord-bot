import { Collection } from 'discord.js';
import { ctfCommand } from '../commands/ctf/index.js';
import { ctftimeCommand } from '../commands/ctftime/index.js';
import { pingCommand } from '../commands/ping.js';
import { aiCommand } from '../commands/ai.js';

/**
 * Returns a Collection<commandName, commandModule> where each module looks like:
 *   {
 *     data: SlashCommandBuilder,
 *     execute(interaction): Promise<void>,
 *     // optional: handleModalSubmit(interaction): Promise<void>
 *   }
 */
export function loadCommands() {
  const commands = new Collection();
  commands.set(ctfCommand.data.name, ctfCommand);
  commands.set(ctftimeCommand.data.name, ctftimeCommand);
  commands.set(pingCommand.data.name, pingCommand);
  commands.set(aiCommand.data.name, aiCommand);
  return commands;
}
