import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-guides-slider',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './guides-slider.html',
  styleUrls: ['./guides-slider.css']
})
export class GuidesSlider implements OnInit, OnDestroy {
  currentIndex = 0;
  visibleCards = 4;
  cardGap = 16;
  private interval: any;

  constructor(private cdr: ChangeDetectorRef) {}

  guides = [
    {
      title: 'How to Buy a Car from Japan: Step by Step Guide',
      desc: 'Learn the complete process of importing a Japanese used car — from auction to your doorstep.',
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&q=80'
    },
    {
      title: 'What is Japan Auction Grade? Everything You Need to Know',
      desc: 'Understand auction grades 1 to 5 and why Grade 4+ means a car in excellent condition.',
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80'
    },
    {
      title: 'Why Japanese Used Cars Have Such Low Mileage',
      desc: "Japan's unique road culture and strict shaken inspection system keeps mileage surprisingly low.",
      image: 'https://images.unsplash.com/photo-1617654112368-307921291f42?w=400&q=80'
    },
    {
      title: 'Top 10 Most Reliable Japanese Cars for Import',
      desc: 'Toyota Land Cruiser, Honda CR-V, Nissan X-Trail — find out which JDM cars last the longest.',
      image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&q=80'
    },
    {
      title: "How to Check a Japanese Car's History Before Buying",
      desc: 'Use the chassis number to verify mileage, accidents, and ownership history before you commit.',
      image: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400&q=80'
    },
    {
      title: 'Shipping a Car from Japan: Costs, Time & What to Expect',
      desc: 'RoRo vs container shipping — which is better for your JDM import and how long does it take?',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'
    },
    {
      title: "What is Shaken? Japan's Vehicle Inspection Explained",
      desc: "Japan's biennial shaken inspection is one of the strictest in the world — and it benefits buyers.",
      image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=400&q=80'
    },
    {
      title: 'Best JDM Cars Under $15,000 in 2025',
      desc: "Quality Japanese imports don't have to break the bank. Here are the best budget JDM picks.",
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80'
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
    }, 4000);
  }

  get maxIndex(): number {
    return this.guides.length - this.visibleCards;
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