// frontend/src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import { User, Lock, MapPin, Phone, Mail, Save, Edit2, CheckCircle, AlertCircle, FileText, Image, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Profile({ user, setUser }) { // Updated destructuring
    const { t } = useLanguage();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [editData, setEditData] = useState({
        full_name: '',
        phone: '',
        address: '',
        village: '',
        district: '',
        state: ''
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/me');
            setProfile(res.data);
            setEditData({
                full_name: res.data.full_name || '',
                phone: res.data.phone || '',
                address: res.data.address || '',
                village: res.data.farmer_profile?.village || '',
                district: res.data.farmer_profile?.district || '',
                state: res.data.farmer_profile?.state || 'Kerala'
            });
        } catch (err) {
            console.error('Failed to fetch profile', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        // Enforce exactly 10 digit phone number
        if (!/^\d{10}$/.test(editData.phone)) {
            setMessage({ type: 'error', text: 'Phone number must be exactly 10 digits' });
            return;
        }

        try {
            // Optimistic update
            const updatedProfile = { ...profile, ...editData, farmer_profile: { ...profile.farmer_profile, ...editData } };
            setProfile(updatedProfile);

            const res = await api.put('/auth/update-profile', editData);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditing(false);

            // Update global user state immediately
            if (setUser && res.data.user) {
                setUser(res.data.user);
                // Also update local storage if needed, but App.jsx usually handles user from token/API
                // If App.jsx relies on initial load, updating state is enough for current session.
            }

            // Re-fetch to be sure
            fetchProfile();
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update profile' });
            fetchProfile(); // Revert on error
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.new_password !== passwordData.confirm_password) {
            setMessage({ type: 'error', text: 'Passwords do not match!' });
            return;
        }

        try {
            await api.post('/auth/change-password', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setIsChangingPassword(false);
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to change password' });
        }
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container animate-fade-in">
            <h1 style={{ color: 'var(--deep-forest)', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                <User size={32} /> {t('myProfile') || 'My Profile'}
            </h1>

            {message.text && (
                <div style={{
                    background: message.type === 'success' ? '#E8F5E9' : '#FFEBEE',
                    color: message.type === 'success' ? '#2E7D32' : '#C62828',
                    padding: '1rem',
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            <div className="gov-grid" style={{ gridTemplateColumns: '1fr', gap: '2rem' }}>
                {/* Profile Information */}
                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ margin: 0 }}>Personal Information</h3>
                        {!isEditing ? (
                            <button className="btn-gov" style={{ padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setIsEditing(true)}>
                                <Edit2 size={16} /> Edit
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn-gov" style={{ background: 'var(--paddy-green)', padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleSaveProfile}>
                                    <Save size={16} /> Save
                                </button>
                                <button className="btn-gov" style={{ background: '#eee', color: '#333', padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => setIsEditing(false)}>
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="gov-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>Full Name</label>
                            {isEditing ? (
                                <input className="gov-input" value={editData.full_name} onChange={e => setEditData({ ...editData, full_name: e.target.value })} />
                            ) : (
                                <p style={{ fontWeight: 'bold', margin: 0 }}>{profile?.full_name}</p>
                            )}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>Phone</label>
                            {isEditing ? (
                                <input
                                    className="gov-input"
                                    value={editData.phone}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (/^\d*$/.test(val) && val.length <= 10) setEditData({ ...editData, phone: val });
                                    }}
                                    maxLength={10}
                                    placeholder="10-digit mobile number"
                                />
                            ) : (
                                <p style={{ fontWeight: 'bold', margin: 0 }}>{profile?.phone}</p>
                            )}
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>Username</label>
                            <p style={{ fontWeight: 'bold', margin: 0 }}>{profile?.username}</p>
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>Address</label>
                            {isEditing ? (
                                <input className="gov-input" value={editData.address} onChange={e => setEditData({ ...editData, address: e.target.value })} />
                            ) : (
                                <p style={{ fontWeight: 'bold', margin: 0 }}>{profile?.address || 'Not provided'}</p>
                            )}
                        </div>

                        {profile?.role === 'farmer' && (
                            <>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>Village</label>
                                    {isEditing ? (
                                        <input className="gov-input" value={editData.village} onChange={e => setEditData({ ...editData, village: e.target.value })} />
                                    ) : (
                                        <p style={{ fontWeight: 'bold', margin: 0 }}>{profile?.farmer_profile?.village || 'Not provided'}</p>
                                    )}
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>District</label>
                                    {isEditing ? (
                                        <input className="gov-input" value={editData.district} onChange={e => setEditData({ ...editData, district: e.target.value })} />
                                    ) : (
                                        <p style={{ fontWeight: 'bold', margin: 0 }}>{profile?.farmer_profile?.district || 'Not provided'}</p>
                                    )}
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>State</label>
                                    <p style={{ fontWeight: 'bold', margin: 0 }}>{profile?.farmer_profile?.state || 'Kerala'}</p>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>Verification Status</label>
                                    <span style={{
                                        background: profile?.farmer_profile?.verification_status === 'approved' ? '#E8F5E9' : profile?.farmer_profile?.verification_status === 'rejected' ? '#FFEBEE' : '#FFF3E0',
                                        color: profile?.farmer_profile?.verification_status === 'approved' ? '#2E7D32' : profile?.farmer_profile?.verification_status === 'rejected' ? '#C62828' : '#E65100',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase'
                                    }}>
                                        {profile?.farmer_profile?.verification_status || 'pending'}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Security Section */}
                <div className="glass-card">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Lock size={20} /> Security
                    </h3>

                    {!isChangingPassword ? (
                        <button className="btn-gov" style={{ width: '100%', padding: '12px' }} onClick={() => setIsChangingPassword(true)}>
                            Change Password
                        </button>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Current Password</label>
                                <input
                                    type="password"
                                    className="gov-input"
                                    value={passwordData.current_password}
                                    onChange={e => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>New Password</label>
                                <input
                                    type="password"
                                    className="gov-input"
                                    value={passwordData.new_password}
                                    onChange={e => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Confirm Password</label>
                                <input
                                    type="password"
                                    className="gov-input"
                                    value={passwordData.confirm_password}
                                    onChange={e => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn-gov" style={{ flex: 1, background: 'var(--paddy-green)', padding: '10px' }} onClick={handleChangePassword}>
                                    Update
                                </button>
                                <button className="btn-gov" style={{ flex: 1, background: '#eee', color: '#333', padding: '10px' }} onClick={() => {
                                    setIsChangingPassword(false);
                                    setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                                }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '2rem', padding: '1rem', background: '#F9FAFB', borderRadius: '8px' }}>
                        <p style={{ fontSize: '0.85rem', margin: 0, opacity: 0.7 }}>
                            <strong>Role:</strong> {profile?.role?.replace('_', ' ').toUpperCase()}
                        </p>
                        <p style={{ fontSize: '0.85rem', margin: '8px 0 0', opacity: 0.7 }}>
                            <strong>Email:</strong> {profile?.email || 'N/A'}
                        </p>
                        <p style={{ fontSize: '0.85rem', margin: '8px 0 0', opacity: 0.7 }}>
                            <strong>Member Since:</strong> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                </div>

                {/* Documents Section - Farmer only */}
                {profile?.role === 'farmer' && (
                    <div className="glass-card">
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={20} /> My Documents
                        </h3>

                        <div className="gov-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {/* Farmer Photo */}
                            <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '1.2rem', border: '1px solid #eee' }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Image size={16} color="var(--paddy-green)" /> Farmer Photo
                                </p>
                                {profile?.farmer_profile?.photo_url ? (
                                    <div>
                                        <img
                                            src={profile.farmer_profile.photo_url}
                                            alt="Farmer"
                                            style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.5rem' }}
                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                                        />
                                        <p style={{ display: 'none', fontSize: '0.8rem', color: '#888', textAlign: 'center' }}>Photo not available on server</p>
                                        <a href={profile.farmer_profile.photo_url} target="_blank" rel="noopener noreferrer"
                                            style={{ fontSize: '0.78rem', color: 'var(--paddy-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <ExternalLink size={12} /> View Full Size
                                        </a>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.4 }}>
                                        <User size={40} />
                                        <p style={{ fontSize: '0.8rem', margin: '0.5rem 0 0' }}>No photo uploaded</p>
                                    </div>
                                )}
                            </div>

                            {/* Land Document */}
                            <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '1.2rem', border: '1px solid #eee' }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FileText size={16} color="#1565C0" /> Land Document
                                </p>
                                {profile?.farmer_profile?.ownership_proof_url ? (
                                    <div>
                                        <div style={{ background: '#E3F2FD', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', marginBottom: '0.5rem' }}>
                                            <FileText size={40} color="#1565C0" />
                                            <p style={{ fontSize: '0.8rem', margin: '0.5rem 0 0', fontWeight: 600, color: '#1565C0' }}>Document Uploaded</p>
                                        </div>
                                        <a href={profile.farmer_profile.ownership_proof_url} target="_blank" rel="noopener noreferrer"
                                            style={{ fontSize: '0.78rem', color: '#1565C0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <ExternalLink size={12} /> View / Download
                                        </a>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.4 }}>
                                        <FileText size={40} />
                                        <p style={{ fontSize: '0.8rem', margin: '0.5rem 0 0' }}>No document uploaded</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
