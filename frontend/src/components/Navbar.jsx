import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  Shield,
  User,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Map,
  FileCheck,
  TrendingUp,
  Landmark,
  Languages,
  Clock,
  Settings,
  Users
} from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { t, language, toggleLanguage } = useLanguage();

  const isAdminOrOfficer = user && ['admin', 'officer', 'district_admin', 'state_admin', 'super_admin'].includes(user.role);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    onLogout();
    navigate('/login');
  };

  // Farmer navigation
  const farmerItems = [
    { label: t('dashboard'), path: '/', icon: <LayoutDashboard size={18} /> },
    { label: t('lands'), path: '/lands', icon: <Map size={18} /> },
    { label: t('upload'), path: '/upload', icon: <FileCheck size={18} /> },
    { label: t('claims'), path: '/claims', icon: <TrendingUp size={18} /> },
    { label: t('profile') || 'Profile', path: '/profile', icon: <User size={18} /> },
    { label: t('keralaStats'), path: '/kerala', icon: <Landmark size={18} /> },
  ];

  // Admin navigation - uses onClick to set tab via URL
  const adminItems = [
    { label: 'Claims', tab: 'claims', icon: <FileCheck size={18} /> },
    { label: 'Farmers', tab: 'farmers', icon: <Users size={18} /> },
    { label: 'Claim History', tab: 'history', icon: <Clock size={18} /> },
    { label: 'Rate Settings', tab: 'settings', icon: <Settings size={18} /> },
    { label: t('profile') || 'Profile', path: '/profile', icon: <User size={18} /> },
    { label: t('keralaStats'), path: '/kerala', icon: <Landmark size={18} /> },
  ];

  const navItems = isAdminOrOfficer ? adminItems : farmerItems;

  // Check if an admin tab is active
  const currentTab = new URLSearchParams(location.search).get('tab') || 'claims';

  const isActive = (item) => {
    if (item.tab) return location.pathname === '/admin' && currentTab === item.tab;
    return location.pathname === item.path;
  };

  const handleNavClick = (item) => {
    setIsOpen(false);
    if (item.tab) {
      navigate(`/admin?tab=${item.tab}`);
    } else {
      navigate(item.path);
    }
  };

  return (
    <nav className="glass-card navbar-container" style={{
      margin: '1rem',
      borderRadius: '20px',
      padding: '0.75rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: '1rem',
      zIndex: 1000,
      background: 'rgba(255,255,255,0.9)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          className="mobile-menu-toggle"
          onClick={() => setIsOpen(!isOpen)}
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div style={{ background: 'var(--paddy-green)', color: 'white', padding: '8px', borderRadius: '12px' }}>
          <Shield size={24} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--deep-forest)', letterSpacing: '-0.5px' }}>PMFBY</h2>
          <p className="desktop-only" style={{ margin: 0, fontSize: '0.6rem', opacity: 0.6, fontWeight: 700, textTransform: 'uppercase' }}>{t('govtKerala')}</p>
        </div>
      </div>

      <div className={`navbar-menu ${isOpen ? 'open' : ''}`} style={{ display: 'flex', gap: '0.5rem' }}>
        {navItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleNavClick(item)}
            style={{
              textDecoration: 'none',
              color: isActive(item) ? 'var(--paddy-green)' : '#555',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '10px',
              background: isActive(item) ? 'rgba(0,132,61,0.08)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderLeft: '1px solid #eee', paddingLeft: '1.5rem' }}>
        <button
          onClick={toggleLanguage}
          style={{
            background: 'var(--paddy-green)', color: 'white', border: 'none',
            borderRadius: '8px', padding: '4px 8px', fontSize: '0.8rem',
            fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
          }}
        >
          <Languages size={14} />
          {language === 'en' ? 'Ml' : 'En'}
        </button>

        <div className="user-info" style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>{user?.full_name}</p>
          <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase' }}>{user?.role?.replace('_', ' ')}</p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--status-rejected)', display: 'flex', alignItems: 'center',
            gap: '4px', fontSize: '0.9rem', fontWeight: 600
          }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}
