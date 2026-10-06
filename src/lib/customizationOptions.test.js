import { describe, it, expect } from 'vitest';
import { drinkHasType, optionLabelsFor } from './customizationOptions.js';

const customizations = {
  temperature: [{ id: 1, label: 'Hot' }, { id: 2, label: 'Iced' }],
  espresso_type: [{ id: 3, label: 'Regular' }, { id: 4, label: 'Decaf' }],
  syrup: [{ id: 10, label: 'Vanilla' }, { id: 11, label: 'Caramel' }],
};

describe('drinkHasType', () => {
  it('is true only for explicitly attached types', () => {
    const drink = { customization_types: ['syrup'] };
    expect(drinkHasType(drink, 'syrup')).toBe(true);
    expect(drinkHasType(drink, 'temperature')).toBe(false);
  });

  it('treats an empty type list as "no customizations", not "all"', () => {
    expect(drinkHasType({ customization_types: [] }, 'temperature')).toBe(false);
    expect(drinkHasType({}, 'temperature')).toBe(false);
  });
});

describe('optionLabelsFor', () => {
  it('returns nothing for a drink with no types, even with a stale allowlist', () => {
    const drink = {
      customization_types: [],
      allowed_customization_options: { temperature: [2], espresso_type: [4] },
    };
    expect(optionLabelsFor(drink, customizations, 'temperature')).toEqual([]);
    expect(optionLabelsFor(drink, customizations, 'espresso_type')).toEqual([]);
  });

  it('returns every enabled option when no allowlist exists for the type', () => {
    const drink = { customization_types: ['espresso_type'] };
    expect(optionLabelsFor(drink, customizations, 'espresso_type')).toEqual(['Regular', 'Decaf']);
  });

  it('narrows to the allowlist when one exists for the type', () => {
    const drink = {
      customization_types: ['espresso_type', 'syrup'],
      allowed_customization_options: { espresso_type: [4] },
    };
    expect(optionLabelsFor(drink, customizations, 'espresso_type')).toEqual(['Decaf']);
    expect(optionLabelsFor(drink, customizations, 'syrup')).toEqual(['Vanilla', 'Caramel']);
  });

  it('ignores allowlist ids that are no longer globally enabled', () => {
    const drink = {
      customization_types: ['syrup'],
      allowed_customization_options: { syrup: [11, 999] },
    };
    expect(optionLabelsFor(drink, customizations, 'syrup')).toEqual(['Caramel']);
  });
});
