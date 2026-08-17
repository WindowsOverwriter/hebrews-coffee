<script>
  import { authToken } from '../stores/auth.js';
  import { onMount } from 'svelte';
  import AdminOrders from './admin/AdminOrders.svelte';
  import AdminLocations from './admin/AdminLocations.svelte';
  import AdminMenu from './admin/AdminMenu.svelte';
  import AdminSettings from './admin/AdminSettings.svelte';
  import AdminTrends from './admin/AdminTrends.svelte';

  // ─── Tab state ───
  const TABS = ['orders', 'locations', 'menu', 'settings', 'trends'];
  const TAB_LABELS = {
    orders: 'Orders',
    locations: 'Locations',
    menu: 'Menu',
    settings: 'Settings',
    trends: 'Trends'
  };
  let activeTab = $state('orders');

  onMount(() => {
    if (!$authToken) {
      window.location.hash = '#/admin';
      return;
    }
  });

  // C3: arrow-key navigation across the tablist (WAI-ARIA authoring practices)
  function handleTabKey(e, index) {
    let nextIndex = null;
    if (e.key === 'ArrowRight') nextIndex = (index + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = TABS.length - 1;
    else return;

    e.preventDefault();
    activeTab = TABS[nextIndex];
    requestAnimationFrame(() => {
      document.getElementById(`admin-tab-${activeTab}`)?.focus();
    });
  }
</script>

<main class="admin-dashboard" id="main-content">
  <h1>Admin Dashboard</h1>

  <!-- ─── Tab bar ─── -->
  <div class="tab-bar" role="tablist" aria-label="Admin sections">
    {#each TABS as tab, i}
      <button
        id="admin-tab-{tab}"
        role="tab"
        class="tab"
        class:active={activeTab === tab}
        aria-selected={activeTab === tab}
        aria-controls="admin-panel-{tab}"
        tabindex={activeTab === tab ? 0 : -1}
        onclick={() => activeTab = tab}
        onkeydown={(e) => handleTabKey(e, i)}
      >{TAB_LABELS[tab]}</button>
    {/each}
  </div>

  {#if activeTab === 'orders'}
    <div id="admin-panel-orders" role="tabpanel" aria-labelledby="admin-tab-orders" tabindex="0">
      <AdminOrders />
    </div>
  {:else if activeTab === 'locations'}
    <div id="admin-panel-locations" role="tabpanel" aria-labelledby="admin-tab-locations" tabindex="0">
      <AdminLocations />
    </div>
  {:else if activeTab === 'menu'}
    <div id="admin-panel-menu" role="tabpanel" aria-labelledby="admin-tab-menu" tabindex="0">
      <AdminMenu />
    </div>
  {:else if activeTab === 'settings'}
    <div id="admin-panel-settings" role="tabpanel" aria-labelledby="admin-tab-settings" tabindex="0">
      <AdminSettings />
    </div>
  {:else if activeTab === 'trends'}
    <!-- m26: onOrdersInvalidated was a no-op — Orders tab already
         remounts fresh via the {#if} unmount when the user switches
         back to it, so no cross-tab signal is needed. -->
    <div id="admin-panel-trends" role="tabpanel" aria-labelledby="admin-tab-trends" tabindex="0">
      <AdminTrends />
    </div>
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
    font-family: var(--font-body);
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
