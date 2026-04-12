import { config } from '../../config.js';
import { noopProvider } from './noopProvider.js';

function loadProviders() {
  const providers = { noop: noopProvider };
  if (config.AI_PROVIDER === 'digitalocean') {
    // Dynamic import so that noop mode doesn't need the openai package or env vars.
    return import('./digitalOceanProvider.js').then((mod) => {
      providers.digitalocean = mod.digitalOceanProvider;
      return providers;
    });
  }
  return Promise.resolve(providers);
}

const providers = await loadProviders();

export function getAiProvider() {
  const provider = providers[config.AI_PROVIDER];
  if (!provider) {
    throw new Error(`Unknown AI_PROVIDER: ${config.AI_PROVIDER}`);
  }
  return provider;
}
