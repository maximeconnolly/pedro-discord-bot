import axios from 'axios';

export class CtfdError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = 'CtfdError';
    this.status = status;
    this.body = body;
  }
}

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, '');
}

function absoluteFileUrl(baseUrl, file) {
  if (!file) return null;
  if (/^https?:\/\//i.test(file)) return file;
  return `${normalizeBaseUrl(baseUrl)}${file.startsWith('/') ? '' : '/'}${file}`;
}

export function createCtfdClient({ baseUrl, token }) {
  const base = normalizeBaseUrl(baseUrl);

  const http = axios.create({
    baseURL: `${base}/api/v1`,
    timeout: 15_000,
    headers: {
      Authorization: `Token ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    validateStatus: () => true,
  });

  async function request(method, path, config = {}) {
    const res = await http.request({ method, url: path, ...config });
    if (res.status < 200 || res.status >= 300) {
      throw new CtfdError(`CTFd ${method} ${path} returned ${res.status}`, {
        status: res.status,
        body: res.data,
      });
    }
    return res.data;
  }

  return {
    get baseUrl() {
      return base;
    },

    async getMe() {
      const body = await request('GET', '/users/me');
      return body?.data ?? null;
    },

    async getMyTeam() {
      // CTFd returns 400/404 when the instance is in user-mode or the user is teamless.
      try {
        const body = await request('GET', '/teams/me');
        return body?.data ?? null;
      } catch (err) {
        if (err instanceof CtfdError && (err.status === 400 || err.status === 404)) {
          return null;
        }
        throw err;
      }
    },

    async listChallenges() {
      const body = await request('GET', '/challenges');
      return (body?.data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        value: c.value ?? null,
      }));
    },

    async getChallenge(id) {
      const body = await request('GET', `/challenges/${id}`);
      const data = body?.data ?? null;
      if (!data) return null;
      const files = (data.files ?? []).map((f) => absoluteFileUrl(base, f));
      return {
        id: data.id,
        name: data.name,
        category: data.category,
        value: data.value ?? null,
        description: data.description ?? '',
        files,
      };
    },

    async listTeamSolves(teamId) {
      const body = await request('GET', `/teams/${teamId}/solves`);
      const solves = body?.data ?? [];
      return new Set(solves.map((s) => s.challenge_id ?? s.challenge?.id).filter(Boolean));
    },
  };
}
