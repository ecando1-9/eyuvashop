import { Download, FileText } from 'lucide-react';

const reports = [
  { title: 'Orders CSV', description: 'Export all orders with status and totals.' },
  { title: 'Customers CSV', description: 'Download customer list with order counts.' },
  { title: 'Revenue Report', description: 'Monthly revenue breakdown and growth.' },
  { title: 'Product Performance', description: 'Best sellers and stock velocity.' },
];

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Reports</p>
        <h1 className="text-2xl font-semibold text-slate-900">Reports & Exports</h1>
        <p className="text-sm text-slate-500 mt-1">Generate and export operational reports.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((report) => (
          <div key={report.title} className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{report.title}</p>
                <p className="text-xs text-slate-500 mt-1">{report.description}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <FileText size={16} />
              </div>
            </div>
            <button className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-orange-600">
              <Download size={14} /> Export
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

