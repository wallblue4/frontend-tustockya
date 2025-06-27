import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { LoginPage } from './pages/auth/LoginPage';

// Dashboard Pages
import { SuperuserDashboard } from './pages/dashboard/SuperuserDashboard';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { WarehouseDashboard } from './pages/dashboard/WarehouseDashboard';
import { SellerDashboard } from './pages/dashboard/SellerDashboard';
import { RunnerDashboard } from './pages/dashboard/RunnerDashboard';

// Protected Route Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles: string[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, hasRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!hasRole(allowedRoles as any[])) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes */}
          <Route 
            path="/superuser" 
            element={
              <ProtectedRoute allowedRoles={['superuser']}>
                <SuperuserDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'superuser']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/warehouse" 
            element={
              <ProtectedRoute allowedRoles={['warehouse', 'admin', 'superuser']}>
                <WarehouseDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/seller" 
            element={
              <ProtectedRoute allowedRoles={['seller', 'admin', 'superuser']}>
                <SellerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/runner" 
            element={
              <ProtectedRoute allowedRoles={['runner', 'admin', 'superuser']}>
                <RunnerDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;