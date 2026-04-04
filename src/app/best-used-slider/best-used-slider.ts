import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-best-used-slider',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './best-used-slider.html',
  styleUrls: ['./best-used-slider.css']
})
export class BestUsedSlider implements OnInit, OnDestroy {
  currentIndex = 0;
  visibleCards = 4;
  cardGap = 16;
  private interval: any;

  constructor(private cdr: ChangeDetectorRef) {}

  bestCars = [
    {
      title: 'Best Used Japanese Cars Under $20,000',
      desc: 'Most reliable, safest used JDM cars that retain the most value under $20,000.',
      budget: '20000',
      image: 'https://images.unsplash.com/photo-1617654112368-307921291f42?w=600&q=80'
    },
    {
      title: 'Best Used Japanese SUVs Under $25,000',
      desc: 'Top JDM SUVs with low mileage, auction grade 4+ and great condition.',
      budget: '25000',
      image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80'
    },
    {
      title: 'Best Used Japanese Trucks Under $20,000',
      desc: 'Most reliable, longest-lasting used Japanese pickup trucks.',
      budget: '20000',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'
    },
    {
      title: 'Best Used Japanese Cars Under $15,000',
      desc: 'Quality JDM imports that give the best value for money under $15,000.',
      budget: '15000',
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&q=80'
    },
    {
      title: 'Best Used Japanese Luxury Cars Under $30,000',
      desc: 'Premium Lexus and Infiniti models with full service history under $30,000.',
      budget: '30000',
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=80'
    },
    {
      title: 'Best Used Japanese Hybrid Cars Under $20,000',
      desc: 'Top fuel-efficient JDM hybrid models available for under $20,000.',
      budget: '20000',
      image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600&q=80'
    },
    {
      title: 'Best Used Japanese Minivans Under $15,000',
      desc: 'Spacious, reliable JDM minivans perfect for families — under $15,000.',
      budget: '15000',
      image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&q=80'
    },
    {
      title: 'Best Used Japanese Sports Cars Under $25,000',
      desc: 'Fun, fast and affordable — the best JDM sports cars under $25,000.',
      budget: '25000',
      image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80'
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

  get maxIndex(): number { return this.bestCars.length - this.visibleCards; }

  get translateX(): string {
    return `translateX(calc(${this.currentIndex} * (-1 * ((100% - ${(this.visibleCards - 1) * this.cardGap}px) / ${this.visibleCards} + ${this.cardGap}px))))`;
  }

  prev() { if (this.currentIndex > 0) this.currentIndex--; clearInterval(this.interval); this.startAutoSlide(); }
  next() { if (this.currentIndex < this.maxIndex) this.currentIndex++; clearInterval(this.interval); this.startAutoSlide(); }
}