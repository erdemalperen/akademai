import { RouteObject, createBrowserRouter, Navigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import React, { useState } from 'react';
import Header from '../components/layout/Header';
import { UserRole } from '../types';

import AdminLayout from '../layouts/AdminLayout';

import BootcampDetailPage from '../pages/bootcamps/BootcampDetailPage';
import AssignedBootcampsPage from '../pages/bootcamps'; 
import AdminTrainingsPage from '../pages/admin/AdminTrainingsPage'; 
import AdminBootcampsPage from '../pages/admin/AdminBootcampsPage';
import AdminManagementPage from '../pages/admin/AdminManagementPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';

import AdminProtectedRoute from '../components/auth/AdminProtectedRoute';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const handleLogout = () => {
      console.log("Logout request from AppLayout");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleSidebar={handleToggleSidebar} onLogout={handleLogout} />
      <main className="flex-1 container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem('user_info');
  if (!user) {
    console.log("[ProtectedRoute] Kullanıcı bilgisi bulunamadı. Giriş sayfasına yönlendiriliyor.");
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const LoginPage = () => <div>Login Page</div>;
const AdminLoginPage = () => <div>Admin Login Page</div>;
const EmployeeDashboardPage = () => <div>Employee Dashboard Page</div>;
const TrainingDetailPage = () => <div>Training Detail Page</div>;
const AdminEmployeesPage = () => <div>Admin Employees Page</div>;
const AdminProfilePage = () => <div>Admin Profile Page</div>;
const AdminSettingsPage = () => <div>Admin Settings Page</div>;
const AdminSystemSettingsPage = () => <div>Admin System Settings Page</div>;

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'login/admin', element: <AdminLoginPage /> },
    ],
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <EmployeeDashboardPage /> },
      { path: 'bootcamps', element: <AssignedBootcampsPage /> },
      { path: 'bootcamps/:bootcampId', element: <BootcampDetailPage /> },
      { path: 'trainings/:trainingId', element: <TrainingDetailPage /> },
      
      { 
        path: 'management', 
        element: (
          <AdminProtectedRoute role={UserRole.ADMIN_SENIOR}>
            <AdminManagementPage />
          </AdminProtectedRoute>
        )
      },
      
      {
        path: 'admin',
        element: (
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        ),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <AdminDashboardPage /> },
          { path: 'trainings', element: <AdminTrainingsPage /> },
          { path: 'bootcamps', element: <AdminBootcampsPage /> },
          { path: 'employees', element: <AdminEmployeesPage /> },
          { path: 'profile', element: <AdminProfilePage /> },
          { path: 'settings', element: <AdminSettingsPage /> },
          { path: 'system-settings', element: <AdminSystemSettingsPage /> },
          { 
            path: 'management', 
            element: (
              <AdminProtectedRoute role={UserRole.ADMIN_SENIOR}>
                <AdminManagementPage />
              </AdminProtectedRoute>
            )
          }, 
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes); 