import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { authToken } from '../stores/auth.js';
import { getMenu } from './api.js';

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body)
  };
}

describe('api.js 401 handling', () => {
  beforeEach(() => {
    authToken.set('a-valid-token');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    authToken.set(null);
  });

  it('clears the auth token before throwing on a 401 response', async () => {
    global.fetch.mockResolvedValue(jsonResponse(401, { error: 'Token expired' }));

    await expect(getMenu()).rejects.toThrow('Token expired');
    expect(get(authToken)).toBeNull();
  });

  it('preserves err.status and err.code on a 401 error', async () => {
    global.fetch.mockResolvedValue(jsonResponse(401, { error: 'Token expired' }));

    await getMenu().catch((err) => {
      expect(err.status).toBe(401);
      expect(err.code).toBe('http');
    });
  });

  it('does not clear the auth token on a non-401 error (e.g. 500)', async () => {
    global.fetch.mockResolvedValue(jsonResponse(500, { error: 'Server error' }));

    await expect(getMenu()).rejects.toThrow('Server error');
    expect(get(authToken)).toBe('a-valid-token');
  });

  it('does not clear the auth token on a 404 error', async () => {
    global.fetch.mockResolvedValue(jsonResponse(404, { error: 'Not found' }));

    await expect(getMenu()).rejects.toThrow('Not found');
    expect(get(authToken)).toBe('a-valid-token');
  });

  it('leaves a previously-set token intact on a successful (2xx) response', async () => {
    global.fetch.mockResolvedValue(jsonResponse(200, { items: [] }));

    const result = await getMenu();
    expect(result).toEqual({ items: [] });
    expect(get(authToken)).toBe('a-valid-token');
  });
});
