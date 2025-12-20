import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useState, useEffect } from 'react';
import Signup from '../pages/Auth/signup.jsx';
import Loginform from '../pages/Auth/loginform.jsx';
import Forgotpassword from '../pages/Auth/forgotpassword.jsx';
import Otp from '../pages/Auth/otp.jsx';
import Newpassword from '../pages/Auth/newpassword.jsx';
import Dashboard from '../pages/Dashboard/Dashboard.jsx';
import ListPage from '../pages/Listpage/ListPage.jsx';
import DeviceList from '../pages/DeviceList/device.jsx';
import Reportpage from '../pages/ReportPage/report.jsx';
import SupportPage from '../pages/Support/support.jsx';
import Settingspage from '../pages/Settings/settings.jsx';
import DeviceDetails from '../pages/Drivelist/DeviceDetails.jsx';
import MainLayout from '../components/layout/MainLayout.jsx';

function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem('authToken');
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('authToken'));
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const expiry = localStorage.getItem('token_expiry');

    if (expiry && Date.now() > Number(expiry)) {
      localStorage.clear();
      window.location.href = '/login';
    }
  }, []);


  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/Overview" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="/login" element={<Loginform />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<Forgotpassword />} />
        <Route path="/otp-verify" element={<Otp />} />
        <Route path="/reset-password" element={<Newpassword />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout theme={theme} setTheme={setTheme} />
            </ProtectedRoute>
          }
        >
          <Route path="Overview" element={<Dashboard />} />
          <Route path="list" element={<ListPage />} />
          <Route path="device" element={<DeviceList />} />
          <Route path="reports" element={<Reportpage />} />
          <Route path="support" element={<SupportPage />} />
          <Route
            path="settings"
            element={<Settingspage setTheme={setTheme} />}
          />

          <Route path="device/:id" element={<DeviceDetails />} />
        </Route>
      </Routes>
    </Router>
  );
}

