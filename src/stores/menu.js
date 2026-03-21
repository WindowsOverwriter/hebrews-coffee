import { writable } from 'svelte/store';

// Drinks array and customization options from GET /api/menu
export const drinks = writable([]);
export const customizations = writable({});
