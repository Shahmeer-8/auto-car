import { applyFilters, slugify, EMPTY_FILTERS } from './cars.filters';
import { CarListing } from '../models/car.model';

function car(over: Partial<CarListing>): CarListing {
  return {
    sellerId: 's1', make: 'Toyota', model: 'Corolla', year: 2018, mileage: 50000,
    transmission: 'Automatic', fuelType: 'Petrol', color: 'White', condition: 'Used',
    bodyType: 'Sedan', price: 10000, description: '', location: 'Tokyo', phone: '',
    images: [], ownerName: '', email: '', submittedAt: '2026-01-01T00:00:00.000Z',
    status: 'approved', ...over,
  };
}

describe('slugify', () => {
  it('normalizes spaces, hyphens and case', () => {
    expect(slugify('Sports Car')).toBe('sports-car');
    expect(slugify('sports-car')).toBe('sports-car');
    expect(slugify('  SUV ')).toBe('suv');
  });
});

describe('applyFilters', () => {
  const cars = [
    car({ id: 'a', make: 'Toyota', model: 'Corolla', bodyType: 'Sedan', price: 10000, year: 2018 }),
    car({ id: 'b', make: 'Honda', model: 'Civic', bodyType: 'Sports Car', price: 25000, year: 2022 }),
    car({ id: 'c', make: 'toyota', model: 'Aqua', bodyType: 'Hatchback', price: 8000, year: 2015, mileage: 90000 }),
  ];

  it('no filters returns everything', () => {
    expect(applyFilters(cars, EMPTY_FILTERS).length).toBe(3);
  });

  it('filters by make case-insensitively and treats "all" as no-op', () => {
    expect(applyFilters(cars, { ...EMPTY_FILTERS, make: 'TOYOTA' }).map(c => c.id)).toEqual(['a', 'c']);
    expect(applyFilters(cars, { ...EMPTY_FILTERS, make: 'all' }).length).toBe(3);
  });

  it('matches body type by slug (sports-car ↔ Sports Car)', () => {
    expect(applyFilters(cars, { ...EMPTY_FILTERS, body: 'sports-car' }).map(c => c.id)).toEqual(['b']);
  });

  it('coerces numeric filters (string query params)', () => {
    expect(applyFilters(cars, { ...EMPTY_FILTERS, maxPrice: Number('10000') }).map(c => c.id)).toEqual(['a', 'c']);
    expect(applyFilters(cars, { ...EMPTY_FILTERS, minYear: 2018 }).map(c => c.id)).toEqual(['a', 'b']);
  });

  it('free-text search matches make/model/location', () => {
    expect(applyFilters(cars, { ...EMPTY_FILTERS, search: 'civ' }).map(c => c.id)).toEqual(['b']);
  });

  it('sorts by price ascending', () => {
    expect(applyFilters(cars, { ...EMPTY_FILTERS, sort: 'price-asc' }).map(c => c.id)).toEqual(['c', 'a', 'b']);
  });

  it('sorts newest first by submittedAt by default', () => {
    const list = [
      car({ id: 'old', submittedAt: '2025-01-01T00:00:00.000Z' }),
      car({ id: 'new', submittedAt: '2026-06-01T00:00:00.000Z' }),
    ];
    expect(applyFilters(list, EMPTY_FILTERS).map(c => c.id)).toEqual(['new', 'old']);
  });

  it('sorts newest with mixed string and Timestamp submittedAt values', () => {
    const ts = { toDate: () => new Date('2026-07-01T00:00:00.000Z') } as unknown as string;
    const list = [
      car({ id: 'str', submittedAt: '2026-01-01T00:00:00.000Z' }),
      car({ id: 'ts', submittedAt: ts }),
    ];
    expect(applyFilters(list, EMPTY_FILTERS).map(c => c.id)).toEqual(['ts', 'str']);
  });
});
