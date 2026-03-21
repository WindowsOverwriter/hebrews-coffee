import { writable } from 'svelte/store';

// JWT string or null — memory only, lost on refresh
export const authToken = writable(null);
