// Local calendar date formatting — toISOString() is UTC and jumps a day
// ahead in US evenings, which would block picking today on the calendar.
export function toIso(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function todayIso() {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth(), now.getDate());
}
