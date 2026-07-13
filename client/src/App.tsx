import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext.js';
import { ToastProvider } from './contexts/ToastContext.js';
import { AuthProvider } from './contexts/AuthContext.js';
import { SocketProvider } from './contexts/SocketContext.js';

// Layouts
import PublicLayout from './layouts/PublicLayout.js';
import AuthLayout from './layouts/AuthLayout.js';
import DashboardLayout from './layouts/DashboardLayout.js';

// Pages
import LandingPage from './pages/LandingPage.js';
import LoginPage from './pages/LoginPage.js';
import RegisterPage from './pages/RegisterPage.js';
import ComponentShowcase from './pages/dev/ComponentShowcase.js';


// Dashboard Pages
import StudentDashboard from './pages/student/StudentDashboard.js';
import StudentProfile from './pages/student/StudentProfile.js';
import StudentDrives from './pages/student/StudentDrives.js';
import OfficerDashboard from './pages/officer/OfficerDashboard.js';
import OfficerCompanies from './pages/officer/OfficerCompanies.js';
import OfficerDrives from './pages/officer/OfficerDrives.js';
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard.js';
import RecruiterDrives from './pages/recruiter/RecruiterDrives.js';
import RecruiterApplicants from './pages/recruiter/RecruiterApplicants.js';
import AdminDashboard from './pages/admin/AdminDashboard.js';

import './App.css';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/dev/components" element={<ComponentShowcase />} />
                </Route>

                {/* Authentication Routes */}
                <Route path="/auth" element={<AuthLayout />}>
                  <Route path="" element={<Navigate to="/auth/login" replace />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  <Route path="forgot-password" element={<div className="text-center p-4"><h3 className="font-bold text-lg mb-2">Forgot Password</h3><p className="text-xs text-zinc-400">Password reset link is handled via console. Please return to login.</p><Link to="/auth/login" className="text-xs text-purple-400 hover:underline block mt-4">Back to Login</Link></div>} />
                </Route>

                {/* Dashboard Role Routes */}
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route path="student" element={<StudentDashboard />} />
                  <Route path="student/profile" element={<StudentProfile />} />
                  <Route path="student/drives" element={<StudentDrives />} />
                  <Route path="placement_officer" element={<OfficerDashboard />} />
                  <Route path="placement_officer/companies" element={<OfficerCompanies />} />
                  <Route path="placement_officer/drives" element={<OfficerDrives />} />
                  <Route path="recruiter" element={<RecruiterDashboard />} />
                  <Route path="recruiter/drives" element={<RecruiterDrives />} />
                  <Route path="recruiter/applicants" element={<RecruiterApplicants />} />
                  <Route path="admin" element={<AdminDashboard />} />
                  <Route path="" element={<Navigate to="student" replace />} />
                </Route>

                {/* Fallback Catch-All */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

// Inline Link helper for forgot password route placeholder
import { Link } from 'react-router-dom';

export default App;
