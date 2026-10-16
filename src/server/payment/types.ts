export interface PaymentInitParams {
  amount: number; // In main currency unit (e.g., 150000 NGN)
  currency: string;
  email: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentInitResult {
  success: boolean;
  reference: string;
  authorizationUrl?: string;
  accessCode?: string;
  provider: string;
  isTestMode: boolean;
  message?: string;
}

export interface PaymentVerifyResult {
  success: boolean;
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  amount: number; // In main currency unit
  currency: string;
  reference: string;
  provider: string;
  channel?: string;
  gatewayResponse?: string;
  paidAt?: string;
  isTestMode: boolean;
  raw?: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  initializePayment(params: PaymentInitParams): Promise<PaymentInitResult>;
  verifyPayment(reference: string): Promise<PaymentVerifyResult>;
  verifyWebhookSignature(signature: string, rawBody: string | Buffer): boolean;
}
