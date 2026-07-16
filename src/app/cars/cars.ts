import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { CarService } from '../services/car.service';
import { CarListing } from '../models/car.model';
import { CarFilters, EMPTY_FILTERS, SortKey, applyFilters, slugify } from './cars.filters';

@Component({
  selector: 'app-cars',
  imports: [CommonModule, RouterModule],
  templateUrl: './cars.html',
  styleUrls: ['./cars.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarsPage implements OnInit, OnDestroy {
  private readonly carService = inject(CarService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly subs = new Subscription();

  readonly cars = signal<CarListing[]>([]);
  readonly loading = signal(true);
  readonly filters = signal<CarFilters>({ ...EMPTY_FILTERS });

  readonly filtered = computed(() => applyFilters(this.cars(), this.filters()));

  readonly makes = computed(() =>
    [...new Set(this.cars().map((c) => c.make?.trim()).filter(Boolean))].sort());
  readonly modelsForMake = computed(() => {
    const mk = slugify(this.filters().make);
    const pool = mk && mk !== 'all' ? this.cars().filter((c) => slugify(c.make) === mk) : this.cars();
    return [...new Set(pool.map((c) => c.model?.trim()).filter(Boolean))].sort();
  });
  readonly bodyTypes = computed(() =>
    [...new Set(this.cars().map((c) => c.bodyType?.trim()).filter(Boolean))].sort());

  ngOnInit(): void {
    this.carService.getListedCars()
      .then((cars) => this.cars.set(cars))
      .finally(() => this.loading.set(false));
    this.subs.add(this.carService.approvedCars$.subscribe((cars) => this.cars.set(cars)));

    this.subs.add(this.route.queryParams.subscribe((p) => {
      const sortParam = p['sort'] === 'ranking' ? 'price-desc' : p['sort'];
      const legalSorts: SortKey[] = ['newest', 'price-asc', 'price-desc', 'year-desc', 'mileage-asc'];
      this.filters.update((f) => ({
        ...f,
        make: p['make'] && p['make'] !== 'all' ? p['make'] : '',
        model: p['model'] && p['model'] !== 'all' ? p['model'] : '',
        body: p['body'] ?? '',
        maxPrice: p['maxPrice'] && !isNaN(Number(p['maxPrice'])) ? Number(p['maxPrice']) : null,
        minYear: p['year'] && !isNaN(Number(p['year'])) ? Number(p['year']) : null,
        sort: legalSorts.includes(sortParam) ? sortParam : 'newest',
      }));
    }));

    this.subs.add(this.route.params.subscribe((p) => {
      if (p['type']) this.filters.update((f) => ({ ...f, body: p['type'] }));
    }));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /** Called from every on-page control: update state + keep the URL shareable. */
  set<K extends keyof CarFilters>(key: K, value: CarFilters[K]): void {
    this.filters.update((f) => ({ ...f, [key]: value }));
    if (key === 'make') this.filters.update((f) => ({ ...f, model: '' }));
    const f = this.filters();
    void this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: {
        make: f.make || null,
        model: f.model || null,
        body: f.body || null,
        maxPrice: f.maxPrice ?? null,
        year: f.minYear ?? null,
        sort: f.sort !== 'newest' ? f.sort : null,
      },
    });
  }

  clearFilters(): void {
    this.filters.set({ ...EMPTY_FILTERS });
    void this.router.navigate([], { relativeTo: this.route, replaceUrl: true, queryParams: {} });
  }

  onSelect(key: 'make' | 'model' | 'body' | 'transmission' | 'fuelType' | 'sort', ev: Event): void {
    this.set(key as keyof CarFilters, (ev.target as HTMLSelectElement).value as never);
  }

  onNumber(key: 'maxPrice' | 'minYear', ev: Event): void {
    const v = (ev.target as HTMLSelectElement).value;
    this.set(key, v ? Number(v) : null);
  }

  onSearch(ev: Event): void {
    this.set('search', (ev.target as HTMLInputElement).value);
  }

  priceLabel(p: number): string {
    return '$' + Number(p).toLocaleString();
  }
}
