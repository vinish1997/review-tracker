import { useCallback, useEffect, useRef, useState } from "react";
import { searchReviews, aggregates as apiAggregates } from "../api/reviews";
import { getPlatforms, getMediators } from "../api/lookups";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import DropdownPortal from "../components/DropdownPortal";
import { formatCurrencyINR as formatCurrency, formatDate } from "../utils/format";

export default function Archive() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [gotoPageInput, setGotoPageInput] = useState('');
  const [search, setSearch] = useState("");
  const [platformId, setPlatformId] = useState("");
  const [mediatorId, setMediatorId] = useState("");
  const [platforms, setPlatforms] = useState([]);
  const [mediators, setMediators] = useState([]);
  const [platformMap, setPlatformMap] = useState({});
  const [mediatorMap, setMediatorMap] = useState({});
  const navigate = useNavigate();
  const [openRow, setOpenRow] = useState(null);
  const menuRef = useRef(null);
  const [colWidths, setColWidths] = useState({});
  const [aggTotals, setAggTotals] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const criteria = { status: 'payment received', platformId: platformId || undefined, mediatorId: mediatorId || undefined, productNameContains: search || undefined, orderIdContains: search || undefined };
    const [res, agg] = await Promise.all([
      searchReviews(criteria, { page, size, sort: 'paymentReceivedDate', dir: 'DESC' }),
      apiAggregates({ statusIn: ['payment received'], platformIdIn: platformId ? [platformId] : undefined, mediatorIdIn: mediatorId ? [mediatorId] : undefined, productNameContains: search || undefined, orderIdContains: search || undefined })
    ]);
    setItems(res.data.content || []);
    setTotalPages(res.data.totalPages || 0);
    setAggTotals(agg.data || null);
    setLoading(false);
  }, [page, size, search, platformId, mediatorId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    try { const s = localStorage.getItem('archive-page-size'); if (s) setSize(Number(s)); } catch { /* ignore */ }
  }, []);
  useEffect(() => { try { localStorage.setItem('archive-page-size', String(size)); } catch { /* ignore */ } }, [size]);
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

  return (
    <div>
      {/* Header */}
      <div className="p-6 rounded-t-xl bg-gradient-to-r from-indigo-50 via-white to-emerald-50">
        <h2 className="text-2xl font-bold text-gray-900">Archive (Payment Received)</h2>
        <p className="text-gray-600">Completed payments and refunds</p>
      </div>
      {/* Body Card */}
      {loading ? (
        <div className="bg-white p-4 rounded-b-xl shadow animate-pulse">
          <div className="flex items-end gap-3 mb-3">
            <div className="flex-1 min-w-56">
              <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-9 bg-gray-200 rounded" />
            </div>
            <div className="w-48">
              <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-9 bg-gray-200 rounded" />
            </div>
            <div className="w-48">
              <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-9 bg-gray-200 rounded" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              {Array.from({length:4}).map((_,i)=> <div key={i} className="h-9 w-24 bg-gray-200 rounded" />)}
            </div>
          </div>
          <div className="rounded overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  {Array.from({length:8}).map((_,i)=> (
                    <th key={i} className="p-2 border"><div className="h-3 w-20 bg-gray-200 rounded" /></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({length:6}).map((_,ri)=> (
                  <tr key={ri} className="border-b">
                    {Array.from({length:8}).map((_,ci)=> <td key={ci} className="p-2"><div className="h-4 bg-gray-200 rounded" /></td>)}
                  </tr>
                ))}
              </tbody>
      </table>
      {items.length > 0 && (
        <div className="mt-2 text-sm text-gray-700 flex items-center justify-end gap-6">
          <div><span className="font-medium">Total Amount:</span> {formatCurrency(aggTotals?.totalAmount ?? 0)}</div>
          <div><span className="font-medium">Total Refund:</span> {formatCurrency(aggTotals?.totalRefund ?? 0)}</div>
        </div>
      )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-b-xl shadow">
          <div className="flex items-end gap-3 mb-3">
            <div className="flex-1 min-w-56">
              <label className="block text-sm font-medium text-gray-700">Quick Search</label>
              <input value={search} onChange={(e)=> { setSearch(e.target.value); setPage(0);} } className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Product or Order" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Platform</label>
              <select value={platformId} onChange={(e)=> { setPlatformId(e.target.value); setPage(0);} } className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm min-w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">All</option>
                {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mediator</label>
              <select value={mediatorId} onChange={(e)=> { setMediatorId(e.target.value); setPage(0);} } className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm min-w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">All</option>
                {mediators.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={()=> exportCsv(items, platformMap, mediatorMap)} className="px-3 py-2 border rounded-md border-gray-300 bg-white hover:bg-gray-50">Export CSV</button>
            <button disabled={page<=0} onClick={()=> setPage(p=>p-1)} className="px-3 py-2 border rounded-md border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50">Prev</button>
            <button disabled={page>=totalPages-1} onClick={()=> setPage(p=>p+1)} className="px-3 py-2 border rounded-md border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
            <select value={size} onChange={(e)=> { setSize(Number(e.target.value)); setPage(0);} } className="px-2 py-2 border rounded-md border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              {[20,50,100].map(n => <option key={n} value={n}>{n}/page</option>)}
            </select>
            <input type="number" min="1" max={Math.max(totalPages,1)} value={gotoPageInput} onChange={(e)=> setGotoPageInput(e.target.value)} placeholder="Go to" className="w-20 border p-2 rounded" onKeyDown={(e)=> { if (e.key==='Enter') { const v = Math.max(1, Math.min(Number(e.currentTarget.value||'1'), Math.max(totalPages,1))); setPage(v-1); } }} />
            <button className="px-3 py-2 border rounded-md border-gray-300 bg-white hover:bg-gray-50" onClick={()=> { const v = Math.max(1, Math.min(Number(gotoPageInput||'1'), Math.max(totalPages,1))); setPage(v-1); }}>Go</button>
            </div>
          </div>
        <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            {[
              {key:'orderId', label:'Order ID'},
              {key:'productName', label:'Product'},
              {key:'platform', label:'Platform'},
              {key:'mediator', label:'Mediator'},
              {key:'amount', label:'Amount'},
              {key:'refund', label:'Refund'},
              {key:'payDate', label:'Payment Date'},
            ].map(h => (
              <th key={h.key} className="p-2 border relative group" style={{ width: colWidths[h.key] ? `${colWidths[h.key]}px` : undefined, minWidth: colWidths[h.key] ? `${colWidths[h.key]}px` : undefined }}>
                {h.label}
                <span
                  onMouseDown={(e)=> {
                    e.preventDefault();
                    const startX = e.clientX;
                    const startW = colWidths[h.key] || e.currentTarget.parentElement.offsetWidth;
                    const onMove = (ev) => {
                      const delta = ev.clientX - startX;
                      const next = Math.max(80, startW + delta);
                      setColWidths(w => ({ ...w, [h.key]: next }));
                    };
                    const onUp = () => {
                      window.removeEventListener('mousemove', onMove);
                      window.removeEventListener('mouseup', onUp);
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                  }}
                  onDoubleClick={() => {
                    const estimator = (text) => 16 + Math.min(600, (String(text||'').length * 8));
                    const maxContent = Math.max(...items.map(i => {
                      switch (h.key) {
                        case 'orderId': return estimator(i.orderId);
                        case 'productName': return estimator(i.productName);
                        case 'platform': return estimator(platformMap[i.platformId]||i.platformId);
                        case 'mediator': return estimator(mediatorMap[i.mediatorId]||i.mediatorId);
                        case 'amount': return estimator(formatCurrency(i.amountRupees));
                        case 'refund': return estimator(formatCurrency(i.refundAmountRupees));
                        case 'payDate': return estimator(formatDate(i.paymentReceivedDate));
                        default: return 120;
                      }
                    }));
                    setColWidths(w => ({ ...w, [h.key]: Math.max(80, maxContent) }));
                  }}
                  className="absolute top-0 right-0 h-full w-1 cursor-col-resize opacity-0 group-hover:opacity-100"
                  role="separator"
                  aria-orientation="vertical"
                />
              </th>
            ))}
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id} className="border-b">
              <td className="p-2" style={{ width: colWidths.orderId ? `${colWidths.orderId}px` : undefined }}>{i.orderId}</td>
              <td className="p-2" style={{ width: colWidths.productName ? `${colWidths.productName}px` : undefined }}>{i.productName}</td>
              <td className="p-2" style={{ width: colWidths.platform ? `${colWidths.platform}px` : undefined }}>{platformMap[i.platformId] || i.platformId}</td>
              <td className="p-2" style={{ width: colWidths.mediator ? `${colWidths.mediator}px` : undefined }}>{mediatorMap[i.mediatorId] || i.mediatorId}</td>
              <td className="p-2" style={{ width: colWidths.amount ? `${colWidths.amount}px` : undefined }}>{formatCurrency(i.amountRupees)}</td>
              <td className="p-2" style={{ width: colWidths.refund ? `${colWidths.refund}px` : undefined }}>{formatCurrency(i.refundAmountRupees)}</td>
              <td className="p-2" style={{ width: colWidths.payDate ? `${colWidths.payDate}px` : undefined }}>{formatDate(i.paymentReceivedDate) || '-'}</td>
                <td className="p-2">
                <div className="relative inline-block">
                  <button ref={openRow===i.id ? menuRef : null} className="px-2 py-1 border rounded-md border-gray-300 bg-white hover:bg-gray-50" onClick={(e)=> { e.stopPropagation(); setOpenRow(prev => prev===i.id ? null : i.id); }}>
                    <EllipsisVerticalIcon className="w-5 h-5 text-gray-600"/>
                  </button>
                  <DropdownPortal open={openRow===i.id} anchorRef={menuRef} onClose={()=> setOpenRow(null)} preferred="up" align="right" className="w-40 overflow-hidden">
                    <button onClick={()=> { setOpenRow(null); navigate(`/reviews/view/${i.id}`); }} className="block w-full text-left px-3 py-2 hover:bg-gray-50 inline-flex items-center gap-2">
                      <EyeIcon className="w-4 h-4"/>
                      <span>Details</span>
                    </button>
                  </DropdownPortal>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td className="p-2" colSpan="8">No archived reviews.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      )}
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
