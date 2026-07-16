import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-privacy',
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="legal-page">
      <h1>Privacy Policy</h1>
      <p class="updated">Last updated: July 2026</p>
      <section>
        <h2>Information We Collect</h2>
        <p>When you create an account, list a vehicle, or contact us, we collect the information you provide: name, email address, phone number, and vehicle listing details (including photos).</p>
      </section>
      <section>
        <h2>How We Use It</h2>
        <p>Your information is used to operate the AutoFlex marketplace: displaying your listings to buyers, moderating content, responding to enquiries, and sending service notifications you have opted into.</p>
      </section>
      <section>
        <h2>Data Storage</h2>
        <p>Data is stored securely on Google Firebase infrastructure. We do not sell your personal information to third parties.</p>
      </section>
      <section>
        <h2>Your Rights</h2>
        <p>You may edit or delete your listings and account data from your dashboard at any time, or <a routerLink="/contact">contact us</a> to request removal of your data.</p>
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
export class PrivacyPage {}
