import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { deleteReview, searchReviews, exportCsv as apiExportCsv, importCsv as apiImportCsv, bulkDelete } from "../api/reviews";
import { getPlatforms, getMediators } from "../api/lookups";
import { useNavigate, useSearchParams } from "react-router-dom";
import Modal from "./Modal";
import { useToast } from "./ToastProvider";
import { PlusIcon, PencilSquareIcon, TrashIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";

export default function ReviewTable() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platforms, setPlatforms] = useState([]);
  const [mediators, setMediators] = useState([]);
  const statusOptions = [
    "ordered",
    "delivered",
    "review submitted",
    "review accepted",
    "rating submitted",
    "refund form submitted",
    "payment received",
  ];
  const dealTypeOptions = [
    { value: "REVIEW_PUBLISHED", label: "Review Published" },
    { value: "REVIEW_SUBMISSION", label: "Review Submission" },
    { value: "RATING_ONLY", label: "Rating Only" },
  ];

  // Advanced search filters
  // Draft filters (checkbox selections)
  const [fPlatformIds, setFPlatformIds] = useState([]);
  const [fMediatorIds, setFMediatorIds] = useState([]);
  const [fStatuses, setFStatuses] = useState([]);
  const [fDealTypes, setFDealTypes] = useState([]);

  // Sorting
  const [sortField, setSortField] = useState("orderedDate");
  const [sortDir, setSortDir] = useState("desc"); // 'asc' | 'desc'
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [quickMode, setQuickMode] = useState("both"); // both | product | order
  const [statusInPreset, setStatusInPreset] = useState([]); // optional preset override
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [mediatorQuery, setMediatorQuery] = useState('');
  const [headElevated, setHeadElevated] = useState(false);
  const tableWrapRef = useRef(null);

  // Applied filters (only used after Apply Filters is clicked)
  const [aPlatformIds, setAPlatformIds] = useState([]);
  const [aMediatorIds, setAMediatorIds] = useState([]);
  const [aStatuses, setAStatuses] = useState([]);
  const [aDealTypes, setADealTypes] = useState([]);
  const [aSearch, setASearch] = useState("");
  const [aQuickMode, setAQuickMode] = useState("both");

  const platformMap = useMemo(() => Object.fromEntries(platforms.map(p => [p.id, p.name])), [platforms]);
  const mediatorMap = useMemo(() => Object.fromEntries(mediators.map(m => [m.id, m])), [mediators]);
  const filteredMediators = useMemo(() => {
    const q = mediatorQuery.trim().toLowerCase();
    if (!q) return mediators;
    return mediators.filter(m => (m.name||'').toLowerCase().includes(q) || (m.phone||'').toLowerCase().includes(q));
  }, [mediators, mediatorQuery]);
  const navigate = useNavigate();
  const toast = useToast();

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const criteria = {
        platformIdIn: (aPlatformIds && aPlatformIds.length>0) ? aPlatformIds : undefined,
        mediatorIdIn: (aMediatorIds && aMediatorIds.length>0) ? aMediatorIds : undefined,
        statusIn: (statusInPreset && statusInPreset.length > 0) ? statusInPreset : ((aStatuses && aStatuses.length>0) ? aStatuses: undefined),
        dealTypeIn: (aDealTypes && aDealTypes.length>0) ? aDealTypes : undefined,
        productNameContains: (aQuickMode === "both" || aQuickMode === "product") ? (aSearch || undefined) : undefined,
        orderIdContains: (aQuickMode === "both" || aQuickMode === "order") ? (aSearch || undefined) : undefined,
      };
      const [res, pRes, mRes] = await Promise.all([
        searchReviews(criteria, {
          page,
          size,
          sort: sortField,
          dir: sortDir.toUpperCase(),
        }),
        getPlatforms(),
        getMediators(),
      ]);
      const pr = res.data;
      let list = (pr.content || []);
      // client-side sort by name-based pseudo fields
      if (["platformName","mediatorName"].includes(sortField)) {
        const nameOf = (r) => sortField === 'platformName' ? (platformMap[r.platformId]||'') : (mediatorMap[r.mediatorId]?.name||'');
        list = [...list].sort((a,b) => {
          const av = nameOf(a), bv = nameOf(b);
          const cmp = String(av).localeCompare(String(bv));
          return (sortDir === 'asc' ? cmp : -cmp);
        });
      }
      setReviews(list);
      setSelected(new Set());
      setTotalPages(pr.totalPages ?? 0);
      setTotalElements(pr.totalElements ?? 0);
      setPlatforms(pRes.data);
      setMediators(mRes.data);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    }
    setLoading(false);
  }, [aSearch, aPlatformIds, aMediatorIds, sortField, sortDir, page, size, aQuickMode, aStatuses, aDealTypes, statusInPreset]);

  // Read optional dashboard preset and apply multi-status filters
  useEffect(() => {
    const preset = searchParams.get('preset');
    if (!preset) { setStatusInPreset([]); return; }
    switch (preset) {
      case 'pending-review-rating':
        setStatusInPreset(['ordered','delivered']);
        break;
      case 'pending-refund-form':
        setStatusInPreset(['review submitted','review accepted','rating submitted']);
        break;
      case 'pending-payment':
        setStatusInPreset(['refund form submitted']);
        break;
      default:
        setStatusInPreset([]);
    }
    setPage(0);
  }, [searchParams]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Load saved filters once on mount (keep hooks before any early return)
  useEffect(() => {
    loadFilters();
  }, []);

  // Elevate header shadow when scrolled
  useEffect(() => {
    const el = tableWrapRef.current;
    if (!el) return;
    const onScroll = () => setHeadElevated(el.scrollTop > 0);
    el.addEventListener('scroll', onScroll);
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const [confirmId, setConfirmId] = useState(null);
  const handleDelete = async (id) => { setConfirmId(id); };
  const doDelete = async () => {
    const id = confirmId;
    setConfirmId(null);
    try { await deleteReview(id); toast.show('Review deleted','success'); await loadReviews(); }
    catch (e) { console.error(e); toast.show('Delete failed','error'); }
  };

  // server-side sorting/filtering now handled in loadReviews

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(0);
  };

  if (loading) return <p>Loading...</p>;

  const toggleAll = (checked) => {
    if (checked) setSelected(new Set(reviews.map(r => r.id)));
    else setSelected(new Set());
  };
  const toggleOne = (id, checked) => {
    const next = new Set(selected);
    if (checked) next.add(id); else next.delete(id);
    setSelected(next);
  };

  const saveFilters = () => {
    setConfirm({
      open: true,
      title: 'Save Filters',
      message: 'Save current filters for next time?',
      onConfirm: () => {
        const data = { quickMode, search, fPlatformIds, fMediatorIds, fStatuses, fDealTypes, sortField, sortDir, size };
        localStorage.setItem('review-filters', JSON.stringify(data));
        toast.show('Filters saved', 'success');
      }
    });
  };
  function loadFilters() {
    try {
      const s = localStorage.getItem('review-filters');
      if (!s) return;
      const d = JSON.parse(s);
      setQuickMode(d.quickMode||'both');
      setSearch(d.search||'');
      setFPlatformIds(d.fPlatformIds||[]);
      setFMediatorIds(d.fMediatorIds||[]);
      setFStatuses(d.fStatuses||[]);
      setFDealTypes(d.fDealTypes||[]);
      setSortField(d.sortField||'orderedDate');
      setSortDir(d.sortDir||'desc');
      setSize(d.size||10);
      // apply loaded filters initially
      setAPlatformIds(d.fPlatformIds||[]);
      setAMediatorIds(d.fMediatorIds||[]);
      setAStatuses(d.fStatuses||[]);
      setADealTypes(d.fDealTypes||[]);
      setASearch(d.search||'');
      setAQuickMode(d.quickMode||'both');
      setPage(0);
    } catch { /* ignore */ }
  }

  

  const doBulkDelete = async () => {
    if (selected.size === 0) { toast.show('Select rows first','error'); return; }
    setConfirm({
      open: true,
      title: 'Delete Selected',
      message: `Delete ${selected.size} selected review(s)?`,
      onConfirm: async () => {
        try { await bulkDelete(Array.from(selected)); setSelected(new Set()); await loadReviews(); toast.show('Deleted','success'); }
        catch(e){ console.error(e); toast.show('Bulk delete failed','error'); }
      }
    });
  };

  const duplicateRow = (r) => {
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
  };

  async function doExport(selectedOnly = false) {
    try {
      if (selectedOnly) {
        const cols = ['orderId','orderLink','productName','dealType','platformId','mediatorId','amountRupees','lessRupees','refundAmountRupees','orderedDate','deliveryDate','reviewSubmitDate','reviewAcceptedDate','ratingSubmittedDate','refundFormSubmittedDate','paymentReceivedDate','status'];
        const selectedRows = reviews.filter(r => selected.has(r.id));
        const rows = [cols, ...selectedRows.map(r => [
          r.orderId, r.orderLink, r.productName, r.dealType, r.platformId, r.mediatorId,
          r.amountRupees ?? '', r.lessRupees ?? '', (r.refundAmountRupees ?? ((+r.amountRupees||0) - (+r.lessRupees||0))),
          r.orderedDate ?? '', r.deliveryDate ?? '', r.reviewSubmitDate ?? '', r.reviewAcceptedDate ?? '', r.ratingSubmittedDate ?? '', r.refundFormSubmittedDate ?? '', r.paymentReceivedDate ?? '', r.status ?? ''
        ])];
        const csv = rows.map(r => r.map(v => String(v).replaceAll('"','""')).map(v => /[,"]/.test(v) ? `"${v}"` : v).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'reviews-selected.csv'; a.click(); URL.revokeObjectURL(url);
      } else {
        const res = await apiExportCsv();
        const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reviews.csv';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Export failed', e);
      alert('Export failed');
    }
  }

  async function onImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await apiImportCsv(file);
      await loadReviews();
    } catch (err) {
      console.error('Import failed', err);
      alert('Import failed: ' + (err?.response?.data?.message || err.message));
    } finally {
      e.target.value = '';
    }
  }

  return (
    <div>
      {/* Header + Actions */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Reviews</h3>
          <div className="text-sm text-gray-500">Manage and track all reviews</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(s=>!s)} className="px-3 py-2 border rounded">{showFilters ? 'Hide Filters' : 'Filters'}</button>
          <div className="relative">
            <details>
              <summary className="px-3 py-2 bg-indigo-600 text-white rounded cursor-pointer select-none shadow hover:bg-indigo-500">Bulk Actions ▾</summary>
              <div className="absolute right-0 mt-1 bg-white border shadow-lg rounded-md w-56 z-10 overflow-hidden">
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-50 inline-flex items-center gap-2" onClick={() => doExport(true)}>
                  <ArrowDownTrayIcon className="w-4 h-4"/>
                  <span>Export Selected</span>
                </button>
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-50 inline-flex items-center gap-2" onClick={() => doExport(false)}>
                  <ArrowDownTrayIcon className="w-4 h-4"/>
                  <span>Export All</span>
                </button>
                <label className="block w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer inline-flex items-center gap-2">
                  <ArrowUpTrayIcon className="w-4 h-4"/>
                  <span>Import CSV</span>
                  <input type="file" accept=".csv,text/csv" className="hidden" onChange={onImport}/>
                </label>
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 inline-flex items-center gap-2" onClick={doBulkDelete}>
                  <TrashIcon className="w-4 h-4"/>
                  <span>Delete Selected</span>
                </button>
              </div>
            </details>
          </div>
          <button onClick={() => navigate("/reviews/new")} className="bg-green-600 text-white px-3 py-2 rounded inline-flex items-center gap-2"><PlusIcon className="w-4 h-4"/>Add Review</button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-3 bg-white p-3 rounded shadow">
        <div className="flex items-end gap-3">
          <div className="flex-1 min-w-56">
            <label className="block text-sm font-medium">Quick Search</label>
            <input type="text" placeholder="Search by product or order ID" className="border p-2 rounded w-full" value={search} onChange={(e)=> setSearch(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Quick Search In</label>
            <select className="border p-2 rounded" value={quickMode} onChange={(e)=> { setQuickMode(e.target.value); setPage(0);} }>
              <option value="both">Product + Order ID</option>
              <option value="product">Product</option>
              <option value="order">Order ID</option>
            </select>
          </div>
          <button onClick={()=> { setASearch(search); setAQuickMode(quickMode); setPage(0); loadReviews(); }} className="bg-blue-600 text-white px-4 py-2 rounded">Search</button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mb-4 bg-white p-4 rounded shadow">
          <div className="grid grid-cols-4 gap-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium">Platform</div>
                <div className="space-x-2">
                  <button type="button" className="text-xs text-indigo-600 hover:underline" onClick={()=> setFPlatformIds(platforms.map(p=>p.id))}>Select All</button>
                  <button type="button" className="text-xs text-gray-600 hover:underline" onClick={()=> setFPlatformIds([])}>Deselect All</button>
                </div>
              </div>
              <div className="max-h-40 overflow-auto space-y-1">
                {platforms.map(p => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={fPlatformIds.includes(p.id)} onChange={(e)=> {
                      setFPlatformIds(prev => e.target.checked ? [...prev, p.id] : prev.filter(x=>x!==p.id));
                    }}/>
                    <span>{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium">Status</div>
                <div className="space-x-2">
                  <button type="button" className="text-xs text-indigo-600 hover:underline" onClick={()=> setFStatuses(statusOptions.slice())}>Select All</button>
                  <button type="button" className="text-xs text-gray-600 hover:underline" onClick={()=> setFStatuses([])}>Deselect All</button>
                </div>
              </div>
              <div className="max-h-40 overflow-auto space-y-1">
                {statusOptions.map(s => (
                  <label key={s} className="flex items-center gap-2 text-sm capitalize">
                    <input type="checkbox" checked={fStatuses.includes(s)} onChange={(e)=> {
                      setFStatuses(prev => e.target.checked ? [...prev, s] : prev.filter(x=>x!==s));
                    }}/>
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium">Deal Type</div>
                <div className="space-x-2">
                  <button type="button" className="text-xs text-indigo-600 hover:underline" onClick={()=> setFDealTypes(dealTypeOptions.map(d=>d.value))}>Select All</button>
                  <button type="button" className="text-xs text-gray-600 hover:underline" onClick={()=> setFDealTypes([])}>Deselect All</button>
                </div>
              </div>
              <div className="max-h-40 overflow-auto space-y-1">
                {dealTypeOptions.map(d => (
                  <label key={d.value} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={fDealTypes.includes(d.value)} onChange={(e)=> {
                      setFDealTypes(prev => e.target.checked ? [...prev, d.value] : prev.filter(x=>x!==d.value));
                    }}/>
                    <span>{d.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium">Mediator</div>
                <div className="space-x-2">
                  <button type="button" className="text-xs text-indigo-600 hover:underline" onClick={()=> setFMediatorIds(mediators.map(m=>m.id))}>Select All</button>
                  <button type="button" className="text-xs text-gray-600 hover:underline" onClick={()=> setFMediatorIds([])}>Deselect All</button>
                </div>
              </div>
              <input className="border p-1 rounded w-full mb-2 text-sm" placeholder="Search name or phone" value={mediatorQuery} onChange={(e)=> setMediatorQuery(e.target.value)} />
              <div className="max-h-40 overflow-auto space-y-1">
                {filteredMediators.map(m => (
                  <label key={m.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={fMediatorIds.includes(m.id)} onChange={(e)=> {
                      setFMediatorIds(prev => e.target.checked ? [...prev, m.id] : prev.filter(x=>x!==m.id));
                    }}/>
                    <span>{m.name} {m.phone ? `· ${m.phone}` : ''}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={()=> { setAPlatformIds(fPlatformIds); setAMediatorIds(fMediatorIds); setAStatuses(fStatuses); setADealTypes(fDealTypes); setPage(0); loadReviews(); }} className="px-3 py-2 bg-blue-600 text-white rounded">Apply Filters</button>
            <button onClick={()=> setConfirm({ open:true, title:'Clear Filters', message:'Clear all selected filters?', onConfirm:()=> { setFPlatformIds([]); setFMediatorIds([]); setFStatuses([]); setFDealTypes([]); } })} className="px-3 py-2 border rounded">Clear Filters</button>
            <button onClick={saveFilters} className="px-3 py-2 border rounded">Save Filters</button>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mb-3 text-sm text-gray-700">
        <div>
          Showing page {page + 1} of {Math.max(totalPages, 1)} ({totalElements} items)
        </div>
        <div className="space-x-2">
          <button disabled={page <= 0} onClick={() => setPage((p)=>Math.max(0,p-1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <button disabled={page >= totalPages - 1} onClick={() => setPage((p)=>Math.min(totalPages-1, p+1))} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          <select value={size} onChange={(e)=> { setSize(Number(e.target.value)); setPage(0);} } className="ml-2 border p-1 rounded">
            {[10,20,50,100].map(n => <option key={n} value={n}>{n}/page</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div ref={tableWrapRef} className="relative rounded shadow overflow-auto">
      {headElevated && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-gray-300/40 to-transparent" />
      )}
      <table className="w-full border-collapse bg-white">
        <thead className={`sticky top-0 z-10 ${headElevated ? 'shadow-md' : ''}`}>
          <tr className="bg-gray-100/95 backdrop-blur text-left select-none">
            <th className="p-2 border"><input type="checkbox" checked={selected.size>0 && selected.size===reviews.length} onChange={(e)=> toggleAll(e.target.checked)} /></th>
            {[
              { key: 'orderId', label: 'Order ID' },
              { key: 'productName', label: 'Product' },
              { key: 'platformName', label: 'Platform' },
              { key: 'status', label: 'Status' },
              { key: 'dealType', label: 'Deal Type' },
              { key: 'mediatorName', label: 'Mediator' },
              { key: 'amountRupees', label: 'Amount' },
              { key: 'refundAmountRupees', label: 'Refund' },
            ].map(col => (
              <th
                key={col.key}
                className="p-2 border cursor-pointer"
                onClick={()=> toggleSort(col.key)}
                title="Click to sort"
              >
                {col.label}{sortField===col.key ? (sortDir==='asc' ? ' ▲' : ' ▼') : ''}
              </th>
            ))}
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((r, idx) => (
            <tr key={r.id} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              <td className="p-2"><input type="checkbox" checked={selected.has(r.id)} onChange={(e)=> toggleOne(r.id, e.target.checked)} /></td>
              <td className="p-2">
                <button className="text-blue-600 hover:underline" onClick={()=> navigate(`/reviews/view/${r.id}`)}>{r.orderId}</button>
              </td>
              <td className="p-2">
                {r.orderLink ? (
                  <a href={r.orderLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {r.productName}
                  </a>
                ) : (
                  r.productName
                )}
              </td>
              <td className="p-2">{platformMap[r.platformId] || r.platformId}</td>
              <td className="p-2 capitalize">{r.status}</td>
              <td className="p-2">{dealTypeLabel(r.dealType)}</td>
              <td className="p-2">
                {r.mediatorId ? (
                  <a
                    href={`https://wa.me/${(mediatorMap[r.mediatorId]?.phone || "").replace(/^\+/, '')}?text=${encodeURIComponent(`Hi ${mediatorMap[r.mediatorId]?.name || ""}, regarding order ${r.orderId}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 hover:underline"
                  >
                    {mediatorMap[r.mediatorId]?.name || r.mediatorId}
                  </a>
                ) : null}
              </td>
              <td className="p-2">₹{r.amountRupees}</td>
              <td className="p-2">₹{r.refundAmountRupees ?? (Number(r.amountRupees ?? 0) - Number(r.lessRupees ?? 0))}</td>
              <td className="p-2 space-x-2">
                <button
                  onClick={() => navigate(`/reviews/edit/${r.id}`)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded inline-flex items-center gap-1"
                >
                  <PencilSquareIcon className="w-4 h-4"/>
                  Edit
                </button>
                <button
                  onClick={() => duplicateRow(r)}
                  className="bg-slate-600 text-white px-2 py-1 rounded inline-flex items-center gap-1"
                >
                  <DocumentDuplicateIcon className="w-4 h-4"/>
                  Duplicate
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded inline-flex items-center gap-1"
                >
                  <TrashIcon className="w-4 h-4"/>
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {reviews.length === 0 && (
            <tr>
              <td colSpan="7" className="p-4 text-center text-gray-500">
                No reviews found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
      <Modal open={!!confirmId} title="Delete Review" onClose={()=> setConfirmId(null)}>
        <p className="mb-4">Are you sure you want to delete this review?</p>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 border rounded" onClick={()=> setConfirmId(null)}>Cancel</button>
          <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={doDelete}>Delete</button>
        </div>
      </Modal>
      <Modal open={confirm.open} title={confirm.title} onClose={()=> setConfirm({ open:false, title:'', message:'', onConfirm:null })}>
        <p className="mb-4">{confirm.message}</p>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 border rounded" onClick={()=> setConfirm({ open:false, title:'', message:'', onConfirm:null })}>Cancel</button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={()=> { const cb = confirm.onConfirm; setConfirm({ open:false, title:'', message:'', onConfirm:null }); cb?.(); }}>Confirm</button>
        </div>
      </Modal>
    </div>
  );
}

function dealTypeLabel(code) {
  switch (code) {
    case 'REVIEW_PUBLISHED': return 'Review Published';
    case 'REVIEW_SUBMISSION': return 'Review Submission';
    case 'RATING_ONLY': return 'Rating Only';
    default: return code || '-';
  }
}
