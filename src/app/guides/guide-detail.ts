import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { GUIDES_DATA, guideSlug } from './guides.data';

@Component({
  selector: 'app-guide-detail',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (guide(); as g) {
      <article class="guide-detail">
        <img class="hero-img" [src]="g.image" [alt]="g.title" />
        <div class="body">
          <h1>{{ g.title }}</h1>
          <p class="meta">{{ g.category }} • {{ g.readTime }} min read</p>
          <p class="lead">{{ g.excerpt }}</p>
          <div class="cta">
            <a routerLink="/cars" class="btn primary">Browse Cars for Sale</a>
            <a routerLink="/guides" class="btn">More Guides</a>
          </div>
          <h2>Related guides</h2>
          <ul class="related">
            @for (r of related(); track r.title) {
              <li><a [routerLink]="['/guides', slugOf(r.title)]">{{ r.title }}</a></li>
            }
          </ul>
        </div>
      </article>
    } @else {
      <div class="guide-detail missing">
        <h1>Guide not found</h1>
        <p><a routerLink="/guides">Back to all guides</a></p>
      </div>
    }
  `,
  styles: `
    .guide-detail { max-width: 860px; margin: 0 auto; padding: 32px 20px 80px; }
    .hero-img { width: 100%; max-height: 420px; object-fit: cover; border-radius: 12px; }
    h1 { margin: 24px 0 4px; font-size: 2rem; }
    .meta { color: #6b7280; margin-bottom: 20px; }
    .lead { font-size: 1.1rem; line-height: 1.8; color: #374151; }
    .cta { display: flex; gap: 12px; margin: 28px 0 40px; flex-wrap: wrap; }
    .btn { padding: 10px 22px; border-radius: 8px; border: 1px solid #d1d5db; text-decoration: none; color: inherit; }
    .btn.primary { background: #e8452e; border-color: #e8452e; color: #fff; }
    h2 { font-size: 1.25rem; margin-bottom: 12px; }
    .related { line-height: 2; }
    .missing { text-align: center; padding-top: 80px; }
  `,
})
export class GuideDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap);

  readonly guide = computed(() => {
    const slug = this.params()?.get('slug') ?? '';
    return GUIDES_DATA.find((g) => guideSlug(g.title) === slug) ?? null;
  });

  readonly related = computed(() => {
    const g = this.guide();
    if (!g) return [];
    return GUIDES_DATA.filter((x) => x !== g && x.category === g.category).slice(0, 4);
  });

  slugOf(title: string): string {
    return guideSlug(title);
  }
}
