import BusinessInsightsCalculator from './BusinessInsightsCalculator';

export default function BusinessInsightsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Business Insights</p>
        <h1 className="text-2xl font-semibold text-slate-900">Profit & Margin Insights</h1>
        <p className="text-sm text-slate-500 mt-1">Calculate profitability, margin, and break-even points.</p>
      </div>

      <BusinessInsightsCalculator />
    </div>
  );
}

