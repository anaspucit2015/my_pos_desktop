import { PaymentService } from './PaymentService.js';
import { PaymentMethod } from '@my-pos/shared';

const service = new PaymentService();

describe('PaymentService.processCash', () => {
  it('calculates change correctly', () => {
    const result = service.processCash(1000, {
      method: PaymentMethod.CASH,
      amountInCents: 1000,
      tenderedInCents: 1500,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.changeInCents).toBe(500);
      expect(result.data.tenderedInCents).toBe(1500);
    }
  });

  it('returns zero change for exact tender', () => {
    const result = service.processCash(1000, {
      method: PaymentMethod.CASH,
      amountInCents: 1000,
      tenderedInCents: 1000,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.changeInCents).toBe(0);
  });

  it('rejects insufficient tender', () => {
    const result = service.processCash(1000, {
      method: PaymentMethod.CASH,
      amountInCents: 1000,
      tenderedInCents: 500,
    });
    expect(result.success).toBe(false);
  });

  it('rejects cash amount that does not match order total', () => {
    const result = service.processCash(1000, {
      method: PaymentMethod.CASH,
      amountInCents: 900,
      tenderedInCents: 2000,
    });
    expect(result.success).toBe(false);
  });
});

describe('PaymentService.processCard', () => {
  it('accepts a valid card payment', () => {
    const result = service.processCard(1000, {
      method: PaymentMethod.CARD,
      amountInCents: 1000,
      transactionRef: 'TXN-ABC-123',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.transactionRef).toBe('TXN-ABC-123');
  });

  it('rejects a blank transaction reference', () => {
    const result = service.processCard(1000, {
      method: PaymentMethod.CARD,
      amountInCents: 1000,
      transactionRef: '   ',
    });
    expect(result.success).toBe(false);
  });

  it('rejects card amount that does not match order total', () => {
    const result = service.processCard(1000, {
      method: PaymentMethod.CARD,
      amountInCents: 800,
      transactionRef: 'TXN-001',
    });
    expect(result.success).toBe(false);
  });
});

describe('PaymentService.processSplitPayment', () => {
  it('processes a valid split payment', () => {
    const result = service.processSplitPayment(1000, 400, 500, 600, 'TXN-SPLIT');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalPaidInCents).toBe(1000);
      expect(result.data.changeInCents).toBe(100);
      expect(result.data.cashPortion?.amountInCents).toBe(400);
      expect(result.data.cardPortion?.amountInCents).toBe(600);
    }
  });

  it('rejects when portions do not sum to total', () => {
    const result = service.processSplitPayment(1000, 300, 400, 500, 'TXN-SPLIT');
    expect(result.success).toBe(false);
  });

  it('rejects insufficient cash tender in split', () => {
    const result = service.processSplitPayment(1000, 500, 400, 500, 'TXN-SPLIT');
    expect(result.success).toBe(false);
  });
});

describe('PaymentService.calculateChange', () => {
  it('returns correct change', () => {
    const result = service.calculateChange(2000, 1599);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(401);
  });

  it('returns error when tendered is less than owed', () => {
    const result = service.calculateChange(500, 1000);
    expect(result.success).toBe(false);
  });
});
