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
      setPlatformMap(Object.fromEntries((p.data || []).map(x => [x.id, x.name])));
      setMediatorMap(Object.fromEntries((m.data || []).map(x => [x.id, x.name])));
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Review Details</h2>
          <p className="text-sm text-gray-500">View and manage review lifecycle</p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <button className="px-4 py-2 text-sm font-medium border border-gray-300 bg-white rounded-lg hover:bg-gray-50 whitespace-nowrap" onClick={() => navigate(-1)}>Back</button>
          <button className="px-4 py-2 text-sm font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 whitespace-nowrap" onClick={() => navigate(`/reviews/edit/${id}`)}>Edit</button>
          <button className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 whitespace-nowrap" onClick={() => duplicateToCreate(review, navigate)} disabled={!review}>Duplicate</button>
          <button className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 whitespace-nowrap" onClick={loadHistory} disabled={!review}>History</button>
        </div>
      </div>

      {!review ? (
        <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded shadow animate-pulse">
          {Array.from({ length: 10 }).map((_, i) => (
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
              const base = ['orderedDate', 'deliveryDate'];
              if ((review.dealType || 'REVIEW_SUBMISSION') === 'REVIEW_PUBLISHED') return [...base, 'reviewSubmitDate', 'reviewAcceptedDate', 'refundFormSubmittedDate', 'paymentReceivedDate'];
              if ((review.dealType || 'REVIEW_SUBMISSION') === 'RATING_ONLY') return [...base, 'ratingSubmittedDate', 'refundFormSubmittedDate', 'paymentReceivedDate'];
              return [...base, 'reviewSubmitDate', 'refundFormSubmittedDate', 'paymentReceivedDate'];
            })();
            const nf = (() => {
              const r = review;
              if (!r.orderedDate) return 'orderedDate';
              if (!r.deliveryDate) return 'deliveryDate';
              if ((r.dealType || 'REVIEW_SUBMISSION') === 'REVIEW_PUBLISHED') {
                if (!r.reviewSubmitDate) return 'reviewSubmitDate';
                if (!r.reviewAcceptedDate) return 'reviewAcceptedDate';
              } else if ((r.dealType || 'REVIEW_SUBMISSION') === 'RATING_ONLY') {
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
              seq.slice(idx + 1).forEach(k => payload[k] = null);
              const res = await updateReview(review.id, payload);
              setReview(res.data);
              setNextDate(null);
            };
            return (
              <>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Overview</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide ${statusClass(review.status)}`}>{titleCaseStatus(review.status)}</span>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Section title="Order Info">
                      <Field label="Order ID" value={review.orderId} copy />
                      <Field label="Product" value={review.productName} />
                      <Field label="Platform" value={platformMap[review.platformId] || review.platformId} />
                      <Field label="Mediator" value={mediatorMap[review.mediatorId] || review.mediatorId} />
                    </Section>
                    <Section title="Financials">
                      <Field label="Amount" value={formatCurrency(review.amountRupees)} highlight />
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Less" value={formatCurrency(review.lessRupees)} />
                        <Field label="Refund" value={formatCurrency(review.refundAmountRupees)} color="text-green-600" />
                      </div>
                      <Field label="Deal Type" value={dealTypeLabel(review.dealType)} />
                    </Section>
                  </div>
                </div>

                {nf && (
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-indigo-900 mb-1">Next Step: {nf.replace(/([A-Z])/g, ' $1')}</div>
                      <p className="text-xs text-indigo-700">Record the date for this milestone to advance the review.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="date" className="border border-indigo-200 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none" value={nextDate ? new Date(nextDate).toISOString().slice(0, 10) : ''} onChange={(e) => setNextDate(e.target.value ? new Date(e.target.value) : null)} />
                      <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" onClick={saveNext} disabled={!nextDate}>Save</button>
                    </div>
                  </div>
                )}

                {/* Lifecycle summary as timeline */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Lifecycle</h3>
                  <div className="relative pl-2">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100" />
                    <div className="space-y-6">
                      <TimelineItem label="Ordered" value={formatDate(review.orderedDate)} active={!!review.orderedDate} />
                      <TimelineItem label="Delivered" value={formatDate(review.deliveryDate)} active={!!review.deliveryDate} />
                      {review.dealType !== 'RATING_ONLY' && (
                        <TimelineItem label="Review Submitted" value={formatDate(review.reviewSubmitDate)} active={!!review.reviewSubmitDate} />
                      )}
                      {review.dealType === 'REVIEW_PUBLISHED' && (
                        <TimelineItem label="Review Accepted" value={formatDate(review.reviewAcceptedDate)} active={!!review.reviewAcceptedDate} />
                      )}
                      {review.dealType === 'RATING_ONLY' && (
                        <TimelineItem label="Rating Submitted" value={formatDate(review.ratingSubmittedDate)} active={!!review.ratingSubmittedDate} />
                      )}
                      <TimelineItem label="Refund Form Submitted" value={formatDate(review.refundFormSubmittedDate)} active={!!review.refundFormSubmittedDate} />
                      <TimelineItem label="Payment Received" value={formatDate(review.paymentReceivedDate)} active={!!review.paymentReceivedDate} last />
                    </div>
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

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</h4>
      <div className="space-y-3 pl-1">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, color, highlight, copy }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="text-[10px] uppercase text-gray-500 font-semibold mb-0.5">{label}</div>
      <div className={`font-medium text-sm flex items-center gap-2 ${color || 'text-gray-900'} ${highlight ? 'text-lg' : ''}`}>
        {value ?? <span className="text-gray-300">-</span>}
        {copy && value && (
          <button onClick={handleCopy} className="text-gray-400 hover:text-indigo-600 transition-colors" title="Copy">
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function TimelineItem({ label, value, active }) {
  return (
    <div className="relative pl-8">
      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white z-10 ${active ? 'border-emerald-500' : 'border-gray-200'}`}>
        {active && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1">
        <span className={`text-sm font-medium ${active ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
        <span className={`text-sm ${active ? 'text-gray-700' : 'text-gray-300'}`}>{value || 'Pending'}</span>
      </div>
    </div>
  );
}

function statusClass(s) {
  const map = {
    'ordered': 'bg-slate-100 text-slate-700',
    'delivered': 'bg-sky-100 text-sky-700',
    'review submitted': 'bg-amber-100 text-amber-700',
    'review accepted': 'bg-emerald-100 text-emerald-700',
    'rating submitted': 'bg-violet-100 text-violet-700',
    'refund form submitted': 'bg-orange-100 text-orange-700',
    'payment received': 'bg-green-100 text-green-700',
  };
  return map[String(s).toLowerCase()] || 'bg-gray-100 text-gray-700';
}

function fieldLabel(k) {
  const map = {
    productName: 'Product Name', orderId: 'Order ID', orderLink: 'Order Link',
    platformId: 'Platform', mediatorId: 'Mediator', dealType: 'Deal Type',
    amountRupees: 'Amount', lessRupees: 'Less', refundAmountRupees: 'Refund',
    orderedDate: 'Ordered', deliveryDate: 'Delivered', reviewSubmitDate: 'Review Submitted',
    reviewAcceptedDate: 'Review Accepted', ratingSubmittedDate: 'Rating Submitted',
    refundFormSubmittedDate: 'Refund Form Submitted', paymentReceivedDate: 'Payment Received',
    status: 'Status'
  };
  return map[k] || k;
}

function formatFieldValue(field, val) {
  if (val == null) return '';
  const dateFields = new Set(['orderedDate', 'deliveryDate', 'reviewSubmitDate', 'reviewAcceptedDate', 'ratingSubmittedDate', 'refundFormSubmittedDate', 'paymentReceivedDate']);
  const moneyFields = new Set(['amountRupees', 'lessRupees', 'refundAmountRupees']);
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
