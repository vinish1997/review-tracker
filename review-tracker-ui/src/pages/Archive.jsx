import { useCallback, useEffect, useMemo, useState } from "react";
import { searchReviews } from "../api/reviews";
import { getPlatforms, getMediators } from "../api/lookups";
import { useNavigate } from "react-router-dom";
import { EyeIcon } from "@heroicons/react/24/outline";

export default function Archive() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [platformId, setPlatformId] = useState("");
  const [mediatorId, setMediatorId] = useState("");
  const [platforms, setPlatforms] = useState([]);
  const [mediators, setMediators] = useState([]);
  const [platformMap, setPlatformMap] = useState({});
  const [mediatorMap, setMediatorMap] = useState({});
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await searchReviews({ status: 'payment received', platformId: platformId || undefined, mediatorId: mediatorId || undefined, productNameContains: search || undefined, orderIdContains: search || undefined }, { page, size, sort: 'paymentReceivedDate', dir: 'DESC' });
    setItems(res.data.content || []);
    setTotalPages(res.data.totalPages || 0);
    setLoading(false);
  }, [page, size, search, platformId, mediatorId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    Promise.all([getPlatforms(), getMediators()]).then(([p, m]) => {
      const pItems = p.data || [];
      const mItems = m.data || [];
      setPlatforms(pItems);
      setMediators(mItems);
      setPlatformMap(Object.fromEntries(pItems.map(x=>[x.id, x.name])));
      setMediatorMap(Object.fromEntries(mItems.map(x=>[x.id, x.name])));
    });
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Archive (Payment Received)</h2>
      <div className="flex items-end gap-3 mb-3">
        <div>
          <label className="block text-sm font-medium">Quick Search</label>
          <input value={search} onChange={(e)=> { setSearch(e.target.value); setPage(0);} } className="border p-2 rounded" placeholder="Product or Order" />
        </div>
        <div>
          <label className="block text-sm font-medium">Platform</label>
          <select value={platformId} onChange={(e)=> { setPlatformId(e.target.value); setPage(0);} } className="border p-2 rounded min-w-48">
            <option value="">All</option>
            {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Mediator</label>
          <select value={mediatorId} onChange={(e)=> { setMediatorId(e.target.value); setPage(0);} } className="border p-2 rounded min-w-48">
            <option value="">All</option>
            {mediators.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={()=> exportCsv(items, platformMap, mediatorMap)} className="px-3 py-1 border rounded">Export CSV</button>
          <button disabled={page<=0} onClick={()=> setPage(p=>p-1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <button disabled={page>=totalPages-1} onClick={()=> setPage(p=>p+1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          <select value={size} onChange={(e)=> { setSize(Number(e.target.value)); setPage(0);} } className="px-2 py-1 border rounded">
            {[20,50,100].map(n => <option key={n} value={n}>{n}/page</option>)}
          </select>
        </div>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2 border">Order ID</th>
            <th className="p-2 border">Product</th>
            <th className="p-2 border">Platform</th>
            <th className="p-2 border">Mediator</th>
            <th className="p-2 border">Amount</th>
            <th className="p-2 border">Refund</th>
            <th className="p-2 border">Payment Date</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(i => (
            <tr key={i.id} className="border-b">
              <td className="p-2">{i.orderId}</td>
              <td className="p-2">{i.productName}</td>
              <td className="p-2">{platformMap[i.platformId] || i.platformId}</td>
              <td className="p-2">{mediatorMap[i.mediatorId] || i.mediatorId}</td>
              <td className="p-2">₹{i.amountRupees}</td>
              <td className="p-2">₹{i.refundAmountRupees}</td>
              <td className="p-2">{i.paymentReceivedDate || '-'}</td>
              <td className="p-2">
                <button onClick={()=> navigate(`/reviews/view/${i.id}`)} className="px-2 py-1 border rounded inline-flex items-center gap-1">
                  <EyeIcon className="w-4 h-4"/> Details
                </button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td className="p-2" colSpan="8">No archived reviews.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function exportCsv(items, platformMap, mediatorMap) {
  const header = ['orderId','productName','platform','mediator','amount','refund','paymentDate'];
  const rows = items.map(i => [
    i.orderId,
    i.productName,
    platformMap[i.platformId] || i.platformId || '',
    mediatorMap[i.mediatorId] || i.mediatorId || '',
    i.amountRupees ?? '',
    i.refundAmountRupees ?? '',
    i.paymentReceivedDate ?? ''
  ]);
  const csv = [header, ...rows].map(r => r.map(v => String(v).replaceAll('"','""')).map(v => /[,"]/.test(v) ? `"${v}"` : v).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'archive.csv';
  a.click();
  URL.revokeObjectURL(url);
}
