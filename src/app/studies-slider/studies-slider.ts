import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-studies-slider',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './studies-slider.html',
  styleUrls: ['./studies-slider.css']
})
export class StudiesSlider implements OnInit, OnDestroy {
  currentIndex = 0;
  visibleCards = 4;
  cardGap = 16;
  private interval: any;

  constructor(private cdr: ChangeDetectorRef) {}

  studies = [
    {
      title: 'Most Popular Japanese Car Colors',
      desc: 'Most popular car colors in Japan, by region and car type.',
      image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80'
    },
    {
      title: 'Which JDM Cars Hold Their Value Best?',
      desc: 'Car depreciation analysis — which Japanese cars lose value the slowest?',
      image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80'
    },
    {
      title: 'Top 10 JDM Cars That Last 200,000+ KM',
      desc: 'Longest-lasting Japanese cars — a mix of SUVs, trucks and sedans.',
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&q=80'
    },
    {
      title: 'Best Time to Buy a Used Car from Japan',
      desc: 'Seasonal price trends and when Japanese auction prices are at their lowest.',
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=80'
    },
    {
      title: 'Toyota vs Honda — Which is More Reliable?',
      desc: 'A data-driven comparison of Japan\'s two most popular car brands.',
      image: 'https://images.unsplash.com/photo-1617654112368-307921291f42?w=600&q=80'
    },
    {
      title: 'Average Mileage of Japanese Used Cars by Year',
      desc: 'How many km do Japanese used cars typically have based on their age?',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'
    },
    {
      title: 'Most Searched JDM Cars Worldwide in 2025',
      desc: 'Which Japanese cars are buyers around the world searching for the most?',
      image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80'
    },
    {
      title: 'Japan Auction Grade vs Actual Car Condition',
      desc: 'Does auction grade accurately predict the real condition of a used car?',
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80'
    },
  ];

  ngOnInit() { this.startAutoSlide(); }
  ngOnDestroy() { clearInterval(this.interval); }

  startAutoSlide() {
    this.interval = setInterval(() => {
      this.currentIndex = this.currentIndex < this.maxIndex ? this.currentIndex + 1 : 0;
      this.cdr.markForCheck();
    }, 5000);
  }

  get maxIndex(): number { return this.studies.length - this.visibleCards; }

  get translateX(): string {
    return `translateX(calc(${this.currentIndex} * (-1 * ((100% - ${(this.visibleCards - 1) * this.cardGap}px) / ${this.visibleCards} + ${this.cardGap}px))))`;
  }

  prev() { if (this.currentIndex > 0) this.currentIndex--; clearInterval(this.interval); this.startAutoSlide(); }
  next() { if (this.currentIndex < this.maxIndex) this.currentIndex++; clearInterval(this.interval); this.startAutoSlide(); }
}