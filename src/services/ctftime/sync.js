import {
  GuildScheduledEventEntityType,
  GuildScheduledEventPrivacyLevel,
} from 'discord.js';
import { logger } from '../../logger.js';
import { fetchEvent } from './client.js';
import {
  getCtftimeEvent,
  insertCtftimeEvent,
  listTrackedEvents,
} from '../../db/repositories/ctftimeEvents.js';

const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;

function buildDescription(event) {
  const suffix = `\n\nCTFtime: ${event.url}`;
  const maxBody = MAX_DESCRIPTION_LENGTH - suffix.length;
  const body = event.description.length > maxBody
    ? event.description.slice(0, maxBody - 1) + '…'
    : event.description;
  return body + suffix;
}

function buildEventOptions(event) {
  return {
    name: event.title.slice(0, MAX_NAME_LENGTH),
    scheduledStartTime: new Date(event.start),
    scheduledEndTime: new Date(event.finish),
    privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
    entityType: GuildScheduledEventEntityType.External,
    entityMetadata: { location: event.location },
    description: buildDescription(event),
  };
}

/**
 * Adds a specific CTFtime event as a Discord scheduled event in the guild.
 * Returns { added: true } or { added: false, reason: 'duplicate' }.
 */
export async function addCtftimeEvent(guild, ctftimeId) {
  const existing = await getCtftimeEvent(guild.id, ctftimeId);
  if (existing) {
    return { added: false, reason: 'duplicate' };
  }

  const event = await fetchEvent(ctftimeId);
  const discordEvent = await guild.scheduledEvents.create(buildEventOptions(event));

  await insertCtftimeEvent({
    guildId: guild.id,
    ctftimeId: event.id,
    discordEventId: discordEvent.id,
  });

  logger.info({ guildId: guild.id, ctftimeId: event.id, discordEventId: discordEvent.id }, 'ctftime event created');
  return { added: true };
}

/**
 * Re-fetches all tracked CTFtime events for a guild and updates their
 * Discord scheduled events if the details have changed on CTFtime.
 * Returns { updated: number, skipped: number }.
 */
export async function refreshTrackedEvents(guild) {
  const tracked = await listTrackedEvents(guild.id);
  let updated = 0;
  let skipped = 0;

  for (const { ctftime_id, discord_event_id } of tracked) {
    try {
      const discordEvent = await guild.scheduledEvents.fetch(discord_event_id).catch(() => null);
      if (!discordEvent) {
        skipped += 1;
        continue;
      }

      // Skip events that have already ended or been cancelled
      if (discordEvent.isCompleted() || discordEvent.isCanceled()) {
        skipped += 1;
        continue;
      }

      const event = await fetchEvent(ctftime_id);
      await discordEvent.edit(buildEventOptions(event));
      updated += 1;
    } catch (err) {
      logger.warn({ err, guildId: guild.id, ctftimeId: ctftime_id }, 'failed to refresh ctftime event');
      skipped += 1;
    }
  }

  logger.info({ guildId: guild.id, updated, skipped }, 'ctftime refresh complete');
  return { updated, skipped };
}

/**
 * Refreshes tracked CTFtime events across all guilds the bot is in.
 * Per-guild errors are caught and logged so one failure doesn't block others.
 */
export async function refreshTrackedEventsForAllGuilds(client) {
  for (const guild of client.guilds.cache.values()) {
    try {
      await refreshTrackedEvents(guild);
    } catch (err) {
      logger.error({ err, guildId: guild.id }, 'ctftime refresh failed for guild');
    }
  }
}
