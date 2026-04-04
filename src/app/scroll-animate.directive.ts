import { Directive, ElementRef, Renderer2, OnDestroy, AfterViewInit, NgZone } from '@angular/core';

@Directive({
  selector: '[appScrollAnimate]',
  standalone: true
})
export class ScrollAnimateDirective implements AfterViewInit, OnDestroy {
  private observer: IntersectionObserver | null = null;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private ngZone: NgZone
  ) {}

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.applyBaseStyles();
      this.applyHiddenStyles();

      this.observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              requestAnimationFrame(() => this.applyVisibleStyles());
            } else {
              this.applyHiddenStyles();
            }
          }
        },
        { threshold: 0.25 }
      );

      this.observer.observe(this.el.nativeElement);
    });
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  private applyBaseStyles(): void {
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'opacity 820ms cubic-bezier(0.16, 1, 0.3, 1), transform 820ms cubic-bezier(0.16, 1, 0.3, 1)');
    this.renderer.setStyle(this.el.nativeElement, 'will-change', 'opacity, transform');
  }

  private applyHiddenStyles(): void {
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(40px)');
  }

  private applyVisibleStyles(): void {
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(0)');
  }
}
