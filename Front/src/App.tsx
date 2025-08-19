import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
// Public Pages
import { HomePage } from './pages/public/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
// Dashboard Pages
import { SuperuserDashboard } from './pages/dashboard/SuperuserDashboard';
import {AdminDashboard} from './pages/dashboard/AdminDashboard';
import { WarehouseDashboard } from './pages/dashboard/WarehouseDashboard';
import { SellerDashboard } from './pages/dashboard/SellerDashboard';
import { RunnerDashboard } from './pages/dashboard/RunnerDashboard';

// Loading Component
const LoadingSpinner: React.FC = () => (
 <div className="flex items-center justify-center min-h-screen">
   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
   <p className="ml-4 text-gray-600">Cargando...</p>
 </div>
);

// Protected Route Component
const ProtectedRoute: React.FC<{
 children: React.ReactNode;
 allowedRoles: string[];
}> = ({ children, allowedRoles }) => {
 const { isAuthenticated, user, hasRole, loading } = useAuth();
 
 if (loading) {
   return <LoadingSpinner />;
 }
 
 if (!isAuthenticated) {
   return <Navigate to="/login" />;
 }
 
 if (!hasRole(allowedRoles as any[])) {
   return <Navigate to="/" />;
 }
 
 return <>{children}</>;
};

// Component to handle root redirect

const RootRedirect: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (isAuthenticated && user) {
    switch (user.role) {
      case 'superuser':
        return <Navigate to="/superuser" replace />;
      case 'administrador':
        return <Navigate to="/administrador" replace />;
      case 'bodeguero':
        return <Navigate to="/warehouse" replace />;
      case 'seller':
        return <Navigate to="/seller" replace />;
      case 'corredor':
        return <Navigate to="/runner" replace />;
      default:
        return <Navigate to="/home" replace />;
    }
  }

  return <Navigate to="/login" replace />;
};



// App Routes Component
const AppRoutes: React.FC = () => {
 const { loading } = useAuth();
 
 if (loading) {
   return <LoadingSpinner />;
 }
 
 return (
   <Routes>
     {/* Root route - redirect based on authentication */}
     <Route path="/" element={<RootRedirect />} />
     <Route path="/login" element={<LoginPage />} />
     <Route path="/home" element={<HomePage />} />
     
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
       path="/administrador"
       element={
         <ProtectedRoute allowedRoles={['administrador', 'superuser']}>
           <AdminDashboard />
         </ProtectedRoute>
       }
     />
     <Route
       path="/warehouse"
       element={
         <ProtectedRoute allowedRoles={['bodeguero', 'admin', 'superuser']}>
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
         <ProtectedRoute allowedRoles={['corredor', 'admin', 'superuser']}>
           <RunnerDashboard />
         </ProtectedRoute>
       }
     />
     
     {/* Fallback Route */}
     <Route path="*" element={<Navigate to="/" />} />
   </Routes>
 );
};

function App() {
 return (
   <AuthProvider>
     <Router>
       <AppRoutes />
     </Router>
   </AuthProvider>
 );
}

export default App;