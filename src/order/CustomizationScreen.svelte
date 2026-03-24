<script>
  import SegmentedToggle from '../components/ui/SegmentedToggle.svelte';
  import CylinderPicker from '../components/ui/CylinderPicker.svelte';
  import TogglePill from '../components/ui/TogglePill.svelte';

  let { drink, customizations, onAddToCart, onBack } = $props();

  // Initialize selections with defaults
  let temperature = $state('');
  let espressoType = $state('');
  let milkType = $state('');
  let addons = $state([]);

  // Derive available options from customizations prop
  let temperatureOptions = $derived(
    (customizations.temperature || []).map(c => c.label)
  );
  let espressoOptions = $derived(
    (customizations.espresso_type || []).map(c => c.label)
  );
  let milkOptions = $derived(
    (customizations.milk_type || []).map(c => c.label)
  );
  let addonOptions = $derived(customizations.addon || []);

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

  function toggleAddon(label) {
    if (addons.includes(label)) {
      addons = addons.filter(a => a !== label);
    } else {
      addons = [...addons, label];
    }
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
        addons: [...addons]
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
    <h2 class="drink-title">{drink.name}</h2>
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
        <CylinderPicker
          options={milkOptions}
          value={milkType}
          onChange={(v) => milkType = v}
          label="Milk"
        />
      </section>
    {/if}

    {#if addonOptions.length > 0}
      <section class="option-group">
        <h3 class="option-label" id="addons-label">Add-ons</h3>
        <div class="addon-list" role="group" aria-labelledby="addons-label">
          {#each addonOptions as addon}
            <TogglePill
              label={addon.label}
              active={addons.includes(addon.label)}
              onToggle={() => toggleAddon(addon.label)}
            />
          {/each}
        </div>
      </section>
    {/if}
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

  .back-btn:focus-visible {
    outline: 2px solid var(--color-cream);
    outline-offset: 2px;
  }

  .drink-title {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
  }

  .custom-body {
    flex: 1;
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
    overflow-y: auto;
    padding-bottom: 100px; /* space for fixed footer */
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

  .addon-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
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
