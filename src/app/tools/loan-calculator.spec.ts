import { monthlyPayment } from './loan-calculator';

describe('monthlyPayment', () => {
  it('computes a standard amortized payment', () => {
    // $20,000 - $5,000 down, 6% APR, 36 months → ≈ $456.33
    expect(monthlyPayment(20000, 5000, 6, 36)).toBeCloseTo(456.33, 1);
  });
  it('handles 0% APR as simple division', () => {
    expect(monthlyPayment(12000, 0, 0, 12)).toBe(1000);
  });
  it('returns 0 for a fully-covered down payment or bad input', () => {
    expect(monthlyPayment(10000, 10000, 5, 36)).toBe(0);
    expect(monthlyPayment(10000, 0, 5, 0)).toBe(0);
  });
});
