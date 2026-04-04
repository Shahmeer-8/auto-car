import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-resources-slider',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './resources-slider.html',
  styleUrls: ['./resources-slider.css']
})
export class ResourcesSlider implements OnInit, OnDestroy {
  currentIndex = 0;
  visibleCards = 4;
  cardGap = 16;
  private interval: any;

  constructor(private cdr: ChangeDetectorRef) {}

  resources = [
    {
      title: 'How to Buy a Japanese Used Car: A Definitive Guide',
      desc: '10 Tips to Help You Buy a Quality JDM Car Through an Exporter',
      image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=600&q=80'
    },
    {
      title: 'How Many KM Should a Used Japanese Car Have?',
      desc: 'How many kilometers is too many when buying a used car from Japan?',
      image: 'https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=600&q=80'
    },
    {
      title: 'New Vs. Used Japanese Car Buying',
      desc: 'Top 10 Reasons to Buy a Used JDM Car Over a Brand New One',
      image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&q=80'
    },
    {
      title: 'What Documents Do You Need to Import a Car from Japan?',
      desc: 'A complete checklist of paperwork required to import a Japanese vehicle.',
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80'
    },
    {
      title: 'How to Read a Japan Auction Sheet',
      desc: 'Understand every field on a Japanese auction inspection sheet before buying.',
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80'
    },
    {
      title: 'Japan Car Export Process: Step by Step',
      desc: 'From winning the auction to car arriving at your port — everything explained.',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'
    },
    {
      title: 'How to Negotiate Price When Buying a JDM Car',
      desc: 'Smart strategies to get the best deal on your Japanese import.',
      image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80'
    },
    {
      title: 'Top Mistakes to Avoid When Importing from Japan',
      desc: 'Common errors first-time importers make — and how to avoid them.',
      image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600&q=80'
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

  get maxIndex(): number { return this.resources.length - this.visibleCards; }

  get translateX(): string {
    return `translateX(calc(${this.currentIndex} * (-1 * ((100% - ${(this.visibleCards - 1) * this.cardGap}px) / ${this.visibleCards} + ${this.cardGap}px))))`;
  }

  prev() { if (this.currentIndex > 0) this.currentIndex--; clearInterval(this.interval); this.startAutoSlide(); }
  next() { if (this.currentIndex < this.maxIndex) this.currentIndex++; clearInterval(this.interval); this.startAutoSlide(); }
}