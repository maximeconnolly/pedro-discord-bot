import { z } from 'zod';

const schema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_ID is required'),
  DISCORD_GUILD_ID: z.string().optional(),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  LOG_LEVEL: z.string().default('info'),
  AI_PROVIDER: z.enum(['noop', 'digitalocean']).default('noop'),
  AI_BASE_URL: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('meta-llama/Meta-Llama-3.1-8B-Instruct'),
  NODE_ENV: z.string().default('production'),
});

async function loadConfig() {
  if (process.env.NODE_ENV !== 'production') {
    try {
      const dotenv = await import('dotenv');
      dotenv.config();
    } catch {
      // dotenv not installed in prod image — ignore
    }
  }

  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    console.error(`Invalid environment:\n${messages}`);
    process.exit(1);
  }
  return parsed.data;
}

// Top-level await: Node 20 ESM.
export const config = await loadConfig();
