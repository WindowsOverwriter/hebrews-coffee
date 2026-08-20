<script>
  import { onMount } from 'svelte';
  import {
    getAdminMenu, createDrink, deleteDrink, setDrinkCustomizationTypes,
    setDrinkCustomizationOptions,
    toggleDrink, toggleCustomization,
    createCustomization, updateCustomization, deleteCustomization
  } from '../../lib/api.js';
  import { ALL_CUSTOMIZATION_TYPES, CUSTOMIZATION_TYPE_LABELS } from '../../lib/constants.js';

  // ─── Menu state ───
  let menuDrinks = $state([]);
  let menuCustomizations = $state({});
  let menuLoading = $state(true);
  let menuError = $state('');
  let togglingId = $state(null);
  let expandedDrinkId = $state(null);
  let newDrinkName = $state('');
  let newDrinkDesc = $state('');
  let newDrinkRatio = $state('');
  let addingDrink = $state(false);

  // ─── Customization option CRUD state ───
  let newOptionLabels = $state({});
  let editingOptionId = $state(null);
  let editingLabel = $state('');
  let addingOptionType = $state(null);

  // Per-drink option allowlist state (key: `${drink.id}-${type}`)
  let savingOptionOverride = $state(null);

  onMount(() => {
    loadMenu();
  });

  // ─── Menu logic ───
  async function loadMenu() {
    try {
      const data = await getAdminMenu();
      menuDrinks = data.drinks || [];
      menuCustomizations = data.customizations || {};
      menuError = '';
    } catch (e) {
      menuError = e.message;
    }
    menuLoading = false;
  }

  async function handleToggleDrink(drink) {
    togglingId = `drink-${drink.id}`;
    try {
      await toggleDrink(drink.id, !drink.enabled);
      await loadMenu();
    } catch (e) {
      menuError = e.message;
    }
    togglingId = null;
  }

  async function handleToggleCustomization(opt) {
    togglingId = `opt-${opt.id}`;
    try {
      await toggleCustomization(opt.id, !opt.enabled);
      await loadMenu();
    } catch (e) {
      menuError = e.message;
    }
    togglingId = null;
  }

  async function handleAddDrink() {
    if (!newDrinkName.trim()) return;
    addingDrink = true;
    try {
      await createDrink({
        name: newDrinkName.trim(),
        description: newDrinkDesc.trim(),
        ratio_summary: newDrinkRatio.trim()
      });
      newDrinkName = '';
      newDrinkDesc = '';
      newDrinkRatio = '';
      await loadMenu();
    } catch (e) {
      menuError = e.message;
    }
    addingDrink = false;
  }

  async function handleDeleteDrink(drink) {
    if (!confirm(`Delete "${drink.name}"? This cannot be undone.`)) return;
    try {
      await deleteDrink(drink.id);
      if (expandedDrinkId === drink.id) expandedDrinkId = null;
      await loadMenu();
    } catch (e) {
      menuError = e.message;
    }
  }

  async function handleToggleType(drink, type) {
    const current = drink.customization_types || [];
    const newTypes = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    togglingId = `type-${drink.id}-${type}`;
    try {
      await setDrinkCustomizationTypes(drink.id, newTypes);
      await loadMenu();
    } catch (e) {
      menuError = e.message;
    }
    togglingId = null;
  }

  // ─── Customization option handlers ───
  async function handleAddOption(type) {
    const label = (newOptionLabels[type] || '').trim();
    if (!label) return;
    addingOptionType = type;
    try {
      await createCustomization(type, label);
      newOptionLabels[type] = '';
      menuError = '';
      await loadMenu();
    } catch (e) {
      menuError = e.message;
    }
    addingOptionType = null;
  }

  function handleStartEditOption(opt) {
    editingOptionId = opt.id;
    editingLabel = opt.label;
  }

  function handleCancelEditOption() {
    editingOptionId = null;
    editingLabel = '';
  }

  async function handleSaveEditOption(opt) {
    const label = editingLabel.trim();
    if (!label || label === opt.label) {
      handleCancelEditOption();
      return;
    }
    try {
      await updateCustomization(opt.id, { label });
      menuError = '';
      handleCancelEditOption();
      await loadMenu();
    } catch (e) {
      menuError = e.message;
    }
  }

  async function handleDeleteOption(opt) {
    if (!confirm(`Delete "${opt.label}"? This cannot be undone.`)) return;
    try {
      await deleteCustomization(opt.id);
      menuError = '';
      await loadMenu();
    } catch (e) {
      menuError = e.message;
    }
  }

  // ─── Per-drink option allowlist ───
  function enabledOptionIdsForType(type) {
    return (menuCustomizations[type] || []).filter(o => o.enabled).map(o => o.id);
  }

  function allowedIdsFor(drink, type) {
    const override = drink.allowed_customization_options?.[type];
    // Absence of an override means "all enabled options apply" — mirror the
    // implicit set so checkboxes render pre-checked.
    return new Set(override ?? enabledOptionIdsForType(type));
  }

  async function handleToggleAllowed(drink, type, optionId) {
    const current = allowedIdsFor(drink, type);
    const next = new Set(current);
    if (next.has(optionId)) next.delete(optionId);
    else next.add(optionId);

    if (next.size === 0) {
      menuError = 'Each active customization type needs at least one allowed option.';
      return;
    }

    // If the resulting set covers every enabled option of this type, clear the
    // override — same customer-facing result, less noise in storage.
    const allEnabled = new Set(enabledOptionIdsForType(type));
    const isFullSet = next.size === allEnabled.size && [...next].every(id => allEnabled.has(id));

    const overrides = { ...(drink.allowed_customization_options || {}) };
    if (isFullSet) delete overrides[type];
    else overrides[type] = [...next];

    savingOptionOverride = `${drink.id}-${type}`;
    try {
      await setDrinkCustomizationOptions(drink.id, overrides);
      menuError = '';
      await loadMenu();
    } catch (e) {
      menuError = e.message;
    }
    savingOptionOverride = null;
  }
</script>

<section class="admin-section">
  {#if menuError}
    <p class="error" role="alert">{menuError}</p>
  {/if}

  {#if menuLoading}
    <p class="loading-text">Loading menu...</p>
  {:else}
    <!-- Add Drink -->
    <h3 class="menu-heading">Drinks</h3>
    <form class="add-drink-form" onsubmit={(e) => { e.preventDefault(); handleAddDrink(); }} aria-label="Add drink">
      <input
        type="text"
        placeholder="Drink name"
        aria-label="Drink name"
        bind:value={newDrinkName}
        class="add-drink-input"
      />
      <input
        type="text"
        placeholder="Description"
        aria-label="Drink description"
        bind:value={newDrinkDesc}
        class="add-drink-input"
      />
      <input
        type="text"
        placeholder="Ratio summary (shown on menu card)"
        aria-label="Ratio summary shown on menu card"
        bind:value={newDrinkRatio}
        class="add-drink-input"
      />
      <button type="submit" class="btn btn-add-drink" disabled={addingDrink || !newDrinkName.trim()}>
        {addingDrink ? 'Adding...' : 'Add Drink'}
      </button>
    </form>

    <!-- Drink List -->
    <ul class="menu-list">
      {#each menuDrinks as drink (drink.id)}
        <li class="menu-item-wrap">
          <div class="menu-item" class:disabled={!drink.enabled}>
            <button
              class="menu-item-expand"
              aria-expanded={expandedDrinkId === drink.id}
              aria-controls="drink-panel-{drink.id}"
              onclick={() => expandedDrinkId = expandedDrinkId === drink.id ? null : drink.id}
            >
              <div class="menu-item-info">
                <span class="menu-item-name">{drink.name}</span>
                <span class="menu-item-desc">{drink.ratio_summary || drink.description}</span>
                <span class="menu-item-types">
                  {(drink.customization_types || []).map(t => CUSTOMIZATION_TYPE_LABELS[t] || t).join(', ') || 'No customizations'}
                </span>
              </div>
              <span class="expand-arrow" class:expanded={expandedDrinkId === drink.id}>&#9660;</span>
            </button>
            <div class="menu-item-controls">
              <button
                class="toggle-switch"
                class:on={drink.enabled}
                role="switch"
                aria-checked={drink.enabled}
                aria-label="Toggle {drink.name}"
                disabled={togglingId === `drink-${drink.id}`}
                onclick={() => handleToggleDrink(drink)}
              >
                <span class="toggle-knob"></span>
              </button>
              <button class="btn btn-delete-sm" onclick={() => handleDeleteDrink(drink)} aria-label="Delete {drink.name}">&times;</button>
            </div>
          </div>

          {#if expandedDrinkId === drink.id}
            <div class="drink-types-panel" id="drink-panel-{drink.id}">
              <p class="drink-types-label">Customization types for this drink:</p>
              <div class="drink-types-grid">
                {#each ALL_CUSTOMIZATION_TYPES as type}
                  {@const active = (drink.customization_types || []).includes(type)}
                  <button
                    class="type-chip"
                    class:active
                    disabled={togglingId === `type-${drink.id}-${type}`}
                    onclick={() => handleToggleType(drink, type)}
                  >
                    {CUSTOMIZATION_TYPE_LABELS[type] || type}
                  </button>
                {/each}
              </div>

              {#if (drink.customization_types || []).length > 0}
                <p class="drink-options-label">Which options apply to this drink:</p>
                {#each drink.customization_types as type}
                  {@const typeOptions = (menuCustomizations[type] || []).filter(o => o.enabled)}
                  {#if typeOptions.length > 0}
                    {@const allowed = allowedIdsFor(drink, type)}
                    {@const saving = savingOptionOverride === `${drink.id}-${type}`}
                    <fieldset class="drink-options-group">
                      <legend class="drink-options-heading">{CUSTOMIZATION_TYPE_LABELS[type] || type}</legend>
                      <div class="drink-options-grid">
                        {#each typeOptions as opt (opt.id)}
                          <label class="option-check">
                            <input
                              type="checkbox"
                              checked={allowed.has(opt.id)}
                              disabled={saving}
                              onchange={() => handleToggleAllowed(drink, type, opt.id)}
                            />
                            <span>{opt.label}</span>
                          </label>
                        {/each}
                      </div>
                    </fieldset>
                  {/if}
                {/each}
              {/if}
            </div>
          {/if}
        </li>
      {/each}
    </ul>

    <!-- Customization Options -->
    {#each ALL_CUSTOMIZATION_TYPES as type}
      {@const options = menuCustomizations[type] || []}
      <h3 class="menu-heading">{CUSTOMIZATION_TYPE_LABELS[type] || type}</h3>
      <ul class="menu-list">
        {#each options as opt (opt.id)}
          <li class="menu-item-wrap">
            {#if editingOptionId === opt.id}
              <form
                class="menu-item edit-mode"
                onsubmit={(e) => { e.preventDefault(); handleSaveEditOption(opt); }}
              >
                <input
                  type="text"
                  class="edit-input"
                  bind:value={editingLabel}
                  aria-label="Rename {opt.label}"
                  maxlength="100"
                />
                <div class="menu-item-controls">
                  <button type="submit" class="btn-inline">Save</button>
                  <button
                    type="button"
                    class="btn-inline btn-inline-secondary"
                    onclick={handleCancelEditOption}
                  >Cancel</button>
                </div>
              </form>
            {:else}
              <div class="menu-item" class:disabled={!opt.enabled}>
                <div class="menu-item-info">
                  <span class="menu-item-name">{opt.label}</span>
                </div>
                <div class="menu-item-controls">
                  <button
                    class="btn-icon"
                    onclick={() => handleStartEditOption(opt)}
                    aria-label="Rename {opt.label}"
                    title="Rename"
                  >&#9998;</button>
                  <button
                    class="toggle-switch"
                    class:on={opt.enabled}
                    role="switch"
                    aria-checked={opt.enabled}
                    aria-label="Toggle {opt.label}"
                    disabled={togglingId === `opt-${opt.id}`}
                    onclick={() => handleToggleCustomization(opt)}
                  >
                    <span class="toggle-knob"></span>
                  </button>
                  <button
                    class="btn-delete-sm"
                    onclick={() => handleDeleteOption(opt)}
                    aria-label="Delete {opt.label}"
                  >&times;</button>
                </div>
              </div>
            {/if}
          </li>
        {/each}
      </ul>

      <form
        class="add-option-form"
        onsubmit={(e) => { e.preventDefault(); handleAddOption(type); }}
        aria-label="Add {CUSTOMIZATION_TYPE_LABELS[type] || type} option"
      >
        <input
          type="text"
          class="add-option-input"
          placeholder="New {CUSTOMIZATION_TYPE_LABELS[type] || type} option"
          aria-label="New {CUSTOMIZATION_TYPE_LABELS[type] || type} option label"
          bind:value={newOptionLabels[type]}
          maxlength="100"
        />
        <button
          type="submit"
          class="btn btn-add-option"
          disabled={addingOptionType === type || !(newOptionLabels[type] || '').trim()}
        >
          {addingOptionType === type ? 'Adding...' : 'Add'}
        </button>
      </form>
    {/each}
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

  /* ─── Menu Tab ─── */
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

  .add-drink-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
    padding: var(--spacing-lg);
    background: var(--color-cream);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-brown-light);
  }

  .add-drink-input {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-brown-light);
    border-radius: var(--radius-md);
    background: var(--color-white);
    min-height: 40px;
    font-size: 0.9375rem;
  }

  .add-drink-input:focus {
    outline: 2px solid var(--color-brand-brown);
    outline-offset: 1px;
  }

  .btn-add-drink {
    background: var(--color-brand-brown);
    color: var(--color-cream);
    min-height: var(--min-tap-target);
    border-radius: var(--radius-md);
    font-weight: 600;
  }

  .menu-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 1px;
    background: var(--color-brown-light);
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--color-brown-light);
  }

  .menu-item-wrap {
    background: var(--color-white);
  }

  .menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-lg);
    min-height: var(--min-tap-target);
    transition: opacity 0.15s ease;
  }

  .menu-item.disabled {
    opacity: 0.5;
  }

  .menu-item-expand {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex: 1;
    min-width: 0;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    padding: 0;
    font-family: inherit;
  }

  .menu-item-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex-shrink: 0;
  }

  .btn-delete-sm {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    background: none;
    border: 1px solid var(--color-error);
    color: var(--color-error);
    font-size: 1.25rem;
    cursor: pointer;
  }

  .menu-item-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .menu-item-name {
    font-weight: 600;
    color: var(--color-brand-brown);
  }

  .menu-item-desc {
    font-size: 0.8125rem;
    color: var(--color-brown-mid);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .menu-item-types {
    font-size: 0.75rem;
    color: var(--color-brown-light);
  }

  /* ─── Drink Types Panel ─── */
  .drink-types-panel {
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--color-cream);
    border-top: 1px solid var(--color-brown-light);
  }

  .drink-types-label {
    font-size: 0.8125rem;
    color: var(--color-brown-mid);
    margin-bottom: var(--spacing-sm);
  }

  .drink-types-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  .type-chip {
    padding: var(--spacing-sm) var(--spacing-md);
    min-height: 40px;
    border-radius: var(--radius-full);
    border: 2px solid var(--color-brown-light);
    background: var(--color-white);
    color: var(--color-brown-mid);
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .type-chip.active {
    border-color: var(--color-brand-brown);
    background: var(--color-brand-brown);
    color: var(--color-cream);
  }

  .type-chip:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

  .expand-arrow {
    font-size: 0.75rem;
    color: var(--color-brown-light);
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }

  .expand-arrow.expanded {
    transform: rotate(180deg);
  }

  /* ─── Per-drink option allowlist ─── */
  .drink-options-label {
    font-size: 0.8125rem;
    color: var(--color-brown-mid);
    margin-top: var(--spacing-md);
    margin-bottom: var(--spacing-sm);
  }

  .drink-options-group {
    border: 1px solid var(--color-brown-light);
    border-radius: var(--radius-md);
    padding: var(--spacing-sm) var(--spacing-md);
    margin: 0 0 var(--spacing-sm);
    background: var(--color-white);
  }

  .drink-options-heading {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-brand-brown);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0 var(--spacing-xs);
  }

  .drink-options-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-xs);
  }

  .option-check {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: var(--radius-full);
    background: var(--color-cream);
    color: var(--color-brown-mid);
    font-size: 0.875rem;
    cursor: pointer;
    min-height: 36px;
    user-select: none;
  }

  .option-check input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: var(--color-brand-brown);
    cursor: pointer;
  }

  .option-check:has(input:checked) {
    background: color-mix(in srgb, var(--color-brand-brown) 10%, var(--color-cream));
    color: var(--color-brand-brown);
    font-weight: 600;
  }

  /* ─── Customization option edit / add ─── */
  .menu-item.edit-mode {
    gap: var(--spacing-sm);
  }

  .edit-input {
    flex: 1;
    min-width: 0;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-brand-brown);
    border-radius: var(--radius-md);
    background: var(--color-white);
    min-height: 36px;
    font-size: 0.9375rem;
    font-family: inherit;
    color: var(--color-brand-brown);
  }

  .edit-input:focus {
    outline: 2px solid var(--color-brand-brown);
    outline-offset: 1px;
  }

  .btn-inline {
    padding: 0 var(--spacing-md);
    min-height: 36px;
    border-radius: var(--radius-md);
    background: var(--color-brand-brown);
    color: var(--color-cream);
    border: none;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .btn-inline-secondary {
    background: none;
    color: var(--color-brown-mid);
    border: 1px solid var(--color-brown-light);
  }

  .btn-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    background: none;
    border: 1px solid var(--color-brown-light);
    color: var(--color-brown-mid);
    font-size: 1rem;
    cursor: pointer;
  }

  .add-option-form {
    display: flex;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-sm);
    margin-bottom: var(--spacing-xl);
    padding: var(--spacing-md);
    background: var(--color-cream);
    border-radius: var(--radius-md);
    border: 1px dashed var(--color-brown-light);
  }

  .add-option-input {
    flex: 1;
    min-width: 0;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-brown-light);
    border-radius: var(--radius-md);
    background: var(--color-white);
    min-height: 40px;
    font-size: 0.9375rem;
    font-family: inherit;
  }

  .add-option-input:focus {
    outline: 2px solid var(--color-brand-brown);
    outline-offset: 1px;
  }

  .btn-add-option {
    background: var(--color-brand-brown);
    color: var(--color-cream);
    padding: 0 var(--spacing-lg);
    min-height: var(--min-tap-target);
    border-radius: var(--radius-md);
    border: none;
    font-weight: 600;
    font-size: 0.9375rem;
    cursor: pointer;
  }

  .btn-add-option:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
