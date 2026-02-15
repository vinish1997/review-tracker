import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../api/reviews";
import {
  ArrowTrendingUpIcon,
  CurrencyRupeeIcon,
  ClipboardDocumentCheckIcon,
  ExclamationCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  BanknotesIcon
} from "@heroicons/react/24/outline";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await getDashboardStats();
        if (!cancelled) setStats(res.data);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!stats) return <div className="p-6 text-center text-gray-500">Failed to load dashboard data.</div>;

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of your review tracking performance.</p>
      </header>

      {/* Action Center - Urgent Tasks */}
      {stats.actionItems && stats.actionItems.length > 0 && (
        <section className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
          <div className="bg-orange-50 px-4 py-3 border-b border-orange-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-orange-800 flex items-center gap-2">
              <ExclamationCircleIcon className="w-5 h-5" /> Action Required
            </h2>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">{stats.actionItems.length} tasks</span>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.actionItems.map(item => (
              <Link key={item.id} to={item.link} className="block px-4 py-3 hover:bg-gray-50 transition flex items-center justify-between group">
                <div className="text-sm text-gray-700">{item.message}</div>
                <div className="text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">Take Action →</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Key Metrics Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="Pending Review"
          value={stats.pendingReviewRating}
          icon={<ClipboardDocumentCheckIcon className="w-5 h-5 text-blue-600" />}
          color="blue"
          to="/reviews?preset=pending-review-rating"
        />
        <MetricCard
          title="Pending Refund"
          value={stats.pendingRefundForm}
          icon={<ArrowTrendingUpIcon className="w-5 h-5 text-amber-600" />}
          color="amber"
          to="/reviews?preset=pending-refund-form"
        />
        <MetricCard
          title="Pending Payment"
          value={stats.pendingPayment}
          icon={<CurrencyRupeeIcon className="w-5 h-5 text-emerald-600" />}
          color="emerald"
          to="/reviews?preset=pending-payment"
        />
        <MetricCard
          title="Overdue"
          value={stats.overdue}
          icon={<ClockIcon className="w-5 h-5 text-rose-600" />}
          color="rose"
          to="/reviews?preset=overdue"
        />
      </section>

      {/* Financial Summary */}
      <section className="bg-gradient-to-br from-indigo-900 to-purple-800 rounded-xl text-white p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-6 opacity-90">
          <BanknotesIcon className="w-6 h-6" />
          <h2 className="text-lg font-semibold">Financial Overview</h2>
        </div>
        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
          <div>
            <div className="text-xs text-indigo-200 mb-1 uppercase tracking-wider">Total Spent</div>
            <div className="text-2xl font-light">{formatCurrency(stats.totalSpent)}</div>
          </div>
          <div>
            <div className="text-xs text-indigo-200 mb-1 uppercase tracking-wider">Total Refunded</div>
            <div className="text-2xl font-light text-green-300">+{formatCurrency(stats.totalRefunded)}</div>
          </div>
          <div>
            <div className="text-xs text-indigo-200 mb-1 uppercase tracking-wider">Net Cost</div>
            <div className="text-2xl font-bold">{formatCurrency(stats.netCost)}</div>
          </div>
          <div>
            <div className="text-xs text-indigo-200 mb-1 uppercase tracking-wider">Pending Refund</div>
            <div className="text-xl font-medium text-amber-300">{formatCurrency(stats.pendingRefundAmount)}</div>
          </div>
        </div>
      </section>

      {/* Quick Links / Navigation Helper */}
      <section className="grid grid-cols-2 gap-3">
        <Link to="/reviews/new" className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-indigo-300 hover:shadow-md transition text-center">
          <div className="text-indigo-600 font-medium mb-1">+ Add Review</div>
          <div className="text-xs text-gray-500">Track a new order</div>
        </Link>
        <Link to="/notifications" className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-indigo-300 hover:shadow-md transition text-center">
          <div className="text-gray-700 font-medium mb-1">Notifications</div>
          <div className="text-xs text-gray-500">Check alerts</div>
        </Link>
      </section>
    </div>
  );
}

function MetricCard({ title, value, icon, color, to }) {
  const colorStyles = {
    blue: "bg-blue-50 border-blue-100",
    amber: "bg-amber-50 border-amber-100",
    emerald: "bg-emerald-50 border-emerald-100",
    rose: "bg-rose-50 border-rose-100",
  };

  return (
    <Link to={to} className={`block p-4 rounded-xl border ${colorStyles[color]} hover:shadow-md transition active:scale-95`}>
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
      </div>
      <div className="text-xs font-medium text-gray-600">{title}</div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="h-48 bg-gray-200 rounded-xl" />
    </div>
  );
}

function formatCurrency(val) {
  return "₹" + Number(val || 0).toLocaleString('en-IN');
}
