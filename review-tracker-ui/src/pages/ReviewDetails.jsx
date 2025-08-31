import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getReview, updateReview } from "../api/reviews";
import { getPlatforms, getMediators } from "../api/lookups";
import axios from "axios";

export default function ReviewDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [history, setHistory] = useState(null);
  const [platformMap, setPlatformMap] = useState({});
  const [mediatorMap, setMediatorMap] = useState({});
  const [nextDate, setNextDate] = useState(null);

  useEffect(() => {
    getReview(id).then(res => setReview(res.data));
    Promise.all([getPlatforms(), getMediators()]).then(([p, m]) => {
      setPlatformMap(Object.fromEntries((p.data||[]).map(x=>[x.id, x.name])));
      setMediatorMap(Object.fromEntries((m.data||[]).map(x=>[x.id, x.name])));
    });
  }, [id]);

  const loadHistory = async () => {
    const res = await axios.get(`/api/reviews/${id}/history`);
    setHistory(res.data);
  };

  if (!review) return <p>Loading...</p>;

  const seq = (() => {
    const base = ['orderedDate','deliveryDate'];
    if ((review.dealType || 'REVIEW_SUBMISSION') === 'REVIEW_PUBLISHED') return [...base,'reviewSubmitDate','reviewAcceptedDate','refundFormSubmittedDate','paymentReceivedDate'];
    if ((review.dealType || 'REVIEW_SUBMISSION') === 'RATING_ONLY') return [...base,'ratingSubmittedDate','refundFormSubmittedDate','paymentReceivedDate'];
    return [...base,'reviewSubmitDate','refundFormSubmittedDate','paymentReceivedDate'];
  })();
  const nf = (() => {
    const r = review;
    if (!r.orderedDate) return 'orderedDate';
    if (!r.deliveryDate) return 'deliveryDate';
    if ((r.dealType||'REVIEW_SUBMISSION')==='REVIEW_PUBLISHED') {
      if (!r.reviewSubmitDate) return 'reviewSubmitDate';
      if (!r.reviewAcceptedDate) return 'reviewAcceptedDate';
    } else if ((r.dealType||'REVIEW_SUBMISSION')==='RATING_ONLY') {
      if (!r.ratingSubmittedDate) return 'ratingSubmittedDate';
    } else {
      if (!r.reviewSubmitDate) return 'reviewSubmitDate';
    }
    if (!r.refundFormSubmittedDate) return 'refundFormSubmittedDate';
    if (!r.paymentReceivedDate) return 'paymentReceivedDate';
    return null;
  })();

  const saveNext = async () => {
    if (!nf || !nextDate) return;
    const payload = { ...review, [nf]: nextDate };
    const idx = seq.indexOf(nf);
    seq.slice(idx+1).forEach(k => payload[k] = null);
    const res = await updateReview(review.id, payload);
    setReview(res.data);
    setNextDate(null);
  };

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
        <Field label="Platform" value={platformMap[review.platformId] || review.platformId} />
        <Field label="Mediator" value={mediatorMap[review.mediatorId] || review.mediatorId} />
        <Field label="Amount" value={review.amountRupees} />
        <Field label="Less" value={review.lessRupees} />
        <Field label="Refund" value={review.refundAmountRupees} />
        {review.orderedDate && <Field label="Ordered" value={review.orderedDate} />} 
        {review.deliveryDate && <Field label="Delivered" value={review.deliveryDate} />}
        {review.dealType !== 'RATING_ONLY' && review.reviewSubmitDate && <Field label="Review Submitted" value={review.reviewSubmitDate} />}
        {review.dealType === 'REVIEW_PUBLISHED' && review.reviewAcceptedDate && <Field label="Review Accepted" value={review.reviewAcceptedDate} />}
        {review.dealType === 'RATING_ONLY' && review.ratingSubmittedDate && <Field label="Rating Submitted" value={review.ratingSubmittedDate} />}
        {review.refundFormSubmittedDate && <Field label="Refund Form" value={review.refundFormSubmittedDate} />}
        {review.paymentReceivedDate && <Field label="Payment Received" value={review.paymentReceivedDate} />}
      </div>

      {nf && (
        <div className="bg-white p-4 rounded shadow flex items-end gap-3">
          <div>
            <div className="text-sm text-gray-600">Advance: {nf.replace(/([A-Z])/g,' $1')}</div>
            <input type="date" className="border p-2 rounded" value={nextDate ? new Date(nextDate).toISOString().slice(0,10) : ''} onChange={(e)=> setNextDate(e.target.value ? new Date(e.target.value) : null)} />
          </div>
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={saveNext} disabled={!nextDate}>Save</button>
        </div>
      )}

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
