import { useEffect, useState, useCallback, useMemo } from "react";
import { deleteReview, searchReviews } from "../api/reviews";
import { getPlatforms, getMediators, getStatuses } from "../api/lookups";
import { useNavigate } from "react-router-dom";
import Modal from "./Modal";
import { useToast } from "./ToastProvider";

export default function ReviewTable() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platforms, setPlatforms] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [mediators, setMediators] = useState([]);

  // Advanced search filters
  const [fPlatformId, setFPlatformId] = useState("");
  const [fStatusId, setFStatusId] = useState("");
  const [fMediatorId, setFMediatorId] = useState("");
  const [fProductName, setFProductName] = useState("");
  const [fOrderId, setFOrderId] = useState("");

  // Sorting
  const [sortField, setSortField] = useState("orderedDate");
  const [sortDir, setSortDir] = useState("desc"); // 'asc' | 'desc'
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [quickMode, setQuickMode] = useState("both"); // both | product | order

  const platformMap = useMemo(() => Object.fromEntries(platforms.map(p => [p.id, p.name])), [platforms]);
  const statusMap = useMemo(() => Object.fromEntries(statuses.map(s => [s.id, s.name])), [statuses]);
  const mediatorMap = useMemo(() => Object.fromEntries(mediators.map(m => [m.id, m])), [mediators]);
  const navigate = useNavigate();
  const toast = useToast();

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const criteria = {
        platformId: fPlatformId || undefined,
        statusId: fStatusId || undefined,
        mediatorId: fMediatorId || undefined,
        productNameContains: (fProductName || ((quickMode === "both" || quickMode === "product") ? search : "")) || undefined,
        orderIdContains: (fOrderId || ((quickMode === "both" || quickMode === "order") ? search : "")) || undefined,
      };
      const [res, pRes, sRes, mRes] = await Promise.all([
        searchReviews(criteria, {
          page,
          size,
          sort: sortField,
          dir: sortDir.toUpperCase(),
        }),
        getPlatforms(),
        getStatuses(),
        getMediators(),
      ]);
      const pr = res.data;
      let list = pr.content || [];
      // client-side sort by name-based pseudo fields
      if (["platformName","statusName","mediatorName"].includes(sortField)) {
        const nameOf = (r) => sortField === 'platformName' ? (platformMap[r.platformId]||'') : sortField === 'statusName' ? (statusMap[r.statusId]||'') : (mediatorMap[r.mediatorId]?.name||'');
        list = [...list].sort((a,b) => {
          const av = nameOf(a), bv = nameOf(b);
          const cmp = String(av).localeCompare(String(bv));
          return (sortDir === 'asc' ? cmp : -cmp);
        });
      }
      setReviews(list);
      setTotalPages(pr.totalPages ?? 0);
      setTotalElements(pr.totalElements ?? 0);
      setPlatforms(pRes.data);
      setStatuses(sRes.data);
      setMediators(mRes.data);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    }
    setLoading(false);
  }, [search, fPlatformId, fStatusId, fMediatorId, fProductName, fOrderId, sortField, sortDir, page, size, quickMode]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

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

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-56">
            <label className="block text-sm font-medium">Quick Search</label>
            <input
              type="text"
              placeholder="Search by product or order ID"
              className="border p-2 rounded w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Quick Search In</label>
            <select className="border p-2 rounded" value={quickMode} onChange={(e)=> { setQuickMode(e.target.value); setPage(0);} }>
              <option value="both">Product + Order ID</option>
              <option value="product">Product</option>
              <option value="order">Order ID</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Platform</label>
            <select className="border p-2 rounded" value={fPlatformId} onChange={(e)=>setFPlatformId(e.target.value)}>
              <option value="">All</option>
              {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Status</label>
            <select className="border p-2 rounded" value={fStatusId} onChange={(e)=>setFStatusId(e.target.value)}>
              <option value="">All</option>
              {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Mediator</label>
            <select className="border p-2 rounded" value={fMediatorId} onChange={(e)=>setFMediatorId(e.target.value)}>
              <option value="">All</option>
              {mediators.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Product</label>
            <input className="border p-2 rounded" value={fProductName} onChange={(e)=>setFProductName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Order ID</label>
            <input className="border p-2 rounded" value={fOrderId} onChange={(e)=>setFOrderId(e.target.value)} />
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={loadReviews} className="bg-blue-500 text-white px-4 py-2 rounded self-end">Search</button>
            <button onClick={() => navigate("/reviews/new")} className="bg-green-500 text-white px-4 py-2 rounded self-end">+ Add Review</button>
          </div>
        </div>
      </div>

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
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200 text-left select-none">
            {[
              { key: 'orderId', label: 'Order ID' },
              { key: 'productName', label: 'Product' },
              { key: 'platformName', label: 'Platform' },
              { key: 'statusName', label: 'Status' },
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
          {reviews.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="p-2">{r.orderId}</td>
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
              <td className="p-2">{statusMap[r.statusId] || r.statusId}</td>
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
                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
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
      <Modal open={!!confirmId} title="Delete Review" onClose={()=> setConfirmId(null)}>
        <p className="mb-4">Are you sure you want to delete this review?</p>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 border rounded" onClick={()=> setConfirmId(null)}>Cancel</button>
          <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={doDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
