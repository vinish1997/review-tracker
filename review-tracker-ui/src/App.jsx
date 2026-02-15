import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import ToastProvider from "./components/ToastProvider";
import BottomNav from "./components/BottomNav";
import FAB from "./components/FAB";
import Dashboard from "./pages/Dashboard";
import SharedView from "./pages/SharedView";
import Reviews from "./pages/Reviews";
import Lookups from "./pages/Lookups";
import Archive from "./pages/Archive";
import Notifications from "./pages/Notifications";
import NotificationRules from "./pages/NotificationRules";

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        {/* Mobile Top Bar */}
        <header className="md:hidden fixed top-0 inset-x-0 z-40 bg-gray-800 text-white h-12 flex items-center px-4 shadow-md">
          <div className="text-base font-semibold">Review Tracker</div>
        </header>

        <div className="md:flex md:h-screen">
          {/* Sidebar (desktop) */}
          <nav className="hidden md:block w-60 bg-gray-800 text-white p-4 space-y-4">
            <h1 className="text-xl font-bold">Review Tracker</h1>
            <Link to="/dashboard" className="block hover:text-gray-300">Dashboard</Link>
            <Link to="/reviews" className="block hover:text-gray-300">Reviews</Link>
            <Link to="/notifications" className="block hover:text-gray-300">Notifications</Link>
            <Link to="/lookups" className="block hover:text-gray-300">Lookups</Link>
            <Link to="/archive" className="block hover:text-gray-300">Archive</Link>
          </nav>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 md:overflow-y-auto pt-16 md:pt-0 pb-20 md:pb-0">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reviews/*" element={<Reviews />} />
              <Route path="/lookups" element={<Lookups />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/notification-rules" element={<NotificationRules />} />
              <Route path="/shared/:slug" element={<SharedView />} />
            </Routes>
          </main>
        </div>

        {/* Mobile Navigation */}
        <BottomNav />
        <FAB />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
