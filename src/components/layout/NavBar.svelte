<script>
  let { currentRoute = '#/' } = $props();
</script>

<nav class="navbar">
  <div class="navbar-inner">
    <a href="#/" class="navbar-brand" aria-label="HeBrews Coffee home">
      <img src="/logo.svg" alt="HeBrews Coffee" class="navbar-logo" />
      <span class="navbar-name">HeBrews</span>
    </a>

    <div class="navbar-links">
      <a href="#/order" class="nav-link" class:active={currentRoute === '#/order'}>Order</a>
      <a href="#/check" class="nav-link" class:active={currentRoute === '#/check'}>My Order</a>
    </div>
  </div>
</nav>

<style>
  .navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: var(--color-brand-brown);
    border-bottom: 1px solid var(--color-brown-mid);
  }

  .navbar-inner {
    max-width: var(--max-width);
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) var(--spacing-lg);
    min-height: 56px;
  }

  .navbar-brand {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    text-decoration: none;
    -webkit-tap-highlight-color: transparent;
  }

  .navbar-logo {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
    object-fit: contain;
  }

  .navbar-name {
    font-family: var(--font-heading);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-cream);
    letter-spacing: -0.01em;
  }

  .navbar-links {
    display: flex;
    gap: var(--spacing-xs);
  }

  .nav-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--min-tap-target);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-full);
    font-family: var(--font-body);
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--color-brown-light);
    text-decoration: none;
    transition: color 0.15s ease, background-color 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .nav-link:hover {
    color: var(--color-cream);
  }

  .nav-link.active {
    color: var(--color-cream);
    background-color: var(--color-brown-mid);
  }
</style>
