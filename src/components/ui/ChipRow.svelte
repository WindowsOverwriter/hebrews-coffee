<script>
  let { options, value, onChange, label = '' } = $props();
</script>

<div class="chip-row-wrapper">
  {#if label}
    <span class="chip-label" id="chip-label">{label}</span>
  {/if}
  <div
    class="chip-row"
    role="radiogroup"
    aria-label={label}
  >
    {#each options as option}
      <button
        type="button"
        role="radio"
        aria-checked={value === option}
        class="chip"
        class:active={value === option}
        onclick={() => onChange(option)}
      >
        {option}
      </button>
    {/each}
  </div>
</div>

<style>
  .chip-row-wrapper {
    width: 100%;
  }

  .chip-label {
    display: block;
    font-family: var(--font-body);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-brown-mid);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--spacing-sm);
  }

  .chip-row {
    display: flex;
    gap: var(--spacing-sm);
    overflow-x: auto;
    padding-bottom: var(--spacing-xs);
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .chip-row::-webkit-scrollbar {
    display: none;
  }

  .chip {
    flex-shrink: 0;
    min-width: 80px;
    padding: 12px 20px;
    border: 2px solid var(--color-brown-light);
    border-radius: var(--radius-full);
    background: var(--color-white);
    font-family: var(--font-body);
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--color-brand-brown);
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: var(--min-tap-target);
    white-space: nowrap;
  }

  .chip.active {
    background: var(--color-brand-brown);
    border-color: var(--color-brand-brown);
    color: var(--color-cream);
  }

  .chip:not(.active):hover {
    background: var(--color-cream);
  }

  .chip:focus-visible {
    outline: 2px solid var(--color-brown-mid);
    outline-offset: 2px;
  }
</style>
