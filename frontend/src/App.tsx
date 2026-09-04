import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Spinner from './components/ui/Spinner';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const VerifySearch = lazy(() => import('./pages/VerifySearch'));
const VerifyDetail = lazy(() => import('./pages/VerifyDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AcceptInvitation = lazy(() => import('./pages/AcceptInvitation'));

const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const Certificates = lazy(() => import('./pages/dashboard/Certificates'));
const NewCertificate = lazy(() => import('./pages/dashboard/NewCertificate'));
const CertificateDetail = lazy(() => import('./pages/dashboard/CertificateDetail'));
const Templates = lazy(() => import('./pages/dashboard/Templates'));
const NewTemplate = lazy(() => import('./pages/dashboard/NewTemplate'));
const EditTemplate = lazy(() => import('./pages/dashboard/EditTemplate'));
const Recipients = lazy(() => import('./pages/dashboard/Recipients'));
const Analytics = lazy(() => import('./pages/dashboard/Analytics'));
const AuditLogs = lazy(() => import('./pages/dashboard/AuditLogs'));
const OrgProfile = lazy(() => import('./pages/dashboard/OrgProfile'));
const Settings = lazy(() => import('./pages/dashboard/Settings'));
const Members = lazy(() => import('./pages/dashboard/Members'));
const StaffDashboard = lazy(() => import('./pages/dashboard/StaffDashboard'));
const Reviews = lazy(() => import('./pages/dashboard/Reviews'));

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Spinner size="lg" />
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function DashboardHome() {
  const { organization, loading } = useAuth();
  const role = organization?.role;

  // Wait until auth is fully loaded before deciding which dashboard to show
  if (loading) return <LoadingScreen />;
  if (role === 'STAFF') return <Navigate to="/dashboard/staff" replace />;
  return <Dashboard />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, organization, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  const role = organization?.role;
  if (role === 'STAFF') return <Navigate to="/dashboard/staff" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify" element={<VerifySearch />} />
          <Route path="/verify/:id" element={<VerifyDetail />} />
        </Route>

        <Route path="/accept-invitation" element={<AcceptInvitation />} />

        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardHome />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="certificates/new" element={<NewCertificate />} />
          <Route path="certificates/bulk" element={<NewCertificate bulk />} />
          <Route path="certificates/:id" element={<CertificateDetail />} />
          <Route path="templates" element={<Templates />} />
          <Route path="templates/new" element={<AdminRoute><NewTemplate /></AdminRoute>} />
          <Route path="templates/:id/edit" element={<AdminRoute><EditTemplate /></AdminRoute>} />
          <Route path="recipients" element={<Recipients />} />
          <Route path="analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
          <Route path="audit-logs" element={<AdminRoute><AuditLogs /></AdminRoute>} />
          <Route path="organization" element={<AdminRoute><OrgProfile /></AdminRoute>} />
          <Route path="members" element={<AdminRoute><Members /></AdminRoute>} />
          <Route path="staff" element={<StaffDashboard />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
