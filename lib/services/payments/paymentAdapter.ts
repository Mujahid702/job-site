export interface PaymentProvider {
  /**
   * Create an checkout order or session
   */
  createOrder(
    userId: string,
    planId: string,
    amount: number,
    currency: string
  ): Promise<{
    id: string; // Order or session ID
    checkoutUrl?: string; // Stripe URL
    clientSecret?: string; // For Stripe elements
    provider: 'stripe' | 'razorpay';
    amount: number;
    currency: string;
    isSandbox: boolean;
  }>;

  /**
   * Verify post-payment signatures or tokens
   */
  verifyPayment(
    payload: any
  ): Promise<{
    success: boolean;
    transactionId: string;
    reference: string;
    amount: number;
    currency: string;
  }>;

  /**
   * Cancel active subscription
   */
  cancelSubscription(reference: string): Promise<boolean>;

  /**
   * Refund an invoice or payment
   */
  refund(transactionId: string, amount: number): Promise<boolean>;
}
