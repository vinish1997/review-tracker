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

  if (!review) return <p>Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Edit Review</h2>
        <button className="px-3 py-1 border rounded" onClick={()=> navigate(-1)}>Cancel</button>
      </div>
      <ReviewForm review={review} onSuccess={() => navigate("/reviews")} />
    </div>
  );
}
