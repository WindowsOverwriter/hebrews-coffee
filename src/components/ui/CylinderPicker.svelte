<script>
  let { options, value, onChange, label = '', labelledBy = '' } = $props();

  let selectedIndex = $derived(options.indexOf(value));
  let dragging = $state(false);
  let dragStartX = $state(0);
  let dragDelta = $state(0);
  let wheelAccum = $state(0);
  let wheelTimer = $state(null);

  function getWrappedIndex(i) {
    const len = options.length;
    return ((i % len) + len) % len;
  }

  // Only return an option if it's distinct from the center at this offset
  function optionAt(offset) {
    if (options.length <= 1) return null;
    // For small lists, check if this offset would show a duplicate
    const idx = getWrappedIndex(selectedIndex + offset);
    // Ensure we don't show the same index as center
    if (idx === selectedIndex) return null;
    // For 2 options, only show ±1
    if (options.length === 2 && Math.abs(offset) > 1) return null;
    // For 3 options, only show ±1
    if (options.length === 3 && Math.abs(offset) > 1) {
      // Check if ±2 wraps to the same as ∓1
      const nearIdx = getWrappedIndex(selectedIndex + (offset > 0 ? 1 : -1));
      if (idx === nearIdx) return null;
    }
    // For 4 options, far positions may duplicate near ones
    if (options.length === 4 && Math.abs(offset) === 2) {
      const nearIdx = getWrappedIndex(selectedIndex + (offset > 0 ? 1 : -1));
      if (idx === nearIdx) return null;
    }
    return options[idx];
  }

  function rotateBy(direction) {
    if (options.length <= 1) return;
    const nextIndex = getWrappedIndex(selectedIndex + direction);
    onChange(options[nextIndex]);
  }

  // Touch/mouse drag handling — horizontal
  function handlePointerDown(e) {
    dragging = true;
    dragStartX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    dragDelta = 0;
  }

  function handlePointerMove(e) {
    if (!dragging) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    dragDelta = x - dragStartX;
  }

  function handlePointerUp() {
    if (!dragging) return;
    dragging = false;
    const threshold = 40;
    if (dragDelta > threshold) {
      rotateBy(-1);
    } else if (dragDelta < -threshold) {
      rotateBy(1);
    }
    dragDelta = 0;
  }

  function handleWheel(e) {
    e.preventDefault();
    wheelAccum += e.deltaX || e.deltaY;
    const wheelThreshold = 80;

    if (wheelTimer) clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => { wheelAccum = 0; }, 200);

    if (wheelAccum > wheelThreshold) {
      rotateBy(1);
      wheelAccum = 0;
    } else if (wheelAccum < -wheelThreshold) {
      rotateBy(-1);
      wheelAccum = 0;
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      rotateBy(-1);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      rotateBy(1);
    }
  }

  let internalLabelId = $derived(`cyl-label-${label.replace(/\s+/g, '-').toLowerCase()}`);
  let labelId = $derived(labelledBy || internalLabelId);
  let hintId = $derived(`cyl-hint-${label.replace(/\s+/g, '-').toLowerCase()}`);
</script>

<div class="cylinder-wrapper">
  {#if options.length <= 1}
    <!-- Static display for single option -->
    {#if !labelledBy}
      <span class="cylinder-label" id={internalLabelId}>{label}</span>
    {/if}
    <div class="cylinder-static" aria-labelledby={labelId}>
      {options[0] ?? '—'}
    </div>
  {:else}
    {#if !labelledBy}
      <span class="cylinder-label" id={internalLabelId}>{label}</span>
    {/if}
    <div
      class="cylinder-picker"
      role="listbox"
      aria-labelledby={labelId}
      aria-describedby={hintId}
      aria-activedescendant="cylinder-opt-{selectedIndex}"
      tabindex="0"
      onkeydown={handleKeyDown}
      onpointerdown={handlePointerDown}
      onpointermove={handlePointerMove}
      onpointerup={handlePointerUp}
      onpointerleave={handlePointerUp}
      onwheel={handleWheel}
    >
      <!-- Far previous -->
      {#if optionAt(-2) != null}
        <button
          type="button"
          class="cylinder-item pos-far-prev"
          tabindex="-1"
          onclick={() => rotateBy(-2)}
          aria-hidden="true"
        >
          {optionAt(-2)}
        </button>
      {/if}

      <!-- Previous -->
      {#if optionAt(-1) != null}
        <button
          type="button"
          class="cylinder-item pos-prev"
          tabindex="-1"
          onclick={() => rotateBy(-1)}
          aria-hidden="true"
        >
          {optionAt(-1)}
        </button>
      {/if}

      <!-- Selected (center) -->
      <div
        class="cylinder-item pos-center"
        role="option"
        aria-selected="true"
        id="cylinder-opt-{selectedIndex}"
      >
        {value}
      </div>

      <!-- Next -->
      {#if optionAt(1) != null}
        <button
          type="button"
          class="cylinder-item pos-next"
          tabindex="-1"
          onclick={() => rotateBy(1)}
          aria-hidden="true"
        >
          {optionAt(1)}
        </button>
      {/if}

      <!-- Far next -->
      {#if optionAt(2) != null}
        <button
          type="button"
          class="cylinder-item pos-far-next"
          tabindex="-1"
          onclick={() => rotateBy(2)}
          aria-hidden="true"
        >
          {optionAt(2)}
        </button>
      {/if}

      <!-- Directional chevrons -->
      <div class="chevron chevron-left" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </div>
      <div class="chevron chevron-right" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 6 15 12 9 18"></polyline>
        </svg>
      </div>

      <!-- Highlight pill behind selected -->
      <div class="center-pill" aria-hidden="true"></div>

      <!-- Fade overlays for cylinder curvature -->
      <div class="fade-left" aria-hidden="true"></div>
      <div class="fade-right" aria-hidden="true"></div>
    </div>
    <p id={hintId} class="cylinder-hint">Swipe or use arrow keys to change</p>
  {/if}
</div>

<style>
  .cylinder-wrapper {
    width: 100%;
  }

  .cylinder-label {
    display: block;
    font-family: var(--font-body);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-brown-mid);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--spacing-sm);
  }

  /* Static single-option display */
  .cylinder-static {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 56px;
    border-radius: var(--radius-full);
    background: var(--color-brand-brown);
    color: var(--color-cream);
    font-family: var(--font-body);
    font-size: 1.0625rem;
    font-weight: 600;
  }

  .cylinder-picker {
    position: relative;
    height: 56px;
    overflow: hidden;
    border-radius: var(--radius-full);
    background: var(--color-cream);
    border: 2px solid var(--color-brown-light);
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    cursor: grab;
    user-select: none;
    touch-action: pan-y;
    outline: none;
  }

  .cylinder-picker:focus-visible {
    outline: 2px solid var(--color-brown-mid);
    outline-offset: 2px;
  }

  .cylinder-picker:active {
    cursor: grabbing;
  }

  /* Center highlight pill */
  .center-pill {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 120px;
    height: 42px;
    background: var(--color-brand-brown);
    border-radius: var(--radius-full);
    z-index: 0;
    pointer-events: none;
  }

  /* Directional chevrons */
  .chevron {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 4;
    color: var(--color-brown-light);
    pointer-events: none;
    display: flex;
    align-items: center;
  }

  .chevron-left {
    left: 10px;
  }

  .chevron-right {
    right: 10px;
  }

  /* Cylinder items — horizontal layout */
  .cylinder-item {
    position: absolute;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 120px;
    font-family: var(--font-body);
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 0 8px;
    z-index: 1;
  }

  .pos-center {
    left: 50%;
    transform: translateX(-50%) perspective(200px) rotateY(0deg);
    font-size: 1.0625rem;
    color: var(--color-cream);
    z-index: 2;
    cursor: default;
  }

  .pos-prev {
    left: 50%;
    transform: translateX(calc(-50% - 120px)) perspective(200px) rotateY(-30deg);
    font-size: 0.9375rem;
    color: var(--color-brown-mid);
    opacity: 0.7;
  }

  .pos-next {
    left: 50%;
    transform: translateX(calc(-50% + 120px)) perspective(200px) rotateY(30deg);
    font-size: 0.9375rem;
    color: var(--color-brown-mid);
    opacity: 0.7;
  }

  .pos-far-prev {
    left: 50%;
    transform: translateX(calc(-50% - 220px)) perspective(200px) rotateY(-55deg);
    font-size: 0.8125rem;
    color: var(--color-brown-light);
    opacity: 0.35;
  }

  .pos-far-next {
    left: 50%;
    transform: translateX(calc(-50% + 220px)) perspective(200px) rotateY(55deg);
    font-size: 0.8125rem;
    color: var(--color-brown-light);
    opacity: 0.35;
  }

  .pos-prev:hover,
  .pos-next:hover {
    opacity: 0.9;
  }

  .pos-far-prev:hover,
  .pos-far-next:hover {
    opacity: 0.5;
  }

  /* Curved fade overlays — left and right */
  .fade-left,
  .fade-right {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 50px;
    z-index: 3;
    pointer-events: none;
  }

  .fade-left {
    left: 0;
    background: linear-gradient(to right, var(--color-cream), transparent);
    border-radius: var(--radius-full) 0 0 var(--radius-full);
  }

  .fade-right {
    right: 0;
    background: linear-gradient(to left, var(--color-cream), transparent);
    border-radius: 0 var(--radius-full) var(--radius-full) 0;
  }

  .cylinder-hint {
    font-family: var(--font-body);
    font-size: 0.875rem;
    color: var(--color-brown-light);
    margin: var(--spacing-xs) 0 0;
    text-align: center;
  }

  @media (prefers-reduced-motion: reduce) {
    .cylinder-item {
      transition: none;
    }
  }
</style>
