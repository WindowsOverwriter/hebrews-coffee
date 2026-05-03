<script>
  import { authToken } from '../stores/auth.js';
  import { onMount, onDestroy } from 'svelte';
  import {
    getAdminOrders, updateOrderStatus, createWalkupOrder,
    getAdminMenu, createDrink, deleteDrink, setDrinkCustomizationTypes,
    toggleDrink, toggleCustomization,
    getSettings, updateSetting,
    getAdminLocations, createLocation, updateLocation,
    deleteLocation, setLocationDates
  } from '../lib/api.js';

  // ─── Tab state ───
  let activeTab = $state('orders');

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
  let walkupName = $state('');
  let walkupPhone = $state('');
  let walkupSaving = $state(false);
  let walkupSuccessMsg = $state('');
  let pollInterval = null;

  // ─── Locations state ───
  let locations = $state([]);
  let newName = $state('');
  let newAddress = $state('');
  let error = $state('');
  let saving = $state(false);
  let expandedId = $state(null);

  // ─── Menu state ───
  let menuDrinks = $state([]);
  let menuCustomizations = $state({});
  let menuLoading = $state(true);
  let menuError = $state('');
  let togglingId = $state(null);
  let expandedDrinkId = $state(null);
  let newDrinkName = $state('');
  let newDrinkDesc = $state('');
  let newDrinkRatio = $state('');
  let addingDrink = $state(false);

  // ─── Settings state ───
  let settings = $state({});
  let settingsLoading = $state(true);
  let settingsError = $state('');
  let savingSetting = $state(null);

  // Calendar state for the expanded location
  let calendarYear = $state(new Date().getFullYear());
  let calendarMonth = $state(new Date().getMonth());

  onMount(() => {
    if (!$authToken) {
      window.location.hash = '#/admin';
      return;
    }
    loadOrders();
    loadLocations();
    loadMenu();
    loadSettings();
    // Poll orders every 15 seconds so the queue stays current
    pollInterval = setInterval(loadOrders, 15000);
  });

  onDestroy(() => {
    if (pollInterval) clearInterval(pollInterval);
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

  async function submitWalkup() {
    if (!walkupName.trim() || !walkupPhone.trim()) return;
    walkupSaving = true;
    walkupSuccessMsg = '';
    try {
      const data = await createWalkupOrder(walkupName.trim(), walkupPhone.trim());
      walkupSuccessMsg = `#${data.order_number} — ${data.confirmation_code}`;
      walkupName = '';
      walkupPhone = '';
      await loadOrders();
    } catch (e) {
      ordersError = e.message;
    }
    walkupSaving = false;
  }

  // ─── Menu logic ───
  async function loadMenu() {
    try {
      const data = await getAdminMenu();
      menuDrinks = data.drinks || [];
      menuCustomizations = data.customizations || {};
      menuError = '';
    } catch (e) {
      menuError = e.message;
    }
    menuLoading = false;
  }

  async function handleToggleDrink(drink) {
    togglingId = `drink-${drink.id}`;
    try {
      await toggleDrink(drink.id, !drink.enabled);
      await loadMenu();
    } catch (e) {
      menuError = e.message;
    }
    togglingId = null;
  }

  async function handleToggleCustomization(opt) {
    togglingId = `opt-${opt.id}`;
    try {
      await toggleCustomization(opt.id, !opt.enabled);
      await loadMenu();
    } catch (e) {
      menuError = e.message;
    }
    togglingId = null;
  }

  async function handleAddDrink() {
    if (!newDrinkName.trim()) return;
    addingDrink = true;
    try {
      await createDrink({
        name: newDrinkName.trim(),
        description: newDrinkDesc.trim(),
        ratio_summary: newDrinkRatio.trim()
      });
      newDrinkName = '';
      newDrinkDesc = '';
      newDrinkRatio = '';
      await loadMenu();
    } catch (e) {
      menuError = e.message;
    }
    addingDrink = false;
  }

  async function handleDeleteDrink(drink) {
    if (!confirm(`Delete "${drink.name}"? This cannot be undone.`)) return;
    try {
      await deleteDrink(drink.id);
      if (expandedDrinkId === drink.id) expandedDrinkId = null;
      await loadMenu();
    } catch (e) {
      menuError = e.message;
    }
  }

  async function handleToggleType(drink, type) {
    const current = drink.customization_types || [];
    const newTypes = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    togglingId = `type-${drink.id}-${type}`;
    try {
      await setDrinkCustomizationTypes(drink.id, newTypes);
      await loadMenu();
    } catch (e) {
      menuError = e.message;
    }
    togglingId = null;
  }

  const ALL_CUSTOMIZATION_TYPES = ['temperature', 'espresso_type', 'milk_type', 'syrup'];

  const CUSTOMIZATION_TYPE_LABELS = {
    temperature: 'Temperature',
    espresso_type: 'Espresso Type',
    milk_type: 'Milk Type',
    syrup: 'Syrup'
  };

  // ─── Settings logic ───
  async function loadSettings() {
    try {
      settings = await getSettings();
      settingsError = '';
    } catch (e) {
      settingsError = e.message;
    }
    settingsLoading = false;
  }

  async function handleUpdateSetting(key, value) {
    savingSetting = key;
    try {
      await updateSetting(key, value);
      settings = { ...settings, [key]: value };
      settingsError = '';
    } catch (e) {
      settingsError = e.message;
    }
    savingSetting = null;
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

  async function loadLocations() {
    try {
      const data = await getAdminLocations();
      locations = data.locations;
    } catch (e) {
      error = e.message;
    }
  }

  async function handleAdd() {
    if (!newName.trim() || !newAddress.trim()) return;
    saving = true;
    error = '';
    try {
      await createLocation(newName.trim(), newAddress.trim());
      newName = '';
      newAddress = '';
      await loadLocations();
    } catch (e) {
      error = e.message;
    }
    saving = false;
  }

  async function handleToggle(loc) {
    try {
      await updateLocation(loc.id, { active: !loc.active });
      await loadLocations();
    } catch (e) {
      error = e.message;
    }
  }

  async function handleDelete(loc) {
    if (!confirm(`Delete "${loc.name}"?`)) return;
    try {
      await deleteLocation(loc.id);
      if (expandedId === loc.id) expandedId = null;
      await loadLocations();
    } catch (e) {
      error = e.message;
    }
  }

  async function handleSetDeleteAfter(loc, dateStr) {
    try {
      await updateLocation(loc.id, { delete_after: dateStr || null });
      await loadLocations();
    } catch (e) {
      error = e.message;
    }
  }

  function toggleExpand(locId) {
    if (expandedId === locId) {
      expandedId = null;
    } else {
      expandedId = locId;
      calendarYear = new Date().getFullYear();
      calendarMonth = new Date().getMonth();
    }
  }

  // Calendar helpers
  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfWeek(year, month) {
    return new Date(year, month, 1).getDay();
  }

  function toIso(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function prevMonth() {
    if (calendarMonth === 0) {
      calendarMonth = 11;
      calendarYear--;
    } else {
      calendarMonth--;
    }
  }

  function nextMonth() {
    if (calendarMonth === 11) {
      calendarMonth = 0;
      calendarYear++;
    } else {
      calendarMonth++;
    }
  }

  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  async function toggleDate(loc, dateStr) {
    const currentDates = loc.dates || [];
    let newDates;
    if (currentDates.includes(dateStr)) {
      newDates = currentDates.filter(d => d !== dateStr);
    } else {
      newDates = [...currentDates, dateStr];
    }
    try {
      await setLocationDates(loc.id, newDates);
      await loadLocations();
    } catch (e) {
      error = e.message;
    }
  }

  function isPast(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr + 'T00:00:00') < today;
  }
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
  </div>

  <!-- ═══════════════════════════════════════════ -->
  <!-- ORDERS TAB                                  -->
  <!-- ═══════════════════════════════════════════ -->
  {#if activeTab === 'orders'}
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

        <!-- ─── Walk-up Order ─── -->
        <div class="walkup-section">
          <h3 class="walkup-title">Walk-up Order</h3>
          <form class="walkup-form" onsubmit={(e) => { e.preventDefault(); submitWalkup(); }}>
            <input
              class="walkup-input"
              type="text"
              placeholder="First and last name"
              bind:value={walkupName}
            />
            <input
              class="walkup-input"
              type="tel"
              placeholder="Phone number"
              bind:value={walkupPhone}
            />
            <button
              type="submit"
              class="btn btn-walkup"
              disabled={walkupSaving || !walkupName.trim() || !walkupPhone.trim()}
            >{walkupSaving ? 'Saving...' : 'Add Walk-up'}</button>
          </form>
          {#if walkupSuccessMsg}
            <p class="walkup-confirm">Added {walkupSuccessMsg}</p>
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

  <!-- ═══════════════════════════════════════════ -->
  <!-- LOCATIONS TAB                               -->
  <!-- ═══════════════════════════════════════════ -->
  {:else if activeTab === 'locations'}
    <section class="admin-section">
      <p class="section-desc">Manage locations and their operating dates. Tap a location to set its schedule.</p>

      {#if error}
        <p class="error" role="alert">{error}</p>
      {/if}

      <form class="add-form" onsubmit={(e) => { e.preventDefault(); handleAdd(); }}>
        <div class="form-row">
          <div class="form-field">
            <label for="loc-name">Name</label>
            <input id="loc-name" type="text" bind:value={newName} placeholder="e.g. Community Center" />
          </div>
          <div class="form-field">
            <label for="loc-address">Address</label>
            <input id="loc-address" type="text" bind:value={newAddress} placeholder="e.g. 456 Oak Ave, City, ST" />
          </div>
        </div>
        <button type="submit" class="btn btn-add" disabled={saving || !newName.trim() || !newAddress.trim()}>
          {saving ? 'Adding...' : 'Add Location'}
        </button>
      </form>

      {#if locations.length === 0}
        <p class="empty">No locations yet. Add one above.</p>
      {:else}
        <ul class="location-list">
          {#each locations as loc (loc.id)}
            <li class="location-entry" class:inactive={!loc.active}>
              <div class="location-item">
                <button class="location-info-btn" onclick={() => toggleExpand(loc.id)}>
                  <div class="location-info">
                    <strong>{loc.name}</strong>
                    <span class="location-address">{loc.address}</span>
                    <span class="date-count">
                      {(loc.dates || []).filter(d => !isPast(d)).length} upcoming date{(loc.dates || []).filter(d => !isPast(d)).length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <span class="expand-arrow" class:expanded={expandedId === loc.id}>&#9660;</span>
                </button>
                <div class="location-actions">
                  <button class="btn btn-toggle" onclick={() => handleToggle(loc)}>
                    {loc.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button class="btn btn-delete" onclick={() => handleDelete(loc)}>Delete</button>
                </div>
              </div>

              {#if expandedId === loc.id}
                <div class="location-expanded">
                  <!-- Scheduled deletion -->
                  <div class="delete-schedule">
                    <label for="delete-after-{loc.id}">Auto-delete after:</label>
                    <input
                      id="delete-after-{loc.id}"
                      type="date"
                      value={loc.delete_after || ''}
                      onchange={(e) => handleSetDeleteAfter(loc, e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {#if loc.delete_after}
                      <button class="btn btn-clear" onclick={() => handleSetDeleteAfter(loc, '')}>Clear</button>
                    {/if}
                  </div>

                  <!-- Calendar -->
                  <div class="calendar">
                    <div class="calendar-header">
                      <button class="cal-nav" onclick={prevMonth}>&larr;</button>
                      <span class="cal-title">{MONTH_NAMES[calendarMonth]} {calendarYear}</span>
                      <button class="cal-nav" onclick={nextMonth}>&rarr;</button>
                    </div>
                    <div class="cal-weekdays">
                      {#each ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as day}
                        <span class="cal-weekday">{day}</span>
                      {/each}
                    </div>
                    <div class="cal-grid">
                      {#each Array(getFirstDayOfWeek(calendarYear, calendarMonth)) as _}
                        <span class="cal-empty"></span>
                      {/each}
                      {#each Array(getDaysInMonth(calendarYear, calendarMonth)) as _, i}
                        {@const dateStr = toIso(calendarYear, calendarMonth, i + 1)}
                        {@const isSelected = (loc.dates || []).includes(dateStr)}
                        {@const past = isPast(dateStr)}
                        <button
                          class="cal-day"
                          class:selected={isSelected}
                          class:past={past}
                          disabled={past}
                          aria-label="{MONTH_NAMES[calendarMonth]} {i + 1}, {calendarYear}"
                          aria-pressed={isSelected}
                          onclick={() => toggleDate(loc, dateStr)}
                        >
                          {i + 1}
                        </button>
                      {/each}
                    </div>
                  </div>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </section>

  <!-- ═══════════════════════════════════════════ -->
  <!-- MENU TAB                                    -->
  <!-- ═══════════════════════════════════════════ -->
  {:else if activeTab === 'menu'}
    <section class="admin-section">
      {#if menuError}
        <p class="error" role="alert">{menuError}</p>
      {/if}

      {#if menuLoading}
        <p class="loading-text">Loading menu...</p>
      {:else}
        <!-- Add Drink -->
        <h3 class="menu-heading">Drinks</h3>
        <form class="add-drink-form" onsubmit={(e) => { e.preventDefault(); handleAddDrink(); }}>
          <input type="text" placeholder="Drink name" bind:value={newDrinkName} class="add-drink-input" />
          <input type="text" placeholder="Description" bind:value={newDrinkDesc} class="add-drink-input" />
          <input type="text" placeholder="Ratio summary (shown on menu card)" bind:value={newDrinkRatio} class="add-drink-input" />
          <button type="submit" class="btn btn-add-drink" disabled={addingDrink || !newDrinkName.trim()}>
            {addingDrink ? 'Adding...' : 'Add Drink'}
          </button>
        </form>

        <!-- Drink List -->
        <ul class="menu-list">
          {#each menuDrinks as drink (drink.id)}
            <li class="menu-item-wrap">
              <div class="menu-item" class:disabled={!drink.enabled}>
                <button class="menu-item-expand" onclick={() => expandedDrinkId = expandedDrinkId === drink.id ? null : drink.id}>
                  <div class="menu-item-info">
                    <span class="menu-item-name">{drink.name}</span>
                    <span class="menu-item-desc">{drink.ratio_summary || drink.description}</span>
                    <span class="menu-item-types">
                      {(drink.customization_types || []).map(t => CUSTOMIZATION_TYPE_LABELS[t] || t).join(', ') || 'No customizations'}
                    </span>
                  </div>
                  <span class="expand-arrow" class:expanded={expandedDrinkId === drink.id}>&#9660;</span>
                </button>
                <div class="menu-item-controls">
                  <button
                    class="toggle-switch"
                    class:on={drink.enabled}
                    role="switch"
                    aria-checked={drink.enabled}
                    aria-label="Toggle {drink.name}"
                    disabled={togglingId === `drink-${drink.id}`}
                    onclick={() => handleToggleDrink(drink)}
                  >
                    <span class="toggle-knob"></span>
                  </button>
                  <button class="btn btn-delete-sm" onclick={() => handleDeleteDrink(drink)} aria-label="Delete {drink.name}">&times;</button>
                </div>
              </div>

              {#if expandedDrinkId === drink.id}
                <div class="drink-types-panel">
                  <p class="drink-types-label">Customization types for this drink:</p>
                  <div class="drink-types-grid">
                    {#each ALL_CUSTOMIZATION_TYPES as type}
                      {@const active = (drink.customization_types || []).includes(type)}
                      <button
                        class="type-chip"
                        class:active
                        disabled={togglingId === `type-${drink.id}-${type}`}
                        onclick={() => handleToggleType(drink, type)}
                      >
                        {CUSTOMIZATION_TYPE_LABELS[type] || type}
                      </button>
                    {/each}
                  </div>
                </div>
              {/if}
            </li>
          {/each}
        </ul>

        <!-- Customization Options -->
        {#each Object.entries(menuCustomizations) as [type, options]}
          <h3 class="menu-heading">{CUSTOMIZATION_TYPE_LABELS[type] || type}</h3>
          <ul class="menu-list">
            {#each options as opt (opt.id)}
              <li class="menu-item-wrap">
                <div class="menu-item" class:disabled={!opt.enabled}>
                  <div class="menu-item-info">
                    <span class="menu-item-name">{opt.label}</span>
                  </div>
                  <button
                    class="toggle-switch"
                    class:on={opt.enabled}
                    role="switch"
                    aria-checked={opt.enabled}
                    aria-label="Toggle {opt.label}"
                    disabled={togglingId === `opt-${opt.id}`}
                    onclick={() => handleToggleCustomization(opt)}
                  >
                    <span class="toggle-knob"></span>
                  </button>
                </div>
              </li>
            {/each}
          </ul>
        {/each}
      {/if}
    </section>

  <!-- ═══════════════════════════════════════════ -->
  <!-- SETTINGS TAB                                -->
  <!-- ═══════════════════════════════════════════ -->
  {:else if activeTab === 'settings'}
    <section class="admin-section">
      {#if settingsError}
        <p class="error" role="alert">{settingsError}</p>
      {/if}

      {#if settingsLoading}
        <p class="loading-text">Loading settings...</p>
      {:else}
        <!-- Orders Toggle -->
        <h3 class="menu-heading">Order Acceptance</h3>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Accept Orders</span>
            <span class="setting-desc">When off, customers cannot submit new orders</span>
          </div>
          <button
            class="toggle-switch"
            class:on={settings.orders_accepting}
            role="switch"
            aria-checked={settings.orders_accepting}
            aria-label="Toggle order acceptance"
            disabled={savingSetting === 'orders_accepting'}
            onclick={() => handleUpdateSetting('orders_accepting', !settings.orders_accepting)}
          >
            <span class="toggle-knob"></span>
          </button>
        </div>

        <!-- Business Hours -->
        <h3 class="menu-heading">Business Hours</h3>
        <div class="hours-grid">
          <div class="field">
            <label for="hours-start">Opens at</label>
            <input
              id="hours-start"
              type="time"
              value={settings.business_hours_start || '08:00'}
              onchange={(e) => handleUpdateSetting('business_hours_start', e.target.value)}
              class="hours-input"
            />
          </div>
          <div class="field">
            <label for="hours-end">Closes at</label>
            <input
              id="hours-end"
              type="time"
              value={settings.business_hours_end || '17:00'}
              onchange={(e) => handleUpdateSetting('business_hours_end', e.target.value)}
              class="hours-input"
            />
          </div>
          <div class="field">
            <label for="slot-interval">Slot interval (minutes)</label>
            <input
              id="slot-interval"
              type="number"
              min="5"
              max="60"
              step="5"
              value={settings.slot_interval_minutes || 15}
              onchange={(e) => handleUpdateSetting('slot_interval_minutes', parseInt(e.target.value))}
              class="hours-input"
            />
          </div>
        </div>
      {/if}
    </section>
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

  .admin-section {
    margin-bottom: var(--spacing-2xl);
  }

  .section-desc {
    color: var(--color-brown-mid);
    margin-bottom: var(--spacing-lg);
    font-size: 0.9375rem;
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

  /* ─── Walk-up Order ─── */
  .walkup-section {
    margin-top: var(--spacing-xl);
    padding-top: var(--spacing-xl);
    border-top: 1px solid var(--color-brown-light);
  }

  .walkup-title {
    font-family: var(--font-heading);
    font-size: 1.125rem;
    color: var(--color-brand-brown);
    margin-bottom: var(--spacing-sm);
  }

  .walkup-form {
    display: flex;
    gap: var(--spacing-sm);
    align-items: stretch;
  }

  .walkup-input {
    flex: 1;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-brown-light);
    border-radius: var(--radius-md);
    background: var(--color-white);
    min-height: var(--min-tap-target);
    font-size: 1rem;
    min-width: 0;
  }

  .walkup-input:focus {
    outline: 2px solid var(--color-brand-brown);
    outline-offset: 1px;
  }

  .btn-walkup {
    background-color: var(--color-brown-mid);
    color: var(--color-cream);
    border-radius: var(--radius-md);
    font-weight: 600;
    white-space: nowrap;
    padding: var(--spacing-sm) var(--spacing-lg);
  }

  .walkup-confirm {
    margin-top: var(--spacing-sm);
    font-size: 0.875rem;
    color: var(--color-success);
    font-weight: 600;
  }

  @media (max-width: 600px) {
    .walkup-form {
      flex-direction: column;
    }
  }

  /* ─── Menu Tab ─── */
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

  .add-drink-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
    padding: var(--spacing-lg);
    background: var(--color-cream);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-brown-light);
  }

  .add-drink-input {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-brown-light);
    border-radius: var(--radius-md);
    background: var(--color-white);
    min-height: 40px;
    font-size: 0.9375rem;
  }

  .add-drink-input:focus {
    outline: 2px solid var(--color-brand-brown);
    outline-offset: 1px;
  }

  .btn-add-drink {
    background: var(--color-brand-brown);
    color: var(--color-cream);
    min-height: var(--min-tap-target);
    border-radius: var(--radius-md);
    font-weight: 600;
  }

  .menu-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 1px;
    background: var(--color-brown-light);
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--color-brown-light);
  }

  .menu-item-wrap {
    background: var(--color-white);
  }

  .menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-lg);
    min-height: var(--min-tap-target);
    transition: opacity 0.15s ease;
  }

  .menu-item.disabled {
    opacity: 0.5;
  }

  .menu-item-expand {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex: 1;
    min-width: 0;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    padding: 0;
    font-family: inherit;
  }

  .menu-item-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex-shrink: 0;
  }

  .btn-delete-sm {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    background: none;
    border: 1px solid var(--color-error);
    color: var(--color-error);
    font-size: 1.25rem;
    cursor: pointer;
  }

  .menu-item-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .menu-item-name {
    font-weight: 600;
    color: var(--color-brand-brown);
  }

  .menu-item-desc {
    font-size: 0.8125rem;
    color: var(--color-brown-mid);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .menu-item-types {
    font-size: 0.75rem;
    color: var(--color-brown-light);
  }

  /* ─── Drink Types Panel ─── */
  .drink-types-panel {
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--color-cream);
    border-top: 1px solid var(--color-brown-light);
  }

  .drink-types-label {
    font-size: 0.8125rem;
    color: var(--color-brown-mid);
    margin-bottom: var(--spacing-sm);
  }

  .drink-types-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  .type-chip {
    padding: var(--spacing-sm) var(--spacing-md);
    min-height: 40px;
    border-radius: var(--radius-full);
    border: 2px solid var(--color-brown-light);
    background: var(--color-white);
    color: var(--color-brown-mid);
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .type-chip.active {
    border-color: var(--color-brand-brown);
    background: var(--color-brand-brown);
    color: var(--color-cream);
  }

  .type-chip:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ─── Settings Tab ─── */
  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--color-cream);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-brown-light);
    margin-bottom: var(--spacing-lg);
  }

  .setting-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .setting-label {
    font-weight: 600;
    color: var(--color-brand-brown);
  }

  .setting-desc {
    font-size: 0.8125rem;
    color: var(--color-brown-mid);
  }

  .hours-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
  }

  .hours-grid .field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .hours-grid .field:last-child {
    grid-column: 1 / -1;
  }

  .hours-grid label {
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--color-brand-brown);
  }

  .hours-input {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-brown-light);
    border-radius: var(--radius-md);
    background: var(--color-white);
    min-height: var(--min-tap-target);
    font-size: 1rem;
    font-family: inherit;
  }

  .hours-input:focus {
    outline: 2px solid var(--color-brand-brown);
    outline-offset: 1px;
  }

  /* ─── Toggle Switch ─── */
  .toggle-switch {
    position: relative;
    width: 52px;
    height: 30px;
    border-radius: var(--radius-full);
    background: var(--color-brown-light);
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color 0.2s ease;
    padding: 0;
  }

  .toggle-switch.on {
    background: var(--color-success);
  }

  .toggle-switch:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .toggle-knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: white;
    transition: transform 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .toggle-switch.on .toggle-knob {
    transform: translateX(22px);
  }

  /* ─── Add Form ─── */
  .add-form {
    background-color: var(--color-cream);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
    border: 1px solid var(--color-brown-light);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .form-field label {
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--color-brand-brown);
  }

  .form-field input {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-brown-light);
    border-radius: var(--radius-md);
    background-color: var(--color-white);
    min-height: var(--min-tap-target);
    font-size: 1rem;
  }

  .form-field input:focus {
    outline: 2px solid var(--color-brand-brown);
    outline-offset: 1px;
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

  .btn-add {
    background-color: var(--color-brand-brown);
    color: var(--color-cream);
    width: 100%;
  }

  .btn-toggle {
    background-color: var(--color-brown-mid);
    color: var(--color-cream);
    font-size: 0.8125rem;
    min-height: 36px;
    padding: var(--spacing-xs) var(--spacing-md);
  }

  .btn-delete {
    background-color: var(--color-error);
    color: var(--color-cream);
    font-size: 0.8125rem;
    min-height: 36px;
    padding: var(--spacing-xs) var(--spacing-md);
  }

  .btn-clear {
    background-color: var(--color-brown-light);
    color: var(--color-cream);
    font-size: 0.8125rem;
    min-height: 36px;
    padding: var(--spacing-xs) var(--spacing-md);
  }

  /* ─── Location List ─── */
  .location-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .location-entry {
    background-color: var(--color-cream);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-brown-light);
    overflow: hidden;
  }

  .location-entry.inactive {
    opacity: 0.55;
  }

  .location-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-lg);
  }

  .location-info-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    text-align: left;
    flex: 1;
    min-width: 0;
    min-height: var(--min-tap-target);
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    font-family: inherit;
  }

  .location-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .location-info strong {
    color: var(--color-brand-brown);
    font-size: 1rem;
  }

  .location-address {
    color: var(--color-brown-mid);
    font-size: 0.875rem;
  }

  .date-count {
    color: var(--color-brown-light);
    font-size: 0.8125rem;
  }

  .expand-arrow {
    font-size: 0.75rem;
    color: var(--color-brown-light);
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }

  .expand-arrow.expanded {
    transform: rotate(180deg);
  }

  .location-actions {
    display: flex;
    gap: var(--spacing-xs);
    flex-shrink: 0;
  }

  .empty {
    color: var(--color-brown-light);
    text-align: center;
    padding: var(--spacing-xl);
  }

  /* ─── Expanded Section ─── */
  .location-expanded {
    border-top: 1px solid var(--color-brown-light);
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  /* ─── Delete Schedule ─── */
  .delete-schedule {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }

  .delete-schedule label {
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--color-brand-brown);
  }

  .delete-schedule input[type="date"] {
    padding: var(--spacing-xs) var(--spacing-sm);
    border: 1px solid var(--color-brown-light);
    border-radius: var(--radius-md);
    background-color: var(--color-white);
    min-height: 36px;
    font-size: 0.875rem;
    font-family: inherit;
  }

  /* ─── Calendar ─── */
  .calendar {
    max-width: 340px;
  }

  .calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-sm);
  }

  .cal-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    background: none;
    border: 1px solid var(--color-brown-light);
    cursor: pointer;
    font-size: 1rem;
    color: var(--color-brand-brown);
  }

  .cal-title {
    font-family: var(--font-heading);
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-brand-brown);
  }

  .cal-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    margin-bottom: var(--spacing-xs);
  }

  .cal-weekday {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-brown-light);
    padding: var(--spacing-xs) 0;
  }

  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 3px;
  }

  .cal-empty {
    aspect-ratio: 1;
  }

  .cal-day {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    background: var(--color-white);
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--color-brand-brown);
    font-weight: 500;
    transition: background-color 0.1s ease;
  }

  .cal-day:hover:not(:disabled) {
    border-color: var(--color-brown-light);
  }

  .cal-day.selected {
    background-color: var(--color-brand-brown);
    color: var(--color-cream);
    font-weight: 700;
  }

  .cal-day.past {
    color: var(--color-brown-light);
    opacity: 0.4;
    cursor: not-allowed;
  }

  @media (min-width: 768px) {
    .form-row {
      grid-template-columns: 1fr 1fr;
    }

    .btn-add {
      width: auto;
    }
  }
</style>
