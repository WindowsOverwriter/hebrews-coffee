const BASE_URL = import.meta.env.VITE_API_BASE_URL;

import { get } from 'svelte/store';
import { authToken } from '../stores/auth.js';

function authHeaders() {
  const token = get(authToken);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// --- Public ---

export async function getMenu() {
  const res = await fetch(`${BASE_URL}/api/menu`);
  return handleResponse(res);
}

export async function getSlots() {
  const res = await fetch(`${BASE_URL}/api/slots`);
  return handleResponse(res);
}

export async function submitOrder(payload) {
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function getOrder(confirmationCode) {
  const res = await fetch(`${BASE_URL}/api/orders/${encodeURIComponent(confirmationCode)}`);
  return handleResponse(res);
}

// --- Admin ---

export async function adminLogin(password) {
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  return handleResponse(res);
}

export async function getAdminOrders() {
  const res = await fetch(`${BASE_URL}/api/admin/orders`, {
    headers: authHeaders()
  });
  return handleResponse(res);
}

export async function updateOrderStatus(id, status) {
  const res = await fetch(`${BASE_URL}/api/admin/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status })
  });
  return handleResponse(res);
}

export async function getTrends() {
  const res = await fetch(`${BASE_URL}/api/admin/trends`, {
    headers: authHeaders()
  });
  return handleResponse(res);
}

export async function resetPeriod() {
  const res = await fetch(`${BASE_URL}/api/admin/period/reset`, {
    method: 'POST',
    headers: authHeaders()
  });
  return handleResponse(res);
}

export async function toggleDrink(id, enabled) {
  const res = await fetch(`${BASE_URL}/api/admin/drinks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ enabled })
  });
  return handleResponse(res);
}

export async function toggleCustomization(id, enabled) {
  const res = await fetch(`${BASE_URL}/api/admin/customizations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ enabled })
  });
  return handleResponse(res);
}

export async function updateSetting(key, value) {
  const res = await fetch(`${BASE_URL}/api/admin/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ key, value })
  });
  return handleResponse(res);
}
