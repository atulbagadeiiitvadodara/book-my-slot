import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import AvailabilityPage from '../pages/AvailabilityPage';
import BookingsPage from '../pages/BookingsPage';
import PublicBookingPage from '../pages/PublicBookingPage';
import CancelPage from '../pages/CancelPage';
import DashboardLayout from '../layouts/DashboardLayout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-text-muted text-sm">Loading...</div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/u/:slug" element={<PublicBookingPage />} />
        <Route path="/cancel/:token" element={<CancelPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="availability" element={<AvailabilityPage />} />
          <Route path="bookings" element={<BookingsPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
