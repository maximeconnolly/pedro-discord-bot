import OpenAI from 'openai';
import { config } from '../../config.js';
import { logger } from '../../logger.js';

const SYSTEM_PROMPT = {
  role: 'system',
  content:
    'You are Pedro, a helpful assistant for a CTF (Capture The Flag) team. ' +
    'You help with CTF challenges, coding exploits, explaining security concepts, ' +
    'decoding payloads, analysing binaries, and general conversation. ' +
    'Be concise but thorough. When discussing exploits or vulnerabilities, ' +
    'provide practical guidance the team can act on.',
};

function createProvider() {
  if (!config.AI_BASE_URL || !config.AI_API_KEY) {
    throw new Error(
      'AI_PROVIDER=digitalocean requires AI_BASE_URL and AI_API_KEY to be set.',
    );
  }

  const client = new OpenAI({
    baseURL: config.AI_BASE_URL,
    apiKey: config.AI_API_KEY,
  });

  return {
    name: 'digitalocean',

    async chat(messages) {
      try {
        const completion = await client.chat.completions.create({
          model: config.AI_MODEL,
          messages: [SYSTEM_PROMPT, ...messages],
          max_tokens: 8192,
        });
        const text = completion.choices?.[0]?.message?.content ?? '';
        return text.trim() || '(no response)';
      } catch (err) {
        logger.error({ err }, 'digitalocean ai request failed');
        return 'Sorry, I couldn\'t reach the AI service right now. Try again in a moment.';
      }
    },
  };
}

export const digitalOceanProvider = createProvider();
