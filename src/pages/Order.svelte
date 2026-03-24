<script>
  import { onMount } from 'svelte';
  import { getMenu } from '../lib/api.js';
  import { cart } from '../stores/cart.js';
  import { drinks, customizations } from '../stores/menu.js';
  import DrinkCard from '../order/DrinkCard.svelte';
  import CustomizationScreen from '../order/CustomizationScreen.svelte';
  import CartItemCard from '../order/CartItemCard.svelte';
  import OrderSummaryPanel from '../order/OrderSummaryPanel.svelte';

  let step = $state('menu');
  let selectedDrink = $state(null);
  let confirmationCode = $state('');
  let loading = $state(true);
  let error = $state('');
  let cartItems = $state([]);
  let toastMessage = $state('');
  let toastVisible = $state(false);
  let codeCopied = $state(false);

  // Subscribe to cart store
  const unsubscribeCart = cart.subscribe(items => {
    cartItems = items;
  });

  let drinkList = $state([]);
  let customizationData = $state({});

  const unsubscribeDrinks = drinks.subscribe(d => drinkList = d);
  const unsubscribeCustomizations = customizations.subscribe(c => customizationData = c);

  onMount(() => {
    loadMenu();
    return () => {
      unsubscribeCart();
      unsubscribeDrinks();
      unsubscribeCustomizations();
    };
  });

  async function loadMenu() {
    loading = true;
    error = '';
    try {
      const data = await getMenu();
      drinks.set(data.drinks || []);
      customizations.set(data.customizations || {});
    } catch (e) {
      error = 'Failed to load menu. Please try again.';
    } finally {
      loading = false;
    }
  }

  function selectDrink(drink) {
    selectedDrink = drink;
    step = 'customization';
  }

  function showToast(message) {
    toastMessage = message;
    toastVisible = true;
    setTimeout(() => { toastVisible = false; }, 2200);
  }

  function handleAddToCart(item) {
    cart.update(items => [...items, item]);
    showToast(`${item.drinkName} added to cart`);
    step = 'cart';
  }

  function handleBackToMenu() {
    step = 'menu';
    selectedDrink = null;
  }

  function removeFromCart(index) {
    cart.update(items => items.filter((_, i) => i !== index));
    // If cart is now empty, go back to menu
    const currentCart = cartItems;
    if (currentCart.length <= 1) {
      step = 'menu';
    }
  }

  function handleOrderPlaced(code) {
    confirmationCode = code;
    cart.set([]);
    step = 'confirmation';
  }

  function goToAddMore() {
    step = 'menu';
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(confirmationCode);
      codeCopied = true;
      setTimeout(() => { codeCopied = false; }, 2000);
    } catch {
      // Fallback: the code already has user-select: all
    }
  }
</script>

<!-- Toast notification -->
{#if toastVisible}
  <div class="toast" role="status" aria-live="polite">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    {toastMessage}
  </div>
{/if}

<main class="order-page" id="main-content">
  {#if step === 'menu'}
    <div class="menu-view step-enter">
      <header class="menu-header">
        <h1>Our Menu</h1>
        {#if cartItems.length > 0}
          <button type="button" class="cart-badge" onclick={() => step = 'cart'} aria-label="View cart, {cartItems.length} items">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span class="badge-count">{cartItems.length}</span>
          </button>
        {/if}
      </header>

      {#if loading}
        <div class="center-message">
          <div class="loading-indicator" aria-hidden="true">
            <span class="bean bean-1"></span>
            <span class="bean bean-2"></span>
            <span class="bean bean-3"></span>
          </div>
          <p class="loading-text">Brewing the menu...</p>
        </div>
      {:else if error}
        <div class="center-message">
          <p class="error-text" role="alert">{error}</p>
          <button type="button" class="retry-btn" onclick={loadMenu}>Try Again</button>
        </div>
      {:else if drinkList.length === 0}
        <div class="center-message">
          <p>No drinks available right now.</p>
        </div>
      {:else}
        <div class="drink-grid" role="list" aria-label="Available drinks">
          {#each drinkList as drink, i (drink.id)}
            <DrinkCard {drink} onSelect={selectDrink} index={i} />
          {/each}
        </div>
      {/if}
    </div>

  {:else if step === 'customization' && selectedDrink}
    <div class="step-enter">
      <CustomizationScreen
        drink={selectedDrink}
        customizations={customizationData}
        onAddToCart={handleAddToCart}
        onBack={handleBackToMenu}
      />
    </div>

  {:else if step === 'cart'}
    <div class="cart-view step-enter">
      <header class="cart-header">
        <button type="button" class="back-link" onclick={handleBackToMenu}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Menu
        </button>
        <h1>Your Cart</h1>
      </header>

      {#if cartItems.length === 0}
        <div class="center-message">
          <p>Your cart is empty.</p>
          <button type="button" class="retry-btn" onclick={handleBackToMenu}>Browse Menu</button>
        </div>
      {:else}
        <div class="cart-layout">
          <div class="cart-items">
            {#each cartItems as item, i (i)}
              <CartItemCard {item} index={i} onRemove={removeFromCart} />
            {/each}
          </div>
          <div class="cart-summary">
            <OrderSummaryPanel
              itemCount={cartItems.length}
              onOrderPlaced={handleOrderPlaced}
              onAddMore={goToAddMore}
            />
          </div>
        </div>
      {/if}
    </div>

  {:else if step === 'confirmation'}
    <div class="confirmation-view step-enter">
      <div class="confirmation-card">
        <div class="check-icon" aria-hidden="true">
          <svg class="check-svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h1>Order Placed!</h1>
        <p class="confirm-subtitle">Your confirmation code is</p>
        <button
          type="button"
          class="confirmation-code"
          onclick={copyCode}
          aria-label="Confirmation code: {confirmationCode}. Tap to copy."
          title="Tap to copy"
        >
          {confirmationCode}
        </button>
        <p class="copy-hint">
          {#if codeCopied}
            Copied!
          {:else}
            Tap the code to copy it
          {/if}
        </p>
        <p class="confirm-instruction">Save this code to check your order status.</p>
        <a href="#/check" class="check-order-link">Check My Order</a>
      </div>
    </div>
  {/if}
</main>

<style>
  .order-page {
    font-family: var(--font-body);
    min-height: 100dvh;
    min-height: 100vh;
  }

  /* ---- Step Transitions ---- */
  @keyframes stepEnter {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .step-enter {
    animation: stepEnter 0.3s ease both;
  }

  /* ---- Toast ---- */
  @keyframes toastSlide {
    0% { transform: translateX(-50%) translateY(-20px); opacity: 0; }
    15% { transform: translateX(-50%) translateY(0); opacity: 1; }
    85% { transform: translateX(-50%) translateY(0); opacity: 1; }
    100% { transform: translateX(-50%) translateY(-20px); opacity: 0; }
  }

  .toast {
    position: fixed;
    top: 72px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: 12px 20px;
    background: var(--color-brand-brown);
    color: var(--color-cream);
    font-family: var(--font-body);
    font-size: 0.9375rem;
    font-weight: 600;
    border-radius: var(--radius-full);
    box-shadow: 0 8px 24px rgba(44, 26, 14, 0.25);
    z-index: 200;
    animation: toastSlide 2.2s ease both;
    white-space: nowrap;
  }

  /* ---- Loading Indicator ---- */
  @keyframes beanBounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
    40% { transform: scale(1); opacity: 1; }
  }

  .loading-indicator {
    display: flex;
    gap: 8px;
    margin-bottom: var(--spacing-md);
  }

  .bean {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--color-brand-brown);
    animation: beanBounce 1.2s ease infinite;
  }

  .bean-2 { animation-delay: 0.15s; }
  .bean-3 { animation-delay: 0.3s; }

  .loading-text {
    color: var(--color-brown-mid);
    font-style: italic;
  }

  /* ---- Menu View ---- */
  .menu-view {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: var(--spacing-lg);
  }

  .menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-xl);
  }

  .menu-header h1 {
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-brand-brown);
    margin: 0;
  }

  .cart-badge {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--min-tap-target);
    height: var(--min-tap-target);
    border: 2px solid var(--color-brand-brown);
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-brand-brown);
    cursor: pointer;
    transition: transform 0.15s ease;
  }

  .cart-badge:hover {
    transform: scale(1.05);
  }

  .cart-badge:active {
    transform: scale(0.95);
  }

  .cart-badge:focus-visible {
    outline: 2px solid var(--color-brown-mid);
    outline-offset: 2px;
  }

  @keyframes badgePop {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
  }

  .badge-count {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--color-brand-brown);
    color: var(--color-cream);
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: badgePop 0.3s ease;
  }

  .drink-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
  }

  /* ---- Cart View ---- */
  .cart-view {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: var(--spacing-lg);
  }

  .cart-header {
    margin-bottom: var(--spacing-xl);
  }

  .cart-header h1 {
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-brand-brown);
    margin: var(--spacing-sm) 0 0;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    border: none;
    background: transparent;
    color: var(--color-brown-mid);
    font-family: var(--font-body);
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    padding: var(--spacing-xs) 0;
    min-height: var(--min-tap-target);
    transition: color 0.15s ease;
  }

  .back-link:hover {
    color: var(--color-brand-brown);
  }

  .back-link:focus-visible {
    outline: 2px solid var(--color-brown-mid);
    outline-offset: 2px;
  }

  .cart-layout {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  .cart-items {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .cart-summary {
    /* mobile: stacked below items */
  }

  /* ---- Confirmation View ---- */
  @keyframes iconPop {
    0% { transform: scale(0); opacity: 0; }
    60% { transform: scale(1.15); }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes checkDraw {
    from { stroke-dashoffset: 30; }
    to { stroke-dashoffset: 0; }
  }

  .confirmation-view {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    padding: var(--spacing-lg);
  }

  .confirmation-card {
    text-align: center;
    max-width: 400px;
    width: 100%;
  }

  .check-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--color-success);
    color: white;
    margin-bottom: var(--spacing-lg);
    animation: iconPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  .check-svg polyline {
    stroke-dasharray: 30;
    stroke-dashoffset: 30;
    animation: checkDraw 0.4s ease 0.4s forwards;
  }

  .confirmation-card h1 {
    font-family: var(--font-heading);
    font-size: 2rem;
    color: var(--color-brand-brown);
    margin: 0 0 var(--spacing-sm);
  }

  .confirm-subtitle {
    font-size: 1rem;
    color: var(--color-brown-mid);
    margin: 0 0 var(--spacing-md);
  }

  .confirmation-code {
    display: inline-block;
    padding: var(--spacing-lg) var(--spacing-2xl);
    background: var(--color-cream);
    border: 3px solid var(--color-brand-brown);
    border-radius: var(--radius-lg);
    font-family: var(--font-heading);
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--color-brand-brown);
    letter-spacing: 0.1em;
    margin-bottom: var(--spacing-sm);
    user-select: all;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.1s ease;
  }

  .confirmation-code:hover {
    background: var(--color-cream-hover);
  }

  .confirmation-code:active {
    transform: scale(0.97);
  }

  .copy-hint {
    font-size: 0.8125rem;
    color: var(--color-brown-light);
    margin: 0 0 var(--spacing-lg);
    min-height: 1.2em;
  }

  .confirm-instruction {
    font-size: 0.9375rem;
    color: var(--color-brown-mid);
    margin: 0 0 var(--spacing-xl);
  }

  .check-order-link {
    display: inline-block;
    padding: 14px 32px;
    background: var(--color-brand-brown);
    color: var(--color-cream);
    font-family: var(--font-body);
    font-size: 1rem;
    font-weight: 600;
    text-decoration: none;
    border-radius: var(--radius-lg);
    min-height: var(--min-tap-target);
    transition: background 0.2s ease, transform 0.15s ease;
  }

  .check-order-link:hover {
    background: var(--color-brown-mid);
    transform: translateY(-1px);
  }

  .check-order-link:active {
    transform: translateY(1px);
  }

  .check-order-link:focus-visible {
    outline: 2px solid var(--color-brown-mid);
    outline-offset: 2px;
  }

  /* ---- Shared ---- */
  .center-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-2xl);
    text-align: center;
    color: var(--color-brown-mid);
    gap: var(--spacing-md);
  }

  .center-message p {
    margin: 0;
    font-size: 1rem;
  }

  .error-text {
    color: var(--color-error);
  }

  .retry-btn {
    padding: 12px 24px;
    border: 2px solid var(--color-brand-brown);
    border-radius: var(--radius-lg);
    background: transparent;
    color: var(--color-brand-brown);
    font-family: var(--font-body);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    min-height: var(--min-tap-target);
    transition: background 0.2s ease, transform 0.15s ease;
  }

  .retry-btn:hover {
    background: var(--color-cream);
    transform: translateY(-1px);
  }

  .retry-btn:active {
    transform: translateY(1px);
  }

  .retry-btn:focus-visible {
    outline: 2px solid var(--color-brown-mid);
    outline-offset: 2px;
  }

  /* ---- Desktop Layout ---- */
  @media (min-width: 768px) {
    .drink-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .cart-layout {
      flex-direction: row;
      align-items: flex-start;
    }

    .cart-items {
      flex: 1;
      min-width: 0;
    }

    .cart-summary {
      width: 360px;
      flex-shrink: 0;
      position: sticky;
      top: var(--spacing-lg);
    }
  }

  @media (min-width: 1024px) {
    .drink-grid {
      grid-template-columns: repeat(4, 1fr);
    }

    .cart-summary {
      width: 400px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .step-enter,
    .check-icon,
    .badge-count,
    .toast {
      animation: none;
    }
    .check-svg polyline {
      stroke-dashoffset: 0;
      animation: none;
    }
  }
</style>
