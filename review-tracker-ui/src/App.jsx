import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { ToastProvider } from "./components/ToastProvider";
import Dashboard from "./pages/Dashboard";
import Reviews from "./pages/Reviews";
import Lookups from "./pages/Lookups";

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <div className="flex h-screen">
        {/* Sidebar */}
        <nav className="w-60 bg-gray-800 text-white p-4 space-y-4">
          <h1 className="text-xl font-bold">Review Tracker</h1>
          <Link to="/" className="block hover:text-gray-300">Dashboard</Link>
          <Link to="/reviews" className="block hover:text-gray-300">Reviews</Link>
          <Link to="/lookups" className="block hover:text-gray-300">Lookups</Link>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/reviews/*" element={<Reviews />} />
            <Route path="/lookups" element={<Lookups />} />
          </Routes>
        </main>
      </div>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
