import { Routes, Route } from "react-router-dom";
import ReviewTable from "../components/ReviewTable";
import AddReview from "./AddReview";
import EditReview from "./EditReview";
import ReviewDetails from "./ReviewDetails";

export default function Reviews() {
  return (
    <Routes>
      <Route index element={<ReviewTable />} />
      <Route path="new" element={<AddReview />} />
      <Route path="edit/:id" element={<EditReview />} />
      <Route path="view/:id" element={<ReviewDetails />} />
    </Routes>
  );
}
