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
  /** Auto-play is suspended while the user is hovering, focused inside, or dragging. */
  private paused = false;

  hostClasses = '';

  maxIndex = computed(() => Math.max(0, this.items().length - this.visibleCards()));

  /** Arrows are pointless when everything already fits on screen. */
  canSlide = computed(() => this.maxIndex() > 0);

  translateX = computed(() => {
    const index = this.currentIndex();
    const visible = this.visibleCards();
    const gap = this.cardGap;
    return `translateX(calc(${index} * (-1 * ((100% - ${
      (visible - 1) * gap
    }px) / ${visible} + ${gap}px))))`;
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

  /** Arrows wrap around, matching auto-play — a dead-end arrow is a dead control. */
  prev(): void {
    this.currentIndex.update((i) => (i > 0 ? i - 1 : this.maxIndex()));
    this.restartAutoSlide();
  }

  next(): void {
    this.currentIndex.update((i) => (i < this.maxIndex() ? i + 1 : 0));
    this.restartAutoSlide();
  }

  // ===== AUTO-PLAY PAUSING =====
  // Stop the carousel moving out from under someone who is reading or tabbing through it.
  pause(): void {
    this.paused = true;
    this.clearAutoSlide();
  }

  resume(): void {
    this.paused = false;
    this.restartAutoSlide();
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (document.hidden) {
      this.clearAutoSlide();
    } else if (!this.paused) {
      this.restartAutoSlide();
    }
  }

  // ===== TOUCH / DRAG SWIPE =====
  // With the dots gone, swiping is the primary way to browse on a phone.
  private dragStartX: number | null = null;
  private readonly SWIPE_THRESHOLD = 45;

  onPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse') return;
    this.dragStartX = event.clientX;
    this.pause();
  }

  onPointerUp(event: PointerEvent): void {
    if (this.dragStartX === null) return;
    const delta = event.clientX - this.dragStartX;
    this.dragStartX = null;

    if (Math.abs(delta) >= this.SWIPE_THRESHOLD && this.canSlide()) {
      delta < 0 ? this.next() : this.prev();
    }
    this.resume();
  }

  onPointerCancel(): void {
    this.dragStartX = null;
    this.resume();
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
    if (width <= 560) {
      this.visibleCards.set(1);
    } else if (width <= 880) {
      this.visibleCards.set(2);
    } else if (width <= 1180) {
      this.visibleCards.set(3);
    } else {
      this.visibleCards.set(4);
    }
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  private startAutoSlide(): void {
    this.clearAutoSlide();
    // Honour the OS "reduce motion" setting, and don't animate a slider that can't move.
    if (this.paused || this.prefersReducedMotion() || this.maxIndex() === 0) return;

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
