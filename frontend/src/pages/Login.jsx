// frontend/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { Shield, Lock, User, Info, Languages, Mail, Phone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useLanguage();

  const [loginType, setLoginType] = useState('email'); // 'email' or 'mobile'
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // For mobile login, only allow digits and max 10
    if (name === 'username' && loginType === 'mobile') {
      if (!/^\d*$/.test(value) || value.length > 10) return;
    }
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const isAdminOrOfficer = (role) => {
    return ['admin', 'officer', 'district_admin', 'state_admin', 'super_admin'].includes(role);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate based on login type
    if (loginType === 'mobile') {
      const mobile = formData.username.trim();
      if (!/^\d{10}$/.test(mobile)) {
        const len = mobile.replace(/\D/g, '').length;
        setError(language === 'en'
          ? `Mobile number must be exactly 10 digits. You entered ${len} digit${len !== 1 ? 's' : ''}.`
          : `മൊബൈൽ നമ്പർ കൃത്യമായി 10 അക്കം ആയിരിക്കണം. നിങ്ങൾ ${len} അക്കം നൽകി.`);
        return;
      }
    } else {
      const email = formData.username.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError(language === 'en'
          ? 'Please enter a valid email address (e.g. name@example.com)'
          : 'ദയവായി സാധുവായ ഇമെയിൽ വിലാസം നൽകുക (ഉദാ: name@example.com)');
        return;
      }
    }

    setLoading(true);

    try {
      const response = await authService.login({
        username: formData.username.trim(),
        password: formData.password,
        login_type: loginType
      });
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLoginSuccess(response.data.user);

      if (isAdminOrOfficer(response.data.user.role)) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Identity verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'url("/kerala_login_bg.png") no-repeat center center fixed',
      backgroundColor: '#004D25',
      backgroundSize: 'cover',
      padding: '2rem',
      position: 'relative'
    }}>
      {/* Language Toggle */}
      < button
        onClick={toggleLanguage}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'white',
          color: 'var(--paddy-green)',
          border: 'none',
          borderRadius: '50px',
          padding: '10px 20px',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}
      >
        <Languages size={18} />
        {language === 'en' ? 'മലയാളം' : 'English'}
      </button >

      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '450px',
        background: 'rgba(255,255,255,0.95)',
        padding: '3rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            background: 'var(--paddy-green)',
            color: 'white',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 8px 16px rgba(0,132,61,0.2)'
          }}>
            <Shield size={32} />
          </div>
          <h1 style={{ color: 'var(--deep-forest)', fontSize: '1.8rem', letterSpacing: '-0.5px' }}>{t('smartCropPortal')}</h1>
          <p style={{ opacity: 0.6, fontSize: '0.9rem', fontWeight: 600 }}>{t('govtKerala')}</p>
        </div>

        {error && (
          <div style={{
            background: '#FFEBEE',
            color: '#C62828',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Info size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Login Type Toggle */}
          <div style={{
            display: 'flex',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '1.5rem',
            border: '2px solid var(--paddy-green)',
          }}>
            <button
              type="button"
              onClick={() => { setLoginType('email'); setFormData({ ...formData, username: '' }); setError(''); }}
              style={{
                flex: 1,
                padding: '0.7rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: loginType === 'email' ? 'var(--paddy-green)' : 'white',
                color: loginType === 'email' ? 'white' : 'var(--paddy-green)',
                transition: 'all 0.3s ease'
              }}
            >
              <Mail size={16} /> {language === 'en' ? 'Email' : 'ഇമെയിൽ'}
            </button>
            <button
              type="button"
              onClick={() => { setLoginType('mobile'); setFormData({ ...formData, username: '' }); setError(''); }}
              style={{
                flex: 1,
                padding: '0.7rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: loginType === 'mobile' ? 'var(--paddy-green)' : 'white',
                color: loginType === 'mobile' ? 'white' : 'var(--paddy-green)',
                transition: 'all 0.3s ease'
              }}
            >
              <Phone size={16} /> {language === 'en' ? 'Mobile' : 'മൊബൈൽ'}
            </button>
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
              {loginType === 'email' ? <Mail size={16} color="var(--paddy-green)" /> : <Phone size={16} color="var(--paddy-green)" />}
              {loginType === 'email'
                ? (language === 'en' ? 'Email Address' : 'ഇമെയിൽ വിലാസം')
                : (language === 'en' ? 'Mobile Number' : 'മൊബൈൽ നമ്പർ')}
            </label>
            <input
              name="username"
              type={loginType === 'email' ? 'email' : 'tel'}
              className="gov-input"
              required
              value={formData.username}
              onChange={handleChange}
              maxLength={loginType === 'mobile' ? 10 : undefined}
              placeholder={loginType === 'email' ? 'Enter your email address' : 'Enter your 10-digit mobile number'}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
              <Lock size={16} color="var(--paddy-green)" /> {t('password')}
            </label>
            <input
              name="password"
              type="password"
              className="gov-input"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn-gov"
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : t('loginBtn')}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          {t('newFarmer')} <Link to="/register" style={{ color: 'var(--paddy-green)', fontWeight: 'bold' }}>{t('registerHere')}</Link>
        </div>

        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #eee', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>
            {t('securePortal')}
          </p>
        </div>
      </div>
    </div >
  );
}

