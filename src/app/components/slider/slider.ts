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
  input,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SliderConfig, SliderItem } from './slider.types';

/** Edge dots render smaller to signal that the page strip continues. */
type SliderDotSize = 'full' | 'sm' | 'xs';

interface SliderDot {
  page: number;
  size: SliderDotSize;
}

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
  items = input.required<SliderItem[]>();
  @Input({ required: true }) config!: SliderConfig;

  currentIndex = signal(0);
  visibleCards = signal(4);
  readonly cardGap = 16;

  private interval: ReturnType<typeof setInterval> | null = null;
  private itemsInitialized = false;

  hostClasses = '';

  maxIndex = computed(() => Math.max(0, this.items().length - this.visibleCards()));

  translateX = computed(() => {
    const index = this.currentIndex();
    const visible = this.visibleCards();
    const gap = this.cardGap;
    return `translateX(calc(${index} * (-1 * ((100% - ${
      (visible - 1) * gap
    }px) / ${visible} + ${gap}px))))`;
  });

  /**
   * Dots represent PAGES (one screenful of cards), not every scroll position —
   * a 26-car row used to render 23 dots on desktop and 26 on a phone. The strip
   * is also capped at MAX_DOTS and windowed around the active page, with the
   * outermost dots shrinking to hint that there is more either side.
   */
  private readonly MAX_DOTS = 7;

  totalPages = computed(() => {
    const perPage = this.visibleCards();
    const count = this.items().length;
    if (!count || !perPage) return 1;
    return Math.max(1, Math.ceil(count / perPage));
  });

  activePage = computed(() =>
    Math.min(Math.floor(this.currentIndex() / this.visibleCards()), this.totalPages() - 1),
  );

  dots = computed<SliderDot[]>(() => {
    const total = this.totalPages();
    const active = this.activePage();

    // A single page needs no pagination at all.
    if (total <= 1) return [];

    if (total <= this.MAX_DOTS) {
      return Array.from({ length: total }, (_, page) => ({ page, size: 'full' as const }));
    }

    // Slide a fixed-size window so the active page stays near the middle.
    const half = Math.floor(this.MAX_DOTS / 2);
    const start = Math.min(Math.max(active - half, 0), total - this.MAX_DOTS);
    const last = this.MAX_DOTS - 1;

    return Array.from({ length: this.MAX_DOTS }, (_, i) => {
      const page = start + i;
      const moreBefore = start > 0;
      const moreAfter = start + this.MAX_DOTS < total;

      let size: SliderDotSize = 'full';
      if ((i === 0 && moreBefore) || (i === last && moreAfter)) size = 'xs';
      else if ((i === 1 && start > 1) || (i === last - 1 && start + this.MAX_DOTS < total - 1)) size = 'sm';

      return { page, size };
    });
  });

  constructor() {
    // Signal inputs don't surface in ngOnChanges/SimpleChanges, so react to `items`
    // changing (e.g. async data arriving) here instead. Skip the initial run — that
    // case is already handled by ngOnInit's own updateVisibleCards/startAutoSlide.
    effect(() => {
      this.items();
      if (!this.itemsInitialized) {
        this.itemsInitialized = true;
        return;
      }
      if (this.currentIndex() > this.maxIndex()) {
        this.currentIndex.set(0);
      }
      this.restartAutoSlide();
    });
  }

  ngOnInit(): void {
    this.updateHostClasses();
    this.updateVisibleCards();
    this.startAutoSlide();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) {
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

  /** Jump a whole screenful, clamped so the last page doesn't scroll past the end. */
  goToPage(page: number): void {
    this.currentIndex.set(Math.min(page * this.visibleCards(), this.maxIndex()));
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

  readonly placeholderImage = 'placeholder-car.svg';

  // Swap any image that fails to load (dead URL, blocked host, empty base64) for the placeholder.
  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (img && !img.src.endsWith(this.placeholderImage)) {
      img.src = this.placeholderImage;
    }
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
