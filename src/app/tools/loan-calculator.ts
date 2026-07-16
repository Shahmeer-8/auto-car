import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

export function monthlyPayment(price: number, down: number, aprPct: number, months: number): number {
  const principal = price - down;
  if (principal <= 0 || months <= 0) return 0;
  if (aprPct <= 0) return Math.round((principal / months) * 100) / 100;
  const r = aprPct / 100 / 12;
  const m = (principal * r) / (1 - Math.pow(1 + r, -months));
  return Math.round(m * 100) / 100;
}

@Component({
  selector: 'app-loan-calculator',
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tool-page">
      <h1>Car Loan Calculator</h1>
      <p class="sub">Estimate your monthly payment for an imported vehicle.</p>
      <form class="calc-form">
        <label>Vehicle price ($)
          <input type="number" min="0" [ngModel]="price()" (ngModelChange)="price.set($event)" name="price" />
        </label>
        <label>Down payment ($)
          <input type="number" min="0" [ngModel]="down()" (ngModelChange)="down.set($event)" name="down" />
        </label>
        <label>APR (%)
          <input type="number" min="0" step="0.1" [ngModel]="apr()" (ngModelChange)="apr.set($event)" name="apr" />
        </label>
        <label>Term (months)
          <select [ngModel]="months()" (ngModelChange)="months.set($event)" name="months">
            @for (m of [12, 24, 36, 48, 60, 72]; track m) { <option [ngValue]="m">{{ m }}</option> }
          </select>
        </label>
      </form>
      <div class="result" aria-live="polite">
        <span class="label">Estimated monthly payment</span>
        <span class="value">\${{ payment() | number: '1.2-2' }}</span>
        <span class="total">Total cost: \${{ total() | number: '1.0-0' }}</span>
      </div>
      <p class="cta"><a routerLink="/cars">Find your car →</a></p>
    </div>
  `,
  styles: `
    .tool-page { max-width: 640px; margin: 0 auto; padding: 48px 20px 80px; }
    h1 { font-size: 1.8rem; } .sub { color: #6b7280; margin-bottom: 28px; }
    .calc-form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    label { display: flex; flex-direction: column; gap: 6px; font-weight: 600; font-size: 14px; }
    input, select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; }
    .result { margin-top: 32px; padding: 24px; border-radius: 12px; background: #111827; color: #fff;
      display: flex; flex-direction: column; gap: 4px; }
    .result .value { font-size: 2rem; font-weight: 800; color: #f97316; }
    .result .total { color: #9ca3af; font-size: 14px; }
    .cta { margin-top: 24px; }
    @media (max-width: 560px) { .calc-form { grid-template-columns: 1fr; } }
  `,
})
export class LoanCalculator {
  readonly price = signal(20000);
  readonly down = signal(5000);
  readonly apr = signal(6);
  readonly months = signal(36);
  readonly payment = computed(() => monthlyPayment(this.price(), this.down(), this.apr(), this.months()));
  readonly total = computed(() => this.payment() * this.months() + this.down());
}
