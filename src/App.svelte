<script>
  import { onMount, onDestroy } from 'svelte';
  import NavBar from './components/layout/NavBar.svelte';

  // Pages
  import Landing from './pages/Landing.svelte';
  import Order from './pages/Order.svelte';
  import CheckOrder from './pages/CheckOrder.svelte';
  import AdminLogin from './pages/AdminLogin.svelte';
  import AdminDashboard from './pages/AdminDashboard.svelte';

  let currentRoute = $state('');

  function handleHashChange() {
    currentRoute = window.location.hash || '#/';
  }

  onMount(() => {
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
  });

  onDestroy(() => {
    window.removeEventListener('hashchange', handleHashChange);
  });

  const isAdminRoute = $derived(
    currentRoute === '#/admin' || currentRoute === '#/admin/dashboard'
  );
</script>

<a href="#main-content" class="skip-link">Skip to main content</a>

{#if !isAdminRoute}
  <NavBar {currentRoute} />
{/if}

{#if currentRoute === '#/' || currentRoute === ''}
  <Landing />
{:else if currentRoute === '#/order'}
  <Order />
{:else if currentRoute === '#/check'}
  <CheckOrder />
{:else if currentRoute === '#/admin'}
  <AdminLogin />
{:else if currentRoute === '#/admin/dashboard'}
  <AdminDashboard />
{:else}
  <Landing />
{/if}

<style>
  .skip-link {
    position: absolute;
    top: -100%;
    left: 0;
    background: var(--color-brand-brown);
    color: var(--color-cream);
    padding: 0.5rem 1rem;
    z-index: 9999;
    font-family: var(--font-body);
    font-weight: 600;
    text-decoration: none;
  }

  .skip-link:focus {
    top: 0;
  }
</style>
