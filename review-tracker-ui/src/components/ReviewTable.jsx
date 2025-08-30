import { useEffect, useState, useCallback, useMemo } from "react";
import { getReviews, deleteReview } from "../api/reviews";
import { getPlatforms, getMediators, getStatuses } from "../api/lookups";
import { useNavigate } from "react-router-dom";

export default function ReviewTable() {
  const [rawReviews, setRawReviews] = useState([]);
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

  const platformMap = useMemo(() => Object.fromEntries(platforms.map(p => [p.id, p.name])), [platforms]);
  const statusMap = useMemo(() => Object.fromEntries(statuses.map(s => [s.id, s.name])), [statuses]);
  const mediatorMap = useMemo(() => Object.fromEntries(mediators.map(m => [m.id, m.name])), [mediators]);
  const navigate = useNavigate();

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const [res, pRes, sRes, mRes] = await Promise.all([
        getReviews({ search }),
        getPlatforms(),
        getStatuses(),
        getMediators(),
      ]);
      setRawReviews(res.data);
      setPlatforms(pRes.data);
      setStatuses(sRes.data);
      setMediators(mRes.data);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await deleteReview(id);
      loadReviews();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // Apply filters and sorting whenever dependencies change
  useEffect(() => {
    const filtered = rawReviews.filter(r => {
      if (fPlatformId && r.platformId !== fPlatformId) return false;
      if (fStatusId && r.statusId !== fStatusId) return false;
      if (fMediatorId && r.mediatorId !== fMediatorId) return false;
      if (fProductName && !(r.productName || "").toLowerCase().includes(fProductName.toLowerCase())) return false;
      if (fOrderId && !(r.orderId || "").toLowerCase().includes(fOrderId.toLowerCase())) return false;
      return true;
    });
    const sorted = [...filtered].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const av = a?.[sortField];
      const bv = b?.[sortField];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    setReviews(sorted);
  }, [rawReviews, fPlatformId, fStatusId, fMediatorId, fProductName, fOrderId, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
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

      {/* Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2 border cursor-pointer" onClick={()=>toggleSort("orderId")}>Order ID</th>
            <th className="p-2 border cursor-pointer" onClick={()=>toggleSort("productName")}>Product</th>
            <th className="p-2 border cursor-pointer" onClick={()=>toggleSort("platformId")}>Platform</th>
            <th className="p-2 border cursor-pointer" onClick={()=>toggleSort("statusId")}>Status</th>
            <th className="p-2 border cursor-pointer" onClick={()=>toggleSort("mediatorId")}>Mediator</th>
            <th className="p-2 border cursor-pointer" onClick={()=>toggleSort("amountRupees")}>Amount</th>
            <th className="p-2 border cursor-pointer" onClick={()=>toggleSort("refundAmountRupees")}>Refund</th>
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
                    href={`https://wa.me/?text=${encodeURIComponent(`Hi ${mediatorMap[r.mediatorId] || ""}, regarding order ${r.orderId}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 hover:underline"
                  >
                    {mediatorMap[r.mediatorId] || r.mediatorId}
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
    </div>
  );
}
