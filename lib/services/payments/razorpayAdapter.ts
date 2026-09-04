import { PaymentProvider } from "./paymentAdapter";
import crypto from "crypto";

export class RazorpayAdapter implements PaymentProvider {
  private getKeys(): { keyId: string; keySecret: string } | null {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return null;
    return { keyId, keySecret };
  }

  private isSandbox(): boolean {
    return !this.getKeys();
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
    const keys = this.getKeys();

    // Amount conversion (INR to paise for Razorpay)
    const convertedAmount = currency.toUpperCase() === 'INR' ? amount : amount * 80; // approximate conversions if USD
    const amountInPaise = Math.round(convertedAmount * 100);

    if (isSandbox) {
      console.log(`[Razorpay Sandbox] Creating simulated order for user ${userId}, plan ${planId}`);
      const mockOrderId = `order_test_${Math.random().toString(36).substring(2, 15)}`;
      const checkoutUrl = `/dashboard/subscription/checkout-sim?provider=razorpay&orderId=${mockOrderId}&planId=${planId}&amount=${convertedAmount}&currency=INR`;

      return {
        id: mockOrderId,
        checkoutUrl,
        provider: 'razorpay',
        amount: convertedAmount,
        currency: 'INR',
        isSandbox: true
      };
    }

    try {
      const basicAuth = Buffer.from(`${keys!.keyId}:${keys!.keySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `receipt_${userId.substring(0, 8)}_${Date.now().toString().slice(-6)}`,
          notes: {
            userId,
            planId
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || 'Failed to create Razorpay order');
      }

      const order = await response.json();
      return {
        id: order.id,
        provider: 'razorpay',
        amount: order.amount / 100,
        currency: order.currency,
        isSandbox: false
      };
    } catch (error: any) {
      console.error('[Razorpay Adapter] createOrder error:', error);
      throw error;
    }
  }

  async verifyPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<{
    success: boolean;
    transactionId: string;
    reference: string;
    amount: number;
    currency: string;
  }> {
    const isSandbox = this.isSandbox();
    const keys = this.getKeys();

    if (isSandbox) {
      console.log(`[Razorpay Sandbox] Verifying simulated order signature for ${payload.razorpay_order_id}`);
      return {
        success: true,
        transactionId: payload.razorpay_payment_id || `pay_test_${Math.random().toString(36).substring(2, 10)}`,
        reference: payload.razorpay_order_id,
        amount: 9.99, // default simulation amount
        currency: 'INR'
      };
    }

    try {
      // 1. Verify cryptographic signature
      const text = `${payload.razorpay_order_id}|${payload.razorpay_payment_id}`;
      const generatedSignature = crypto
        .createHmac('sha256', keys!.keySecret)
        .update(text)
        .digest('hex');

      const success = generatedSignature === payload.razorpay_signature;

      if (!success) {
        throw new Error('Razorpay signature verification failed');
      }

      // 2. Fetch payment details from Razorpay to get the exact amount
      const basicAuth = Buffer.from(`${keys!.keyId}:${keys!.keySecret}`).toString('base64');
      const response = await fetch(`https://api.razorpay.com/v1/payments/${payload.razorpay_payment_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${basicAuth}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve Razorpay payment details');
      }

      const payment = await response.json();

      return {
        success: true,
        transactionId: payload.razorpay_payment_id,
        reference: payload.razorpay_order_id,
        amount: payment.amount / 100,
        currency: payment.currency
      };
    } catch (error: any) {
      console.error('[Razorpay Adapter] verifyPayment error:', error);
      return {
        success: false,
        transactionId: '',
        reference: '',
        amount: 0,
        currency: 'INR'
      };
    }
  }

  async cancelSubscription(reference: string): Promise<boolean> {
    const isSandbox = this.isSandbox();
    const keys = this.getKeys();

    if (isSandbox) {
      console.log(`[Razorpay Sandbox] Cancelling simulated subscription: ${reference}`);
      return true;
    }

    try {
      const basicAuth = Buffer.from(`${keys!.keyId}:${keys!.keySecret}`).toString('base64');
      const response = await fetch(`https://api.razorpay.com/v1/subscriptions/${reference}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cancel_at_cycle_end: true
        })
      });

      return response.ok;
    } catch (error) {
      console.error('[Razorpay Adapter] cancelSubscription error:', error);
      return false;
    }
  }

  async refund(transactionId: string, amount: number): Promise<boolean> {
    const isSandbox = this.isSandbox();
    const keys = this.getKeys();

    if (isSandbox) {
      console.log(`[Razorpay Sandbox] Refunding simulated payment ${transactionId} for INR ${amount}`);
      return true;
    }

    try {
      const basicAuth = Buffer.from(`${keys!.keyId}:${keys!.keySecret}`).toString('base64');
      const response = await fetch(`https://api.razorpay.com/v1/payments/${transactionId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100) // Convert back to paise
        })
      });

      return response.ok;
    } catch (error) {
      console.error('[Razorpay Adapter] refund error:', error);
      return false;
    }
  }
}
