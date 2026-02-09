import { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.STRIPE_PUBLIC_KEY!);

const creditPackages = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 100,
    price: 9.99,
    features: ['100 credits', 'Basic support', 'Email assistance'],
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 500,
    price: 39.99,
    features: ['500 credits', 'Priority support', 'Email & chat support', 'Faster response times'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 20000,
    price: 149.99,
    features: ['2000 credits', '24/7 support', 'Dedicated account manager', 'Custom solutions'],
  },
];

export function PurchaseCredits() {
  const [selectedPackage, setSelectedPackage] = useState(creditPackages[0].id);
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: creditPackages.find((pkg) => pkg.id === selectedPackage)?.priceId,
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Buy Credits</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Choose a package that fits your needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {creditPackages.map((pkg) => (
          <div
            key={pkg.id}
            onClick={() => setSelectedPackage(pkg.id)}
            className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
              selectedPackage === pkg.id
                ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-accent-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{pkg.name}</h3>
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-accent-100 text-accent-800 dark:bg-accent-900/50 dark:text-accent-100">
                {pkg.credits} credits
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ${pkg.price.toFixed(2)}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400"> / one-time</span>
              </p>
              <ul className="mt-4 space-y-2">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-center text-gray-600 dark:text-gray-300">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={handlePurchase}
          disabled={isLoading}
          className="px-8 py-3 text-lg font-medium text-white bg-accent-600 rounded-lg hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Purchase Now'}
        </button>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Secure payment powered by Stripe. No credit card required for trial.
        </p>
      </div>
    </div>
  );
}
