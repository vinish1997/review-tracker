import ReviewForm from "../components/ReviewForm";
import { useLocation, useNavigate } from "react-router-dom";

export default function AddReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state?.prefill || null;
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header (same width as card) */}
      <div className="p-6 rounded-t-xl bg-gradient-to-r from-indigo-50 via-white to-emerald-50">
        <h2 className="text-2xl font-bold text-gray-900">Create Review</h2>
        <p className="text-gray-600">Add a new review entry</p>
      </div>

      {/* Card */}
      <div className="bg-white p-6 rounded-b-xl shadow">
        <ReviewForm initialValues={prefill || undefined} onSuccess={() => navigate("/reviews")} onCancel={() => navigate('/reviews')} />
      </div>
    </div>
  );
}
