import { useNavigate, useParams } from "react-router-dom";
import ReviewForm from "../components/ReviewForm";
import { useEffect, useState } from "react";
import { getReview } from "../api/reviews";

export default function EditReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);

  useEffect(() => {
    getReview(id).then(res => setReview(res.data));
  }, [id]);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header (same width as card) */}
      <div className="p-6 rounded-t-xl bg-gradient-to-r from-indigo-50 via-white to-emerald-50">
        <h2 className="text-2xl font-bold text-gray-900">Edit Review</h2>
        <p className="text-gray-600">Update existing review details</p>
      </div>

      {/* Card */}
      {!review ? (
        <div className="bg-white p-6 rounded-b-xl shadow animate-pulse">
          <div className="space-y-3">
            {Array.from({length:6}).map((_,i)=> (
              <div key={i} className="h-4 bg-gray-200 rounded" />
            ))}
            <div className="h-10 bg-gray-200 rounded w-32" />
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-b-xl shadow">
          <ReviewForm review={review} onSuccess={() => navigate("/reviews")} onCancel={()=> navigate(-1)} />
        </div>
      )}
    </div>
  );
}
