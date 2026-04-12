import { ChannelType } from 'discord.js';

export const SOLVED_TAG_NAME = 'Solved';
const MAX_CHANNEL_NAME = 100;
const MAX_THREAD_NAME = 100;
const MAX_MESSAGE_CONTENT = 2000;

function sanitizeChannelName(name) {
  // Discord channel names: lowercase, no spaces, <=100 chars.
  const out = name
    .toLowerCase()
    .replace(/[^a-z0-9\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, MAX_CHANNEL_NAME);
  return out || 'ctf';
}

function truncate(str, max) {
  if (!str) return '';
  if (str.length <= max) return str;
  return `${str.slice(0, max - 1)}…`;
}

export function buildThreadName({ category, name, points }) {
  const cat = category ? `[${category}] ` : '';
  const pts = points != null ? ` (${points})` : '';
  return truncate(`${cat}${name}${pts}`, MAX_THREAD_NAME);
}

export function buildStarterMessage({ name, category, points, description, files }) {
  const lines = [`**${name}**`];
  const meta = [];
  if (category) meta.push(`Category: ${category}`);
  if (points != null) meta.push(`Points: ${points}`);
  if (meta.length) lines.push(meta.join(' • '));
  lines.push('');
  lines.push(description?.trim() ? description.trim() : '_No description provided._');
  if (files && files.length) {
    lines.push('');
    lines.push('**Files:**');
    for (const f of files) lines.push(`- ${f}`);
  }
  return truncate(lines.join('\n'), MAX_MESSAGE_CONTENT);
}

/**
 * Create the Discord surface area for a CTF:
 *   <Category "CTF name">
 *     ├─ #ctf-name             (text channel — commands run here)
 *     ├─ 🔊 ctf-name            (voice channel — team collab)
 *     └─ #ctf-name-challenges   (forum channel — one post per challenge)
 */
export async function createCtfChannels(guild, ctfName) {
  const sanitized = sanitizeChannelName(ctfName);
  const categoryName = truncate(ctfName, MAX_CHANNEL_NAME);

  const category = await guild.channels.create({
    name: categoryName,
    type: ChannelType.GuildCategory,
  });

  const textChannel = await guild.channels.create({
    name: sanitized,
    type: ChannelType.GuildText,
    parent: category.id,
    topic: `CTF: ${ctfName} — run /ctf sync here to pull challenges`,
  });

  const voiceChannel = await guild.channels.create({
    name: truncate(ctfName, MAX_CHANNEL_NAME),
    type: ChannelType.GuildVoice,
    parent: category.id,
  });

  const forumChannel = await guild.channels.create({
    name: sanitizeChannelName(`${sanitized}-challenges`),
    type: ChannelType.GuildForum,
    parent: category.id,
    topic: `Challenges for ${ctfName}`,
    availableTags: [{ name: SOLVED_TAG_NAME, moderated: false }],
  });

  return { category, textChannel, voiceChannel, forumChannel };
}

export function findSolvedTagId(forumChannel) {
  const tag = forumChannel.availableTags?.find((t) => t.name === SOLVED_TAG_NAME);
  return tag?.id ?? null;
}

export async function createChallengePost(forumChannel, challenge, { solved }) {
  const solvedTagId = findSolvedTagId(forumChannel);
  const thread = await forumChannel.threads.create({
    name: buildThreadName(challenge),
    message: { content: buildStarterMessage(challenge) },
    appliedTags: solved && solvedTagId ? [solvedTagId] : [],
  });
  return thread;
}

export async function updateChallengePost(forumChannel, threadId, challenge, { solved }) {
  const thread = await forumChannel.threads.fetch(threadId).catch(() => null);
  if (!thread) return null;

  const newName = buildThreadName(challenge);
  if (thread.name !== newName) {
    await thread.setName(newName).catch(() => {});
  }

  const starter = await thread.fetchStarterMessage().catch(() => null);
  if (starter) {
    const newContent = buildStarterMessage(challenge);
    if (starter.content !== newContent) {
      await starter.edit({ content: newContent }).catch(() => {});
    }
  }

  const solvedTagId = findSolvedTagId(forumChannel);
  if (solvedTagId) {
    const current = new Set(thread.appliedTags ?? []);
    const shouldHave = solved;
    const has = current.has(solvedTagId);
    if (shouldHave && !has) {
      current.add(solvedTagId);
      await thread.setAppliedTags([...current]).catch(() => {});
    } else if (!shouldHave && has) {
      current.delete(solvedTagId);
      await thread.setAppliedTags([...current]).catch(() => {});
    }
  }
  return thread;
}

/**
 * Rename the category with an "archived-" prefix and archive any active
 * forum threads so they fall out of the active list.
 */
export async function archiveCtfChannels(guild, { categoryId, forumChannelId }) {
  const forumChannel = await guild.channels.fetch(forumChannelId).catch(() => null);
  if (forumChannel) {
    const active = await forumChannel.threads.fetchActive().catch(() => null);
    if (active?.threads) {
      for (const [, thread] of active.threads) {
        await thread.setArchived(true).catch(() => {});
      }
    }
  }

  const category = await guild.channels.fetch(categoryId).catch(() => null);
  if (category && !category.name.startsWith('archived-')) {
    await category.setName(truncate(`archived-${category.name}`, MAX_CHANNEL_NAME)).catch(() => {});
  }
}
