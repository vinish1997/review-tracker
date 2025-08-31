import { useCallback, useEffect, useState } from "react";
import { searchReviews } from "../api/reviews";

export default function Archive() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [platformId, setPlatformId] = useState("");
  const [mediatorId, setMediatorId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await searchReviews({ status: 'payment received', platformId: platformId || undefined, mediatorId: mediatorId || undefined, productNameContains: search || undefined, orderIdContains: search || undefined }, { page, size, sort: 'paymentReceivedDate', dir: 'DESC' });
    setItems(res.data.content || []);
    setTotalPages(res.data.totalPages || 0);
    setLoading(false);
  }, [page, size, search, platformId, mediatorId]);

  useEffect(() => { load(); }, [load]);

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
          <input value={platformId} onChange={(e)=> { setPlatformId(e.target.value); setPage(0);} } className="border p-2 rounded" placeholder="Platform ID" />
        </div>
        <div>
          <label className="block text-sm font-medium">Mediator</label>
          <input value={mediatorId} onChange={(e)=> { setMediatorId(e.target.value); setPage(0);} } className="border p-2 rounded" placeholder="Mediator ID" />
        </div>
        <div className="ml-auto flex items-center gap-2">
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
            <th className="p-2 border">Amount</th>
            <th className="p-2 border">Refund</th>
            <th className="p-2 border">Payment Date</th>
          </tr>
        </thead>
        <tbody>
          {items.map(i => (
            <tr key={i.id} className="border-b">
              <td className="p-2">{i.orderId}</td>
              <td className="p-2">{i.productName}</td>
              <td className="p-2">₹{i.amountRupees}</td>
              <td className="p-2">₹{i.refundAmountRupees}</td>
              <td className="p-2">{i.paymentReceivedDate || '-'}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td className="p-2" colSpan="5">No archived reviews.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
