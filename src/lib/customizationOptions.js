// Customer-facing option filtering for one drink.
//
// A drink only shows the customization types explicitly attached to it. An
// empty `customization_types` list means "no customizations" — it is NOT a
// fallback to every type. (Falling back used to make admin removals of the
// last type invisible to customers.)
//
// Within an attached type, `allowed_customization_options[type]` (when present)
// narrows the globally-enabled options to that id allowlist.

export function drinkHasType(drink, type) {
  return (drink?.customization_types || []).includes(type);
}

export function optionLabelsFor(drink, customizations, type) {
  if (!drinkHasType(drink, type)) return [];
  const all = customizations?.[type] || [];
  const allowedIds = drink.allowed_customization_options?.[type];
  const filtered = allowedIds ? all.filter(c => allowedIds.includes(c.id)) : all;
  return filtered.map(c => c.label);
}
