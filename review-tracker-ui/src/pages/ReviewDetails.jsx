import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getReview } from "../api/reviews";
import axios from "axios";

export default function ReviewDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [history, setHistory] = useState(null);

  useEffect(() => {
    getReview(id).then(res => setReview(res.data));
  }, [id]);

  const loadHistory = async () => {
    const res = await axios.get(`/api/reviews/${id}/history`);
    setHistory(res.data);
  };

  if (!review) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Review Details</h2>
        <div className="space-x-2">
          <button className="px-3 py-1 border rounded" onClick={()=> navigate(-1)}>Back</button>
          <button className="px-3 py-1 bg-yellow-500 text-white rounded" onClick={()=> navigate(`/reviews/edit/${id}`)}>Edit</button>
          <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={loadHistory}>View History</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded shadow">
        <Field label="Order ID" value={review.orderId} />
        <Field label="Product" value={review.productName} />
        <Field label="Deal Type" value={review.dealType} />
        <Field label="Status" value={review.status} />
        <Field label="Platform" value={review.platformId} />
        <Field label="Mediator" value={review.mediatorId} />
        <Field label="Amount" value={review.amountRupees} />
        <Field label="Less" value={review.lessRupees} />
        <Field label="Refund" value={review.refundAmountRupees} />
        <Field label="Ordered" value={review.orderedDate} />
        <Field label="Delivered" value={review.deliveryDate} />
        <Field label="Review Submitted" value={review.reviewSubmitDate} />
        <Field label="Review Accepted" value={review.reviewAcceptedDate} />
        <Field label="Rating Submitted" value={review.ratingSubmittedDate} />
        <Field label="Refund Form" value={review.refundFormSubmittedDate} />
        <Field label="Payment Received" value={review.paymentReceivedDate} />
      </div>

      {history && (
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-xl font-semibold mb-2">History</h3>
          {history.length === 0 && <div className="text-sm text-gray-500">No history.</div>}
          {history.map((h) => (
            <div key={h.id} className="border-b py-2">
              <div className="text-sm text-gray-600">{(h.type || 'CHANGE').toUpperCase()} • {h.at ? new Date(h.at).toLocaleString() : ''}</div>
              {h.note && <div className="text-sm">{h.note}</div>}
              {h.changes && h.changes.length > 0 && (
                <table className="mt-2 text-sm w-full">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="pr-4">Field</th>
                      <th className="pr-4">Old</th>
                      <th>New</th>
                    </tr>
                  </thead>
                  <tbody>
                    {h.changes.map((c, idx) => (
                      <tr key={idx}>
                        <td className="pr-4">{c.field}</td>
                        <td className="pr-4">{String(c.oldVal ?? '')}</td>
                        <td>{String(c.newVal ?? '')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className="font-medium">{value ?? '-'}</div>
    </div>
  );
}
