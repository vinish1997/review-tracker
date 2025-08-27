import { Routes, Route } from "react-router-dom";
import ReviewTable from "../components/ReviewTable";
import ReviewForm from "../components/ReviewForm";

export default function Reviews() {
  return (
    <Routes>
      <Route path="/" element={<ReviewTable />} />
      <Route path="/new" element={<ReviewForm />} />
      <Route path="/edit/:id" element={<ReviewForm />} />
    </Routes>
  );
}
