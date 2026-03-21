<script>
  import { onMount, onDestroy } from 'svelte';

  // Pages
  import Landing from './pages/Landing.svelte';
  import Order from './pages/Order.svelte';
  import CheckOrder from './pages/CheckOrder.svelte';
  import AdminLogin from './pages/AdminLogin.svelte';
  import AdminDashboard from './pages/AdminDashboard.svelte';

  let currentRoute = '';

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
</script>

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
