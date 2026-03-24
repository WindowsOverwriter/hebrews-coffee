<script>
  let { options, value, onChange, label = '' } = $props();

  let activeIndex = $derived(options.indexOf(value));

  function handleSelect(option) {
    onChange(option);
  }

  function handleKeyDown(e, i) {
    let nextIndex;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (i + 1) % options.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (i - 1 + options.length) % options.length;
    } else {
      return;
    }
    onChange(options[nextIndex]);
    // Focus the newly selected button after Svelte re-renders
    requestAnimationFrame(() => {
      const group = e.target.closest('[role="radiogroup"]');
      const buttons = group?.querySelectorAll('[role="radio"]');
      buttons?.[nextIndex]?.focus();
    });
  }
</script>

<div class="segmented-toggle" role="radiogroup" aria-label={label}>
  <div
    class="slider"
    style="width: calc({100 / options.length}% - {8 / options.length}px); transform: translateX(calc({activeIndex} * (100% + {8 / options.length}px)));"
  ></div>
  {#each options as option, i}
    <button
      type="button"
      role="radio"
      aria-checked={value === option}
      class="toggle-option"
      class:active={value === option}
      tabindex={value === option ? 0 : -1}
      onclick={() => handleSelect(option)}
      onkeydown={(e) => handleKeyDown(e, i)}
    >
      {option}
    </button>
  {/each}
</div>

<style>
  .segmented-toggle {
    display: flex;
    position: relative;
    background: var(--color-cream);
    border-radius: var(--radius-full);
    padding: 4px;
    gap: 0;
    border: 2px solid var(--color-brown-light);
  }

  .slider {
    position: absolute;
    top: 4px;
    left: 4px;
    bottom: 4px;
    background: var(--color-brand-brown);
    border-radius: var(--radius-full);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 0;
  }

  .toggle-option {
    flex: 1;
    position: relative;
    z-index: 1;
    padding: 14px 24px;
    border: none;
    background: transparent;
    font-family: var(--font-body);
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-brand-brown);
    cursor: pointer;
    transition: color 0.3s ease;
    min-height: var(--min-tap-target);
    border-radius: var(--radius-full);
  }

  .toggle-option.active {
    color: var(--color-cream);
  }

  .toggle-option:focus-visible {
    outline: 2px solid var(--color-brown-mid);
    outline-offset: 2px;
  }

  .toggle-option.active:focus-visible {
    outline-color: var(--color-cream);
  }
</style>
