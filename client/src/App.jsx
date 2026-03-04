import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, QrCode, Search, ServerCog, Menu, X } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import UploadTeams from './pages/UploadTeams';
import ScannerPage from './pages/ScannerPage';
import SearchRooms from './pages/SearchRooms';
import RoomConfig from './pages/RoomConfig';
import Login from './pages/Login';
import Register from './pages/Register';
import './index.css';

const Sidebar = ({ handleLogout, isOpen, closeSidebar }) => (
  <>
    <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={closeSidebar}></div>
    <div className={`sidebar glass-panel ${isOpen ? 'open' : ''}`}>
      <div className="logo-container" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: '800' }}>
            Hackathon
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Registration System</p>
        </div>
        <button
          className="menu-trigger"
          onClick={closeSidebar}
          style={{ display: window.innerWidth <= 768 ? 'block' : 'none', background: 'none', border: 'none', color: 'white', padding: 0 }}
        >
          <X size={24} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <NavLink to="/" onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} /> Dashboard
        </NavLink>
        <NavLink to="/upload" onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Users size={20} /> Upload Teams
        </NavLink>
        <NavLink to="/scan" onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <QrCode size={20} /> Check-In Scanner
        </NavLink>
        <NavLink to="/rooms" onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Search size={20} /> Search Rooms
        </NavLink>
        <NavLink to="/config" onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <ServerCog size={20} /> Configure Rooms
        </NavLink>
      </div>

      <button onClick={handleLogout} className="btn-primary" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.5)', boxShadow: 'none' }}>
        Logout
      </button>
    </div>
  </>
);

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <BrowserRouter>
      {isAuthenticated ? (
        <div className="app-layout">
          <Sidebar handleLogout={handleLogout} isOpen={isSidebarOpen} closeSidebar={closeSidebar} />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            {/* Mobile Header */}
            <div className="mobile-header">
              <div>
                <h2 className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Hackathon</h2>
              </div>
              <button className="menu-trigger" onClick={toggleSidebar}>
                <Menu size={24} />
              </button>
            </div>

            <main className="main-content" style={{ height: '100%', overflowY: 'auto' }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/upload" element={<UploadTeams />} />
                <Route path="/scan" element={<ScannerPage />} />
                <Route path="/rooms" element={<SearchRooms />} />
                <Route path="/config" element={<RoomConfig />} />
                <Route path="*" element={<Dashboard />} />
              </Routes>
            </main>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login setAuth={setIsAuthenticated} />} />
          <Route path="/register" element={<Register setAuth={setIsAuthenticated} />} />
          <Route path="*" element={<Login setAuth={setIsAuthenticated} />} />
        </Routes>
      )}
    </BrowserRouter>
  );
};

export default App;
