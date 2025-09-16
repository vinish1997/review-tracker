import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { aggregates as apiAggregates, searchReviews, overdueCount as apiOverdueCount } from "../api/reviews";
import { formatCurrencyINR as formatCurrency, formatInt } from "../utils/format";

export default function Dashboard() {
  const [totals, setTotals] = useState({ count: 0, totalAmount: 0, totalRefund: 0 });
  const [counts, setCounts] = useState({
    pendingReviewRating: null,
    pendingRefundForm: null,
    pendingPayment: null,
    overdue: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [aggRes, c1, c2, c3, oc] = await Promise.all([
          apiAggregates({}),
          // Use search endpoint to fetch counts via totalElements (request minimal page size)
          searchReviews({ statusIn: ["ordered", "delivered"] }, { page: 0, size: 1, sort: "createdAt", dir: "DESC" }),
          searchReviews({ statusIn: ["review submitted", "review accepted", "rating submitted"] }, { page: 0, size: 1, sort: "createdAt", dir: "DESC" }),
          searchReviews({ statusIn: ["refund form submitted"] }, { page: 0, size: 1, sort: "createdAt", dir: "DESC" }),
          apiOverdueCount(),
        ]);
        if (cancelled) return;
        setTotals({
          count: Number(aggRes.data?.count ?? 0),
          totalAmount: Number(aggRes.data?.totalAmount ?? 0),
          totalRefund: Number(aggRes.data?.totalRefund ?? 0),
        });
        setCounts({
          pendingReviewRating: Number(c1.data?.totalElements ?? 0),
          pendingRefundForm: Number(c2.data?.totalElements ?? 0),
          pendingPayment: Number(c3.data?.totalElements ?? 0),
          overdue: Number(oc.data?.overdue ?? 0),
        });
      } catch (e) {
        // Soft-fail: keep UI visible with zeros
        setCounts({ pendingReviewRating: null, pendingRefundForm: null, pendingPayment: null, overdue: null });
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const Card = ({ title, value, to, accent = "indigo" }) => (
    <Link to={to} className={`block rounded-lg border p-4 hover:shadow transition bg-white border-${accent}-100`}>
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value == null ? "—" : formatInt(value)}</div>
      <div className={`mt-2 text-xs text-${accent}-700`}>View details →</div>
    </Link>
  );

  const Stat = ({ label, value, fmt = (v)=>v }) => (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-semibold">{fmt(value)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Pending Review/Rating" value={counts.pendingReviewRating} to="/reviews?preset=pending-review-rating" accent="blue" />
        <Card title="Pending Refund Form" value={counts.pendingRefundForm} to="/reviews?preset=pending-refund-form" accent="amber" />
        <Card title="Pending Payment" value={counts.pendingPayment} to="/reviews?preset=pending-payment" accent="emerald" />
        <Card title="Overdue" value={counts.overdue} to="/reviews?preset=overdue" accent="rose" />
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Total Reviews" value={totals.count} fmt={formatInt} />
        <Stat label="Total Amount" value={totals.totalAmount} fmt={formatCurrency} />
        <Stat label="Total Refund" value={totals.totalRefund} fmt={formatCurrency} />
      </section>

      {loading && (
        <div className="text-sm text-gray-500">Loading metrics…</div>
      )}
    </div>
  );
}
