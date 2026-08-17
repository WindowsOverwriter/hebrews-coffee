<script>
  import { authToken } from '../stores/auth.js';
  import { adminLogin } from '../lib/api.js';
  import { onMount } from 'svelte';

  let password = $state('');
  let error = $state('');
  let loading = $state(false);

  onMount(() => {
    if ($authToken) {
      window.location.hash = '#/admin/dashboard';
    }
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password.trim()) return;
    loading = true;
    error = '';
    try {
      const data = await adminLogin(password);
      authToken.set(data.token);
      window.location.hash = '#/admin/dashboard';
    } catch (err) {
      error = err.message || 'Login failed.';
    } finally {
      loading = false;
    }
  }
</script>

<main class="admin-login" id="main-content">
  <div class="login-card">
    <h1>Admin Login</h1>

    <form onsubmit={handleSubmit}>
      <label for="admin-password">Password</label>
      <input
        id="admin-password"
        type="password"
        bind:value={password}
        placeholder="Enter admin password"
        autocomplete="current-password"
        required
        aria-required="true"
      />

      {#if error}
        <p class="error" role="alert">{error}</p>
      {/if}

      <button type="submit" disabled={loading || !password.trim()}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  </div>
</main>

<style>
  .admin-login {
    min-height: 80vh;
    min-height: 80dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-lg);
  }

  .login-card {
    width: 100%;
    max-width: 380px;
    background-color: var(--color-cream);
    border: 1px solid var(--color-brown-light);
    border-radius: var(--radius-lg);
    padding: var(--spacing-2xl) var(--spacing-xl);
  }

  .login-card h1 {
    font-family: var(--font-heading);
    color: var(--color-brand-brown);
    font-size: 1.5rem;
    text-align: center;
    margin-bottom: var(--spacing-xl);
  }

  label {
    display: block;
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--color-brand-brown);
    margin-bottom: var(--spacing-xs);
  }

  input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-brown-light);
    border-radius: var(--radius-md);
    background-color: var(--color-white);
    min-height: var(--min-tap-target);
    font-size: 1rem;
    margin-bottom: var(--spacing-lg);
  }

  input:focus {
    outline: 2px solid var(--color-brand-brown);
    outline-offset: 1px;
  }

  .error {
    color: var(--color-error);
    font-size: 0.875rem;
    margin-bottom: var(--spacing-md);
  }

  button {
    width: 100%;
    min-height: var(--min-tap-target);
    background-color: var(--color-brand-brown);
    color: var(--color-cream);
    border-radius: var(--radius-md);
    font-weight: 600;
    font-size: 1rem;
    transition: opacity 0.15s ease;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button:hover:not(:disabled) {
    opacity: 0.9;
  }
</style>
