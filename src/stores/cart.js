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
//     addons: string[]
//   }
// }
export const cart = writable([]);
