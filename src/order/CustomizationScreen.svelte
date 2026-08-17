<script>
  import SegmentedToggle from '../components/ui/SegmentedToggle.svelte';
  import CylinderPicker from '../components/ui/CylinderPicker.svelte';

  let { drink, customizations, onAddToCart, onBack } = $props();

  // Initialize selections with defaults
  let temperature = $state('');
  let espressoType = $state('');
  let milkType = $state('');
  let syrup = $state('');
  let syrupPumps = $state(2);
  let specialInstructions = $state('');

  const SYRUP_PUMPS_DEFAULT = 2;
  const SYRUP_PUMPS_MAX = 6;

  // Only show customization types attached to this drink (fall back to all if none set)
  let drinkTypes = $derived(drink.customization_types || []);
  let hasType = (type) => drinkTypes.length === 0 || drinkTypes.includes(type);

  // Derive available options from customizations prop, filtered by drink's types
  let temperatureOptions = $derived(
    hasType('temperature') ? (customizations.temperature || []).map(c => c.label) : []
  );
  let espressoOptions = $derived(
    hasType('espresso_type') ? (customizations.espresso_type || []).map(c => c.label) : []
  );
  let milkOptions = $derived(
    hasType('milk_type') ? (customizations.milk_type || []).map(c => c.label) : []
  );
  let syrupOptions = $derived(
    hasType('syrup') ? (customizations.syrup || []).map(c => c.label) : []
  );
  const SYRUP_NONE_LABEL = 'None';
  let syrupWheelOptions = $derived(
    syrupOptions.length ? [SYRUP_NONE_LABEL, ...syrupOptions] : []
  );
  let syrupWheelValue = $derived(syrup || SYRUP_NONE_LABEL);

  function handleSyrupChange(next) {
    if (next === SYRUP_NONE_LABEL) {
      syrup = '';
      syrupPumps = SYRUP_PUMPS_DEFAULT;
    } else {
      syrup = next;
    }
  }
  // Set defaults when options load
  $effect(() => {
    if (temperatureOptions.length && !temperature) {
      temperature = temperatureOptions[0];
    }
  });
  $effect(() => {
    if (espressoOptions.length && !espressoType) {
      espressoType = espressoOptions[0];
    }
  });
  $effect(() => {
    if (milkOptions.length && !milkType) {
      milkType = milkOptions[0];
    }
  });

  function adjustPumps(delta) {
    syrupPumps = Math.max(1, Math.min(SYRUP_PUMPS_MAX, syrupPumps + delta));
  }

  function handleAddToCart() {
    onAddToCart({
      drinkId: drink.id,
      drinkName: drink.name,
      ratioSummary: drink.ratio_summary,
      customizations: {
        temperature,
        espresso_type: espressoType,
        milk_type: milkType,
        syrup: syrup || null,
        syrup_pumps: syrup ? syrupPumps : null,
        special_instructions: specialInstructions.trim() || null
      }
    });
  }
</script>

<div class="customization-screen">
  <div class="custom-header">
    <button type="button" class="back-btn" onclick={onBack} aria-label="Back to menu">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>
    <div class="drink-heading">
      <h2 class="drink-title">{drink.name}</h2>
      {#if drink.ratio_summary}
        <p class="drink-ratio">{drink.ratio_summary}</p>
      {/if}
    </div>
  </div>

  <!-- M24: persistent live region for pump count so screen readers announce
       updates from the initial value onward, not just after the +/- controls
       are inserted into the DOM. -->
  <div class="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
    {#if syrup}
      {syrup}, {syrupPumps} pump{syrupPumps === 1 ? '' : 's'}
    {/if}
  </div>

  <div class="custom-body">
    {#if temperatureOptions.length > 0}
      <section class="option-group">
        <h3 class="option-label">Temperature</h3>
        <SegmentedToggle
          options={temperatureOptions}
          value={temperature}
          onChange={(v) => temperature = v}
          label="Temperature"
        />
      </section>
    {/if}

    {#if espressoOptions.length > 0}
      <section class="option-group">
        <h3 class="option-label">Espresso</h3>
        <SegmentedToggle
          options={espressoOptions}
          value={espressoType}
          onChange={(v) => espressoType = v}
          label="Espresso type"
        />
      </section>
    {/if}

    {#if milkOptions.length > 0}
      <section class="option-group">
        <h3 class="option-label" id="cust-milk-label">Milk</h3>
        <CylinderPicker
          options={milkOptions}
          value={milkType}
          onChange={(v) => milkType = v}
          label="Milk"
          labelledBy="cust-milk-label"
        />
      </section>
    {/if}

    {#if syrupOptions.length > 0}
      <section class="option-group">
        <h3 class="option-label" id="cust-syrup-label">Syrup</h3>
        <CylinderPicker
          options={syrupWheelOptions}
          value={syrupWheelValue}
          onChange={handleSyrupChange}
          label="Syrup"
          labelledBy="cust-syrup-label"
        />
        {#if syrup}
          <div class="pump-control">
            <span class="pump-label">Pumps</span>
            <div class="pump-stepper" role="group" aria-label="Syrup pumps">
              <button
                type="button"
                class="pump-btn"
                onclick={() => adjustPumps(-1)}
                disabled={syrupPumps <= 1}
                aria-label="Decrease pumps"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <span class="pump-value" aria-live="polite">{syrupPumps}</span>
              <button
                type="button"
                class="pump-btn"
                onclick={() => adjustPumps(1)}
                disabled={syrupPumps >= SYRUP_PUMPS_MAX}
                aria-label="Increase pumps"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>
          </div>
        {/if}
      </section>
    {/if}

    <section class="option-group">
      <label for="special-instructions" class="option-label">Special Instructions</label>
      <textarea
        id="special-instructions"
        class="special-instructions"
        bind:value={specialInstructions}
        placeholder="Any special requests for your drink..."
        maxlength="200"
        rows="3"
      ></textarea>
      <p class="disclaimer">We do not have cold foams or whipped cream.</p>
    </section>
  </div>

  <div class="custom-footer">
    <button type="button" class="add-to-cart-btn" onclick={handleAddToCart}>
      Add to Cart
    </button>
  </div>
</div>

<style>
  .customization-screen {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    min-height: 100vh;
    background: var(--color-white);
    /* Footer height derives from the button's tap target + footer padding
       so body padding stays in sync if either token changes. */
    --footer-height: calc(var(--min-tap-target) + 2 * var(--spacing-md) + env(safe-area-inset-bottom, 0px));
  }

  .custom-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md);
    background: var(--color-brand-brown);
    color: var(--color-cream);
  }

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--min-tap-target);
    height: var(--min-tap-target);
    border: none;
    background: transparent;
    color: var(--color-cream);
    cursor: pointer;
    border-radius: var(--radius-md);
    flex-shrink: 0;
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .back-btn:focus-visible {
    outline: 2px solid var(--color-cream);
    outline-offset: 2px;
  }

  .drink-heading {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .drink-title {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
  }

  .drink-ratio {
    font-family: var(--font-body);
    font-size: 0.8125rem;
    color: color-mix(in srgb, var(--color-cream) 75%, transparent);
    margin: 0;
  }

  .custom-body {
    flex: 1;
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
    overflow-y: auto;
    padding-bottom: calc(var(--footer-height) + var(--spacing-md));
  }

  .option-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .option-label {
    font-family: var(--font-body);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-brown-mid);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
  }

  .pump-control {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) 0;
  }

  .pump-label {
    font-family: var(--font-body);
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-brown-mid);
  }

  .pump-stepper {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .pump-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: 2px solid var(--color-brown-light);
    border-radius: 50%;
    background: transparent;
    color: var(--color-brand-brown);
    cursor: pointer;
    transition: background 0.15s ease, opacity 0.15s ease;
  }

  .pump-btn:hover:not(:disabled) {
    background: var(--color-cream);
  }

  .pump-btn:active:not(:disabled) {
    background: var(--color-cream-hover);
  }

  .pump-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .pump-btn:focus-visible {
    outline: 2px solid var(--color-brown-mid);
    outline-offset: 2px;
  }

  .pump-value {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-brand-brown);
    min-width: 32px;
    text-align: center;
  }

  .special-instructions {
    width: 100%;
    padding: 12px;
    border: 2px solid var(--color-brown-light);
    border-radius: var(--radius-md);
    background: var(--color-white);
    color: var(--color-brand-brown);
    font-family: var(--font-body);
    font-size: 0.9375rem;
    line-height: 1.5;
    resize: vertical;
    min-height: 80px;
    transition: border-color 0.2s ease;
  }

  .special-instructions::placeholder {
    color: var(--color-brown-light);
  }

  .special-instructions:focus {
    border-color: var(--color-brand-brown);
  }

  .special-instructions:focus-visible {
    outline: 2px solid var(--color-brown-mid);
    outline-offset: 2px;
  }

  .disclaimer {
    font-family: var(--font-body);
    font-size: 0.8125rem;
    color: var(--color-brown-light);
    font-style: italic;
    margin: 0;
  }

  .custom-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: var(--spacing-md) var(--spacing-lg);
    padding-bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom, 0px));
    background: var(--color-white);
    border-top: 1px solid var(--color-cream);
    z-index: 10;
  }

  .add-to-cart-btn {
    width: 100%;
    padding: 16px;
    border: none;
    border-radius: var(--radius-lg);
    background: var(--color-brand-brown);
    color: var(--color-cream);
    font-family: var(--font-body);
    font-size: 1.125rem;
    font-weight: 700;
    cursor: pointer;
    min-height: var(--min-tap-target);
    transition: background 0.2s ease;
  }

  .add-to-cart-btn:hover {
    background: var(--color-brown-mid);
    transform: translateY(-1px);
  }

  .add-to-cart-btn:active {
    background: var(--color-brand-brown);
    transform: translateY(1px);
  }

  .add-to-cart-btn:focus-visible {
    outline: 2px solid var(--color-brown-mid);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .add-to-cart-btn,
    .add-to-cart-btn:hover,
    .add-to-cart-btn:active {
      transform: none;
      transition: background 0.2s ease;
    }
  }

  @media (min-width: 768px) {
    .customization-screen {
      min-height: auto;
      max-width: 600px;
      margin: 0 auto;
    }

    .custom-footer {
      position: sticky;
    }
  }
</style>
