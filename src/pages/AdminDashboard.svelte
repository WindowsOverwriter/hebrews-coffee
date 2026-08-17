<script>
  import { authToken } from '../stores/auth.js';
  import { onMount } from 'svelte';
  import AdminOrders from './admin/AdminOrders.svelte';
  import AdminLocations from './admin/AdminLocations.svelte';
  import AdminMenu from './admin/AdminMenu.svelte';
  import AdminSettings from './admin/AdminSettings.svelte';
  import AdminTrends from './admin/AdminTrends.svelte';

  // ─── Tab state ───
  let activeTab = $state('orders');

  onMount(() => {
    if (!$authToken) {
      window.location.hash = '#/admin';
      return;
    }
  });
</script>

<main class="admin-dashboard" id="main-content">
  <h1>Admin Dashboard</h1>

  <!-- ─── Tab bar ─── -->
  <div class="tab-bar" role="tablist">
    <button
      role="tab"
      class="tab"
      class:active={activeTab === 'orders'}
      aria-selected={activeTab === 'orders'}
      onclick={() => activeTab = 'orders'}
    >Orders</button>
    <button
      role="tab"
      class="tab"
      class:active={activeTab === 'locations'}
      aria-selected={activeTab === 'locations'}
      onclick={() => activeTab = 'locations'}
    >Locations</button>
    <button
      role="tab"
      class="tab"
      class:active={activeTab === 'menu'}
      aria-selected={activeTab === 'menu'}
      onclick={() => activeTab = 'menu'}
    >Menu</button>
    <button
      role="tab"
      class="tab"
      class:active={activeTab === 'settings'}
      aria-selected={activeTab === 'settings'}
      onclick={() => activeTab = 'settings'}
    >Settings</button>
    <button
      role="tab"
      class="tab"
      class:active={activeTab === 'trends'}
      aria-selected={activeTab === 'trends'}
      onclick={() => activeTab = 'trends'}
    >Trends</button>
  </div>

  {#if activeTab === 'orders'}
    <AdminOrders />
  {:else if activeTab === 'locations'}
    <AdminLocations />
  {:else if activeTab === 'menu'}
    <AdminMenu />
  {:else if activeTab === 'settings'}
    <AdminSettings />
  {:else if activeTab === 'trends'}
    <!-- m26: onOrdersInvalidated was a no-op — Orders tab already
         remounts fresh via the {#if} unmount when the user switches
         back to it, so no cross-tab signal is needed. -->
    <AdminTrends />
  {/if}
</main>

<style>
  .admin-dashboard {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: var(--spacing-xl) var(--spacing-lg);
  }

  .admin-dashboard h1 {
    font-family: var(--font-heading);
    color: var(--color-brand-brown);
    font-size: 2rem;
    margin-bottom: var(--spacing-lg);
  }

  /* ─── Tabs ─── */
  .tab-bar {
    display: flex;
    gap: 0;
    border-bottom: 2px solid var(--color-brown-light);
    margin-bottom: var(--spacing-xl);
  }

  .tab {
    padding: var(--spacing-sm) var(--spacing-xl);
    min-height: var(--min-tap-target);
    font-family: var(--font-heading);
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-brown-light);
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    margin-bottom: -2px;
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease;
  }

  .tab.active {
    color: var(--color-brand-brown);
    border-bottom-color: var(--color-brand-brown);
  }
</style>
