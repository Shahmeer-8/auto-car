import { CarListing } from '../models/car.model';

export type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'year-desc' | 'mileage-asc';

export interface CarFilters {
  make: string;
  model: string;
  body: string;
  maxPrice: number | null;
  minYear: number | null;
  transmission: string;
  fuelType: string;
  search: string;
  sort: SortKey;
}

export const EMPTY_FILTERS: CarFilters = {
  make: '', model: '', body: '', maxPrice: null, minYear: null,
  transmission: '', fuelType: '', search: '', sort: 'newest',
};

/** 'Sports Car' / 'sports-car' / ' SUV ' → 'sports-car' / 'suv' */
export function slugify(s: string): string {
  return (s || '').toLowerCase().trim().replace(/[\s_-]+/g, '-');
}

function isSet(v: string): boolean {
  return !!v && v.toLowerCase() !== 'all';
}

export function applyFilters(cars: CarListing[], f: CarFilters): CarListing[] {
  const out = cars.filter((c) => {
    if (isSet(f.make) && slugify(c.make) !== slugify(f.make)) return false;
    if (isSet(f.model) && slugify(c.model) !== slugify(f.model)) return false;
    if (isSet(f.body) && slugify(c.bodyType) !== slugify(f.body)) return false;
    if (isSet(f.transmission) && slugify(c.transmission) !== slugify(f.transmission)) return false;
    if (isSet(f.fuelType) && slugify(c.fuelType) !== slugify(f.fuelType)) return false;
    if (f.maxPrice != null && Number(c.price) > f.maxPrice) return false;
    if (f.minYear != null && Number(c.year) < f.minYear) return false;
    if (f.search.trim()) {
      const hay = `${c.make} ${c.model} ${c.location} ${c.bodyType}`.toLowerCase();
      if (!hay.includes(f.search.trim().toLowerCase())) return false;
    }
    return true;
  });

  const by = {
    'newest': (a: CarListing, b: CarListing) => (b.submittedAt || '').localeCompare(a.submittedAt || ''),
    'price-asc': (a: CarListing, b: CarListing) => Number(a.price) - Number(b.price),
    'price-desc': (a: CarListing, b: CarListing) => Number(b.price) - Number(a.price),
    'year-desc': (a: CarListing, b: CarListing) => Number(b.year) - Number(a.year),
    'mileage-asc': (a: CarListing, b: CarListing) => Number(a.mileage) - Number(b.mileage),
  }[f.sort] ?? ((a: CarListing, b: CarListing) => 0);

  return [...out].sort(by);
}
