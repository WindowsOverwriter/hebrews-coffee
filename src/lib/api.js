const BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!BASE_URL) {
  throw new Error(
    'VITE_API_BASE_URL is not set. Add it to .env.local (dev) or your deploy environment config (production).'
  );
}

import { get } from 'svelte/store';
import { authToken } from '../stores/auth.js';

// Render free-tier cold starts can take 30+ seconds; give a generous ceiling
// before we tell the user the request timed out.
const DEFAULT_TIMEOUT_MS = 45000;

function authHeaders() {
  const token = get(authToken);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.code = 'http';
    throw err;
  }
  return res.json();
}

async function request(path, init = {}) {
  const { timeout = DEFAULT_TIMEOUT_MS, ...fetchInit } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...fetchInit,
      signal: fetchInit.signal ?? controller.signal
    });
    return await handleResponse(res);
  } catch (err) {
    if (err.code === 'http') throw err;
    if (err.name === 'AbortError') {
      const wrapped = new Error('Request timed out. Please check your connection and try again.');
      wrapped.code = 'timeout';
      throw wrapped;
    }
    if (err instanceof TypeError) {
      const wrapped = new Error('Network error. Please check your connection and try again.');
      wrapped.code = 'network';
      throw wrapped;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// --- Public ---

export async function getMenu() {
  return request('/api/menu');
}

export async function getSlots() {
  return request('/api/slots');
}

export async function submitOrder(payload) {
  return request('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function getOrder(confirmationCode) {
  return request(`/api/orders/${encodeURIComponent(confirmationCode)}`);
}

export async function getLocations() {
  return request('/api/locations');
}

// --- Admin ---

export async function adminLogin(password) {
  return request('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
}

export async function getAdminOrders() {
  return request('/api/admin/orders', { headers: authHeaders() });
}

export async function updateOrderStatus(id, status) {
  return request(`/api/admin/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status })
  });
}

export async function getTrends() {
  return request('/api/admin/trends', { headers: authHeaders() });
}

export async function resetPeriod() {
  return request('/api/admin/period/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() }
  });
}

export async function getAdminMenu() {
  return request('/api/admin/menu', { headers: authHeaders() });
}

export async function createDrink(data) {
  return request('/api/admin/drinks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data)
  });
}

export async function deleteDrink(id) {
  return request(`/api/admin/drinks/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
}

export async function setDrinkCustomizationTypes(drinkId, types) {
  return request(`/api/admin/drinks/${drinkId}/customization-types`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ types })
  });
}

export async function setDrinkCustomizationOptions(drinkId, overrides) {
  return request(`/api/admin/drinks/${drinkId}/customization-options`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ overrides })
  });
}

export async function toggleDrink(id, enabled) {
  return request(`/api/admin/drinks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ enabled })
  });
}

export async function toggleCustomization(id, enabled) {
  return request(`/api/admin/customizations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ enabled })
  });
}

export async function createCustomization(type, label) {
  return request('/api/admin/customizations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ type, label })
  });
}

export async function updateCustomization(id, patch) {
  return request(`/api/admin/customizations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(patch)
  });
}

export async function deleteCustomization(id) {
  return request(`/api/admin/customizations/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
}

export async function getSettings() {
  return request('/api/admin/settings', { headers: authHeaders() });
}

export async function updateSetting(key, value) {
  return request('/api/admin/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ key, value })
  });
}

export async function getAdminLocations() {
  return request('/api/admin/locations', { headers: authHeaders() });
}

export async function createLocation(name, address) {
  return request('/api/admin/locations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, address })
  });
}

export async function updateLocation(id, data) {
  return request(`/api/admin/locations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data)
  });
}

export async function deleteLocation(id) {
  return request(`/api/admin/locations/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
}

export async function setLocationDates(id, dates) {
  return request(`/api/admin/locations/${id}/dates`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ dates })
  });
}
