export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Settings</p>
        <h1 className="text-2xl font-semibold text-slate-900">Settings & Access</h1>
        <p className="text-sm text-slate-500 mt-1">Manage store preferences, security, and roles.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Store Settings</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Store Name</label>
              <input defaultValue="eYuvaShop" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Support Email</label>
              <input defaultValue="support@eyuvashop.com" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Default Currency</label>
              <select defaultValue="INR" className="mt-1">
                <option value="INR">INR (?)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>
          </div>
          <button className="mt-2 inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold bg-orange-500 text-white">Save Settings</button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Security & Roles</h2>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Role-based access control</span>
              <span className="text-xs font-semibold text-emerald-600">Enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Two-factor authentication</span>
              <span className="text-xs font-semibold text-slate-400">Planned</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Admin activity logs</span>
              <span className="text-xs font-semibold text-emerald-600">Active</span>
            </div>
          </div>
          <button className="mt-2 inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold border border-slate-200 text-slate-700">Manage Roles</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Activity Logs</h2>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>Admin logged in</span>
            <span className="text-xs text-slate-400">Today</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Product pricing updated</span>
            <span className="text-xs text-slate-400">Yesterday</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Coupon created</span>
            <span className="text-xs text-slate-400">2 days ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}

