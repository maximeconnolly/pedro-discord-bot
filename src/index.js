import { config } from './config.js';
import { logger } from './logger.js';
import { createClient } from './bot/client.js';
import { loadCommands } from './bot/commandLoader.js';
import { registerEvents } from './bot/eventLoader.js';
import { pool } from './db/pool.js';
import { getAiProvider } from './services/ai/provider.js';

async function main() {
  const client = createClient();
  const commands = loadCommands();
  const aiProvider = getAiProvider();
  logger.info({ provider: aiProvider.name }, 'ai provider loaded');
  registerEvents(client, { commands, aiProvider });

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  async function shutdown(signal) {
    logger.info({ signal }, 'shutting down');
    try {
      await client.destroy();
    } catch (err) {
      logger.warn({ err }, 'error destroying client');
    }
    try {
      await pool.end();
    } catch (err) {
      logger.warn({ err }, 'error closing pg pool');
    }
    process.exit(0);
  }

  await client.login(config.DISCORD_TOKEN);
}

main().catch((err) => {
  logger.error({ err }, 'fatal startup error');
  process.exit(1);
});
