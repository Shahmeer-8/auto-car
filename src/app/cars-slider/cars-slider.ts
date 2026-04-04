import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { CarService } from '../services/car.service';

@Component({
  selector: 'app-cars-slider',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cars-slider.html',
  styleUrls: ['./cars-slider.css']
})
export class CarsSlider implements OnInit, OnDestroy {
  currentIndex = 0;
  visibleCards = 4;
  cardGap = 16;
  private interval: any;
  private sub!: Subscription;

  constructor(
    private cdr: ChangeDetectorRef,
    private carService: CarService
  ) {}

  hardcodedCars = [
    { id: 'static-1', name: '2022 Toyota Land Cruiser', price: '$45,000', meta: '28,000 km • Automatic • SUV',   badge: 'Grade 4.5',  image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&q=80' },
    { id: 'static-2', name: '2021 Honda CR-V',          price: '$22,500', meta: '32,000 km • Automatic • SUV',   badge: 'Hot Deal',   image: 'https://images.unsplash.com/photo-1617654112368-307921291f42?w=400&q=80' },
    { id: 'static-3', name: '2022 Nissan X-Trail',      price: '$24,000', meta: '21,000 km • Automatic • SUV',   badge: 'Popular',    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80' },
    { id: 'static-4', name: '2022 Mazda CX-5',          price: '$26,000', meta: '19,000 km • Automatic • SUV',   badge: 'Premium',    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80' },
    { id: 'static-5', name: '2021 Subaru Forester',     price: '$21,000', meta: '35,000 km • Automatic • SUV',   badge: 'Great Deal', image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=400&q=80' },
    { id: 'static-6', name: '2020 Toyota Hilux',        price: '$32,000', meta: '45,000 km • Manual • Truck',    badge: 'Hot Deal',   image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' },
    { id: 'static-7', name: '2022 Lexus RX 350',        price: '$54,000', meta: '12,000 km • Automatic • SUV',   badge: 'Premium',    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&q=80' },
    { id: 'static-8', name: '2021 Mitsubishi Pajero',   price: '$29,500', meta: '38,000 km • Automatic • SUV',   badge: 'Grade 4',    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&q=80' },
  ];

  cars: any[] = [];

  ngOnInit() {
    this.loadCars();
    this.startAutoSlide();

    // ✅ CarService se listen karo (same tab)
    this.sub = this.carService.carsUpdated$.subscribe(() => {
      this.loadCars();
      this.cdr.detectChanges();
    });

    // ✅ Dusri tab se bhi catch karo
    window.addEventListener('storage', this.onStorageChange);
  }

  ngOnDestroy() {
    clearInterval(this.interval);
    this.sub?.unsubscribe();
    window.removeEventListener('storage', this.onStorageChange);
  }

  // ✅ Arrow function — this binding sahi rahega
  onStorageChange = () => {
    this.loadCars();
    this.cdr.detectChanges();
  }

  loadCars() {
    const allCars = [...this.hardcodedCars];

    const listedCars = this.carService.getListedCars().map((l: any) => ({
      id: l.id,
      name: `${l.year} ${l.make} ${l.model}`,
      price: '$' + Number(l.price)?.toLocaleString(),
      meta: `${Number(l.mileage)?.toLocaleString()} km • ${l.transmission} • ${l.bodyType || 'Car'}`,
      badge: 'New Listing',
      image: l.images?.[0] || 'assets/placeholder-car.jpg',
      isUserListing: true
    }));

    // ✅ User listings pehle dikhao
    this.cars = [...listedCars, ...allCars];
  }

  startAutoSlide() {
    clearInterval(this.interval);
    this.interval = setInterval(() => {
      this.currentIndex = this.currentIndex < this.maxIndex
        ? this.currentIndex + 1
        : 0;
      this.cdr.detectChanges();
    }, 3500);
  }

  get maxIndex(): number {
    return Math.max(0, this.cars.length - this.visibleCards);
  }

  get translateX(): string {
    return `translateX(calc(${this.currentIndex} * (-1 * ((100% - ${(this.visibleCards - 1) * this.cardGap}px) / ${this.visibleCards} + ${this.cardGap}px))))`;
  }

  prev() {
    if (this.currentIndex > 0) this.currentIndex--;
    this.startAutoSlide();
  }

  next() {
    if (this.currentIndex < this.maxIndex) this.currentIndex++;
    this.startAutoSlide();
  }

  goTo(index: number) {
    this.currentIndex = index;
    this.startAutoSlide();
  }

  get dots(): number[] {
    return Array(this.maxIndex + 1).fill(0).map((_, i) => i);
  }
}