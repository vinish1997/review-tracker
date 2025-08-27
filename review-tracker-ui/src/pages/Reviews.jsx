import { Routes, Route } from "react-router-dom";
import ReviewTable from "../components/ReviewTable";
import AddReview from "./AddReview";
import EditReview from "./EditReview";

export default function Reviews() {
  return (
    <Routes>
      <Route path="/" element={<ReviewTable />} />
      <Route path="/new" element={<AddReview />} />
      <Route path="/edit/:id" element={<EditReview />} />
    </Routes>
  );
}
