<script>
  import { onDestroy } from 'svelte';
  import { Chart, BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
  Chart.register(BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend);
  import { getTrends, resetPeriod } from '../../lib/api.js';
  import { CUSTOMIZATION_TYPE_LABELS } from '../../lib/constants.js';

  // Called after a period reset so the Orders tab is rebuilt from fresh data.
  // Replaces the in-component `await loadOrders()` that lived in the old monolith.
  let { onOrdersInvalidated } = $props();

  // ─── Trends state ───
  let trendsData = $state(null);
  let trendsLoading = $state(false);
  let trendsError = $state('');
  let resetting = $state(false);
  let resetResult = $state('');
  let chartCanvas = $state(null);
  let chartInstance = null;

  // ─── Trends logic ───
  $effect(() => {
    if (chartCanvas && trendsData?.drinks?.length) {
      renderChart();
    }
  });

  // Chart.js does not clean up after itself — without this the canvas stays
  // registered and revisiting the tab throws "Canvas is already in use".
  onDestroy(() => {
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
  });

  async function loadTrends() {
    trendsLoading = true;
    trendsError = '';
    try {
      trendsData = await getTrends();
      renderChart();
    } catch (e) {
      trendsError = e.message;
    }
    trendsLoading = false;
  }

  function renderChart() {
    if (!chartCanvas || !trendsData?.drinks?.length) return;
    if (chartInstance) chartInstance.destroy();

    const labels = trendsData.drinks.map(d => d.drink_name);
    const data = trendsData.drinks.map(d => d.count);

    chartInstance = new Chart(chartCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Orders',
          data,
          backgroundColor: '#5C3D1E',
          borderColor: '#2C1A0E',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#2C1A0E',
            titleFont: { family: 'Inter' },
            bodyFont: { family: 'Inter' }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: '#5C3D1E', font: { family: 'Inter' } },
            grid: { color: 'rgba(160, 120, 80, 0.15)' }
          },
          x: {
            ticks: { color: '#2C1A0E', font: { family: 'Inter', weight: 600 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  async function handleEndSession() {
    if (!confirm('End this session? This will:\n\n- Export all order data (anonymized) to the server\n- Strip personal info from the database\n- Start a new period\n\nThis cannot be undone.')) return;
    resetting = true;
    resetResult = '';
    try {
      const data = await resetPeriod();
      resetResult = `${data.message} (${data.total_orders} orders exported to ${data.export_file})`;
      trendsData = null;
      if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
      onOrdersInvalidated?.();
    } catch (e) {
      trendsError = e.message;
    }
    resetting = false;
  }
</script>

<section class="admin-section">
  {#if trendsError}
    <p class="error" role="alert">{trendsError}</p>
  {/if}

  {#if !trendsData && !trendsLoading}
    <div class="trends-prompt">
      <p class="trends-prompt-text">Generate analytics for the current session.</p>
      <button class="btn btn-generate" onclick={loadTrends}>Generate Trends</button>
    </div>
  {:else if trendsLoading}
    <p class="loading-text">Crunching numbers...</p>
  {:else if trendsData}
    <div class="trends-summary">
      <span class="trends-total">{trendsData.total_orders} orders this session</span>
      {#if trendsData.period_start}
        <span class="trends-since">since {new Date(trendsData.period_start).toLocaleDateString()}</span>
      {/if}
    </div>

    <!-- Drink frequency chart -->
    {#if trendsData.drinks.length > 0}
      <h3 class="menu-heading">Drink Popularity</h3>
      <div class="chart-wrap">
        <canvas bind:this={chartCanvas}></canvas>
      </div>
    {/if}

    <!-- Customization breakdowns -->
    {#each Object.entries(trendsData.customizations) as [type, items]}
      <h3 class="menu-heading">{CUSTOMIZATION_TYPE_LABELS[type] || type}</h3>
      <div class="breakdown-list">
        {#each items as item}
          <div class="breakdown-row">
            <span class="breakdown-label">{item.label}</span>
            <div class="breakdown-bar-wrap">
              <div
                class="breakdown-bar"
                style="width: {Math.round((item.count / trendsData.total_orders) * 100)}%"
              ></div>
            </div>
            <span class="breakdown-count">{item.count}</span>
          </div>
        {/each}
      </div>
    {/each}

    <button class="btn btn-refresh-trends" onclick={loadTrends}>Refresh</button>

    <!-- End Session -->
    <div class="end-session">
      <h3 class="menu-heading">End Session</h3>
      <p class="end-session-desc">Export anonymized order data to the server and start a fresh period. Personal information will be stripped from the database.</p>
      {#if resetResult}
        <p class="end-session-result">{resetResult}</p>
      {/if}
      <button
        class="btn btn-end-session"
        disabled={resetting}
        onclick={handleEndSession}
      >{resetting ? 'Exporting...' : 'End Session & Export'}</button>
    </div>
  {/if}
</section>

<style>
  .admin-section {
    margin-bottom: var(--spacing-2xl);
  }

  .error {
    color: var(--color-error);
    margin-bottom: var(--spacing-md);
    font-size: 0.9375rem;
  }

  .loading-text {
    text-align: center;
    color: var(--color-brown-mid);
    padding: var(--spacing-2xl) 0;
  }

  .menu-heading {
    font-family: var(--font-heading);
    font-size: 1.125rem;
    color: var(--color-brand-brown);
    margin-top: var(--spacing-xl);
    margin-bottom: var(--spacing-sm);
  }

  .menu-heading:first-of-type {
    margin-top: 0;
  }

  /* ─── Buttons ─── */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--min-tap-target);
    padding: var(--spacing-sm) var(--spacing-lg);
    border-radius: var(--radius-md);
    font-weight: 600;
    font-size: 0.9375rem;
    cursor: pointer;
    transition: opacity 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ─── Trends Tab ─── */
  .trends-prompt {
    text-align: center;
    padding: var(--spacing-2xl) var(--spacing-lg);
  }

  .trends-prompt-text {
    color: var(--color-brown-mid);
    margin-bottom: var(--spacing-lg);
    font-size: 1rem;
  }

  .btn-generate {
    background: var(--color-brand-brown);
    color: var(--color-cream);
    min-height: var(--min-tap-target);
    padding: var(--spacing-sm) var(--spacing-2xl);
    border-radius: var(--radius-md);
    font-weight: 700;
    font-size: 1.125rem;
  }

  .trends-summary {
    display: flex;
    align-items: baseline;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
  }

  .trends-total {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-brand-brown);
  }

  .trends-since {
    font-size: 0.875rem;
    color: var(--color-brown-mid);
  }

  .chart-wrap {
    height: 280px;
    margin-bottom: var(--spacing-xl);
    background: var(--color-white);
    border-radius: var(--radius-lg);
    padding: var(--spacing-md);
    border: 1px solid var(--color-brown-light);
  }

  .breakdown-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-xl);
  }

  .breakdown-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .breakdown-label {
    width: 120px;
    flex-shrink: 0;
    font-weight: 500;
    font-size: 0.9375rem;
    color: var(--color-brand-brown);
    text-align: right;
  }

  .breakdown-bar-wrap {
    flex: 1;
    height: 24px;
    background: var(--color-cream);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .breakdown-bar {
    height: 100%;
    background: var(--color-brown-mid);
    border-radius: var(--radius-sm);
    min-width: 4px;
    transition: width 0.3s ease;
  }

  .breakdown-count {
    width: 36px;
    text-align: right;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-brand-brown);
  }

  .btn-refresh-trends {
    background: var(--color-cream);
    color: var(--color-brand-brown);
    border: 1px solid var(--color-brown-light);
    border-radius: var(--radius-md);
    min-height: var(--min-tap-target);
    padding: var(--spacing-sm) var(--spacing-lg);
    font-weight: 600;
    margin-bottom: var(--spacing-xl);
  }

  .end-session {
    margin-top: var(--spacing-xl);
    padding-top: var(--spacing-xl);
    border-top: 2px solid var(--color-error);
  }

  .end-session-desc {
    color: var(--color-brown-mid);
    font-size: 0.9375rem;
    margin-bottom: var(--spacing-md);
  }

  .end-session-result {
    color: var(--color-success);
    font-weight: 600;
    font-size: 0.9375rem;
    margin-bottom: var(--spacing-md);
  }

  .btn-end-session {
    background: var(--color-error);
    color: white;
    min-height: var(--min-tap-target);
    padding: var(--spacing-sm) var(--spacing-xl);
    border-radius: var(--radius-md);
    font-weight: 700;
  }

  .btn-end-session:disabled {
    opacity: 0.5;
  }
</style>
