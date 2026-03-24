<script>
  let { label, active = false, onToggle } = $props();
</script>

<button
  type="button"
  role="checkbox"
  aria-checked={active}
  class="toggle-pill"
  class:active
  onclick={() => onToggle(!active)}
>
  <span class="pill-label">{label}</span>
  <span class="pill-indicator" aria-hidden="true">
    <span class="pill-dot"></span>
  </span>
</button>

<style>
  .toggle-pill {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 16px 20px;
    border: 2px solid var(--color-brown-light);
    border-radius: var(--radius-lg);
    background: var(--color-white);
    font-family: var(--font-body);
    font-size: 1rem;
    color: var(--color-brand-brown);
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: var(--min-tap-target);
  }

  .toggle-pill.active {
    background: var(--color-cream);
    border-color: var(--color-brand-brown);
  }

  .toggle-pill:not(.active):hover {
    background: var(--color-cream-hover);
  }

  .toggle-pill:active {
    transform: scale(0.98);
  }

  .toggle-pill:focus-visible {
    outline: 2px solid var(--color-brown-mid);
    outline-offset: 2px;
  }

  .pill-label {
    font-weight: 500;
  }

  .pill-indicator {
    width: 44px;
    height: 26px;
    border-radius: var(--radius-full);
    background: var(--color-brown-light);
    position: relative;
    transition: background 0.2s ease;
    flex-shrink: 0;
  }

  .active .pill-indicator {
    background: var(--color-brand-brown);
  }

  .pill-dot {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .active .pill-dot {
    transform: translateX(18px);
  }
</style>
