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
      <h2 className="text-2xl font-bold mb-4">Edit Review</h2>
      <ReviewForm review={review} onSuccess={() => navigate("/reviews")} />
    </div>
  );
}
