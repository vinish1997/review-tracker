import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { formatCurrencyINR as formatCurrency } from "../utils/format";
import { getPlatforms, getMediators } from "../api/lookups";
import { searchReviews, aggregates as apiAggregates } from "../api/reviews";
import axios from "axios";

export default function SharedView() {
  const { slug } = useParams();
  const [meta, setMeta] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [platforms, setPlatforms] = useState([]);
  const [mediators, setMediators] = useState([]);
  const [totalAmount, setTotalAmount] = useState(null);
  const [totalRefund, setTotalRefund] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [{ data: meta }, p, m] = await Promise.all([
          axios.get(`/api/views/shared/${slug}`),
          getPlatforms(),
          getMediators(),
        ]);
        setMeta(meta);
        setPlatforms(p.data||[]);
        setMediators(m.data||[]);
        const cfg = meta?.config || {};
        const criteria = {
          platformIdIn: (cfg.fPlatformIds && cfg.fPlatformIds.length>0) ? cfg.fPlatformIds : undefined,
          mediatorIdIn: (cfg.fMediatorIds && cfg.fMediatorIds.length>0) ? cfg.fMediatorIds : undefined,
          statusIn: (cfg.fStatuses && cfg.fStatuses.length>0) ? cfg.fStatuses : undefined,
          dealTypeIn: (cfg.fDealTypes && cfg.fDealTypes.length>0) ? cfg.fDealTypes : undefined,
          productNameContains: (cfg.quickMode === 'both' || cfg.quickMode === 'product') ? (cfg.search || undefined) : undefined,
          orderIdContains: (cfg.quickMode === 'both' || cfg.quickMode === 'order') ? (cfg.search || undefined) : undefined,
        };
        const [res, agg] = await Promise.all([
          searchReviews(criteria, { page: 0, size: cfg.size || 100, sort: cfg.sortField || 'orderedDate', dir: (cfg.sortDir || 'DESC').toUpperCase() }),
          apiAggregates(criteria)
        ]);
        const list = res.data.content || [];
        setRows(list);
        const fallbackAmount = list.reduce((s, r) => s + (+r.amountRupees || 0), 0);
        const fallbackRefund = list.reduce((s, r) => s + (+(r.refundAmountRupees ?? ((+r.amountRupees||0) - (+r.lessRupees||0))) || 0), 0);
        setTotalAmount(Number(agg?.data?.totalAmount ?? fallbackAmount));
        setTotalRefund(Number(agg?.data?.totalRefund ?? fallbackRefund));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const platformMap = useMemo(() => Object.fromEntries(platforms.map(p => [p.id, p.name])), [platforms]);
  const mediatorMap = useMemo(() => Object.fromEntries(mediators.map(m => [m.id, m.name])), [mediators]);

  const cfg = meta?.config || {};
  const colOrder = (cfg.colOrder && Array.isArray(cfg.colOrder) ? cfg.colOrder : ['orderId','productName','platformName','status','dealType','mediatorName','refundAmountRupees']);
  const visible = (cfg.visibleCols || {});
  const columns = colOrder.filter(k => visible[k] !== false);

  const dealTypeLabel = (code) => {
    switch (code) {
      case 'REVIEW_PUBLISHED': return 'Review Published';
      case 'REVIEW_SUBMISSION': return 'Review Submission';
      case 'RATING_ONLY': return 'Rating Only';
      default: return code || '-';
    }
  };

  const render = (key, r) => {
    switch (key) {
      case 'orderId': return r.orderId;
      case 'productName': return r.productName;
      case 'platformName': return platformMap[r.platformId] || r.platformId;
      case 'status': return r.status;
      case 'dealType': return dealTypeLabel(r.dealType);
      case 'mediatorName': return mediatorMap[r.mediatorId] || r.mediatorId;
      case 'amountRupees': return formatCurrency(r.amountRupees);
      case 'refundAmountRupees': return formatCurrency(r.refundAmountRupees ?? ((+r.amountRupees||0) - (+r.lessRupees||0)));
      default: return r[key];
    }
  };

  const csvVal = (key, r) => {
    switch (key) {
      case 'orderId': return r.orderId ?? '';
      case 'productName': return r.productName ?? '';
      case 'platformName': return (platformMap[r.platformId] || r.platformId || '');
      case 'status': return r.status ?? '';
      case 'dealType': return dealTypeLabel(r.dealType ?? '');
      case 'mediatorName': return (mediatorMap[r.mediatorId] || r.mediatorId || '');
      case 'amountRupees': return String(r.amountRupees ?? '');
      case 'refundAmountRupees': {
        const v = r.refundAmountRupees ?? ((+r.amountRupees||0) - (+r.lessRupees||0));
        return String(v ?? '');
      }
      default: {
        const v = r[key];
        if (v == null) return '';
        return typeof v === 'string' ? v : String(v);
      }
    }
  };

  const exportCsv = () => {
    try {
      const headers = columns.map(labelOf);
      const data = rows.map(r => columns.map(k => csvVal(k, r)));
      const totalsRow = columns.map((k, idx) => {
        if (idx === 0) return 'Totals';
        if (k === 'amountRupees') return String(totalAmount ?? 0);
        if (k === 'refundAmountRupees') return String(totalRefund ?? 0);
        return '';
      });
      const all = [headers, ...data, totalsRow];
      const csv = all.map(row => row.map(v => String(v).replaceAll('"','""')).map(v => /[",\n]/.test(v) ? `"${v}"` : v).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(meta?.name || 'shared-view').replace(/\s+/g,'-').toLowerCase()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Export failed');
      console.error('Export CSV failed', e);
    }
  };

  const doPrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const title = meta?.name || 'Shared View';
    const head = `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>
      <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial; padding: 24px; }
        h1 { font-size: 20px; margin: 0 0 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; text-align: left; }
        th { background: #f3f4f6; }
      </style></head><body>`;
    const thead = `<thead><tr>${columns.map(k => `<th>${labelOf(k)}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${rows.map(r => `<tr>${columns.map(k => `<td>${csvVal(k,r)}</td>`).join('')}</tr>`).join('')}</tbody>`;
    const tfoot = `<tfoot><tr>${columns.map((k, idx) => {
      if (idx === 0) return `<td><strong>Totals</strong></td>`;
      if (k === 'amountRupees') return `<td><strong>${formatCurrency(totalAmount||0)}</strong></td>`;
      if (k === 'refundAmountRupees') return `<td><strong>${formatCurrency(totalRefund||0)}</strong></td>`;
      return `<td></td>`;
    }).join('')}</tr></tfoot>`;
    const doc = `${head}<h1>${title}</h1><table>${thead}${tbody}${tfoot}</table></body></html>`;
    w.document.open();
    w.document.write(doc);
    w.document.close();
    w.focus();
    setTimeout(() => {
      try { w.print(); } catch { void 0; }
      try { w.close(); } catch { void 0; }
    }, 100);
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (!meta) return <div className="p-6">Link not found or disabled.</div>;
  return (
    <div>
      <div className="p-6 rounded-t-xl bg-gradient-to-r from-indigo-50 via-white to-emerald-50">
        <h3 className="text-2xl font-bold text-gray-900">{meta.name}</h3>
        <div className="text-sm text-gray-600">Shared view</div>
      </div>
      <div className="bg-white p-4 rounded-b-xl shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-700">Showing {rows.length} items</div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded bg-white hover:bg-gray-50" onClick={exportCsv}>Export CSV</button>
            <button className="px-3 py-1 border rounded bg-white hover:bg-gray-50" onClick={doPrint}>Print</button>
          </div>
        </div>
        <div className="rounded shadow overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                {columns.map(key => (
                  <th key={key} className="p-2 border">{labelOf(key)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b">
                  {columns.map(key => (
                    <td key={key} className="p-2 border-t">{render(key, r)}</td>
                  ))}
                </tr>
              ))}
              {rows.length===0 && (
                <tr><td className="p-4 text-center text-gray-500" colSpan={columns.length}>No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function labelOf(key) {
  const labels = { orderId:'Order ID', productName:'Product', platformName:'Platform', status:'Status', dealType:'Deal Type', mediatorName:'Mediator', amountRupees:'Amount', refundAmountRupees:'Refund' };
  return labels[key] || key;
}
