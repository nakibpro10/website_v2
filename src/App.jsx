import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoadingScreen from './components/LoadingScreen';
import ToastContainer from './components/ToastContainer';
import PinModal from './components/PinModal';
import GooglePasswordSetupModal from './components/GooglePasswordSetupModal';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import SubscriptionPage from './pages/SubscriptionPage';
import AdminPage from './pages/AdminPage';
import TosPage from './pages/TosPage';
import PrivacyPage from './pages/PrivacyPage';

const ADMIN_EMAILS = ['admin@nakibcloud.com', 'nakibpro1@gmail.com'];

function ProtectedRoute({ children }) {
  const { authState } = useAuth();
  const location = useLocation();

  if (authState === 'loading') {
    return <><LoadingScreen /><ToastContainer /></>;
  }

  if (authState === 'unauthenticated') {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (authState === 'google-setup') {
    return <><GooglePasswordSetupModal /><ToastContainer /></>;
  }

  if (authState === 'pin-setup' || authState === 'pin-verify') {
    return <><PinModal isSetup={authState === 'pin-setup'} /><ToastContainer /></>;
  }

  if (authState === 'authenticated') {
    return children;
  }

  return <><LoadingScreen /><ToastContainer /></>;
}

function AdminRoute({ children }) {
  const { currentUser } = useAuth();
  const isAdmin = ADMIN_EMAILS.includes(currentUser?.email);
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function AdminFab() {
  const navigate = useNavigate();
  return (
    <button
      className="admin-fab-btn"
      onClick={() => navigate('/admin')}
    >
      <i className="fas fa-shield-alt"></i> Admin
    </button>
  );
}

export default function App() {
  const { authState, currentUser } = useAuth();
  const isAdmin = ADMIN_EMAILS.includes(currentUser?.email);

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/tos" element={<TosPage />} />
        <Route path="/privacy-policy" element={<PrivacyPage />} />

        {/* Auth route */}
        <Route
          path="/auth"
          element={
            authState === 'authenticated' ? (
              <Navigate to="/dashboard" replace />
            ) : authState === 'loading' ? (
              <><LoadingScreen /><ToastContainer /></>
            ) : authState === 'google-setup' ? (
              <><GooglePasswordSetupModal /><ToastContainer /></>
            ) : (authState === 'pin-setup' || authState === 'pin-verify') ? (
              <><PinModal isSetup={authState === 'pin-setup'} /><ToastContainer /></>
            ) : (
              <><AuthPage /><ToastContainer /></>
            )
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
              <ToastContainer />
              {isAdmin && <AdminFab />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/subscription"
          element={
            <ProtectedRoute>
              <SubscriptionPage />
              <ToastContainer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminPage currentUserEmail={currentUser?.email} />
                <ToastContainer />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        {/* Root redirect */}
        <Route
          path="/"
          element={
            authState === 'authenticated' ? (
              <Navigate to="/dashboard" replace />
            ) : authState === 'loading' ? (
              <><LoadingScreen /><ToastContainer /></>
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* Catch all */}
        <Route
          path="*"
          element={
            authState === 'authenticated' ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
      </Routes>
    </>
  );
}
