// Client-side file download helpers. The session export JSON is the only
// record that survives an End Session reset, so this is how the admin keeps it.

/** `hebrews-period-<periodId>-<YYYY-MM-DD>.json`; periodId falls back to
 * 'unknown' and the date to today when the export carries none. */
export function exportFilename(exportData, now = new Date()) {
  const periodId = exportData?.period?.id ?? 'unknown';
  const stamp = exportData?.period?.ended_at || exportData?.period?.started_at;
  const date = stamp ? new Date(stamp) : now;
  const iso = Number.isNaN(date.getTime()) ? now : date;
  const y = iso.getFullYear();
  const m = String(iso.getMonth() + 1).padStart(2, '0');
  const d = String(iso.getDate()).padStart(2, '0');
  return `hebrews-period-${periodId}-${y}-${m}-${d}.json`;
}

/** Pretty-printed JSON text for a download. */
export function serializeExport(data) {
  return JSON.stringify(data, null, 2);
}

/** Trigger a browser download of `data` as JSON. Browser-only. */
export function downloadJson(filename, data) {
  const blob = new Blob([serializeExport(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
