<script>
  let { drink, onSelect, index = 0 } = $props();
</script>

<button
  type="button"
  class="drink-card"
  style="animation-delay: {index * 60}ms"
  onclick={() => onSelect(drink)}
  aria-label="Customize {drink.name}"
>
  <h3 class="drink-name">{drink.name}</h3>
  {#if drink.ratio_summary}
    <p class="drink-ratio">{drink.ratio_summary}</p>
  {/if}
</button>

<style>
  @keyframes cardEnter {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .drink-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
    padding: var(--spacing-lg);
    background: var(--color-cream);
    border: 2px solid transparent;
    border-radius: var(--radius-lg);
    cursor: pointer;
    min-height: 80px;
    height: 100%;
    text-align: left;
    width: 100%;
    font-family: var(--font-body);
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    animation: cardEnter 0.4s ease both;
  }

  .drink-card:hover {
    border-color: var(--color-brown-light);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(44, 26, 14, 0.1);
  }

  .drink-card:active {
    transform: translateY(1px);
    border-color: var(--color-brand-brown);
    box-shadow: 0 1px 3px rgba(44, 26, 14, 0.15);
  }

  .drink-card:focus-visible {
    outline: 2px solid var(--color-brown-mid);
    outline-offset: 2px;
  }

  .drink-name {
    font-family: var(--font-heading);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-brand-brown);
    margin: 0;
    line-height: 1.3;
  }

  .drink-ratio {
    font-size: 0.875rem;
    color: var(--color-brown-mid);
    margin: 0;
    line-height: 1.5;
  }

  @media (prefers-reduced-motion: reduce) {
    .drink-card {
      animation: none;
      transition: none;
    }
  }
</style>
