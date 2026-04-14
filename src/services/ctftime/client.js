import axios from 'axios';

export class CtftimeError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = 'CtftimeError';
    this.status = status;
    this.body = body;
  }
}

const CTFTIME_API = 'https://ctftime.org/api/v1';
const USER_AGENT =
  'pedro-discord-bot/1.0 (https://github.com/maximeconnolly/pedro-discord-bot)';

const http = axios.create({
  baseURL: CTFTIME_API,
  timeout: 15_000,
  headers: {
    'User-Agent': USER_AGENT,
    Accept: 'application/json',
  },
  validateStatus: () => true,
});

function normalizeEvent(raw) {
  return {
    id: raw.id,
    title: raw.title,
    url: raw.ctftime_url ?? raw.url,
    description: raw.description ?? '',
    start: raw.start,
    finish: raw.finish,
    isOnline: !raw.onsite,
    location: raw.onsite && raw.location ? raw.location : 'Online',
  };
}

export async function fetchEvent(ctftimeId) {
  const res = await http.get(`/events/${ctftimeId}/`);
  if (res.status === 404) {
    throw new CtftimeError(`CTFtime event ${ctftimeId} not found`, { status: 404 });
  }
  if (res.status < 200 || res.status >= 300) {
    throw new CtftimeError(`CTFtime API returned ${res.status} for event ${ctftimeId}`, {
      status: res.status,
      body: res.data,
    });
  }
  return normalizeEvent(res.data);
}
