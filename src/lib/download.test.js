import { describe, it, expect } from 'vitest';
import { exportFilename, serializeExport } from './download.js';

describe('exportFilename', () => {
  it('uses the period id and the ended_at date', () => {
    const name = exportFilename({ period: { id: 7, started_at: '2026-10-01T15:00:00+00:00', ended_at: '2026-10-06T20:30:00+00:00' } });
    expect(name).toMatch(/^hebrews-period-7-2026-10-0[67]\.json$/);
  });

  it('falls back to started_at for a preview (ended_at null)', () => {
    const name = exportFilename({ period: { id: 3, started_at: '2026-09-04T12:00:00+00:00', ended_at: null } });
    expect(name).toMatch(/^hebrews-period-3-2026-09-0[45]\.json$/);
  });

  it('falls back to "unknown" and the supplied date when there is no period', () => {
    const name = exportFilename({ period: null, orders: [] }, new Date(2026, 0, 5));
    expect(name).toBe('hebrews-period-unknown-2026-01-05.json');
  });
});

describe('serializeExport', () => {
  it('pretty-prints with two-space indentation', () => {
    const text = serializeExport({ a: 1, b: [2] });
    expect(text).toBe('{\n  "a": 1,\n  "b": [\n    2\n  ]\n}');
  });
});
