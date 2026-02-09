export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  description?: string;
  created: number;
  balance?: number;
  currency?: string;
  delinquent?: boolean;
  metadata?: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'paused';
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at?: number;
  created: number;
  items: {
    data: StripeSubscriptionItem[];
  };
  metadata?: Record<string, string>;
  trial_start?: number;
  trial_end?: number;
}

export interface StripeSubscriptionItem {
  id: string;
  price: StripePrice;
  quantity: number;
}

export interface StripePrice {
  id: string;
  product: string | StripeProduct;
  active: boolean;
  currency: string;
  unit_amount: number;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number;
  };
  type: 'one_time' | 'recurring';
  metadata?: Record<string, string>;
}

export interface StripeProduct {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  created: number;
  images?: string[];
  metadata?: Record<string, string>;
  features?: string[];
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status:
    | 'requires_payment_method'
    | 'requires_confirmation'
    | 'requires_action'
    | 'processing'
    | 'requires_capture'
    | 'canceled'
    | 'succeeded';
  customer?: string;
  description?: string;
  created: number;
  metadata?: Record<string, string>;
  client_secret?: string;
}

export interface StripeInvoice {
  id: string;
  customer: string;
  subscription?: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  currency: string;
  created: number;
  due_date?: number;
  hosted_invoice_url?: string;
  invoice_pdf?: string;
  lines: {
    data: StripeInvoiceLineItem[];
  };
  metadata?: Record<string, string>;
}

export interface StripeInvoiceLineItem {
  id: string;
  amount: number;
  currency: string;
  description?: string;
  quantity?: number;
  price?: StripePrice;
}

export interface StripeCharge {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  customer?: string;
  description?: string;
  created: number;
  paid: boolean;
  refunded: boolean;
  metadata?: Record<string, string>;
}

export interface StripePaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'sepa_debit' | 'ideal' | 'alipay' | 'wechat_pay';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    country?: string;
  };
  billing_details?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      city?: string;
      country?: string;
      line1?: string;
      line2?: string;
      postal_code?: string;
      state?: string;
    };
  };
  created: number;
  customer?: string;
  metadata?: Record<string, string>;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
  livemode: boolean;
}

export interface StripeCheckoutSession {
  id: string;
  customer?: string;
  customer_email?: string;
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  status: 'complete' | 'expired' | 'open';
  mode: 'payment' | 'setup' | 'subscription';
  success_url?: string;
  cancel_url?: string;
  url?: string;
  amount_total?: number;
  currency?: string;
  metadata?: Record<string, string>;
  subscription?: string;
}

export interface StripePlan {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  interval: 'day' | 'week' | 'month' | 'year';
  interval_count: number;
  trial_period_days?: number;
  features?: string[];
  metadata?: Record<string, string>;
}

export interface StripeCredentials {
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
}

export interface StripeStats {
  totalCustomers: number;
  activeSubscriptions: number;
  revenue: {
    total: number;
    currency: string;
    thisMonth: number;
    lastMonth: number;
  };
  invoices: {
    paid: number;
    unpaid: number;
    total: number;
  };
}
