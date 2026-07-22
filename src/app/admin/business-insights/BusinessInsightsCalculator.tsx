'use client';

import { useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/utils';

export default function BusinessInsightsCalculator() {
  const [costPrice, setCostPrice] = useState(400);
  const [sellingPrice, setSellingPrice] = useState(799);
  const [discount, setDiscount] = useState(50);
  const [shippingCost, setShippingCost] = useState(40);
  const [gatewayFeePercent, setGatewayFeePercent] = useState(2);
  const [fixedCosts, setFixedCosts] = useState(10000);

  const metrics = useMemo(() => {
    const netSale = Math.max(sellingPrice - discount, 0);
    const gatewayFee = (netSale * gatewayFeePercent) / 100;
    const profitPerProduct = netSale - costPrice - gatewayFee;
    const profitPerOrder = profitPerProduct - shippingCost;
    const profitPercentage = netSale > 0 ? (profitPerOrder / netSale) * 100 : 0;
    const breakEvenUnits = profitPerOrder > 0 ? Math.ceil(fixedCosts / profitPerOrder) : 0;

    return {
      netSale,
      gatewayFee,
      profitPerProduct,
      profitPerOrder,
      profitPercentage,
      breakEvenUnits,
    };
  }, [costPrice, sellingPrice, discount, shippingCost, gatewayFeePercent, fixedCosts]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Profit Inputs</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">
              Cost Price (?)
              <input type="number" value={costPrice} onChange={(e) => setCostPrice(Number(e.target.value))} className="mt-1" />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Selling Price (?)
              <input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(Number(e.target.value))} className="mt-1" />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Discount (?)
              <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="mt-1" />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Shipping Cost (?)
              <input type="number" value={shippingCost} onChange={(e) => setShippingCost(Number(e.target.value))} className="mt-1" />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Gateway Fees (%)
              <input type="number" value={gatewayFeePercent} onChange={(e) => setGatewayFeePercent(Number(e.target.value))} className="mt-1" />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Fixed Monthly Costs (?)
              <input type="number" value={fixedCosts} onChange={(e) => setFixedCosts(Number(e.target.value))} className="mt-1" />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Profit Summary</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs text-slate-500">Net Sale</p>
              <p className="text-lg font-semibold text-slate-900">{formatCurrency(metrics.netSale)}</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs text-slate-500">Gateway Fees</p>
              <p className="text-lg font-semibold text-slate-900">{formatCurrency(metrics.gatewayFee)}</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs text-slate-500">Profit per Product</p>
              <p className="text-lg font-semibold text-slate-900">{formatCurrency(metrics.profitPerProduct)}</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs text-slate-500">Profit per Order</p>
              <p className="text-lg font-semibold text-slate-900">{formatCurrency(metrics.profitPerOrder)}</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs text-slate-500">Profit Percentage</p>
              <p className="text-lg font-semibold text-slate-900">{metrics.profitPercentage.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs text-slate-500">Break-even Units</p>
              <p className="text-lg font-semibold text-slate-900">{metrics.breakEvenUnits}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">Use this calculator to estimate profit per product and per order.</p>
        </div>
      </div>
    </div>
  );
}

