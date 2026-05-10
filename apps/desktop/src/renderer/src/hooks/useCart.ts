import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import type { CreateOrderDTO, PaymentDTO } from '@my-pos/shared';

interface UseCartResult {
  /** Place a new order from the current cart contents. Returns orderId on success. */
  checkout(payment: PaymentDTO): Promise<{ orderId: number } | { error: string }>;
}

/**
 * Extends the cart store with the IPC-backed checkout action.
 * Thin wrapper that composes cartStore + authStore + window.api.
 */
export function useCart(): UseCartResult {
  const { items, discountInCents, clearCart } = useCartStore();
  const currentUser = useAuthStore((s) => s.currentUser);

  const checkout = async (
    payment: PaymentDTO,
  ): Promise<{ orderId: number } | { error: string }> => {
    if (!currentUser) return { error: 'No authenticated user' };
    if (items.length === 0) return { error: 'Cart is empty' };

    const dto: CreateOrderDTO = {
      cashierId: currentUser.id,
      discountInCents,
      items: items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPriceInCents: item.unitPriceInCents,
        discountInCents: item.discountInCents,
      })),
    };

    const createRes = await window.api.orders.create(dto);
    if (!createRes.success) return { error: createRes.error };

    const completeRes = await window.api.orders.complete(
      createRes.data.id,
      payment,
      currentUser.id,
    );

    if (!completeRes.success) return { error: completeRes.error };

    clearCart();
    return { orderId: completeRes.data.id };
  };

  return { checkout };
}
