import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContentService } from '../../core/services/content.service';
import { AttributesService } from '../../core/services/attributes.service';
import { CarService } from '../../services/car.service';
import { CarListing } from '../../models/car.model';
import { mergeAttrValues } from '../../core/catalog/catalog.util';

@Component({
  selector: 'app-hero-slider',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hero-slider.html',
  styleUrls: ['./hero-slider.css']
})
export class HeroSlider implements OnInit, OnDestroy {
  readonly content = inject(ContentService).content;
  private readonly attributesService = inject(AttributesService);
  private readonly carService = inject(CarService);

  currentSlide = 0;
  private interval: any;

  slides = [
    {
      image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1600&q=80',
      alt: 'Toyota Land Cruiser Japan',
      label: '🔥 Hot Deal'
    },
    {
      image: 'https://images.unsplash.com/photo-1617654112368-307921291f42?w=1600&q=80',
      alt: 'JDM Sports Car',
      label: '⭐ Premium JDM'
    },
    {
      image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1600&q=80',
      alt: 'Japanese Sedan',
      label: '✅ Inspected'
    },
    {
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1600&q=80',
      alt: 'Japanese SUV',
      label: '🚢 Ready to Ship'
    }
  ];

  // Admin-managed makes (config/attributes).
  readonly makes = this.attributesService.makes;

  // Fallback models per make, used when a make has no real listings yet.
  modelsByMake: { [key: string]: string[] } = {
    'Toyota': ['Land Cruiser', 'Hilux', 'Corolla', 'Camry', 'RAV4', 'Prado', 'HiAce', 'Fortuner', 'Alphard', 'Vitz'],
    'Honda': ['Civic', 'CR-V', 'Accord', 'Fit', 'HR-V', 'Pilot', 'Freed', 'Odyssey', 'Step WGN'],
    'Nissan': ['GTR', 'X-Trail', 'Patrol', 'Note', 'Navara', 'Skyline', 'Leaf', 'Serena', 'Elgrand'],
    'Mazda': ['CX-5', 'Demio', 'Atenza', 'CX-3', 'Axela', 'BT-50', 'MPV'],
    'Subaru': ['Forester', 'Outback', 'Impreza', 'WRX', 'XV', 'Legacy', 'BRZ'],
    'Mitsubishi': ['Pajero', 'Eclipse Cross', 'Outlander', 'L200', 'Delica', 'Galant'],
    'Suzuki': ['Jimny', 'Swift', 'Vitara', 'Carry', 'Alto', 'Spacia'],
    'Lexus': ['LX', 'GX', 'RX', 'IS', 'ES', 'LS', 'NX'],
    'Daihatsu': ['Mira', 'Terios', 'Move', 'Tanto', 'Rocky'],
    'Isuzu': ['D-Max', 'MU-X', 'Elf', 'Forward']
  };

  // Real approved listings, loaded once, used to add live models not in the fallback map.
  private approvedCars: CarListing[] = [];

  filteredModels: string[] = [];

  // Year range
  years: number[] = [];

  selectedMake = '';
  selectedModel = '';
  selectedYear = '';
  selectedPrice = '';

  quickTags = [
    { label: '🏔️ Land Cruiser', make: 'Toyota', model: 'Land Cruiser' },
    { label: '⚡ Nissan GTR', make: 'Nissan', model: 'GTR' },
    { label: '🚗 Honda Civic', make: 'Honda', model: 'Civic' },
    { label: '🌲 Subaru Forester', make: 'Subaru', model: 'Forester' },
    { label: '💎 Lexus LX', make: 'Lexus', model: 'LX' },
  ];

  constructor(private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit() {
    this.startAutoSlide();
    this.generateYears();
    this.carService.getListedCars().then((cars) => {
      this.approvedCars = cars;
      // Refresh the current model list (if any) without clearing the user's selection.
      if (this.selectedMake) this.filteredModels = this.modelsFor(this.selectedMake);
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  generateYears() {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 2000; y--) {
      this.years.push(y);
    }
  }

  onMakeChange() {
    this.selectedModel = '';
    this.filteredModels = this.selectedMake ? this.modelsFor(this.selectedMake) : [];
  }

  /** Fallback models for a make, unioned with models actually found in real approved listings. */
  private modelsFor(make: string): string[] {
    const makeKey = make.toLowerCase().trim();
    const listingModels = this.approvedCars
      .filter((c) => (c.make || '').toLowerCase().trim() === makeKey)
      .map((c) => c.model);
    return mergeAttrValues(this.modelsByMake[make] || [], listingModels);
  }

  quickSearch(tag: { label: string; make: string; model: string }) {
    this.selectedMake = tag.make;
    this.onMakeChange();
    this.selectedModel = tag.model;
    this.onSearch();
  }

  startAutoSlide() {
    this.interval = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.slides.length;
      this.cdr.detectChanges();
    }, 4000); // 4 seconds — comfortable speed
  }

  goToSlide(index: number) {
    this.currentSlide = index;
    clearInterval(this.interval);
    this.startAutoSlide();
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    clearInterval(this.interval);
    this.startAutoSlide();
  }

  prevSlide() {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    clearInterval(this.interval);
    this.startAutoSlide();
  }

  onSearch() {
    const make = this.selectedMake || 'all';
    const model = this.selectedModel || 'all';

    this.router.navigate(['/cars'], {
      queryParams: {
        make,
        model,
        year: this.selectedYear || null,
        maxPrice: this.selectedPrice || null
      }
    });
  }
}