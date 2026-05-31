import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  HostListener,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SliderConfig, SliderItem } from './slider.types';

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './slider.html',
  styleUrls: ['./slider.css'],
  host: {
    '[class]': 'hostClasses',
  },
})
export class Slider implements OnInit, OnDestroy, OnChanges {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) items: SliderItem[] = [];
  @Input({ required: true }) config!: SliderConfig;

  currentIndex = signal(0);
  visibleCards = signal(4);
  readonly cardGap = 16;

  private interval: ReturnType<typeof setInterval> | null = null;

  hostClasses = '';

  maxIndex = computed(() => Math.max(0, this.items.length - this.visibleCards()));

  translateX = computed(() => {
    const index = this.currentIndex();
    const visible = this.visibleCards();
    const gap = this.cardGap;
    return `translateX(calc(${index} * (-1 * ((100% - ${
      (visible - 1) * gap
    }px) / ${visible} + ${gap}px))))`;
  });

  dots = computed(() => Array.from({ length: this.maxIndex() + 1 }, (_, i) => i));

  ngOnInit(): void {
    this.updateHostClasses();
    this.updateVisibleCards();
    this.startAutoSlide();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] || changes['items']) {
      this.updateHostClasses();
      if (this.currentIndex() > this.maxIndex()) {
        this.currentIndex.set(0);
      }
      this.restartAutoSlide();
    }
  }

  ngOnDestroy(): void {
    this.clearAutoSlide();
  }

  @HostListener('window:resize')
  onResize(): void {
    const prev = this.visibleCards();
    this.updateVisibleCards();
    if (prev !== this.visibleCards() && this.currentIndex() > this.maxIndex()) {
      this.currentIndex.set(this.maxIndex());
    }
  }

  prev(): void {
    if (this.currentIndex() > 0) {
      this.currentIndex.update((i) => i - 1);
    }
    this.restartAutoSlide();
  }

  next(): void {
    if (this.currentIndex() < this.maxIndex()) {
      this.currentIndex.update((i) => i + 1);
    }
    this.restartAutoSlide();
  }

  goTo(index: number): void {
    this.currentIndex.set(index);
    this.restartAutoSlide();
  }

  getRouterLink(item: SliderItem, index: number): string | any[] {
    return this.config.getRouterLink?.(item, index) ?? ['/'];
  }

  getQueryParams(item: SliderItem): Record<string, string> | null {
    return this.config.getQueryParams?.(item) ?? null;
  }

  getCarDetailLink(item: SliderItem, index: number): any[] {
    return ['/car-detail', item.isUserListing ? item.id : index + 1];
  }

  private updateHostClasses(): void {
    const classes = ['slider-host'];
    if (this.config.sectionClass) {
      classes.push(this.config.sectionClass);
    }
    if (this.config.bordered) {
      classes.push('slider-host--bordered');
    }
    if (this.config.compactPadding) {
      classes.push('slider-host--compact');
    }
    this.hostClasses = classes.join(' ');
  }

  private updateVisibleCards(): void {
    const width = window.innerWidth;
    if (width <= 480) {
      this.visibleCards.set(1);
    } else if (width <= 768) {
      this.visibleCards.set(2);
    } else if (width <= 1024) {
      this.visibleCards.set(3);
    } else {
      this.visibleCards.set(4);
    }
  }

  private startAutoSlide(): void {
    this.clearAutoSlide();
    const ms = this.config.autoPlayMs ?? 4000;
    this.interval = setInterval(() => {
      this.currentIndex.update((i) => (i < this.maxIndex() ? i + 1 : 0));
    }, ms);
  }

  private restartAutoSlide(): void {
    this.clearAutoSlide();
    this.startAutoSlide();
  }

  private clearAutoSlide(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
