import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getReview, updateReview } from "../api/reviews";
import { formatCurrencyINR as formatCurrency, formatDate } from "../utils/format";
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

  function duplicateToCreate(r, navigate) {
    if (!r) return;
    const clean = {
      orderId: '',
      orderLink: r.orderLink || '',
      productName: r.productName || '',
      platformId: r.platformId || '',
      mediatorId: r.mediatorId || '',
      dealType: r.dealType || '',
      amountRupees: r.amountRupees ?? '',
      lessRupees: r.lessRupees ?? '',
      orderedDate: null,
      deliveryDate: null,
      reviewSubmitDate: null,
      reviewAcceptedDate: null,
      ratingSubmittedDate: null,
      refundFormSubmittedDate: null,
      paymentReceivedDate: null,
    };
    navigate('/reviews/new', { state: { prefill: clean } });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Review Details</h2>
        <div className="space-x-2">
          <button className="px-3 py-1 border rounded" onClick={()=> navigate(-1)}>Back</button>
          <button className="px-3 py-1 bg-yellow-500 text-white rounded" onClick={()=> navigate(`/reviews/edit/${id}`)}>Edit</button>
          <button className="px-3 py-1 bg-slate-600 text-white rounded" onClick={()=> duplicateToCreate(review, navigate)} disabled={!review}>Duplicate</button>
          <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={loadHistory} disabled={!review}>View History</button>
        </div>
      </div>

      {!review ? (
        <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded shadow animate-pulse">
          {Array.from({length:10}).map((_,i)=> (
            <div key={i}>
              <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {(() => {
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
              <>
                <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded shadow">
                  <Field label="Order ID" value={review.orderId} />
                  <Field label="Product" value={review.productName} />
                  <Field label="Deal Type" value={dealTypeLabel(review.dealType)} />
                  <Field label="Status" value={titleCaseStatus(review.status)} />
                  <Field label="Platform" value={platformMap[review.platformId] || review.platformId} />
                  <Field label="Mediator" value={mediatorMap[review.mediatorId] || review.mediatorId} />
        <Field label="Amount" value={formatCurrency(review.amountRupees)} />
        <Field label="Less" value={formatCurrency(review.lessRupees)} />
        <Field label="Refund" value={formatCurrency(review.refundAmountRupees)} />
        {review.orderedDate && <Field label="Ordered" value={formatDate(review.orderedDate)} />} 
        {review.deliveryDate && <Field label="Delivered" value={formatDate(review.deliveryDate)} />}
        {review.dealType !== 'RATING_ONLY' && review.reviewSubmitDate && <Field label="Review Submitted" value={formatDate(review.reviewSubmitDate)} />}
        {review.dealType === 'REVIEW_PUBLISHED' && review.reviewAcceptedDate && <Field label="Review Accepted" value={formatDate(review.reviewAcceptedDate)} />}
        {review.dealType === 'RATING_ONLY' && review.ratingSubmittedDate && <Field label="Rating Submitted" value={formatDate(review.ratingSubmittedDate)} />}
        {review.refundFormSubmittedDate && <Field label="Refund Form" value={formatDate(review.refundFormSubmittedDate)} />}
        {review.paymentReceivedDate && <Field label="Payment Received" value={formatDate(review.paymentReceivedDate)} />}
                </div>

                {nf && (
                  <div className="bg-white p-4 rounded shadow flex items-end gap-3">
                    <div>
                      <div className="text-sm text-gray-600">Advance: {nf.replace(/([A-Z])/g,' $1')}</div>
                      <input type="date" className="border p-2 rounded bg-white text-gray-900" value={nextDate ? new Date(nextDate).toISOString().slice(0,10) : ''} onChange={(e)=> setNextDate(e.target.value ? new Date(e.target.value) : null)} />
                    </div>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={saveNext} disabled={!nextDate}>Save</button>
                  </div>
                )}

                {/* Lifecycle summary as timeline */}
                <div className="bg-white p-4 rounded shadow">
                  <h3 className="text-xl font-semibold mb-2">Lifecycle</h3>
                  <div className="relative">
                    <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200" />
          <TimelineItem label="Ordered" value={formatDate(review.orderedDate)} first />
          <TimelineItem label="Delivered" value={formatDate(review.deliveryDate)} />
          {review.dealType !== 'RATING_ONLY' && (
            <TimelineItem label="Review Submitted" value={formatDate(review.reviewSubmitDate)} />
          )}
          {review.dealType === 'REVIEW_PUBLISHED' && (
            <TimelineItem label="Review Accepted" value={formatDate(review.reviewAcceptedDate)} />
          )}
          {review.dealType === 'RATING_ONLY' && (
            <TimelineItem label="Rating Submitted" value={formatDate(review.ratingSubmittedDate)} />
          )}
          <TimelineItem label="Refund Form Submitted" value={formatDate(review.refundFormSubmittedDate)} />
          <TimelineItem label="Payment Received" value={formatDate(review.paymentReceivedDate)} last />
                  </div>
                </div>
              </>
            );
          })()}

          {history && (
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-xl font-semibold mb-2">History</h3>
              {history.length === 0 && <div className="text-sm text-gray-500">No history.</div>}
              {history.map((h) => (
                <div key={h.id} className="border-b py-2">
                  <div className="text-sm text-gray-600">{(h.type || 'CHANGE').toUpperCase()} • {h.at ? new Date(h.at).toLocaleDateString() : ''}</div>
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
                        {h.changes.map((c, idx) => {
                          const label = fieldLabel(c.field);
                          const oldV = formatFieldValue(c.field, c.oldVal);
                          const newV = formatFieldValue(c.field, c.newVal);
                          return (
                            <tr key={idx}>
                              <td className="pr-4">{label}</td>
                              <td className="pr-4">{oldV}</td>
                              <td>{newV}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
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

function TimelineItem({ label, value }) {
  return (
    <div className="relative pl-8 py-2">
      <span className={`absolute left-2 top-3 w-2.5 h-2.5 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`}></span>
      <div className="text-sm flex items-center justify-between">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium">{value || '-'}</span>
      </div>
    </div>
  );
}

function fieldLabel(k) {
  const map = {
    productName: 'Product Name', orderId:'Order ID', orderLink:'Order Link',
    platformId:'Platform', mediatorId:'Mediator', dealType:'Deal Type',
    amountRupees:'Amount', lessRupees:'Less', refundAmountRupees:'Refund',
    orderedDate:'Ordered', deliveryDate:'Delivered', reviewSubmitDate:'Review Submitted',
    reviewAcceptedDate:'Review Accepted', ratingSubmittedDate:'Rating Submitted',
    refundFormSubmittedDate:'Refund Form Submitted', paymentReceivedDate:'Payment Received',
    status:'Status'
  };
  return map[k] || k;
}

function formatFieldValue(field, val) {
  if (val == null) return '';
  const dateFields = new Set(['orderedDate','deliveryDate','reviewSubmitDate','reviewAcceptedDate','ratingSubmittedDate','refundFormSubmittedDate','paymentReceivedDate']);
  const moneyFields = new Set(['amountRupees','lessRupees','refundAmountRupees']);
  if (dateFields.has(field)) return formatDate(val);
  if (moneyFields.has(field)) return formatCurrency(val);
  return String(val);
}

function dealTypeLabel(code) {
  switch (code) {
    case 'REVIEW_PUBLISHED': return 'Review Published';
    case 'REVIEW_SUBMISSION': return 'Review Submission';
    case 'RATING_ONLY': return 'Rating Only';
    default: return code || '-';
  }
}

function titleCaseStatus(s) {
  if (!s) return '-';
  return String(s).replace(/\b\w/g, c => c.toUpperCase());
}
