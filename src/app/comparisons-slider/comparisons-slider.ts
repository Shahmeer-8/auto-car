import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-comparisons-slider',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './comparisons-slider.html',
  styleUrls: ['./comparisons-slider.css']
})
export class ComparisonsSlider implements OnInit, OnDestroy {
  currentIndex = 0;
  visibleCards = 4;
  cardGap = 16;
  private interval: any;

  constructor(private cdr: ChangeDetectorRef) {}

  comparisons = [
    { title: 'Toyota Land Cruiser vs Nissan Patrol',     slug: 'land-cruiser-vs-patrol',      image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80' },
    { title: 'Honda CR-V vs Toyota RAV4',                slug: 'crv-vs-rav4',                  image: 'https://images.unsplash.com/photo-1617654112368-307921291f42?w=600&q=80' },
    { title: 'Toyota Hilux vs Nissan Navara',            slug: 'hilux-vs-navara',              image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
    { title: 'Subaru Forester vs Mazda CX-5',            slug: 'forester-vs-cx5',              image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&q=80' },
    { title: 'Lexus RX vs Toyota Harrier',               slug: 'lexus-rx-vs-harrier',          image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=80' },
    { title: 'Honda Civic vs Toyota Corolla',            slug: 'civic-vs-corolla',             image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&q=80' },
    { title: 'Nissan X-Trail vs Honda CR-V',             slug: 'xtrail-vs-crv',                image: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&q=80' },
    { title: 'Toyota Prado vs Mitsubishi Pajero',        slug: 'prado-vs-pajero',              image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&q=80' },
  ];

  ngOnInit() { this.startAutoSlide(); }
  ngOnDestroy() { clearInterval(this.interval); }

  startAutoSlide() {
    this.interval = setInterval(() => {
      this.currentIndex = this.currentIndex < this.maxIndex ? this.currentIndex + 1 : 0;
      this.cdr.markForCheck();
    }, 5000);
  }

  get maxIndex(): number { return this.comparisons.length - this.visibleCards; }

  get translateX(): string {
    return `translateX(calc(${this.currentIndex} * (-1 * ((100% - ${(this.visibleCards - 1) * this.cardGap}px) / ${this.visibleCards} + ${this.cardGap}px))))`;
  }

  prev() { if (this.currentIndex > 0) this.currentIndex--; clearInterval(this.interval); this.startAutoSlide(); }
  next() { if (this.currentIndex < this.maxIndex) this.currentIndex++; clearInterval(this.interval); this.startAutoSlide(); }
}