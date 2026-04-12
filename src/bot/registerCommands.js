import { REST, Routes } from 'discord.js';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { loadCommands } from './commandLoader.js';

async function main() {
  const commands = loadCommands();
  const payload = [...commands.values()].map((c) => c.data.toJSON());

  const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);

  if (config.DISCORD_GUILD_ID) {
    logger.info({ guildId: config.DISCORD_GUILD_ID }, 'registering commands to guild');
    await rest.put(
      Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, config.DISCORD_GUILD_ID),
      { body: payload },
    );
  } else {
    logger.info('registering global commands');
    await rest.put(Routes.applicationCommands(config.DISCORD_CLIENT_ID), { body: payload });
  }
  logger.info('slash commands registered');
}

main().catch((err) => {
  logger.error({ err }, 'failed to register slash commands');
  process.exit(1);
});
