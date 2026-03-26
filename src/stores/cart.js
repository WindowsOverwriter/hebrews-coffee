import { writable } from 'svelte/store';

// Shape of each item:
// {
//   drinkId: number,
//   drinkName: string,
//   ratioSummary: string,
//   customizations: {
//     temperature: string,
//     espresso_type: string,
//     milk_type: string,
//     syrup: string|null,
//     syrup_pumps: number|null,
//     special_instructions: string|null
//   }
// }
export const cart = writable([]);
