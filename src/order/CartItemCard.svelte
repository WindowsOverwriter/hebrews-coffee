<script>
  let { item, index, onRemove } = $props();

  let customizationLines = $derived(() => {
    const lines = [];
    const c = item.customizations;
    if (c.temperature) lines.push(c.temperature);
    if (c.espresso_type) lines.push(c.espresso_type);
    if (c.milk_type) lines.push(c.milk_type);
    if (c.addons?.length) {
      lines.push(...c.addons);
    }
    return lines;
  });
</script>

<div class="cart-item-card" role="group" aria-label="{item.drinkName}, item {index + 1}">
  <div class="card-content">
    <h3 class="item-name">{item.drinkName}</h3>
    <ul class="item-customizations" aria-label="Customizations">
      {#each customizationLines() as line}
        <li>{line}</li>
      {/each}
    </ul>
  </div>
  <button
    type="button"
    class="remove-btn"
    onclick={() => onRemove(index)}
    aria-label="Remove {item.drinkName} from cart"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  </button>
</div>

<style>
  .cart-item-card {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    background: var(--color-cream);
    border: 2px solid var(--color-brown-light);
    border-radius: var(--radius-lg);
    position: relative;
  }

  .card-content {
    flex: 1;
    min-width: 0;
  }

  .item-name {
    font-family: var(--font-heading);
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--color-brand-brown);
    margin: 0 0 var(--spacing-sm);
  }

  .item-customizations {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs) var(--spacing-sm);
  }

  .item-customizations li {
    font-family: var(--font-body);
    font-size: 0.875rem;
    color: var(--color-brown-mid);
    background: var(--color-white);
    padding: 4px 10px;
    border-radius: var(--radius-full);
  }

  .remove-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: none;
    background: transparent;
    color: var(--color-brown-light);
    cursor: pointer;
    border-radius: var(--radius-md);
    flex-shrink: 0;
    transition: color 0.2s ease;
  }

  .remove-btn:hover {
    color: var(--color-error);
  }

  .remove-btn:focus-visible {
    outline: 2px solid var(--color-brown-mid);
    outline-offset: 2px;
  }
</style>
