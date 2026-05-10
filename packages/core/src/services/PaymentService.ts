import { PaymentMethod } from '@my-pos/shared';
import { ok, err, type Result } from '@my-pos/shared';
import type { CashPaymentDTO, CardPaymentDTO } from '@my-pos/shared';

export interface CashPaymentResult {
  method: PaymentMethod.CASH;
  amountInCents: number;
  tenderedInCents: number;
  changeInCents: number;
}

export interface CardPaymentResult {
  method: PaymentMethod.CARD;
  amountInCents: number;
  transactionRef: string;
}

export interface SplitPaymentResult {
  cashPortion: CashPaymentResult | null;
  cardPortion: CardPaymentResult | null;
  totalPaidInCents: number;
  changeInCents: number;
}

/**
 * Stateless service for payment validation and change calculation.
 * Does not persist anything — call OrderRepository.recordPayment for storage.
 */
export class PaymentService {
  /**
   * Validates and calculates a cash payment.
   *
   * @param orderTotalInCents - The amount owed in cents.
   * @param dto - Cash payment data including amount tendered.
   * @returns CashPaymentResult with change, or an error if tendered is insufficient.
   */
  processCash(
    orderTotalInCents: number,
    dto: CashPaymentDTO,
  ): Result<CashPaymentResult, Error> {
    if (dto.tenderedInCents < dto.amountInCents) {
      return err(
        new Error(
          `Insufficient tender: owed ${dto.amountInCents} cents, received ${dto.tenderedInCents} cents`,
        ),
      );
    }

    if (dto.amountInCents !== orderTotalInCents) {
      return err(
        new Error(
          `Cash amount (${dto.amountInCents}) must equal the order total (${orderTotalInCents})`,
        ),
      );
    }

    const changeInCents = dto.tenderedInCents - dto.amountInCents;
    return ok({
      method: PaymentMethod.CASH,
      amountInCents: dto.amountInCents,
      tenderedInCents: dto.tenderedInCents,
      changeInCents,
    });
  }

  /**
   * Validates a card payment.
   *
   * @param orderTotalInCents - The amount owed in cents.
   * @param dto - Card payment data including transaction reference.
   */
  processCard(
    orderTotalInCents: number,
    dto: CardPaymentDTO,
  ): Result<CardPaymentResult, Error> {
    if (dto.amountInCents !== orderTotalInCents) {
      return err(
        new Error(
          `Card amount (${dto.amountInCents}) must equal the order total (${orderTotalInCents})`,
        ),
      );
    }

    if (!dto.transactionRef.trim()) {
      return err(new Error('Card payment requires a transaction reference'));
    }

    return ok({
      method: PaymentMethod.CARD,
      amountInCents: dto.amountInCents,
      transactionRef: dto.transactionRef,
    });
  }

  /**
   * Validates a split payment (partial cash + partial card).
   *
   * @param orderTotalInCents - The total owed in cents.
   * @param cashAmountInCents - The portion to pay in cash.
   * @param tenderedInCents - Actual cash handed over.
   * @param cardAmountInCents - The portion to pay by card.
   * @param transactionRef - Card transaction reference.
   */
  processSplitPayment(
    orderTotalInCents: number,
    cashAmountInCents: number,
    tenderedInCents: number,
    cardAmountInCents: number,
    transactionRef: string,
  ): Result<SplitPaymentResult, Error> {
    const combinedTotal = cashAmountInCents + cardAmountInCents;
    if (combinedTotal !== orderTotalInCents) {
      return err(
        new Error(
          `Split payment total (${combinedTotal}) does not equal order total (${orderTotalInCents})`,
        ),
      );
    }

    if (tenderedInCents < cashAmountInCents) {
      return err(
        new Error(
          `Insufficient cash tender: owed ${cashAmountInCents} cents, received ${tenderedInCents} cents`,
        ),
      );
    }

    const changeInCents = tenderedInCents - cashAmountInCents;

    return ok({
      cashPortion: {
        method: PaymentMethod.CASH,
        amountInCents: cashAmountInCents,
        tenderedInCents,
        changeInCents,
      },
      cardPortion: {
        method: PaymentMethod.CARD,
        amountInCents: cardAmountInCents,
        transactionRef,
      },
      totalPaidInCents: combinedTotal,
      changeInCents,
    });
  }

  /**
   * Calculates change for a cash transaction.
   *
   * @param tenderedInCents - Amount the customer handed over.
   * @param totalInCents - Amount owed.
   * @returns Change in cents, or an error if tendered is insufficient.
   */
  calculateChange(
    tenderedInCents: number,
    totalInCents: number,
  ): Result<number, Error> {
    if (tenderedInCents < totalInCents) {
      return err(
        new Error(
          `Insufficient tender: owed ${totalInCents} cents, tendered ${tenderedInCents} cents`,
        ),
      );
    }
    return ok(tenderedInCents - totalInCents);
  }
}
