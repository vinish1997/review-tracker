import { useCallback, useEffect, useState } from "react";
import { searchReviews } from "../api/reviews";

export default function Archive() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await searchReviews({ status: 'payment received' }, { page: 0, size: 100, sort: 'paymentReceivedDate', dir: 'DESC' });
    setItems(res.data.content || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Archive (Payment Received)</h2>
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

