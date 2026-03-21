<script>
  // Admin dashboard — orders, trends, menu management, settings
  import { authToken } from '../stores/auth.js';
  import { onMount } from 'svelte';

  onMount(() => {
    if (!$authToken) {
      window.location.hash = '#/admin';
    }
  });
</script>

<main class="admin-dashboard">
  <h1>Admin Dashboard</h1>
  <p>Placeholder — see TECHNICAL_SPEC.md §5.5</p>
</main>
