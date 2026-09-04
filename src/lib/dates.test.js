import { describe, it, expect, afterEach, vi } from 'vitest';
import { toIso, todayIso } from './dates.js';

describe('toIso', () => {
  it('formats year/month/day with zero-padding (month is 0-indexed input)', () => {
    expect(toIso(2026, 0, 5)).toBe('2026-01-05');
  });

  it('does not zero-pad the year', () => {
    expect(toIso(2026, 8, 4)).toBe('2026-09-04');
  });

  it('formats double-digit month and day without extra padding', () => {
    expect(toIso(2026, 11, 25)).toBe('2026-12-25');
  });
});

describe('todayIso', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses the local date, not the UTC date, in the evening (US timezone rollover)', () => {
    // 2026-09-04 22:00 US Pacific (UTC-7) == 2026-09-05 05:00 UTC.
    // If todayIso used toISOString() it would report the 5th, a day ahead.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-04T22:00:00-07:00'));

    expect(todayIso()).toBe('2026-09-04');
  });

  it('matches a plain local-date construction at a given instant', () => {
    vi.useFakeTimers();
    const instant = new Date('2026-01-15T12:00:00');
    vi.setSystemTime(instant);

    expect(todayIso()).toBe(toIso(instant.getFullYear(), instant.getMonth(), instant.getDate()));
  });
});
