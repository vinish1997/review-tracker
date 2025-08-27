import ReviewForm from "../components/ReviewForm";

export default function AddReview() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Add New Review</h2>
      <ReviewForm onSuccess={() => alert("Review Created!")} />
    </div>
  );
}
