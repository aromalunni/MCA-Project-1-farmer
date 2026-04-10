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
  Languages
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

  const navItems = [
    { label: t('dashboard'), path: '/', icon: <LayoutDashboard size={18} />, roles: ['farmer'] },
    { label: t('lands'), path: '/lands', icon: <Map size={18} />, roles: ['farmer'] },
    { label: t('upload'), path: '/upload', icon: <FileCheck size={18} />, roles: ['farmer'] },
    { label: t('claims'), path: '/claims', icon: <TrendingUp size={18} />, roles: ['farmer'] },
    { label: t('profile') || 'Profile', path: '/profile', icon: <User size={18} />, roles: ['farmer', 'admin', 'officer', 'district_admin', 'state_admin', 'super_admin'] },
    { label: t('keralaStats'), path: '/kerala', icon: <Landmark size={18} />, roles: ['farmer', 'officer', 'district_admin', 'state_admin', 'super_admin'] },
    { label: t('adminPanel'), path: '/admin', icon: <Shield size={18} />, activeRoles: ['admin', 'officer', 'district_admin', 'state_admin', 'super_admin'] }
  ];

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
        {/* Mobile Menu Toggle */}
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

      <div className={`navbar-menu ${isOpen ? 'open' : ''}`} style={{ display: 'flex', gap: '1rem' }}>
        {navItems.filter(item => {
          if (item.activeRoles) return item.activeRoles.includes(user?.role) || (user?.role === 'admin' && item.path === '/admin');
          if (item.roles && user?.role === 'admin' && !item.roles.includes('admin')) return false;
          if (item.roles) return item.roles.includes(user?.role);
          return true;
        }).map((item, idx) => (
          <Link
            key={idx}
            to={item.path}
            onClick={() => setIsOpen(false)}
            style={{
              textDecoration: 'none',
              color: location.pathname === item.path ? 'var(--paddy-green)' : '#555',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '10px',
              background: location.pathname === item.path ? 'rgba(0,132,61,0.05)' : 'transparent',
              transition: 'all 0.2s'
            }}
          >
            {item.icon} {item.label}
          </Link>
        ))}
      </div>

      <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderLeft: '1px solid #eee', paddingLeft: '1.5rem' }}>
        <button
          onClick={toggleLanguage}
          style={{
            background: 'var(--paddy-green)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '4px 8px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
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
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--status-rejected)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.9rem',
            fontWeight: 600
          }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}

