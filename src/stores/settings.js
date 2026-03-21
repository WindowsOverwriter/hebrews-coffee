import { writable } from 'svelte/store';

// Whether the shop is currently accepting orders
export const ordersAccepting = writable(true);
