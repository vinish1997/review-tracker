import { useEffect, useState, useCallback } from "react";
import { getReviews, deleteReview } from "../api/reviews";
import { useNavigate } from "react-router-dom";

export default function ReviewTable() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReviews({ search });
      setReviews(res.data);
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

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      {/* Search Bar */}
      <div className="flex mb-4 justify-between">
        <input
          type="text"
          placeholder="Search by product or order ID"
          className="border p-2 rounded w-1/2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={loadReviews}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Search
        </button>
        <button
          onClick={() => navigate("/reviews/new")}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          + Add Review
        </button>
      </div>

      {/* Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2 border">Order ID</th>
            <th className="p-2 border">Product</th>
            <th className="p-2 border">Platform</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Amount</th>
            <th className="p-2 border">Refund</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="p-2">{r.orderId}</td>
              <td className="p-2">{r.productName}</td>
              <td className="p-2">{r.platform}</td>
              <td className="p-2">{r.status}</td>
              <td className="p-2">₹{r.amount}</td>
              <td className="p-2">₹{r.amount - r.less}</td>
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
