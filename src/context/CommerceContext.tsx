import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  Order,
  OrderItem,
  DeliveryInfo,
  CheckoutCalculation,
  CheckoutInitializeResponse,
  PaymentVerifyResponse,
} from '../types/commerce';

interface CommerceContextType {
  loading: boolean;
  error: string | null;
  validateCartItems: (
    items: { productId: string; quantity: number; variantId?: string }[]
  ) => Promise<{ success: boolean; calculation?: CheckoutCalculation; error?: string }>;
  initializeCheckout: (
    deliveryInfo: DeliveryInfo,
    items: { productId: string; quantity: number; variantId?: string }[],
    providerName?: string
  ) => Promise<CheckoutInitializeResponse>;
  verifyPayment: (reference: string, orderId?: string) => Promise<PaymentVerifyResponse>;
  fetchMyOrders: () => Promise<Order[]>;
}

const CommerceContext = createContext<CommerceContextType | undefined>(undefined);

export const CommerceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Request server-authoritative cart validation and recalculation.
   */
  const validateCartItems = useCallback(
    async (items: { productId: string; quantity: number; variantId?: string }[]) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/checkout/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });
        const data = await res.json();
        setLoading(false);
        if (data.success && data.calculation) {
          return { success: true, calculation: data.calculation };
        }
        return { success: false, error: data.error || (data.errors && data.errors.join('. ')) || 'Validation failed' };
      } catch (err: unknown) {
        setLoading(false);
        const msg = err instanceof Error ? err.message : 'Server validation unreachable';
        return { success: false, error: msg };
      }
    },
    []
  );

  /**
   * Initializes order and payment session on the backend.
   */
  const initializeCheckout = useCallback(
    async (
      deliveryInfo: DeliveryInfo,
      items: { productId: string; quantity: number; variantId?: string }[],
      providerName = 'PAYSTACK'
    ): Promise<CheckoutInitializeResponse> => {
      setLoading(true);
      setError(null);

      if (!user) {
        setLoading(false);
        return {
          success: false,
          orderId: '',
          orderReference: '',
          paymentReference: '',
          paymentId: '',
          amount: 0,
          currency: 'NGN',
          provider: 'PAYSTACK',
          environment: 'test',
          error: 'Please sign in to proceed with checkout.',
        };
      }

      try {
        const res = await fetch('/api/checkout/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            customerEmail: user.email || deliveryInfo.email,
            deliveryInfo,
            items,
            providerName,
          }),
        });
        const data = await res.json();
        setLoading(false);
        return data;
      } catch (err: unknown) {
        setLoading(false);
        const msg = err instanceof Error ? err.message : 'Checkout initiation failed';
        return {
          success: false,
          orderId: '',
          orderReference: '',
          paymentReference: '',
          paymentId: '',
          amount: 0,
          currency: 'NGN',
          provider: 'PAYSTACK',
          environment: 'test',
          error: msg,
        };
      }
    },
    [user]
  );

  /**
   * Verifies payment reference on the backend, updating the order and deducting stock.
   */
  const verifyPayment = useCallback(
    async (reference: string, orderId?: string): Promise<PaymentVerifyResponse> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/checkout/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference, orderId }),
        });
        const data = await res.json();
        setLoading(false);
        return data;
      } catch (err: unknown) {
        setLoading(false);
        const msg = err instanceof Error ? err.message : 'Payment verification error';
        return {
          success: false,
          paymentStatus: 'FAILED',
          orderStatus: 'PENDING_PAYMENT',
          orderId: orderId || '',
          orderReference: '',
          amount: 0,
          currency: 'NGN',
          error: msg,
        };
      }
    },
    []
  );

  /**
   * Fetches customer's own order history.
   */
  const fetchMyOrders = useCallback(async (): Promise<Order[]> => {
    if (!user) return [];
    try {
      const res = await fetch(`/api/orders/user/me?userId=${encodeURIComponent(user.uid)}`, {
        headers: {
          'x-user-id': user.uid,
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        return data.orders;
      }
      return [];
    } catch (err) {
      console.error('Error fetching customer orders:', err);
      return [];
    }
  }, [user]);

  return (
    <CommerceContext.Provider
      value={{
        loading,
        error,
        validateCartItems,
        initializeCheckout,
        verifyPayment,
        fetchMyOrders,
      }}
    >
      {children}
    </CommerceContext.Provider>
  );
};

export const useCommerce = () => {
  const context = useContext(CommerceContext);
  if (!context) {
    throw new Error('useCommerce must be used within a CommerceProvider');
  }
  return context;
};
