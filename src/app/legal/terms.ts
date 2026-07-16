import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-terms',
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="legal-page">
      <h1>Terms of Service</h1>
      <p class="updated">Last updated: July 2026</p>
      <section>
        <h2>Use of the Marketplace</h2>
        <p>AutoFlex provides a platform for listing and browsing used vehicles. You must provide accurate information in your listings. All new listings are reviewed by our team before publication.</p>
      </section>
      <section>
        <h2>Listings &amp; Content</h2>
        <p>You retain ownership of the content you post but grant AutoFlex the right to display it on the platform. Listings that are fraudulent, misleading, or inappropriate will be rejected or removed.</p>
      </section>
      <section>
        <h2>Transactions</h2>
        <p>AutoFlex connects buyers and sellers. Unless explicitly stated, AutoFlex is not a party to transactions between users; verify vehicle condition and documentation before purchase.</p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Questions about these terms? <a routerLink="/contact">Contact us</a>.</p>
      </section>
    </div>
  `,
  styles: `
    .legal-page { max-width: 800px; margin: 0 auto; padding: 48px 20px 80px; }
    h1 { font-size: 2rem; margin-bottom: 4px; }
    .updated { color: #6b7280; margin-bottom: 32px; }
    section { margin-bottom: 24px; }
    h2 { font-size: 1.2rem; margin-bottom: 8px; }
    p { line-height: 1.7; color: #374151; }
  `,
})
export class TermsPage {}
