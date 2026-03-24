<script>
  import { getSlots, submitOrder } from '../lib/api.js';
  import { cart } from '../stores/cart.js';
  import { get } from 'svelte/store';

  let { itemCount, onOrderPlaced, onAddMore } = $props();

  let customerName = $state('');
  let phoneNumber = $state('');
  let pickupSlot = $state('');
  let slots = $state([]);
  let loading = $state(false);
  let error = $state('');
  let loadingSlots = $state(true);

  $effect(() => {
    loadSlots();
  });

  async function loadSlots() {
    try {
      const data = await getSlots();
      slots = data.slots || [];
      if (slots.length > 0 && !pickupSlot) {
        pickupSlot = slots[0];
      }
    } catch (e) {
      slots = [];
    } finally {
      loadingSlots = false;
    }
  }

  function formatPhone(value) {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  function handlePhoneInput(e) {
    phoneNumber = formatPhone(e.target.value);
  }

  let isValid = $derived(
    customerName.trim().length > 0 &&
    phoneNumber.trim().length > 0 &&
    pickupSlot.length > 0
  );

  async function handleSubmit() {
    if (!isValid || loading) return;
    error = '';
    loading = true;

    try {
      const items = get(cart);
      const payload = {
        customer_name: customerName.trim(),
        phone_number: phoneNumber.trim(),
        pickup_slot: pickupSlot,
        items: items.map(item => ({
          drink_id: item.drinkId,
          customizations: {
            temperature: item.customizations.temperature,
            espresso_type: item.customizations.espresso_type,
            milk_type: item.customizations.milk_type,
            addons: item.customizations.addons
          }
        }))
      };
      const result = await submitOrder(payload);
      onOrderPlaced(result.confirmation_code);
    } catch (e) {
      if (e.status === 503) {
        error = 'Orders are currently closed. Please try again later.';
      } else {
        error = e.message || 'Failed to place order. Please try again.';
      }
    } finally {
      loading = false;
    }
  }
</script>

<div class="order-summary">
  <h3 class="summary-title">Order Summary</h3>
  <p class="item-count">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>

  <button type="button" class="add-more-btn" onclick={onAddMore}>
    + Add another drink
  </button>

  <form class="summary-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
    <div class="field">
      <label for="customer-name">Name</label>
      <input
        id="customer-name"
        type="text"
        bind:value={customerName}
        placeholder="Your name"
        required
        maxlength="100"
        autocomplete="name"
      />
    </div>

    <div class="field">
      <label for="phone-number">Phone Number</label>
      <input
        id="phone-number"
        type="tel"
        value={phoneNumber}
        oninput={handlePhoneInput}
        placeholder="(555) 123-4567"
        required
        maxlength="14"
        autocomplete="tel"
      />
    </div>

    <div class="field">
      <label for="pickup-slot-group">Pickup Time</label>
      {#if loadingSlots}
        <p class="loading-text">Loading times...</p>
      {:else if slots.length === 0}
        <p class="error-text">No pickup times available</p>
      {:else}
        <div class="slot-grid" role="radiogroup" aria-label="Pickup time" id="pickup-slot-group">
          {#each slots as slot}
            <button
              type="button"
              role="radio"
              aria-checked={pickupSlot === slot}
              class="slot-btn"
              class:active={pickupSlot === slot}
              onclick={() => pickupSlot = slot}
            >
              {slot}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    {#if error}
      <p class="error-text" role="alert">{error}</p>
    {/if}

    <button
      type="submit"
      class="place-order-btn"
      disabled={!isValid || loading || slots.length === 0}
    >
      {#if loading}
        Placing Order...
      {:else}
        Place Order
      {/if}
    </button>
  </form>
</div>

<style>
  .order-summary {
    background: var(--color-white);
    border: 2px solid var(--color-cream);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
  }

  .summary-title {
    font-family: var(--font-heading);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-brand-brown);
    margin: 0 0 var(--spacing-xs);
  }

  .item-count {
    font-family: var(--font-body);
    font-size: 0.9375rem;
    color: var(--color-brown-mid);
    margin: 0 0 var(--spacing-md);
  }

  .add-more-btn {
    width: 100%;
    padding: 12px;
    border: 2px dashed var(--color-brown-light);
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-brown-mid);
    font-family: var(--font-body);
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: var(--spacing-lg);
    min-height: var(--min-tap-target);
    transition: border-color 0.2s ease, color 0.2s ease;
  }

  .add-more-btn:hover {
    border-color: var(--color-brand-brown);
    color: var(--color-brand-brown);
  }

  .add-more-btn:focus-visible {
    outline: 2px solid var(--color-brown-mid);
    outline-offset: 2px;
  }

  .summary-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .field label {
    font-family: var(--font-body);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-brown-mid);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .field input {
    padding: 14px 16px;
    border: 2px solid var(--color-cream);
    border-radius: var(--radius-md);
    font-family: var(--font-body);
    font-size: 1rem;
    color: var(--color-brand-brown);
    background: var(--color-white);
    min-height: var(--min-tap-target);
    transition: border-color 0.2s ease;
  }

  .field input:focus {
    outline: none;
    border-color: var(--color-brand-brown);
  }

  .field input::placeholder {
    color: var(--color-brown-light);
  }

  .slot-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-sm);
  }

  .slot-btn {
    padding: 12px 8px;
    border: 2px solid var(--color-cream);
    border-radius: var(--radius-md);
    background: var(--color-white);
    font-family: var(--font-body);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-brand-brown);
    cursor: pointer;
    min-height: var(--min-tap-target);
    transition: all 0.2s ease;
  }

  .slot-btn.active {
    background: var(--color-brand-brown);
    border-color: var(--color-brand-brown);
    color: var(--color-cream);
  }

  .slot-btn:not(.active):hover {
    border-color: var(--color-brown-light);
  }

  .slot-btn:focus-visible {
    outline: 2px solid var(--color-brown-mid);
    outline-offset: 2px;
  }

  .loading-text {
    font-family: var(--font-body);
    font-size: 0.875rem;
    color: var(--color-brown-light);
    margin: 0;
  }

  .error-text {
    font-family: var(--font-body);
    font-size: 0.875rem;
    color: var(--color-error);
    margin: 0;
  }

  .place-order-btn {
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

  .place-order-btn:hover:not(:disabled) {
    background: var(--color-brown-mid);
  }

  .place-order-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .place-order-btn:focus-visible {
    outline: 2px solid var(--color-brown-mid);
    outline-offset: 2px;
  }

  @media (min-width: 768px) {
    .slot-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
</style>
