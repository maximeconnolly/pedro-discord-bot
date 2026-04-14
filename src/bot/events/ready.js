import { Events } from 'discord.js';
import { logger } from '../../logger.js';
import { refreshTrackedEventsForAllGuilds } from '../../services/ctftime/sync.js';

const CTFTIME_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const ready = {
  name: Events.ClientReady,
  async execute(_context, client) {
    logger.info({ user: client.user?.tag }, 'bot online');

    // Initial refresh of tracked CTFtime events (non-blocking)
    refreshTrackedEventsForAllGuilds(client).catch((err) =>
      logger.error({ err }, 'initial ctftime refresh failed'),
    );

    // Daily refresh
    setInterval(() => {
      refreshTrackedEventsForAllGuilds(client).catch((err) =>
        logger.error({ err }, 'scheduled ctftime refresh failed'),
      );
    }, CTFTIME_REFRESH_INTERVAL_MS);
  },
};
