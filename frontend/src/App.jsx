// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Claims from './pages/Claims';
import AdminDashboard from './pages/AdminDashboard';
import KeralaStats from './pages/KeralaStats';
import Lands from './pages/Lands';
import Profile from './pages/Profile';

// Components
import Navbar from './components/Navbar';
import FarmerChatbot from './components/FarmerChatbot';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="spinner"></div>
    </div>;
  }

  const isAdminOrOfficer = user && ['admin', 'officer', 'district_admin', 'state_admin', 'super_admin'].includes(user.role);

  return (
    <Router>
      {user && <Navbar user={user} onLogout={handleLogout} />}

      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/" /> : <Register />}
        />

        {/* Protected Routes */}
        {user ? (
          <>
            <Route
              path="/"
              element={isAdminOrOfficer ? <Navigate to="/admin" /> : <Home user={user} />}
            />
            <Route path="/lands" element={<Lands user={user} />} />
            <Route path="/upload" element={<Upload user={user} />} />
            <Route path="/claims" element={<Claims user={user} />} />
            <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
            <Route path="/kerala" element={<KeralaStats />} />

            {isAdminOrOfficer && (
              <Route path="/admin" element={<AdminDashboard user={user} />} />
            )}

            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
      {/* Chatbot for farmers only - not admin */}
      {user && !isAdminOrOfficer && <FarmerChatbot />}
    </Router>
  );
}

