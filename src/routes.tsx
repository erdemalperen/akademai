import { createBrowserRouter, Navigate } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import CalendarPage from "./pages/CalendarPage";
import TrainingsPage from "./pages/TrainingsPage";
import TrainingDetailPage from "./pages/TrainingDetailPage";
import AssignedBootcampsPage from "./pages/bootcamps/index"; 
import BootcampDetailPage from "./pages/bootcamps/BootcampDetailPage";
import AdminUsersPage from "./pages/admin/UsersPage";
import AdminTrainingsPage from "./pages/admin/AdminTrainingsPage";
import AdminConferencesPage from "./pages/admin/AdminConferencesPage";
import ConferenceAttendeesPage from "./pages/admin/ConferenceAttendeesPage";
import BootcampAttendeesPage from "./pages/admin/BootcampAttendeesPage";
import EmployeeConferencesPage from "./pages/EmployeeConferencesPage";
import AdminTrainingEditor from "./components/training/AdminTrainingEditor";
import { ErrorDisplay } from "./components/ui/ErrorBoundary";
import AllTrainingsPage from "./pages/dashboard/AllTrainingsPage";
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-full p-6">
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    <p className="text-gray-500">Bu sayfa şu anda geliştirilme aşamasındadır.</p>
  </div>
);

import ReportsPage from "./pages/ReportsPage";
import LanguageLearningPage from "./pages/LanguageLearningPage";
import LoginPage from "./pages/auth/LoginPage";
import AdminLoginPage from "./pages/auth/AdminLoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import AdminRegisterPage from "./pages/auth/AdminRegisterPage";
import AuthLayout from "./components/layout/AuthLayout";
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminProtectedRoute from "./components/auth/AdminProtectedRoute";
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
    errorElement: <ErrorDisplay />
  },
  {
    path: "/",
    element: <AuthLayout />,
    errorElement: <ErrorDisplay />,
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "login/admin",
        element: <AdminLoginPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
      {
        path: "register/admin",
        element: <AdminRegisterPage />,
      },
    ],
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorDisplay />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "trainings",
        element: <TrainingsPage />,
      },
      {
        path: "trainings/all",
        element: <AllTrainingsPage />,
      },
      {
        path: "trainings/:trainingId",
        element: <TrainingDetailPage />,
      },
      {
        path: "bootcamps",
        element: <AssignedBootcampsPage />,
      },
      {
        path: "bootcamps/:bootcampId",
        element: <BootcampDetailPage />,
      },
      {
        path: "conferences",
        element: <EmployeeConferencesPage />,
      },
      {
        path: "calendar",
        element: <CalendarPage />,
      },
            {
        path: "language-learning",
        element: <LanguageLearningPage />,
      },
      {
        path: "reports",
        element: (
          <AdminProtectedRoute>
            <ReportsPage />
          </AdminProtectedRoute>
        ),
      },
      {
        path: "users",
        element: (
          <AdminProtectedRoute>
            <AdminUsersPage />
          </AdminProtectedRoute>
        ),
      },
      {
        path: "admin/trainings",
        element: (
          <AdminProtectedRoute>
            <AdminTrainingsPage />
          </AdminProtectedRoute>
        ),
      },
      {
        path: "admin/bootcamps",
        element: (
          <AdminProtectedRoute>
            <AdminTrainingsPage isBootcampMode={true} />
          </AdminProtectedRoute>
        ),
      },
      {
        path: "admin/conferences",
        element: (
          <AdminProtectedRoute>
            <AdminConferencesPage />
          </AdminProtectedRoute>
        ),
      },
      
      {
        path: "admin/conferences/:conferenceId/attendees",
        element: (
          <AdminProtectedRoute>
            <ConferenceAttendeesPage />
          </AdminProtectedRoute>
        ),
      },
      {
        path: "admin/bootcamps/:bootcampId/attendees",
        element: (
          <AdminProtectedRoute>
            <BootcampAttendeesPage />
          </AdminProtectedRoute>
        ),
      },
      {
        path: "admin/trainings/edit/:id",
        element: (
          <AdminProtectedRoute>
            <AdminTrainingEditor />
          </AdminProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/trainings",
    element: <Navigate to="/dashboard/trainings" replace />,
    errorElement: <ErrorDisplay />,
  },
  {
    path: "/trainings/all",
    element: <Navigate to="/dashboard/trainings/all" replace />,
    errorElement: <ErrorDisplay />,
  },
  {
    path: "/trainings/:id",
    element: <Navigate to="/dashboard/trainings/:id" replace />,
    errorElement: <ErrorDisplay />,
  },
  {
    path: "/calendar",
    element: <Navigate to="/dashboard/calendar" replace />,
    errorElement: <ErrorDisplay />,
  },
  {
    path: "/reports",
    element: <Navigate to="/dashboard/reports" replace />,
    errorElement: <ErrorDisplay />,
  },
  {
    path: "/users",
    element: <Navigate to="/dashboard/users" replace />,
    errorElement: <ErrorDisplay />,
  },
  {
    path: "/uploads/*",
    element: null,
    errorElement: <ErrorDisplay />,
  }
]);

