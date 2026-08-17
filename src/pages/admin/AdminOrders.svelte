<script>
  import { onMount } from 'svelte';
  import { getAdminOrders, updateOrderStatus } from '../../lib/api.js';

  // ─── Orders state ───
  let orders = $state([]);
  let ordersLoading = $state(true);
  let ordersError = $state('');
  let ordersView = $state('queue'); // 'queue' | 'table'
  let updatingOrderId = $state(null);
  let lookupQuery = $state('');
  let receivedCount = $derived(orders.filter(o => o.status === 'received').length);
  let lookupMatches = $derived.by(() => {
    const q = lookupQuery.trim().toUpperCase();
    if (!q) return [];
    const received = orders.filter(o => o.status === 'received');
    const digits = q.replace(/\D/g, '');
    return received.filter(o => {
      if (o.confirmation_code.toUpperCase().includes(q)) return true;
      if (digits.length >= 3 && o.phone_number.replace(/\D/g, '').includes(digits)) return true;
      if (digits && String(o.order_number) === digits) return true;
      return false;
    });
  });
  onMount(() => {
    loadOrders();
  });

  // Poll orders every 15 seconds so the queue stays current
  $effect(() => {
    const pollInterval = setInterval(loadOrders, 15000);
    return () => clearInterval(pollInterval);
  });

  // ─── Orders logic ───
  async function loadOrders() {
    try {
      const data = await getAdminOrders();
      orders = data.orders || [];
      ordersError = '';
    } catch (e) {
      ordersError = e.message;
    }
    ordersLoading = false;
  }

  function parseSlotMinutes(slotStr) {
    const match = slotStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const period = match[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  function getNowMinutes() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  function getQueueOrders() {
    const cutoff = getNowMinutes() + 15;
    return orders
      .filter(o => {
        if (o.status !== 'queued') return false;
        const slot = parseSlotMinutes(o.pickup_slot);
        // Include if slot is within 15 min from now (or already past/unparseable)
        return slot === null || slot <= cutoff;
      })
      .sort((a, b) => {
        const slotA = parseSlotMinutes(a.pickup_slot) ?? 0;
        const slotB = parseSlotMinutes(b.pickup_slot) ?? 0;
        if (slotA !== slotB) return slotA - slotB;
        return a.id - b.id;
      });
  }

  function getUpcomingCount() {
    // Queued orders beyond the 15-min window
    const cutoff = getNowMinutes() + 15;
    return orders.filter(o => {
      if (o.status !== 'queued') return false;
      const slot = parseSlotMinutes(o.pickup_slot);
      return slot !== null && slot > cutoff;
    }).length;
  }

  async function markReceived(orderId) {
    updatingOrderId = orderId;
    try {
      await updateOrderStatus(orderId, 'received');
      await loadOrders();
    } catch (e) {
      ordersError = e.message;
    }
    updatingOrderId = null;
  }

  async function markCompleted(orderId) {
    updatingOrderId = orderId;
    try {
      await updateOrderStatus(orderId, 'completed');
      await loadOrders();
    } catch (e) {
      ordersError = e.message;
    }
    updatingOrderId = null;
  }

  function drinkLabel(drinkName, customizations) {
    const temp = customizations?.temperature;
    return temp ? `${temp} ${drinkName}` : drinkName;
  }

  function formatDetails(customizations) {
    if (!customizations) return [];
    const lines = [];
    if (customizations.espresso_type) lines.push(customizations.espresso_type);
    if (customizations.milk_type) lines.push(customizations.milk_type);
    if (customizations.syrup) {
      const pumps = customizations.syrup_pumps || 2;
      lines.push(`${customizations.syrup} (${pumps} pump${pumps !== 1 ? 's' : ''})`);
    }
    if (customizations.special_instructions) {
      lines.push(`"${customizations.special_instructions}"`);
    }
    return lines;
  }

  function statusLabel(status) {
    return { queued: 'Queued', received: 'Received', completed: 'Completed' }[status] || status;
  }
</script>

<section class="admin-section">
  {#if ordersError}
    <p class="error" role="alert">{ordersError}</p>
  {/if}

  <!-- View toggle -->
  <div class="view-toggle">
    <button
      class="view-btn"
      class:active={ordersView === 'queue'}
      onclick={() => ordersView = 'queue'}
    >Queue</button>
    <button
      class="view-btn"
      class:active={ordersView === 'table'}
      onclick={() => ordersView = 'table'}
    >All Orders</button>
  </div>

  {#if ordersLoading}
    <p class="loading-text">Loading orders...</p>

  <!-- ─── Queue View ─── -->
  {:else if ordersView === 'queue'}
    {@const queue = getQueueOrders()}
    {@const upcomingCount = getUpcomingCount()}

    {#if queue.length === 0}
      <div class="queue-empty">
        <p class="queue-empty-title">No orders due</p>
        {#if upcomingCount > 0}
          <p class="queue-empty-sub">{upcomingCount} order{upcomingCount !== 1 ? 's' : ''} scheduled for later time slots</p>
        {:else}
          <p class="queue-empty-sub">Orders will appear here as they come in</p>
        {/if}
      </div>
    {:else}
      <div class="queue-header">
        <span class="queue-count">{queue.length} in queue</span>
        {#if upcomingCount > 0}
          <span class="queue-upcoming">+ {upcomingCount} upcoming</span>
        {/if}
      </div>

      <!-- Head of queue — single order card -->
      {@const order = queue[0]}
      <div class="order-card">
        <div class="order-card-header">
          <span class="order-number">#{order.order_number}</span>
          <span class="order-slot">{order.pickup_slot}</span>
        </div>

        <div class="order-card-customer">
          <span class="customer-name">{order.customer_name}</span>
          <span class="customer-phone">{order.phone_number}</span>
        </div>
        <span class="order-code-secondary">{order.confirmation_code}</span>

        <ul class="order-items-list">
          {#each order.items as item}
            {@const details = formatDetails(item.customizations)}
            <li class="order-item-entry">
              <span class="item-drink">{drinkLabel(item.drink_name, item.customizations)}</span>
              {#if details.length > 0}
                <ul class="item-details">
                  {#each details as detail}
                    <li>{detail}</li>
                  {/each}
                </ul>
              {/if}
            </li>
          {/each}
        </ul>

        <button
          class="btn btn-received"
          disabled={updatingOrderId === order.id}
          onclick={() => markReceived(order.id)}
        >
          {updatingOrderId === order.id ? 'Updating...' : 'Received'}
        </button>
      </div>

      {#if queue.length > 1}
        <p class="queue-next">Next up: #{queue[1].order_number} {queue[1].customer_name} — {queue[1].pickup_slot}</p>
      {/if}
    {/if}

    <!-- ─── Received Order Lookup ─── -->
    <div class="lookup-section">
      <div class="lookup-header">
        <h3 class="lookup-title">Mark Ready for Pickup</h3>
        {#if receivedCount > 0}
          <span class="lookup-badge">{receivedCount} received</span>
        {/if}
      </div>
      <div class="lookup-input-wrap">
        <input
          class="lookup-input"
          type="text"
          placeholder="Search by phone or order code..."
          bind:value={lookupQuery}
        />
        {#if lookupQuery}
          <button class="lookup-clear" onclick={() => lookupQuery = ''} aria-label="Clear search">&times;</button>
        {/if}
      </div>
      {#if lookupQuery.trim() && lookupMatches.length === 0}
        <p class="lookup-no-results">No received orders match "{lookupQuery.trim()}"</p>
      {/if}
      {#if lookupMatches.length > 0}
        <ul class="lookup-results">
          {#each lookupMatches as order (order.id)}
            <li class="lookup-card">
              <div class="lookup-card-top">
                <div class="lookup-card-info">
                  <span class="lookup-card-name">{order.customer_name}</span>
                  <span class="lookup-card-meta">#{order.order_number} &middot; {order.confirmation_code} &middot; {order.pickup_slot} &middot; {order.phone_number}</span>
                </div>
                <button
                  class="btn btn-sm btn-complete"
                  disabled={updatingOrderId === order.id}
                  onclick={() => { markCompleted(order.id); lookupQuery = ''; }}
                >{updatingOrderId === order.id ? '...' : 'Complete'}</button>
              </div>
              <div class="lookup-card-items">
                {#each order.items as item}
                  <span class="lookup-item">{drinkLabel(item.drink_name, item.customizations)}</span>
                {/each}
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

  <!-- ─── Table View ─── -->
  {:else}
    {@const sortBySlot = (a, b) => {
      const slotA = parseSlotMinutes(a.pickup_slot) ?? 0;
      const slotB = parseSlotMinutes(b.pickup_slot) ?? 0;
      if (slotA !== slotB) return slotA - slotB;
      return a.id - b.id;
    }}
    {@const openOrders = orders.filter(o => o.status !== 'completed').sort(sortBySlot)}
    {@const completedOrders = orders.filter(o => o.status === 'completed').sort(sortBySlot)}

    {#if openOrders.length === 0 && completedOrders.length === 0}
      <p class="empty">No orders in the current period.</p>
    {:else}
      <!-- Open orders -->
      {#if openOrders.length > 0}
        <h3 class="table-heading">Open Orders ({openOrders.length})</h3>
        <div class="orders-table-wrap">
          <table class="orders-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Code</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Slot</th>
                <th>Items</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each openOrders as order (order.id)}
                <tr class="order-row">
                  <td class="col-num">{order.order_number}</td>
                  <td class="col-code">{order.confirmation_code}</td>
                  <td>{order.customer_name}</td>
                  <td class="col-phone">{order.phone_number}</td>
                  <td>{order.pickup_slot}</td>
                  <td class="col-items">
                    {#each order.items as item}
                      {@const details = formatDetails(item.customizations)}
                      <div class="table-item">
                        <strong>{drinkLabel(item.drink_name, item.customizations)}</strong>
                        {#if details.length > 0}
                          <span class="table-item-details">{details.join(', ')}</span>
                        {/if}
                      </div>
                    {/each}
                  </td>
                  <td>
                    <span class="status-badge status-{order.status}">{statusLabel(order.status)}</span>
                  </td>
                  <td class="col-actions">
                    {#if order.status === 'queued'}
                      <button
                        class="btn btn-sm btn-received"
                        disabled={updatingOrderId === order.id}
                        onclick={() => markReceived(order.id)}
                      >Received</button>
                    {:else if order.status === 'received'}
                      <button
                        class="btn btn-sm btn-complete"
                        disabled={updatingOrderId === order.id}
                        onclick={() => markCompleted(order.id)}
                      >Complete</button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <p class="all-done">All orders completed.</p>
      {/if}

      <!-- Completed orders -->
      {#if completedOrders.length > 0}
        <h3 class="table-heading completed-heading">Completed ({completedOrders.length})</h3>
        <div class="orders-table-wrap">
          <table class="orders-table completed-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Code</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Slot</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              {#each completedOrders as order (order.id)}
                <tr class="order-row completed">
                  <td class="col-num">{order.order_number}</td>
                  <td class="col-code">{order.confirmation_code}</td>
                  <td>{order.customer_name}</td>
                  <td class="col-phone">{order.phone_number}</td>
                  <td>{order.pickup_slot}</td>
                  <td class="col-items">
                    {#each order.items as item}
                      {@const details = formatDetails(item.customizations)}
                      <div class="table-item">
                        <strong>{drinkLabel(item.drink_name, item.customizations)}</strong>
                        {#if details.length > 0}
                          <span class="table-item-details">{details.join(', ')}</span>
                        {/if}
                      </div>
                    {/each}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    {/if}
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

  /* ─── View Toggle ─── */
  .view-toggle {
    display: flex;
    background: var(--color-cream);
    border-radius: var(--radius-lg);
    padding: 4px;
    margin-bottom: var(--spacing-lg);
    border: 1px solid var(--color-brown-light);
  }

  .view-btn {
    flex: 1;
    padding: var(--spacing-sm) var(--spacing-md);
    min-height: 40px;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    font-weight: 600;
    font-size: 0.9375rem;
    color: var(--color-brown-mid);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .view-btn.active {
    background: var(--color-brand-brown);
    color: var(--color-cream);
  }

  /* ─── Queue View ─── */
  .queue-header {
    display: flex;
    align-items: baseline;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
  }

  .queue-count {
    font-family: var(--font-heading);
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-brand-brown);
  }

  .queue-upcoming {
    font-size: 0.875rem;
    color: var(--color-brown-light);
  }

  .queue-empty {
    text-align: center;
    padding: var(--spacing-2xl) var(--spacing-lg);
  }

  .queue-empty-title {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    color: var(--color-brand-brown);
    margin-bottom: var(--spacing-xs);
  }

  .queue-empty-sub {
    color: var(--color-brown-light);
    font-size: 0.9375rem;
  }

  .queue-next {
    text-align: center;
    color: var(--color-brown-mid);
    font-size: 0.875rem;
    margin-top: var(--spacing-md);
  }

  /* ─── Order Card (Queue Head) ─── */
  .order-card {
    background: var(--color-cream);
    border: 2px solid var(--color-brand-brown);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    max-width: 480px;
    margin: 0 auto;
  }

  .order-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
    padding-bottom: var(--spacing-sm);
    border-bottom: 1px solid var(--color-brown-light);
  }

  .order-number {
    font-family: var(--font-heading);
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--color-brand-brown);
    line-height: 1;
  }

  .order-slot {
    font-weight: 600;
    color: var(--color-brown-mid);
    font-size: 1rem;
  }

  .order-code-secondary {
    display: block;
    font-family: monospace;
    font-size: 0.8125rem;
    color: var(--color-brown-light);
    letter-spacing: 0.05em;
    margin-bottom: var(--spacing-sm);
  }

  .order-card-customer {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: var(--spacing-md);
  }

  .customer-name {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-brand-brown);
  }

  .customer-phone {
    font-size: 0.9375rem;
    color: var(--color-brown-mid);
  }

  .order-items-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }

  .order-item-entry {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-white);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-brown-light);
  }

  .item-drink {
    font-weight: 700;
    font-size: 1.125rem;
    color: var(--color-brand-brown);
    display: block;
    margin-bottom: 4px;
  }

  .item-details {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    font-size: 0.9375rem;
    color: var(--color-brown-mid);
    margin-top: 4px;
  }

  .btn-received {
    width: 100%;
    background-color: var(--color-success);
    color: white;
    font-size: 1.125rem;
    padding: var(--spacing-md);
    min-height: 56px;
    border-radius: var(--radius-md);
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .btn-received:active:not(:disabled) {
    transform: scale(0.98);
  }

  /* ─── Table View ─── */
  .orders-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border: 1px solid var(--color-brown-light);
    border-radius: var(--radius-lg);
  }

  .orders-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .orders-table thead {
    background: var(--color-brand-brown);
    color: var(--color-cream);
  }

  .orders-table th {
    padding: var(--spacing-sm) var(--spacing-md);
    text-align: left;
    font-weight: 600;
    white-space: nowrap;
  }

  .orders-table td {
    padding: var(--spacing-sm) var(--spacing-md);
    border-bottom: 1px solid var(--color-cream);
    vertical-align: top;
  }

  .orders-table tbody tr:nth-child(even) {
    background: var(--color-white);
  }

  .orders-table tbody tr:nth-child(odd) {
    background: var(--color-cream);
  }

  .order-row.completed {
    opacity: 0.5;
  }

  .col-num {
    font-weight: 700;
    font-size: 1.125rem;
    color: var(--color-brand-brown);
    text-align: center;
    white-space: nowrap;
  }

  .col-code {
    font-family: monospace;
    font-size: 0.8125rem;
    color: var(--color-brown-light);
    white-space: nowrap;
  }

  .col-phone {
    white-space: nowrap;
  }

  .col-items {
    min-width: 180px;
  }

  .col-actions {
    white-space: nowrap;
  }

  .table-item {
    margin-bottom: 4px;
  }

  .table-item-details {
    font-size: 0.8125rem;
    color: var(--color-brown-mid);
    display: block;
  }

  .status-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .status-queued {
    background: #FEF3C7;
    color: #92400E;
  }

  .status-received {
    background: #DBEAFE;
    color: #1E40AF;
  }

  .status-completed {
    background: #D1FAE5;
    color: #065F46;
  }

  .btn-sm {
    font-size: 0.8125rem;
    min-height: 36px;
    padding: var(--spacing-xs) var(--spacing-md);
  }

  .btn-complete {
    background-color: var(--color-brand-brown);
    color: var(--color-cream);
    border-radius: var(--radius-md);
    font-weight: 600;
  }

  .table-heading {
    font-family: var(--font-heading);
    font-size: 1.125rem;
    color: var(--color-brand-brown);
    margin-bottom: var(--spacing-sm);
  }

  .completed-heading {
    margin-top: var(--spacing-xl);
    color: var(--color-brown-light);
  }

  .completed-table {
    opacity: 0.6;
  }

  .all-done {
    text-align: center;
    color: var(--color-success);
    font-weight: 600;
    padding: var(--spacing-lg) 0;
  }

  /* ─── Received Lookup ─── */
  .lookup-section {
    margin-top: var(--spacing-xl);
    padding-top: var(--spacing-xl);
    border-top: 1px solid var(--color-brown-light);
  }

  .lookup-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
  }

  .lookup-title {
    font-family: var(--font-heading);
    font-size: 1.125rem;
    color: var(--color-brand-brown);
  }

  .lookup-badge {
    font-size: 0.75rem;
    font-weight: 600;
    background: #DBEAFE;
    color: #1E40AF;
    padding: 2px 8px;
    border-radius: var(--radius-full);
  }

  .lookup-input-wrap {
    position: relative;
    margin-bottom: var(--spacing-md);
  }

  .lookup-input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    padding-right: 40px;
    border: 1px solid var(--color-brown-light);
    border-radius: var(--radius-md);
    background: var(--color-white);
    min-height: var(--min-tap-target);
    font-size: 1rem;
    box-sizing: border-box;
  }

  .lookup-input:focus {
    outline: 2px solid var(--color-brand-brown);
    outline-offset: 1px;
  }

  .lookup-clear {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    font-size: 1.25rem;
    color: var(--color-brown-light);
    cursor: pointer;
  }

  .lookup-no-results {
    color: var(--color-brown-light);
    font-size: 0.875rem;
    text-align: center;
    padding: var(--spacing-sm) 0;
  }

  .lookup-results {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .lookup-card {
    background: var(--color-cream);
    border: 1px solid var(--color-brown-light);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
  }

  .lookup-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
  }

  .lookup-card-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .lookup-card-name {
    font-weight: 700;
    color: var(--color-brand-brown);
    font-size: 1rem;
  }

  .lookup-card-meta {
    font-size: 0.8125rem;
    color: var(--color-brown-mid);
  }

  .lookup-card-items {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    margin-top: var(--spacing-xs);
  }

  .lookup-item {
    font-size: 0.8125rem;
    color: var(--color-brown-mid);
    background: var(--color-white);
    padding: 2px 8px;
    border-radius: var(--radius-sm);
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

  .empty {
    color: var(--color-brown-light);
    text-align: center;
    padding: var(--spacing-xl);
  }
</style>
