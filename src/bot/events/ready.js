import { Events } from 'discord.js';
import { logger } from '../../logger.js';

export const ready = {
  name: Events.ClientReady,
  async execute(_context, client) {
    logger.info({ user: client.user?.tag }, 'bot online');
  },
};
