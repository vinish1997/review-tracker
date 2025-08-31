import ReviewForm from "../components/ReviewForm";
import { useNavigate } from "react-router-dom";

export default function AddReview() {
  const navigate = useNavigate();
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Add New Review</h2>
      <ReviewForm onSuccess={() => navigate("/reviews")} />
    </div>
  );
}
