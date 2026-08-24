/** Case/format-insensitive key so 'Sports Car', 'sports-car' and 'sports car' collapse to one entry. */
export function attrKey(value: string): string {
  return (value || '').toLowerCase().trim().replace(/[\s_-]+/g, '-');
}

/**
 * Merges admin-managed values with values that actually appear in listings,
 * de-duplicated case-insensitively. Admin spelling wins; extra values found only
 * in listings are appended so nothing becomes unfilterable.
 */
export function mergeAttrValues(adminValues: string[], listingValues: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of [...adminValues, ...listingValues]) {
    const value = (v || '').trim();
    if (!value) continue;
    const key = attrKey(value);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

/** Emoji shown next to a make/body type on the home page cards. Falls back to a generic car. */
const ICONS: Record<string, string> = {
  toyota: '🚗', honda: '🏎️', nissan: '🚙', mazda: '🚘', subaru: '🏔️', mitsubishi: '⚡',
  suzuki: '🛻', lexus: '💎', daihatsu: '🌟', isuzu: '🚐', bmw: '🏁', audi: '🔷',
  'mercedes-benz': '⭐', volkswagen: '🚌', other: '🚗',
  sedan: '🚗', suv: '🚙', truck: '🛻', pickup: '🛻', minivan: '🚐', van: '🚐', coupe: '🏎️',
  hatchback: '🚘', wagon: '🚌', electric: '⚡', hybrid: '🔋', convertible: '🚗', cuv: '🚙',
  crossover: '🚙', compact: '🚘', 'sports-car': '🏎️', luxury: '💎', cpo: '✅',
};

export function attrIcon(value: string): string {
  return ICONS[attrKey(value)] ?? '🚗';
}
