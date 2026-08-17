<script>
  import { onMount } from 'svelte';
  import {
    getAdminLocations, createLocation, updateLocation,
    deleteLocation, setLocationDates
  } from '../../lib/api.js';

  // ─── Locations state ───
  let locations = $state([]);
  let newName = $state('');
  let newAddress = $state('');
  let error = $state('');
  let saving = $state(false);
  let expandedId = $state(null);

  // Calendar state for the expanded location
  let calendarYear = $state(new Date().getFullYear());
  let calendarMonth = $state(new Date().getMonth());

  onMount(() => {
    loadLocations();
  });

  async function loadLocations() {
    try {
      const data = await getAdminLocations();
      locations = data.locations;
    } catch (e) {
      error = e.message;
    }
  }

  async function handleAdd() {
    if (!newName.trim() || !newAddress.trim()) return;
    saving = true;
    error = '';
    try {
      await createLocation(newName.trim(), newAddress.trim());
      newName = '';
      newAddress = '';
      await loadLocations();
    } catch (e) {
      error = e.message;
    }
    saving = false;
  }

  async function handleToggle(loc) {
    try {
      await updateLocation(loc.id, { active: !loc.active });
      await loadLocations();
    } catch (e) {
      error = e.message;
    }
  }

  async function handleDelete(loc) {
    if (!confirm(`Delete "${loc.name}"?`)) return;
    try {
      await deleteLocation(loc.id);
      if (expandedId === loc.id) expandedId = null;
      await loadLocations();
    } catch (e) {
      error = e.message;
    }
  }

  async function handleSetDeleteAfter(loc, dateStr) {
    try {
      await updateLocation(loc.id, { delete_after: dateStr || null });
      await loadLocations();
    } catch (e) {
      error = e.message;
    }
  }

  function toggleExpand(locId) {
    if (expandedId === locId) {
      expandedId = null;
    } else {
      expandedId = locId;
      calendarYear = new Date().getFullYear();
      calendarMonth = new Date().getMonth();
    }
  }

  // Calendar helpers
  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfWeek(year, month) {
    return new Date(year, month, 1).getDay();
  }

  function toIso(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function prevMonth() {
    if (calendarMonth === 0) {
      calendarMonth = 11;
      calendarYear--;
    } else {
      calendarMonth--;
    }
  }

  function nextMonth() {
    if (calendarMonth === 11) {
      calendarMonth = 0;
      calendarYear++;
    } else {
      calendarMonth++;
    }
  }

  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  async function toggleDate(loc, dateStr) {
    const currentDates = loc.dates || [];
    let newDates;
    if (currentDates.includes(dateStr)) {
      newDates = currentDates.filter(d => d !== dateStr);
    } else {
      newDates = [...currentDates, dateStr];
    }
    try {
      await setLocationDates(loc.id, newDates);
      await loadLocations();
    } catch (e) {
      error = e.message;
    }
  }

  function isPast(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr + 'T00:00:00') < today;
  }
</script>

<section class="admin-section">
  <p class="section-desc">Manage locations and their operating dates. Tap a location to set its schedule.</p>

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}

  <form class="add-form" onsubmit={(e) => { e.preventDefault(); handleAdd(); }}>
    <div class="form-row">
      <div class="form-field">
        <label for="loc-name">Name</label>
        <input id="loc-name" type="text" bind:value={newName} placeholder="e.g. Community Center" />
      </div>
      <div class="form-field">
        <label for="loc-address">Address</label>
        <input id="loc-address" type="text" bind:value={newAddress} placeholder="e.g. 456 Oak Ave, City, ST" />
      </div>
    </div>
    <button type="submit" class="btn btn-add" disabled={saving || !newName.trim() || !newAddress.trim()}>
      {saving ? 'Adding...' : 'Add Location'}
    </button>
  </form>

  {#if locations.length === 0}
    <p class="empty">No locations yet. Add one above.</p>
  {:else}
    <ul class="location-list">
      {#each locations as loc (loc.id)}
        <li class="location-entry" class:inactive={!loc.active}>
          <div class="location-item">
            <button class="location-info-btn" onclick={() => toggleExpand(loc.id)}>
              <div class="location-info">
                <strong>{loc.name}</strong>
                <span class="location-address">{loc.address}</span>
                <span class="date-count">
                  {(loc.dates || []).filter(d => !isPast(d)).length} upcoming date{(loc.dates || []).filter(d => !isPast(d)).length === 1 ? '' : 's'}
                </span>
              </div>
              <span class="expand-arrow" class:expanded={expandedId === loc.id}>&#9660;</span>
            </button>
            <div class="location-actions">
              <button class="btn btn-toggle" onclick={() => handleToggle(loc)}>
                {loc.active ? 'Deactivate' : 'Activate'}
              </button>
              <button class="btn btn-delete" onclick={() => handleDelete(loc)}>Delete</button>
            </div>
          </div>

          {#if expandedId === loc.id}
            <div class="location-expanded">
              <!-- Scheduled deletion -->
              <div class="delete-schedule">
                <label for="delete-after-{loc.id}">Auto-delete after:</label>
                <input
                  id="delete-after-{loc.id}"
                  type="date"
                  value={loc.delete_after || ''}
                  onchange={(e) => handleSetDeleteAfter(loc, e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                {#if loc.delete_after}
                  <button class="btn btn-clear" onclick={() => handleSetDeleteAfter(loc, '')}>Clear</button>
                {/if}
              </div>

              <!-- Calendar -->
              <div class="calendar">
                <div class="calendar-header">
                  <button class="cal-nav" onclick={prevMonth}>&larr;</button>
                  <span class="cal-title">{MONTH_NAMES[calendarMonth]} {calendarYear}</span>
                  <button class="cal-nav" onclick={nextMonth}>&rarr;</button>
                </div>
                <div class="cal-weekdays">
                  {#each ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as day}
                    <span class="cal-weekday">{day}</span>
                  {/each}
                </div>
                <div class="cal-grid">
                  {#each Array(getFirstDayOfWeek(calendarYear, calendarMonth)) as _}
                    <span class="cal-empty"></span>
                  {/each}
                  {#each Array(getDaysInMonth(calendarYear, calendarMonth)) as _, i}
                    {@const dateStr = toIso(calendarYear, calendarMonth, i + 1)}
                    {@const isSelected = (loc.dates || []).includes(dateStr)}
                    {@const past = isPast(dateStr)}
                    <button
                      class="cal-day"
                      class:selected={isSelected}
                      class:past={past}
                      disabled={past}
                      aria-label="{MONTH_NAMES[calendarMonth]} {i + 1}, {calendarYear}"
                      aria-pressed={isSelected}
                      onclick={() => toggleDate(loc, dateStr)}
                    >
                      {i + 1}
                    </button>
                  {/each}
                </div>
              </div>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .admin-section {
    margin-bottom: var(--spacing-2xl);
  }

  .section-desc {
    color: var(--color-brown-mid);
    margin-bottom: var(--spacing-lg);
    font-size: 0.9375rem;
  }

  .error {
    color: var(--color-error);
    margin-bottom: var(--spacing-md);
    font-size: 0.9375rem;
  }

  /* ─── Add Form ─── */
  .add-form {
    background-color: var(--color-cream);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
    border: 1px solid var(--color-brown-light);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .form-field label {
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--color-brand-brown);
  }

  .form-field input {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-brown-light);
    border-radius: var(--radius-md);
    background-color: var(--color-white);
    min-height: var(--min-tap-target);
    font-size: 1rem;
  }

  .form-field input:focus {
    outline: 2px solid var(--color-brand-brown);
    outline-offset: 1px;
  }

  /* ─── Buttons ─── */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--min-tap-target);
    padding: var(--spacing-sm) var(--spacing-lg);
    border-radius: var(--radius-md);
    font-weight: 600;
    font-size: 0.9375rem;
    cursor: pointer;
    transition: opacity 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-add {
    background-color: var(--color-brand-brown);
    color: var(--color-cream);
    width: 100%;
  }

  .btn-toggle {
    background-color: var(--color-brown-mid);
    color: var(--color-cream);
    font-size: 0.8125rem;
    min-height: 36px;
    padding: var(--spacing-xs) var(--spacing-md);
  }

  .btn-delete {
    background-color: var(--color-error);
    color: var(--color-cream);
    font-size: 0.8125rem;
    min-height: 36px;
    padding: var(--spacing-xs) var(--spacing-md);
  }

  .btn-clear {
    background-color: var(--color-brown-light);
    color: var(--color-cream);
    font-size: 0.8125rem;
    min-height: 36px;
    padding: var(--spacing-xs) var(--spacing-md);
  }

  /* ─── Location List ─── */
  .location-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .location-entry {
    background-color: var(--color-cream);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-brown-light);
    overflow: hidden;
  }

  .location-entry.inactive {
    opacity: 0.55;
  }

  .location-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-lg);
  }

  .location-info-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    text-align: left;
    flex: 1;
    min-width: 0;
    min-height: var(--min-tap-target);
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    font-family: inherit;
  }

  .location-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .location-info strong {
    color: var(--color-brand-brown);
    font-size: 1rem;
  }

  .location-address {
    color: var(--color-brown-mid);
    font-size: 0.875rem;
  }

  .date-count {
    color: var(--color-brown-light);
    font-size: 0.8125rem;
  }

  .expand-arrow {
    font-size: 0.75rem;
    color: var(--color-brown-light);
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }

  .expand-arrow.expanded {
    transform: rotate(180deg);
  }

  .location-actions {
    display: flex;
    gap: var(--spacing-xs);
    flex-shrink: 0;
  }

  .empty {
    color: var(--color-brown-light);
    text-align: center;
    padding: var(--spacing-xl);
  }

  /* ─── Expanded Section ─── */
  .location-expanded {
    border-top: 1px solid var(--color-brown-light);
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  /* ─── Delete Schedule ─── */
  .delete-schedule {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }

  .delete-schedule label {
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--color-brand-brown);
  }

  .delete-schedule input[type="date"] {
    padding: var(--spacing-xs) var(--spacing-sm);
    border: 1px solid var(--color-brown-light);
    border-radius: var(--radius-md);
    background-color: var(--color-white);
    min-height: 36px;
    font-size: 0.875rem;
    font-family: inherit;
  }

  /* ─── Calendar ─── */
  .calendar {
    max-width: 340px;
  }

  .calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-sm);
  }

  .cal-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    background: none;
    border: 1px solid var(--color-brown-light);
    cursor: pointer;
    font-size: 1rem;
    color: var(--color-brand-brown);
  }

  .cal-title {
    font-family: var(--font-heading);
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-brand-brown);
  }

  .cal-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    margin-bottom: var(--spacing-xs);
  }

  .cal-weekday {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-brown-light);
    padding: var(--spacing-xs) 0;
  }

  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 3px;
  }

  .cal-empty {
    aspect-ratio: 1;
  }

  .cal-day {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    background: var(--color-white);
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--color-brand-brown);
    font-weight: 500;
    transition: background-color 0.1s ease;
  }

  .cal-day:hover:not(:disabled) {
    border-color: var(--color-brown-light);
  }

  .cal-day.selected {
    background-color: var(--color-brand-brown);
    color: var(--color-cream);
    font-weight: 700;
  }

  .cal-day.past {
    color: var(--color-brown-light);
    opacity: 0.4;
    cursor: not-allowed;
  }

  @media (min-width: 768px) {
    .form-row {
      grid-template-columns: 1fr 1fr;
    }

    .btn-add {
      width: auto;
    }
  }
</style>
