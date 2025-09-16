import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { useState } from "react";
import ToastProvider from "./components/ToastProvider";
import Dashboard from "./pages/Dashboard";
import SharedView from "./pages/SharedView";
import Reviews from "./pages/Reviews";
import Lookups from "./pages/Lookups";
import Archive from "./pages/Archive";

function App() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  return (
    <BrowserRouter>
      <ToastProvider>
        {/* Mobile Top Bar */}
        <header className="md:hidden fixed top-0 inset-x-0 z-40 bg-gray-800 text-white h-12 flex items-center justify-between px-4">
          <button
            aria-label="Open menu"
            className="px-2 py-1 rounded hover:bg-gray-700 active:bg-gray-600"
            onClick={() => setMobileNavOpen(true)}
          >
            {/* Simple hamburger */}
            <span aria-hidden>☰</span>
          </button>
          <div className="text-base font-semibold">Review Tracker</div>
          <span className="w-6" />
        </header>

        {/* Mobile Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
            <nav className="relative h-full w-64 bg-gray-800 text-white p-4 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-lg font-bold">Review Tracker</h1>
                <button
                  aria-label="Close menu"
                  className="px-2 py-1 rounded hover:bg-gray-700 active:bg-gray-600"
                  onClick={() => setMobileNavOpen(false)}
                >
                  ✕
                </button>
              </div>
              <Link to="/dashboard" className="block hover:text-gray-300" onClick={() => setMobileNavOpen(false)}>Dashboard</Link>
              <Link to="/reviews" className="block hover:text-gray-300" onClick={() => setMobileNavOpen(false)}>Reviews</Link>
              <Link to="/lookups" className="block hover:text-gray-300" onClick={() => setMobileNavOpen(false)}>Lookups</Link>
              <Link to="/archive" className="block hover:text-gray-300" onClick={() => setMobileNavOpen(false)}>Archive</Link>
            </nav>
          </div>
        )}

        <div className="md:flex md:h-screen">
          {/* Sidebar (desktop) */}
          <nav className="hidden md:block w-60 bg-gray-800 text-white p-4 space-y-4">
            <h1 className="text-xl font-bold">Review Tracker</h1>
            <Link to="/dashboard" className="block hover:text-gray-300">Dashboard</Link>
            <Link to="/reviews" className="block hover:text-gray-300">Reviews</Link>
            <Link to="/lookups" className="block hover:text-gray-300">Lookups</Link>
            <Link to="/archive" className="block hover:text-gray-300">Archive</Link>
          </nav>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 md:overflow-y-auto pt-12 md:pt-0">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reviews/*" element={<Reviews />} />
              <Route path="/lookups" element={<Lookups />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/shared/:slug" element={<SharedView />} />
            </Routes>
          </main>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
