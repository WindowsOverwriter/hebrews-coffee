import { describe, it, expect } from 'vitest';
import { createLatestWins } from './latestWins.js';

// Mirrors the shape of AdminOrders.svelte's loadOrders(): start a token,
// await a fetch-like promise, and only apply the result if still current.
function makeLoader(guard, state) {
  return async function load(fetchPromise) {
    const token = guard.start();
    try {
      const data = await fetchPromise;
      if (!guard.isCurrent(token)) return;
      state.orders = data;
      state.error = null;
    } catch (e) {
      if (!guard.isCurrent(token)) return;
      state.error = e.message;
    }
    state.loading = false;
  };
}

describe('createLatestWins', () => {
  it('drops a stale (earlier-started) response that resolves after a newer one', async () => {
    const guard = createLatestWins();
    const state = { orders: null, error: null, loading: true };
    const load = makeLoader(guard, state);

    let resolveFirst, resolveSecond;
    const first = new Promise((res) => { resolveFirst = res; });
    const second = new Promise((res) => { resolveSecond = res; });

    // Kick off the "poll" first, then a "manual refetch" starts before it resolves.
    const firstCall = load(first);
    const secondCall = load(second);

    // The newer call resolves first (simulating the poll being slow).
    resolveSecond(['fresh-order']);
    await secondCall;
    expect(state.orders).toEqual(['fresh-order']);
    expect(state.loading).toBe(false);

    // The stale call resolves after — it must not overwrite state.
    resolveFirst(['stale-order']);
    await firstCall;
    expect(state.orders).toEqual(['fresh-order']);
  });

  it('applies the result when only one call is in flight', async () => {
    const guard = createLatestWins();
    const state = { orders: null, error: null, loading: true };
    const load = makeLoader(guard, state);

    await load(Promise.resolve(['only-order']));
    expect(state.orders).toEqual(['only-order']);
    expect(state.loading).toBe(false);
  });

  it('drops a stale error just like a stale success', async () => {
    const guard = createLatestWins();
    const state = { orders: null, error: null, loading: true };
    const load = makeLoader(guard, state);

    let rejectFirst, resolveSecond;
    const first = new Promise((_, rej) => { rejectFirst = rej; });
    const second = new Promise((res) => { resolveSecond = res; });

    const firstCall = load(first);
    const secondCall = load(second);

    resolveSecond(['fresh-order']);
    await secondCall;

    rejectFirst(new Error('stale network error'));
    await firstCall;

    expect(state.error).toBeNull();
    expect(state.orders).toEqual(['fresh-order']);
  });

  it('isCurrent reflects the most recently started token', () => {
    const guard = createLatestWins();
    const tokenA = guard.start();
    expect(guard.isCurrent(tokenA)).toBe(true);
    const tokenB = guard.start();
    expect(guard.isCurrent(tokenA)).toBe(false);
    expect(guard.isCurrent(tokenB)).toBe(true);
  });
});
