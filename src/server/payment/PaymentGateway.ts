import { PaymentProvider, PaymentInitParams, PaymentInitResult, PaymentVerifyResult } from './types';
import { PaystackProvider } from './PaystackProvider';

export class PaymentGateway {
  private providers: Map<string, PaymentProvider> = new Map();
  private defaultProvider: string = 'PAYSTACK';

  constructor() {
    this.registerProvider(new PaystackProvider());
  }

  registerProvider(provider: PaymentProvider) {
    this.providers.set(provider.name.toUpperCase(), provider);
  }

  getProvider(name?: string): PaymentProvider {
    const key = (name || this.defaultProvider).toUpperCase();
    const provider = this.providers.get(key);
    if (!provider) {
      throw new Error(`Unsupported payment provider: ${name}`);
    }
    return provider;
  }

  async initializePayment(providerName: string | undefined, params: PaymentInitParams): Promise<PaymentInitResult> {
    const provider = this.getProvider(providerName);
    return provider.initializePayment(params);
  }

  async verifyPayment(providerName: string | undefined, reference: string): Promise<PaymentVerifyResult> {
    const provider = this.getProvider(providerName);
    return provider.verifyPayment(reference);
  }

  verifyWebhookSignature(providerName: string, signature: string, rawBody: string | Buffer): boolean {
    const provider = this.getProvider(providerName);
    return provider.verifyWebhookSignature(signature, rawBody);
  }
}

export const paymentGateway = new PaymentGateway();
