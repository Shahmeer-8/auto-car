import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-rankings-slider',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './rankings-slider.html',
  styleUrls: ['./rankings-slider.css']
})
export class RankingsSlider implements OnInit, OnDestroy {
  currentIndex = 0;
  visibleCards = 4;
  cardGap = 16;
  private interval: any;

  constructor(private cdr: ChangeDetectorRef) {}

  rankings = [
    {
      title: 'Best Small SUVs from Japan',
      type: 'suv',
      image: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&q=80'
    },
    {
      title: 'Best Japanese Hybrid Cars',
      type: 'hybrid',
      image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600&q=80'
    },
    {
      title: 'Best Midsize SUVs from Japan',
      type: 'suv',
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&q=80'
    },
    {
      title: 'Best Japanese Sedans',
      type: 'sedan',
      image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&q=80'
    },
    {
      title: 'Best Japanese Trucks & Pickups',
      type: 'truck',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'
    },
    {
      title: 'Best Luxury Japanese Cars',
      type: 'luxury',
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=80'
    },
    {
      title: 'Best Japanese Minivans',
      type: 'minivan',
      image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&q=80'
    },
    {
      title: 'Best Japanese Sports Cars',
      type: 'sports car',
      image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80'
    },
  ];

  ngOnInit() {
    this.startAutoSlide();
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  startAutoSlide() {
    this.interval = setInterval(() => {
      this.currentIndex = this.currentIndex < this.maxIndex
        ? this.currentIndex + 1
        : 0;
      this.cdr.markForCheck();
    }, 4500);
  }

  get maxIndex(): number {
    return this.rankings.length - this.visibleCards;
  }

  get translateX(): string {
    return `translateX(calc(${this.currentIndex} * (-1 * ((100% - ${(this.visibleCards - 1) * this.cardGap}px) / ${this.visibleCards} + ${this.cardGap}px))))`;
  }

  prev() {
    if (this.currentIndex > 0) this.currentIndex--;
    clearInterval(this.interval);
    this.startAutoSlide();
  }

  next() {
    if (this.currentIndex < this.maxIndex) this.currentIndex++;
    clearInterval(this.interval);
    this.startAutoSlide();
  }
}