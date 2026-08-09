'use client';

import { CreditCard, Smartphone, Building2, Wallet, ShieldCheck, Lock, Plus } from 'lucide-react';

const paymentMethods = [
  {
    id: 'upi',
    label: 'UPI',
    icon: Smartphone,
    description: 'Pay using any UPI app',
    color: 'bg-purple-50 text-purple-700',
    comingSoon: false,
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    icon: CreditCard,
    description: 'Visa, Mastercard, Rupay',
    color: 'bg-blue-50 text-blue-700',
    comingSoon: false,
  },
  {
    id: 'netbanking',
    label: 'Net Banking',
    icon: Building2,
    description: 'All major banks supported',
    color: 'bg-green-50 text-green-700',
    comingSoon: false,
  },
  {
    id: 'wallet',
    label: 'Wallets',
    icon: Wallet,
    description: 'Paytm, PhonePe, Amazon Pay',
    color: 'bg-yellow-50 text-yellow-700',
    comingSoon: true,
  },
];

export default function PaymentsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900">Payment Methods</h1>
        <p className="text-sm text-gray-400 mt-0.5">Accepted payment options at checkout</p>
      </div>

      {/* Security Notice */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-green-800">100% Secure Payments</p>
          <p className="text-xs text-green-600 mt-0.5">
            All transactions are encrypted and processed securely. We never store your card number or CVV.
          </p>
        </div>
      </div>

      {/* Accepted Payment Methods */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-sm">Accepted Payment Methods</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <div key={method.id} className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${method.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">{method.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{method.description}</p>
                </div>
                {method.comingSoon && (
                  <span className="text-[10px] font-bold bg-orange-50 text-[#FF6B00] border border-orange-200 px-2 py-1 rounded-full">
                    Soon
                  </span>
                )}
                {!method.comingSoon && (
                  <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full">
                    Available
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Saved Payment Methods Placeholder */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-extrabold text-gray-900 text-sm">Saved Payment Methods</h2>
          <button className="flex items-center gap-1.5 text-xs font-bold text-[#FF6B00] border border-orange-200 hover:bg-orange-50 px-3 py-2 rounded-xl transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-500 text-sm">No saved payment methods</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">
            Saved payment options will appear here after your first order. Payment data is handled securely via Razorpay.
          </p>
        </div>
      </div>

      {/* Razorpay Notice */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0">
          <CreditCard className="w-5 h-5 text-blue-600" />
        </div>
        <p className="text-xs text-gray-500">
          Payments are powered by <span className="font-bold text-gray-700">Razorpay</span>. Your payment details are never stored on eYuvaShop servers.
        </p>
      </div>
    </div>
  );
}
