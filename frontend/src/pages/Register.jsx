// frontend/src/pages/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { Shield, User, MapPin, Upload, Sprout, CheckCircle, Info, Loader2, Languages, ArrowRight, ArrowLeft, Mail, Phone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { t, language, toggleLanguage } = useLanguage();
    const [step, setStep] = useState(1);
    const [isSuccess, setIsSuccess] = useState(false);

    const [contactType, setContactType] = useState('email'); // 'email' or 'mobile'
    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        email_or_mobile: '',
        password: '',
        address: '',
        village: '',
        district: 'Alappuzha',
        state: 'Kerala',
        pin_code: '',
        survey_number: '',
        area: '',
        unit: 'Acre',
        crop_type: 'Paddy',
        latitude: '',
        longitude: ''
    });

    const [files, setFiles] = useState({
        land_document: null,
        farmer_photo: null
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updated = { ...formData, [name]: value };

        // Auto-generate username from full_name
        if (name === 'full_name') {
            const autoUsername = value.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            updated.username = autoUsername;
        }

        setFormData(updated);
    };

    const handleFileChange = (e) => {
        setFiles({ ...files, [e.target.name]: e.target.files[0] });
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            if (files.land_document) data.append('land_document', files.land_document);
            if (files.farmer_photo) data.append('farmer_photo', files.farmer_photo);

            await authService.registerFarmer(data);
            setIsSuccess(true);
        } catch (err) {
            // Handle different error formats
            let errorMessage = 'Registration failed. Please try again.';

            if (err.response?.data?.detail) {
                const detail = err.response.data.detail;
                // If detail is an array of validation errors
                if (Array.isArray(detail)) {
                    errorMessage = detail.map(e => e.msg || JSON.stringify(e)).join(', ');
                }
                // If detail is a string
                else if (typeof detail === 'string') {
                    errorMessage = detail;
                }
                // If detail is an object
                else if (typeof detail === 'object') {
                    errorMessage = detail.msg || JSON.stringify(detail);
                }
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        let requiredFields = [];
        if (step === 1) {
            requiredFields = ['full_name', 'username', 'email_or_mobile', 'password'];
        } else if (step === 2) {
            requiredFields = ['village', 'district', 'pin_code', 'survey_number', 'area', 'crop_type', 'latitude', 'longitude'];
        }

        const missing = requiredFields.filter(field => !formData[field]);
        if (missing.length > 0) {
            // Capitalize first letter of field name for error message
            const missingNames = missing.map(f => f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())).join(', ');
            setError(`Please fill in all required fields: ${missingNames}`);
            return;
        }

        // Additional validation
        if (step === 1 && formData.username.length < 3) {
            setError('Username must be at least 3 characters');
            return;
        }
        if (step === 1 && contactType === 'mobile' && !/^\d{10}$/.test(formData.email_or_mobile)) {
            setError('Mobile number must be exactly 10 digits');
            return;
        }
        if (step === 1 && contactType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_or_mobile)) {
            setError('Please enter a valid email address');
            return;
        }
        if (step === 2 && formData.pin_code.length !== 6) {
            setError('PIN Code must be 6 digits');
            return;
        }

        setError('');
        setStep(s => s + 1);
    };
    const prevStep = () => setStep(s => s - 1);

    if (isSuccess) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', padding: '1rem' }}>
                <div className="glass-card animate-fade-in" style={{ textAlign: 'center', maxWidth: '500px', padding: '3rem' }}>
                    <div style={{ background: 'var(--status-approved)', color: 'white', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 4px 12px rgba(8,160,77,0.3)' }}>
                        <CheckCircle size={48} />
                    </div>
                    <h2 style={{ color: 'var(--deep-forest)', marginBottom: '1rem' }}>{t('regSuccess')}</h2>
                    <p style={{ marginBottom: '2rem', opacity: 0.8 }}>{t('regSuccessMsg')}</p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link to="/login" className="btn-gov" style={{ textDecoration: 'none' }}>{t('loginNow')}</Link>
                        <Link to="/" className="btn-gov" style={{ background: 'white', color: '#333', border: '1px solid #ddd', textDecoration: 'none' }}>{t('backToHome')}</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'url("/kerala_login_bg.png") no-repeat center center fixed, linear-gradient(135deg, #004D25 0%, #00843D 100%)',
            backgroundSize: 'cover',
            padding: '2rem',
            position: 'relative'
        }}>
            {/* Language Toggle */}
            <button
                onClick={toggleLanguage}
                style={{
                    position: 'absolute', top: '20px', right: '20px', background: 'white', color: 'var(--paddy-green)',
                    border: 'none', borderRadius: '50px', padding: '10px 20px', fontSize: '0.9rem', fontWeight: 'bold',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 100
                }}
            >
                <Languages size={18} />
                {language === 'en' ? 'മലയാളം' : 'English'}
            </button>

            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '800px', background: 'rgba(255,255,255,0.95)', padding: '2rem 3rem', marginTop: '2rem', marginBottom: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ background: 'var(--paddy-green)', color: 'white', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 8px 16px rgba(0,132,61,0.2)' }}>
                        <Sprout size={28} />
                    </div>
                    <h1 style={{ color: 'var(--deep-forest)', fontSize: '1.5rem', letterSpacing: '-0.5px' }}>{t('farmRegisterTitle')}</h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', fontWeight: 600 }}>{t('govtKerala')}</p>
                </div>

                {/* Progress Indicators */}
                <div className="progress-stepper mb-4" style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            width: '40px', height: '40px', borderRadius: '50%', background: step >= i ? 'var(--paddy-green)' : '#eee',
                            color: step >= i ? 'white' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                        }}>
                            {i}
                        </div>
                    ))}
                </div>
                <p style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem', fontWeight: '600', color: 'var(--paddy-green)' }}>
                    {step === 1 ? t('regStep1') : step === 2 ? t('regStep2') : t('regStep3')}
                </p>

                {error && (
                    <div style={{ background: '#FFEBEE', color: '#C62828', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Info size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {step === 1 && (
                        <div className="animate-fade-in">
                            <div className="gov-grid">
                                <div>
                                    <label className="text-sm font-semibold mb-1 block">{t('fullName')}</label>
                                    <input name="full_name" className="gov-input w-full" required value={formData.full_name} onChange={handleChange} placeholder="Name as per Aadhaar" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold mb-1 block">Username <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>(auto-generated)</span></label>
                                    <input
                                        name="username"
                                        className="gov-input w-full"
                                        required
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="Auto-generated from name"
                                        style={{ background: '#F5F5F5' }}
                                    />
                                </div>
                            </div>

                            {/* Email or Mobile Toggle */}
                            <div style={{ margin: '1.2rem 0' }}>
                                <label className="text-sm font-semibold mb-1 block">Contact Method</label>
                                <div style={{
                                    display: 'flex', borderRadius: '12px', overflow: 'hidden',
                                    border: '2px solid var(--paddy-green)', width: 'fit-content', marginBottom: '0.8rem'
                                }}>
                                    {[
                                        { key: 'email', label: 'Email', icon: <Mail size={14} /> },
                                        { key: 'mobile', label: 'Mobile', icon: <Phone size={14} /> }
                                    ].map(opt => (
                                        <button key={opt.key} type="button" onClick={() => {
                                            setContactType(opt.key);
                                            setFormData({ ...formData, email_or_mobile: '' });
                                        }} style={{
                                            padding: '0.5rem 1.2rem', border: 'none', cursor: 'pointer',
                                            fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px',
                                            background: contactType === opt.key ? 'var(--paddy-green)' : 'white',
                                            color: contactType === opt.key ? 'white' : 'var(--paddy-green)',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            {opt.icon} {opt.label}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    name="email_or_mobile"
                                    className="gov-input w-full"
                                    required
                                    type={contactType === 'email' ? 'email' : 'tel'}
                                    value={formData.email_or_mobile}
                                    onChange={(e) => {
                                        if (contactType === 'mobile') {
                                            if (/^\d*$/.test(e.target.value) && e.target.value.length <= 10) handleChange(e);
                                        } else {
                                            handleChange(e);
                                        }
                                    }}
                                    maxLength={contactType === 'mobile' ? 10 : undefined}
                                    placeholder={contactType === 'email' ? 'Enter email address' : 'Enter 10-digit mobile number'}
                                />
                            </div>

                            <div className="gov-grid">
                                <div>
                                    <label className="text-sm font-semibold mb-1 block">{t('password')}</label>
                                    <input name="password" type="password" className="gov-input w-full" required value={formData.password} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold mb-1 block">{t('address')}</label>
                                    <input name="address" className="gov-input w-full" value={formData.address} onChange={handleChange} placeholder="House Name/No." />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="gov-grid animate-fade-in">
                            <div>
                                <label className="text-sm font-semibold mb-1 block">{t('village')}</label>
                                <input name="village" className="gov-input w-full" required value={formData.village} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="text-sm font-semibold mb-1 block">{t('district')}</label>
                                <select name="district" className="gov-input w-full" value={formData.district} onChange={handleChange}>
                                    {['Alappuzha', 'Ernakulam', 'Idukki', 'Kottayam', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'].map(d => <option key={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-semibold mb-1 block">{t('pinCode')}</label>
                                <input
                                    name="pin_code"
                                    className="gov-input w-full"
                                    required
                                    value={formData.pin_code}
                                    onChange={(e) => {
                                        if (/^\d*$/.test(e.target.value)) handleChange(e);
                                    }}
                                    maxLength="6"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold mb-1 block">{t('surveyNumber')}</label>
                                <input name="survey_number" className="gov-input w-full" required value={formData.survey_number} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="text-sm font-semibold mb-1 block">{t('area')}</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        name="area"
                                        type="number"
                                        step="0.01"
                                        className="gov-input w-full"
                                        required
                                        value={formData.area}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                    />
                                    <select name="unit" className="gov-input" style={{ width: '100px' }} value={formData.unit} onChange={handleChange}>
                                        <option>Acre</option>
                                        <option>Hectare</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold mb-1 block">{t('cropType')}</label>
                                <select name="crop_type" className="gov-input w-full" value={formData.crop_type} onChange={handleChange}>
                                    {['Paddy', 'Coconut', 'Rubber', 'Banana', 'Pepper', 'Cardamom'].map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>

                            <div className="glass-card" style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                                <label className="text-sm font-semibold mb-2 block" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <MapPin size={16} /> {t('location') || 'Farm Coordinates'}
                                </label>
                                <div className="gov-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <input
                                        name="latitude"
                                        className="gov-input w-full"
                                        placeholder="Latitude"
                                        value={formData.latitude}
                                        onChange={handleChange}
                                        type="number"
                                        step="0.000001"
                                        required
                                    />
                                    <input
                                        name="longitude"
                                        className="gov-input w-full"
                                        placeholder="Longitude"
                                        value={formData.longitude}
                                        onChange={handleChange}
                                        type="number"
                                        step="0.000001"
                                        required
                                    />
                                </div>
                                <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Please enter the coordinates manually.</p>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="gov-grid animate-fade-in">
                            <div>
                                <label className="text-sm font-semibold mb-1 block">{t('farmerPhoto')} <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>(Optional)</span></label>
                                <div className="upload-box" onClick={() => document.getElementsByName('farmer_photo')[0].click()} style={{ height: '150px' }}>
                                    <User size={32} color="var(--paddy-green)" />
                                    <span style={{ fontSize: '0.8rem', marginTop: '8px' }}>{files.farmer_photo ? files.farmer_photo.name : 'Click to Upload Photo (Optional)'}</span>
                                    <input type="file" name="farmer_photo" hidden accept="image/*" onChange={handleFileChange} />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold mb-1 block">{t('landDoc')} <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>(Optional)</span></label>
                                <div className="upload-box" onClick={() => document.getElementsByName('land_document')[0].click()} style={{ height: '150px' }}>
                                    <Upload size={32} color="var(--paddy-green)" />
                                    <span style={{ fontSize: '0.8rem', marginTop: '8px' }}>{files.land_document ? files.land_document.name : 'Click to Upload PDF/Image (Optional)'}</span>
                                    <input type="file" name="land_document" hidden accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
                                </div>
                                <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '8px', textAlign: 'center' }}>You can upload documents later from your profile</p>
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
                        {step > 1 && (
                            <button type="button" className="btn-gov" onClick={prevStep} style={{ background: '#eee', color: '#333' }}>
                                <ArrowLeft size={16} style={{ marginRight: '8px' }} /> {t('previous')}
                            </button>
                        )}
                        {step < 3 ? (
                            <button type="button" className="btn-gov" onClick={nextStep} style={{ marginLeft: 'auto' }}>
                                {t('next')} <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                            </button>
                        ) : (
                            <button type="submit" className="btn-gov" style={{ marginLeft: 'auto', background: 'var(--deep-forest)' }} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} style={{ marginRight: '8px' }} />}
                                {t('reviewSubmit')}
                            </button>
                        )}
                    </div>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    Already registered? <Link to="/login" style={{ color: 'var(--paddy-green)', fontWeight: 'bold' }}>{t('login')}</Link>
                </div>
            </div>
        </div>
    );
}
