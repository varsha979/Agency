import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";

import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import Agencies from "./pages/super-admin/Agencies";
import AgencyDetails from "./pages/super-admin/AgencyDetails";
import PlatformActivities from "./pages/super-admin/PlatformActivities";

import AgencyDashboard from "./pages/agency/AgencyDashboard";
import Team from "./pages/agency/Team";
import Clients from "./pages/agency/Clients";
import Projects from "./pages/agency/Projects";
import ProjectDetails from "./pages/agency/ProjectDetails";
import Meetings from "./pages/agency/Meetings";
import Feedback from "./pages/agency/Feedback";
import Files from "./pages/agency/Files";

import ClientDashboard from "./pages/client/ClientDashboard";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* Super Admin Routes */}
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/agencies"
            element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <Agencies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/agencies/:id"
            element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <AgencyDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/activities"
            element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <PlatformActivities />
              </ProtectedRoute>
            }
          />

          {/* Agency Admin & Team Routes (Super Admin can also access via Support Mode) */}
          <Route
            path="/agency"
            element={
              <ProtectedRoute allowedRoles={["agency_admin", "agency_team", "super_admin"]}>
                <AgencyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agency/team"
            element={
              <ProtectedRoute allowedRoles={["agency_admin", "super_admin"]}>
                <Team />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agency/clients"
            element={
              <ProtectedRoute allowedRoles={["agency_admin", "agency_team", "super_admin"]}>
                <Clients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agency/projects"
            element={
              <ProtectedRoute allowedRoles={["agency_admin", "agency_team", "super_admin"]}>
                <Projects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agency/projects/:id"
            element={
              <ProtectedRoute allowedRoles={["agency_admin", "agency_team", "super_admin"]}>
                <ProjectDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agency/meetings"
            element={
              <ProtectedRoute allowedRoles={["agency_admin", "agency_team", "super_admin"]}>
                <Meetings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agency/feedback"
            element={
              <ProtectedRoute allowedRoles={["agency_admin", "agency_team", "super_admin"]}>
                <Feedback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agency/files"
            element={
              <ProtectedRoute allowedRoles={["agency_admin", "agency_team", "super_admin"]}>
                <Files />
              </ProtectedRoute>
            }
          />

          {/* Client Portal Routes */}
          <Route
            path="/client"
            element={
              <ProtectedRoute allowedRoles={["agency_client"]}>
                <ClientDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
