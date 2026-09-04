<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { authToken } from './stores/auth.js';
  import NavBar from './components/layout/NavBar.svelte';

  // Pages
  import Landing from './pages/Landing.svelte';
  import Order from './pages/Order.svelte';
  import CheckOrder from './pages/CheckOrder.svelte';
  import AdminLogin from './pages/AdminLogin.svelte';
  import AdminDashboard from './pages/AdminDashboard.svelte';

  // m19: init from the real hash at module load so a deep-link to
  // #/order etc. doesn't briefly render Landing before onMount runs.
  let currentRoute = $state(window.location.hash || '#/');
  let hasUserNavigated = false;

  function handleHashChange() {
    currentRoute = window.location.hash || '#/';
    hasUserNavigated = true;
  }

  onMount(() => {
    window.addEventListener('hashchange', handleHashChange);
  });

  onDestroy(() => {
    window.removeEventListener('hashchange', handleHashChange);
  });

  // S9: After a user-initiated route change, move focus to the new page's h1
  // so screen readers announce the transition. Skip the initial render.
  $effect(() => {
    currentRoute;
    if (!hasUserNavigated) return;
    tick().then(() => {
      const main = document.getElementById('main-content');
      const heading = main?.querySelector('h1');
      if (!heading) return;
      if (!heading.hasAttribute('tabindex')) {
        heading.setAttribute('tabindex', '-1');
      }
      heading.focus({ preventScroll: false });
    });
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
  <!-- Guard at the routing layer: never mount the dashboard without a token.
       Reactive, so a 401-cleared token drops the user back to login. -->
  {#if $authToken}
    <AdminDashboard />
  {:else}
    <AdminLogin />
  {/if}
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
