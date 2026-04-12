import { ready } from './events/ready.js';
import { interactionCreate } from './events/interactionCreate.js';
import { messageCreate } from './events/messageCreate.js';

export function registerEvents(client, context) {
  client.once(ready.name, (...args) => ready.execute(context, ...args));
  client.on(interactionCreate.name, (...args) => interactionCreate.execute(context, ...args));
  client.on(messageCreate.name, (...args) => messageCreate.execute(context, ...args));
}
