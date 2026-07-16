import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-chassis-decoder',
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tool-page">
      <h1>JDM Chassis Code Decoder</h1>
      <p class="sub">Japanese-market cars use a chassis code (e.g. <code>JZX100-0012345</code>) instead of a 17-digit VIN. Enter one to break it down.</p>
      <input class="code-input" type="text" placeholder="e.g. JZX100-0012345"
             [ngModel]="code()" (ngModelChange)="code.set($event)" name="code" />
      @if (parsed(); as p) {
        <div class="breakdown">
          <div class="part"><span class="label">Model code</span><span class="value">{{ p.model }}</span>
            <span class="hint">Identifies platform, engine family and generation</span></div>
          @if (p.serial) {
            <div class="part"><span class="label">Serial number</span><span class="value">{{ p.serial }}</span>
              <span class="hint">Sequential production number</span></div>
          }
        </div>
      }
      <section class="examples">
        <h2>Common codes</h2>
        <ul>
          @for (e of examples; track e.code) { <li><strong>{{ e.code }}</strong> — {{ e.desc }}</li> }
        </ul>
        <p class="note">The exact model/engine matching a code is confirmed on the export certificate. Ask us to verify any chassis code before you buy.</p>
      </section>
      <p class="cta"><a routerLink="/contact">Ask us to verify a code →</a></p>
    </div>
  `,
  styles: `
    .tool-page { max-width: 720px; margin: 0 auto; padding: 48px 20px 80px; }
    h1 { font-size: 1.8rem; } .sub { color: #6b7280; margin-bottom: 24px; }
    .code-input { width: 100%; padding: 12px 14px; font-size: 1.05rem; border: 1px solid #d1d5db; border-radius: 8px; text-transform: uppercase; }
    .breakdown { margin-top: 20px; display: grid; gap: 12px; }
    .part { padding: 14px 16px; border: 1px solid #e5e7eb; border-radius: 10px; display: grid; gap: 2px; }
    .part .label { font-size: 12px; text-transform: uppercase; color: #6b7280; }
    .part .value { font-size: 1.2rem; font-weight: 700; }
    .part .hint { font-size: 13px; color: #6b7280; }
    .examples { margin-top: 32px; } .examples h2 { font-size: 1.15rem; margin-bottom: 10px; }
    .examples li { padding: 4px 0; } .note { margin-top: 12px; color: #6b7280; font-size: 14px; }
    .cta { margin-top: 24px; }
  `,
})
export class ChassisDecoder {
  readonly code = signal('');
  readonly parsed = computed(() => {
    const raw = this.code().trim().toUpperCase();
    if (!raw) return null;
    const [model, serial] = raw.split('-');
    if (!model) return null;
    return { model, serial: serial ?? '' };
  });
  readonly examples = [
    { code: 'JZX100', desc: 'Toyota Chaser / Mark II / Cresta (1JZ engine)' },
    { code: 'BNR34', desc: 'Nissan Skyline GT-R R34 (RB26DETT)' },
    { code: 'FD3S', desc: 'Mazda RX-7 (13B rotary)' },
    { code: 'EK9', desc: 'Honda Civic Type R (B16B)' },
    { code: 'GDB', desc: 'Subaru Impreza WRX STI (EJ207)' },
  ];
}
