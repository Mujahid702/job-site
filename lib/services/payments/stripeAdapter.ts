import { PaymentProvider } from "./paymentAdapter";

export class StripeAdapter implements PaymentProvider {
  private getSecretKey(): string | null {
    return process.env.STRIPE_SECRET_KEY || null;
  }

  private isSandbox(): boolean {
    return !this.getSecretKey();
  }

  async createOrder(
    userId: string,
    planId: string,
    amount: number,
    currency: string
  ): Promise<{
    id: string;
    checkoutUrl?: string;
    clientSecret?: string;
    provider: 'stripe' | 'razorpay';
    amount: number;
    currency: string;
    isSandbox: boolean;
  }> {
    const isSandbox = this.isSandbox();
    const secretKey = this.getSecretKey();

    if (isSandbox) {
      console.log(`[Stripe Sandbox] Creating simulated checkout session for user ${userId}, plan ${planId}`);
      const mockSessionId = `cs_test_${Math.random().toString(36).substring(2, 15)}`;
      const checkoutUrl = `/dashboard/subscription/checkout-sim?provider=stripe&sessionId=${mockSessionId}&planId=${planId}&amount=${amount}&currency=${currency}`;
      
      return {
        id: mockSessionId,
        checkoutUrl,
        provider: 'stripe',
        amount,
        currency,
        isSandbox: true
      };
    }

    try {
      // Production path: Create standard Stripe Checkout Session via REST API
      const params = new URLSearchParams();
      params.append('payment_method_types[0]', 'card');
      params.append('line_items[0][price_data][currency]', currency.toLowerCase());
      params.append('line_items[0][price_data][product_data][name]', `Placement Premium ${planId.toUpperCase()}`);
      params.append('line_items[0][price_data][unit_amount]', Math.round(amount * 100).toString());
      params.append('line_items[0][price_data][recurring][interval]', 'month');
      params.append('line_items[0][quantity]', '1');
      params.append('mode', 'subscription');
      params.append('success_url', `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/subscription?status=success&session_id={CHECKOUT_SESSION_ID}`);
      params.append('cancel_url', `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/subscription?status=cancelled`);
      params.append('client_reference_id', userId);
      params.append('metadata[userId]', userId);
      params.append('metadata[planId]', planId);

      const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create Stripe checkout session');
      }

      const session = await response.json();
      return {
        id: session.id,
        checkoutUrl: session.url,
        provider: 'stripe',
        amount,
        currency,
        isSandbox: false
      };
    } catch (error: any) {
      console.error('[Stripe Adapter] createOrder error:', error);
      throw error;
    }
  }

  async verifyPayment(payload: { sessionId: string }): Promise<{
    success: boolean;
    transactionId: string;
    reference: string;
    amount: number;
    currency: string;
  }> {
    const isSandbox = this.isSandbox();
    const secretKey = this.getSecretKey();

    if (isSandbox) {
      console.log(`[Stripe Sandbox] Verifying simulated checkout session ${payload.sessionId}`);
      // Simulate success
      return {
        success: true,
        transactionId: `txn_stripe_${Math.random().toString(36).substring(2, 10)}`,
        reference: `sub_stripe_${Math.random().toString(36).substring(2, 10)}`,
        amount: 29.99, // default simulation amount
        currency: 'USD'
      };
    }

    try {
      const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${payload.sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve Stripe session details');
      }

      const session = await response.json();
      const success = session.payment_status === 'paid' || session.status === 'complete';
      const reference = session.subscription || `sub_fallback_${Date.now()}`;
      
      return {
        success,
        transactionId: session.payment_intent || `txn_stripe_${payload.sessionId}`,
        reference,
        amount: (session.amount_total || 0) / 100,
        currency: (session.currency || 'usd').toUpperCase()
      };
    } catch (error: any) {
      console.error('[Stripe Adapter] verifyPayment error:', error);
      return {
        success: false,
        transactionId: '',
        reference: '',
        amount: 0,
        currency: 'USD'
      };
    }
  }

  async cancelSubscription(reference: string): Promise<boolean> {
    const isSandbox = this.isSandbox();
    const secretKey = this.getSecretKey();

    if (isSandbox) {
      console.log(`[Stripe Sandbox] Cancelling simulated subscription: ${reference}`);
      return true;
    }

    try {
      const response = await fetch(`https://api.stripe.com/v1/subscriptions/${reference}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${secretKey}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('[Stripe Adapter] cancelSubscription error:', error);
      return false;
    }
  }

  async refund(transactionId: string, amount: number): Promise<boolean> {
    const isSandbox = this.isSandbox();
    const secretKey = this.getSecretKey();

    if (isSandbox) {
      console.log(`[Stripe Sandbox] Refunding simulated transaction ${transactionId} for amount $${amount}`);
      return true;
    }

    try {
      const params = new URLSearchParams();
      if (transactionId.startsWith('pi_')) {
        params.append('payment_intent', transactionId);
      } else {
        params.append('charge', transactionId);
      }
      params.append('amount', Math.round(amount * 100).toString());

      const response = await fetch('https://api.stripe.com/v1/refunds', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      return response.ok;
    } catch (error) {
      console.error('[Stripe Adapter] refund error:', error);
      return false;
    }
  }
}
