<script>
  import { onMount } from 'svelte';
  import { getSettings, updateSetting } from '../../lib/api.js';

  // ─── Settings state ───
  let settings = $state({});
  let settingsLoading = $state(true);
  let settingsError = $state('');
  let savingSetting = $state(null);

  onMount(() => {
    loadSettings();
  });

  // ─── Settings logic ───
  async function loadSettings() {
    try {
      settings = await getSettings();
      settingsError = '';
    } catch (e) {
      settingsError = e.message;
    }
    settingsLoading = false;
  }

  async function handleUpdateSetting(key, value) {
    savingSetting = key;
    try {
      await updateSetting(key, value);
      settings = { ...settings, [key]: value };
      settingsError = '';
    } catch (e) {
      settingsError = e.message;
    }
    savingSetting = null;
  }
</script>

<section class="admin-section">
  {#if settingsError}
    <p class="error" role="alert">{settingsError}</p>
  {/if}

  {#if settingsLoading}
    <p class="loading-text">Loading settings...</p>
  {:else}
    <!-- Orders Toggle -->
    <h3 class="menu-heading">Order Acceptance</h3>
    <div class="setting-row">
      <div class="setting-info">
        <span class="setting-label">Accept Orders</span>
        <span class="setting-desc">When off, customers cannot submit new orders</span>
      </div>
      <button
        class="toggle-switch"
        class:on={settings.orders_accepting}
        role="switch"
        aria-checked={settings.orders_accepting}
        aria-label="Toggle order acceptance"
        disabled={savingSetting === 'orders_accepting'}
        onclick={() => handleUpdateSetting('orders_accepting', !settings.orders_accepting)}
      >
        <span class="toggle-knob"></span>
      </button>
    </div>

    <!-- Business Hours -->
    <h3 class="menu-heading">Business Hours</h3>
    <div class="hours-grid">
      <div class="field">
        <label for="hours-start">Opens at</label>
        <input
          id="hours-start"
          type="time"
          value={settings.business_hours_start || '08:00'}
          onchange={(e) => handleUpdateSetting('business_hours_start', e.target.value)}
          class="hours-input"
        />
      </div>
      <div class="field">
        <label for="hours-end">Closes at</label>
        <input
          id="hours-end"
          type="time"
          value={settings.business_hours_end || '17:00'}
          onchange={(e) => handleUpdateSetting('business_hours_end', e.target.value)}
          class="hours-input"
        />
      </div>
      <div class="field">
        <label for="slot-interval">Slot interval (minutes)</label>
        <input
          id="slot-interval"
          type="number"
          min="5"
          max="60"
          step="5"
          value={settings.slot_interval_minutes || 15}
          onchange={(e) => handleUpdateSetting('slot_interval_minutes', parseInt(e.target.value))}
          class="hours-input"
        />
      </div>
    </div>
  {/if}
</section>

<style>
  .admin-section {
    margin-bottom: var(--spacing-2xl);
  }

  .error {
    color: var(--color-error);
    margin-bottom: var(--spacing-md);
    font-size: 0.9375rem;
  }

  .loading-text {
    text-align: center;
    color: var(--color-brown-mid);
    padding: var(--spacing-2xl) 0;
  }

  .menu-heading {
    font-family: var(--font-heading);
    font-size: 1.125rem;
    color: var(--color-brand-brown);
    margin-top: var(--spacing-xl);
    margin-bottom: var(--spacing-sm);
  }

  .menu-heading:first-of-type {
    margin-top: 0;
  }

  /* ─── Settings Tab ─── */
  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--color-cream);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-brown-light);
    margin-bottom: var(--spacing-lg);
  }

  .setting-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .setting-label {
    font-weight: 600;
    color: var(--color-brand-brown);
  }

  .setting-desc {
    font-size: 0.8125rem;
    color: var(--color-brown-mid);
  }

  .hours-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
  }

  .hours-grid .field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .hours-grid .field:last-child {
    grid-column: 1 / -1;
  }

  .hours-grid label {
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--color-brand-brown);
  }

  .hours-input {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-brown-light);
    border-radius: var(--radius-md);
    background: var(--color-white);
    min-height: var(--min-tap-target);
    font-size: 1rem;
    font-family: inherit;
  }

  .hours-input:focus {
    outline: 2px solid var(--color-brand-brown);
    outline-offset: 1px;
  }

  /* ─── Toggle Switch ─── */
  .toggle-switch {
    position: relative;
    width: 52px;
    height: 30px;
    border-radius: var(--radius-full);
    background: var(--color-brown-light);
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color 0.2s ease;
    padding: 0;
  }

  .toggle-switch.on {
    background: var(--color-success);
  }

  .toggle-switch:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .toggle-knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: white;
    transition: transform 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .toggle-switch.on .toggle-knob {
    transform: translateX(22px);
  }
</style>
