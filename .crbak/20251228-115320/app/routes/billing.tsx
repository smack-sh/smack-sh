import { PaymentProcessor } from '~/features/payments/PaymentProcessor';

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-smack-elements-background-depth-1">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <PaymentProcessor />
      </div>
    </div>
  );
}
