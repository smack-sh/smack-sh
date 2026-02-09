import { useState } from 'react';
import { useLoaderData } from '@remix-run/react';
import { json, type LoaderFunctionArgs } from '@remix-run/node';

export async function loader({ request }: LoaderFunctionArgs) {
  // Note: Auth should be handled at route level for Electron builds

  // Mock data - in real app, fetch from Stripe/payment provider
  const transactions = [
    {
      id: 'txn_1',
      type: 'payment',
      amount: 29.99,
      currency: 'USD',
      status: 'completed',
      description: 'Starter Plan - 100 Credits',
      date: '2024-10-15T14:30:00Z',
      paymentMethod: 'card_ending_4242',
      invoiceUrl: '/invoices/inv_1',
    },
    {
      id: 'txn_2',
      type: 'refund',
      amount: -9.99,
      currency: 'USD',
      status: 'completed',
      description: 'Refund - Unused Credits',
      date: '2024-10-10T09:15:00Z',
      paymentMethod: 'card_ending_4242',
      invoiceUrl: '/invoices/inv_2',
    },
    {
      id: 'txn_3',
      type: 'payment',
      amount: 99.99,
      currency: 'USD',
      status: 'pending',
      description: 'Pro Plan - 500 Credits',
      date: '2024-10-08T16:45:00Z',
      paymentMethod: 'card_ending_5555',
      invoiceUrl: '/invoices/inv_3',
    },
  ];

  const creditBalance = {
    total: 350,
    used: 150,
    remaining: 200,
  };

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 9.99,
      credits: 100,
      features: ['100 Credits', 'Basic Support', 'Email Support'],
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29.99,
      credits: 350,
      features: ['350 Credits', 'Priority Support', 'Chat Support', 'Advanced Features'],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99.99,
      credits: 1000,
      features: ['1000 Credits', '24/7 Support', 'Dedicated Manager', 'Custom Solutions'],
      popular: false,
    },
  ];

  return json({ transactions, creditBalance, plans });
}

export function PaymentProcessor() {
  const { transactions, creditBalance, plans } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<'plans' | 'transactions' | 'balance'>('plans');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment & Billing</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage your subscriptions and payment methods</p>
        </div>
        <button
          onClick={() => setIsUpgradeModalOpen(true)}
          className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
        >
          Upgrade Plan
        </button>
      </div>

      {/* Credit Balance Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Credit Balance</h3>
          <span className="px-3 py-1 bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 rounded-full text-sm">
            Active Plan: Pro
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{creditBalance.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Credits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{creditBalance.used}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Used Credits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{creditBalance.remaining}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Remaining Credits</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-accent-600 h-2 rounded-full transition-all"
              style={{ width: `${(creditBalance.used / creditBalance.total) * 100}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {Math.round((creditBalance.used / creditBalance.total) * 100)}% used
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'plans', label: 'Plans & Pricing', icon: '💳' },
            { id: 'transactions', label: 'Transaction History', icon: '📋' },
            { id: 'balance', label: 'Credit Usage', icon: '📊' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-accent-500 text-accent-600 dark:text-accent-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'plans' && <PlansTab plans={plans} />}
        {activeTab === 'transactions' && <TransactionsTab transactions={transactions} />}
        {activeTab === 'balance' && <BalanceTab creditBalance={creditBalance} />}
      </div>

      {/* Upgrade Modal */}
      {isUpgradeModalOpen && <UpgradeModal plans={plans} onClose={() => setIsUpgradeModalOpen(false)} />}
    </div>
  );
}

function PlansTab({ plans }: { plans: any[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative p-6 rounded-lg border-2 transition-all ${
              plan.popular
                ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="px-3 py-1 bg-accent-500 text-white text-xs rounded-full">Most Popular</span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">${plan.price}</span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="text-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">{plan.credits}</span>
                <span className="text-gray-600 dark:text-gray-400"> Credits</span>
              </div>
              {plan.features.map((feature: string, index: number) => (
                <div key={index} className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                </div>
              ))}
            </div>

            <button
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                plan.popular
                  ? 'bg-accent-600 text-white hover:bg-accent-700'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {plan.id === 'enterprise' ? 'Contact Sales' : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionsTab({ transactions }: { transactions: any[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return '💳';
      case 'refund':
        return '↩️';
      case 'subscription':
        return '🔄';
      default:
        return '📄';
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white">Transaction History</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-2xl">{getTypeIcon(transaction.type)}</div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(transaction.date).toLocaleDateString()} • {transaction.paymentMethod}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-lg font-semibold ${
                    transaction.amount > 0 ? 'text-gray-900 dark:text-white' : 'text-green-600'
                  }`}
                >
                  {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount)}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                  {transaction.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BalanceTab({ creditBalance }: { creditBalance: any }) {
  const usageData = [
    { date: '2024-10-15', used: 25, category: 'AI Code Review' },
    { date: '2024-10-14', used: 45, category: 'Project Generation' },
    { date: '2024-10-13', used: 30, category: 'Code Translation' },
    { date: '2024-10-12', used: 20, category: 'Terminal Commands' },
    { date: '2024-10-11', used: 30, category: 'AI Chat' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Credit Usage Over Time</h3>
        <div className="space-y-3">
          {usageData.map((usage, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{usage.category}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{usage.date}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-white">{usage.used} credits</p>
                <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                  <div
                    className="bg-accent-600 h-2 rounded-full"
                    style={{ width: `${(usage.used / 50) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UpgradeModal({ plans, onClose }: { plans: any[]; onClose: () => void }) {
  const [selectedPlan, setSelectedPlan] = useState(plans[1]); // Default to Pro

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Upgrade Your Plan</h3>
        <div className="space-y-4 mb-6">
          {plans.map((plan) => (
            <label
              key={plan.id}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedPlan.id === plan.id
                  ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="plan"
                value={plan.id}
                checked={selectedPlan.id === plan.id}
                onChange={() => setSelectedPlan(plan)}
                className="mr-3 text-accent-600 focus:ring-accent-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">{plan.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {plan.credits} credits • ${plan.price}/month
                </div>
              </div>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Cancel
          </button>
          <button className="px-4 py-2 bg-accent-600 text-white text-sm font-medium rounded-md hover:bg-accent-700">
            Upgrade to {selectedPlan.name}
          </button>
        </div>
      </div>
    </div>
  );
}
