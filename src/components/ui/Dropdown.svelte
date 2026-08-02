<script>
  let {
    options = [],
    value = '',
    onChange,
    id,
    ariaLabel = '',
    placeholder = 'Select an option',
    disabled = false
  } = $props();

  let open = $state(false);
  let activeIndex = $state(-1);
  let triggerEl = $state(null);
  let listEl = $state(null);

  let selectedIndex = $derived(options.indexOf(value));
  let displayLabel = $derived(value || placeholder);
  let listboxId = $derived(id ? `${id}-listbox` : 'dropdown-listbox');

  function openMenu() {
    if (disabled) return;
    open = true;
    activeIndex = selectedIndex >= 0 ? selectedIndex : 0;
    queueMicrotask(scrollActiveIntoView);
  }

  function close() {
    open = false;
    activeIndex = -1;
  }

  function toggle() {
    if (open) close();
    else openMenu();
  }

  function select(idx) {
    const opt = options[idx];
    if (opt === undefined) return;
    onChange?.(opt);
    close();
    triggerEl?.focus();
  }

  function scrollActiveIntoView() {
    if (!listEl || activeIndex < 0) return;
    const el = listEl.querySelector(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }

  function handleKeydown(e) {
    if (disabled) return;
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close();
        triggerEl?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        activeIndex = Math.min(options.length - 1, activeIndex + 1);
        scrollActiveIntoView();
        break;
      case 'ArrowUp':
        e.preventDefault();
        activeIndex = Math.max(0, activeIndex - 1);
        scrollActiveIntoView();
        break;
      case 'Home':
        e.preventDefault();
        activeIndex = 0;
        scrollActiveIntoView();
        break;
      case 'End':
        e.preventDefault();
        activeIndex = options.length - 1;
        scrollActiveIntoView();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        select(activeIndex);
        break;
      case 'Tab':
        close();
        break;
    }
  }

  function handleClickOutside(e) {
    if (!open) return;
    if (triggerEl?.contains(e.target)) return;
    if (listEl?.contains(e.target)) return;
    close();
  }

  $effect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  });
</script>

<div class="dropdown">
  <button
    type="button"
    bind:this={triggerEl}
    {id}
    class="trigger"
    class:open
    class:placeholder={!value}
    {disabled}
    role="combobox"
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-controls={listboxId}
    aria-label={ariaLabel}
    onclick={toggle}
    onkeydown={handleKeydown}
  >
    <span class="value">{displayLabel}</span>
    <svg class="chevron" class:up={open} viewBox="0 0 12 8" aria-hidden="true">
      <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </button>

  {#if open}
    <ul
      bind:this={listEl}
      id={listboxId}
      class="listbox"
      role="listbox"
      tabindex="-1"
      onkeydown={handleKeydown}
    >
      {#each options as opt, i}
        <li
          role="option"
          aria-selected={opt === value}
          data-idx={i}
          class="option"
          class:active={i === activeIndex}
          class:selected={opt === value}
          onmousedown={(e) => { e.preventDefault(); select(i); }}
          onmouseenter={() => activeIndex = i}
        >
          <span>{opt}</span>
          {#if opt === value}
            <svg class="check" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2 6.5L5 9.5L10 3.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .dropdown {
    position: relative;
  }

  .trigger {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-sm);
    padding: 14px 16px;
    border: 2px solid var(--color-cream);
    border-radius: var(--radius-md);
    background: var(--color-white);
    font-family: var(--font-body);
    font-size: 1rem;
    color: var(--color-brand-brown);
    min-height: var(--min-tap-target);
    cursor: pointer;
    text-align: left;
    transition: border-color 0.2s ease;
  }

  .trigger:hover:not(:disabled) {
    border-color: var(--color-brown-light);
  }

  .trigger.open {
    border-color: var(--color-brand-brown);
  }

  .trigger:focus {
    outline: none;
    border-color: var(--color-brand-brown);
  }

  .trigger:focus-visible {
    outline: 2px solid var(--color-brown-mid);
    outline-offset: 2px;
  }

  .trigger:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .trigger.placeholder .value {
    color: var(--color-brown-light);
  }

  .value {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chevron {
    width: 12px;
    height: 8px;
    color: var(--color-brown-mid);
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }

  .chevron.up {
    transform: rotate(180deg);
  }

  .listbox {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 10;
    margin: 0;
    padding: var(--spacing-xs);
    list-style: none;
    background: var(--color-white);
    border: 2px solid var(--color-brand-brown);
    border-radius: var(--radius-md);
    box-shadow: 0 8px 24px rgba(44, 26, 14, 0.15);
    max-height: 280px;
    overflow-y: auto;
  }

  .option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-sm);
    padding: 12px 12px;
    border-radius: var(--radius-sm);
    font-family: var(--font-body);
    font-size: 0.9375rem;
    color: var(--color-brand-brown);
    cursor: pointer;
    min-height: var(--min-tap-target);
    transition: background 0.1s ease;
  }

  .option.active {
    background: var(--color-cream-hover);
  }

  .option.selected {
    background: var(--color-brand-brown);
    color: var(--color-cream);
    font-weight: 600;
  }

  .option.selected.active {
    background: var(--color-brown-mid);
  }

  .check {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
</style>
