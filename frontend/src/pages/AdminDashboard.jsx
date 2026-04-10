// frontend/src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import api, { claimService, masterService } from '../services/api';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
import {
    Shield,
    Users,
    Map,
    AlertTriangle,
    TrendingUp,
    FileCheck,
    IndianRupee,
    CheckCircle,
    Eye,
    ArrowRight,
    Filter,
    Download,
    Pencil,
    Trash2,
    Save,
    XCircle,
    Clock,
    X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/Toast';

import { useSearchParams } from 'react-router-dom';

export default function AdminDashboard({ user }) {
    const { t } = useLanguage();
    const toast = useToast();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'claims';
    const [claims, setClaims] = useState([]);
    const [farmers, setFarmers] = useState([]);
    const [selectedFarmer, setSelectedFarmer] = useState(null);
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [approveAmount, setApproveAmount] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [adminNotes, setAdminNotes] = useState('');

    const [editFormData, setEditFormData] = useState({
        full_name: '',
        phone: '',
        village: '',
        district: '',
        land_area: ''
    });

    // Rate settings state
    const [rates, setRates] = useState([]);
    const [editingRate, setEditingRate] = useState(null);
    const [rateForm, setRateForm] = useState({ rate_per_acre: '', rate_per_cent: '' });
    const [rateSaving, setRateSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [claimsRes, statsRes] = await Promise.all([
                claimService.getAllClaims(),
                claimService.getStats()
            ]);
            setClaims(claimsRes.data);
            setStats(statsRes.data);

            const farmersRes = await api.get(`/farmer/all?t=${Date.now()}`);
            setFarmers(farmersRes.data);
        } catch (err) {
            console.error('Failed to fetch admin data', err);
        }

        // Fetch rates separately so it always runs
        try {
            const ratesRes = await masterService.getRates();
            setRates(ratesRes.data);
        } catch (e) { console.error('Rates fetch failed', e); }

        setLoading(false);
    };

    const handleClaimAction = async (claimId, action) => {
        try {
            if (action === 'approve') {
                await claimService.approveClaim(claimId, {
                    claim_status: 'approved',
                    claim_amount: approveAmount ? parseFloat(approveAmount) : undefined,
                    district_admin_notes: adminNotes || 'Approved by admin'
                });
                toast.success('Claim approved successfully!');
            } else if (action === 'reject') {
                await claimService.approveClaim(claimId, {
                    claim_status: 'rejected',
                    rejection_reason: rejectReason || 'Rejected by admin',
                    district_admin_notes: adminNotes || 'Rejected'
                });
                toast.info('Claim rejected.');
            }
            setSelectedClaim(null);
            setApproveAmount('');
            setRejectReason('');
            setAdminNotes('');
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error('Action failed: ' + (err.response?.data?.detail || err.message));
        }
    };

    const handleFarmerStatus = async (farmerId, status) => {
        try {
            await api.put(`/farmer/${farmerId}/verify`, { status });
            fetchData();
            if (selectedFarmer && selectedFarmer.id === farmerId) {
                setSelectedFarmer(null);
            }
        } catch (err) {
            toast.error('Status update failed');
        }
    };

    const handleEditFarmer = (farmer) => {
        setSelectedFarmer(farmer);
        setEditFormData({
            full_name: farmer.full_name,
            phone: farmer.phone,
            village: farmer.place,
            district: farmer.district,
            land_area: farmer.land_area
        });
        setNewPassword('');
        setIsEditing(true);
    };

    const [newPassword, setNewPassword] = useState('');

    const handleSaveFarmer = async () => {
        try {
            // Update details
            const formData = new FormData();
            Object.keys(editFormData).forEach(key => formData.append(key, editFormData[key]));
            await api.put(`/farmer/${selectedFarmer.id}/update`, formData);

            // Update password if provided
            if (newPassword) {
                await api.put('/auth/admin/reset-password', {
                    user_id: selectedFarmer.id, // ID from farmer list is user_id
                    new_password: newPassword
                });
            }

            toast.success('Farmer details updated successfully');
            setIsEditing(false);
            setNewPassword('');
            fetchData();
            setSelectedFarmer(null);
        } catch (err) {
            console.error(err);
            toast.error('Failed to update: ' + (err.response?.data?.detail || err.message));
        }
    };

    const handleDeleteFarmer = async (farmer) => {
        const target = (farmer && farmer.id) ? farmer : selectedFarmer;

        if (!target) return;

        try {
            // Optimistic UI update - Delete INSTANTLY from view
            setFarmers(prev => prev.filter(f => f.id !== target.id));

            // Call API
            await api.delete(`/farmer/${target.id}`);

            // Sync with backend
            fetchData();

            if (selectedFarmer && selectedFarmer.id === target.id) {
                setSelectedFarmer(null);
            }
        } catch (err) {
            console.error('Delete error:', err);
            toast.error('Failed to delete: ' + (err.response?.data?.detail || err.message));
            // Revert optimistic update if failed
            fetchData();
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return '#4CAF50';
            case 'rejected': return '#F44336';
            case 'requested': return '#FF9800';
            case 'verified': return '#2196F3';
            case 'paid': return '#00897B';
            default: return '#888';
        }
    };

    const renderStats = () => (
        <div className="gov-grid mb-4">
            <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>{t('totalClaims') || 'Total Claims'}</p>
                        <h2 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{stats?.total_claims || 0}</h2>
                    </div>
                    <div style={{ background: 'rgba(0,132,61,0.1)', padding: '12px', borderRadius: '12px', height: 'fit-content' }}>
                        <FileCheck color="var(--paddy-green)" />
                    </div>
                </div>
            </div>

            <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>{t('approvedAmount') || 'Approved Amount'}</p>
                        <h2 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>₹{(stats?.total_approved_amount || 0).toLocaleString()}</h2>
                    </div>
                    <div style={{ background: 'rgba(21,101,192,0.1)', padding: '12px', borderRadius: '12px', height: 'fit-content' }}>
                        <IndianRupee color="var(--status-completed)" />
                    </div>
                </div>
            </div>

            <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>{t('pendingReview') || 'Pending Review'}</p>
                        <h2 style={{ fontSize: '2rem', margin: '0.5rem 0', color: '#FF9800' }}>{stats?.pending_claims || 0}</h2>
                    </div>
                    <div style={{ background: 'rgba(239,108,0,0.1)', padding: '12px', borderRadius: '12px', height: 'fit-content' }}>
                        <Clock color="var(--status-pending)" />
                    </div>
                </div>
            </div>

            <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Total Farmers</p>
                        <h2 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{farmers.length}</h2>
                    </div>
                    <div style={{ background: 'rgba(0,132,61,0.1)', padding: '12px', borderRadius: '12px', height: 'fit-content' }}>
                        <Users color="var(--paddy-green)" />
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ color: 'var(--deep-forest)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem' }}>
                        <Shield size={28} />
                        {t('adminDashboard') || 'ADMIN DASHBOARD'}
                    </h1>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>{t('govtKerala')}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="user-badge" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '8px 16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontWeight: '600', fontSize: '0.9rem', margin: 0 }}>{user?.full_name}</p>
                            <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: 0, textTransform: 'uppercase' }}>{user?.role?.replace('_', ' ')}</p>
                        </div>
                        <div style={{ width: '36px', height: '36px', background: '#00843D', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {user?.full_name?.charAt(0)}
                        </div>
                    </div>
                </div>
            </header>

            {renderStats()}

            {/* Charts Row */}
            {claims.length > 0 && (
                <div className="gov-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '2rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h4 style={{ margin: '0 0 1rem', color: 'var(--deep-forest)' }}>Claim Status Distribution</h4>
                        <div style={{ maxHeight: '220px', display: 'flex', justifyContent: 'center' }}>
                            <Pie data={{
                                labels: ['Requested', 'Verified', 'Approved', 'Rejected'],
                                datasets: [{
                                    data: [
                                        claims.filter(c => c.claim_status === 'requested').length,
                                        claims.filter(c => c.claim_status === 'verified').length,
                                        claims.filter(c => c.claim_status === 'approved').length,
                                        claims.filter(c => c.claim_status === 'rejected').length,
                                    ],
                                    backgroundColor: ['#FF9800', '#2196F3', '#4CAF50', '#F44336'],
                                }]
                            }} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } } }} />
                        </div>
                    </div>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h4 style={{ margin: '0 0 1rem', color: 'var(--deep-forest)' }}>Claims Amount by Type</h4>
                        <div style={{ maxHeight: '220px' }}>
                            <Bar data={{
                                labels: [...new Set(claims.map(c => c.damage_type || 'Other'))],
                                datasets: [{
                                    label: 'Total Amount (₹)',
                                    data: [...new Set(claims.map(c => c.damage_type || 'Other'))].map(type =>
                                        claims.filter(c => (c.damage_type || 'Other') === type).reduce((s, c) => s + (c.claim_amount || 0), 0)
                                    ),
                                    backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#EF5350'],
                                    borderRadius: 6,
                                }]
                            }} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
                        </div>
                    </div>
                </div>
            )}

            {/* ===== CLAIMS TAB (Pending for Approval) ===== */}
            {activeTab === 'claims' && (
                <div className="animate-fade-in">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--deep-forest)' }}>
                        <AlertTriangle size={20} color="#FF9800" /> Pending Claims for Approval
                    </h3>

                    {claims.filter(c => c.claim_status === 'requested' || c.claim_status === 'verified').length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', opacity: 0.6 }}>
                            <CheckCircle size={48} style={{ marginBottom: '1rem', color: '#4CAF50' }} />
                            <h3>All Caught Up!</h3>
                            <p>No pending claims to review at this time.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {claims.filter(c => c.claim_status === 'requested' || c.claim_status === 'verified').map(claim => (
                                <div key={claim.id} className="glass-card" style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                                                <h3 style={{ margin: 0 }}>{claim.claim_number}</h3>
                                                <span style={{
                                                    background: getStatusColor(claim.claim_status) + '20',
                                                    color: getStatusColor(claim.claim_status),
                                                    padding: '4px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {claim.claim_status}
                                                </span>
                                                {claim.is_fraud_suspected && (
                                                    <span style={{ background: '#FFEBEE', color: '#C62828', padding: '4px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>
                                                        ⚠️ Fraud Suspected
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ opacity: 0.7, fontSize: '0.9rem', margin: '4px 0' }}>
                                                Farmer: <strong>{claim.farmer_name}</strong> • Survey #{claim.land_survey}
                                            </p>
                                            <p style={{ opacity: 0.5, fontSize: '0.8rem', margin: '4px 0' }}>
                                                Filed: {new Date(claim.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>

                                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: '0 0 4px' }}>DAMAGE</p>
                                                <h3 style={{ margin: 0, color: claim.damage_percentage > 50 ? '#C62828' : '#FF9800' }}>
                                                    {claim.damage_percentage}%
                                                </h3>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: '0 0 4px' }}>AMOUNT</p>
                                                <h3 style={{ margin: 0, color: 'var(--paddy-green)' }}>
                                                    ₹{claim.claim_amount?.toLocaleString()}
                                                </h3>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eee', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <button
                                            className="btn-gov"
                                            style={{ background: 'var(--paddy-green)', color: 'white', padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            onClick={() => { setSelectedClaim(claim); setApproveAmount(claim.claim_amount?.toString() || ''); }}
                                        >
                                            <FileCheck size={16} /> Review Claim
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ===== FARMERS TAB ===== */}
            {activeTab === 'farmers' && (
                <div>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--deep-forest)' }}>
                        <Users size={20} /> All Registered Farmers ({farmers.length})
                    </h3>

                    {farmers.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', opacity: 0.6 }}>
                            <Users size={48} style={{ marginBottom: '1rem' }} />
                            <h3>No Farmers Registered</h3>
                            <p>No farmers have registered yet.</p>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#F9FAFB', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem 1.5rem', opacity: 0.6, fontSize: '0.8rem' }}>NAME</th>
                                        <th style={{ padding: '1rem 1.5rem', opacity: 0.6, fontSize: '0.8rem' }}>CONTACT</th>
                                        <th style={{ padding: '1rem 1.5rem', opacity: 0.6, fontSize: '0.8rem' }}>LOCATION</th>
                                        <th style={{ padding: '1rem 1.5rem', opacity: 0.6, fontSize: '0.8rem' }}>LAND AREA</th>
                                        <th style={{ padding: '1rem 1.5rem', opacity: 0.6, fontSize: '0.8rem' }}>REGISTERED</th>
                                        <th style={{ padding: '1rem 1.5rem', opacity: 0.6, fontSize: '0.8rem' }}>STATUS</th>
                                        <th style={{ padding: '1rem 1.5rem', opacity: 0.6, fontSize: '0.8rem' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {farmers.map(item => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '1.2rem 1.5rem', fontWeight: 'bold' }}>{item.full_name}</td>
                                            <td style={{ padding: '1.2rem 1.5rem' }}>{item.phone}</td>
                                            <td style={{ padding: '1.2rem 1.5rem' }}>{item.place}, {item.district}</td>
                                            <td style={{ padding: '1.2rem 1.5rem' }}>{item.land_area} Acres</td>
                                            <td style={{ padding: '1.2rem 1.5rem', fontSize: '0.9rem', color: '#666' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Clock size={12} color="#888" />
                                                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.2rem 1.5rem' }}>
                                                <span style={{
                                                    background: item.verification_status === 'approved' ? '#E8F5E9' : item.verification_status === 'rejected' ? '#FFEBEE' : '#FFF3E0',
                                                    color: item.verification_status === 'approved' ? '#2E7D32' : item.verification_status === 'rejected' ? '#C62828' : '#E65100',
                                                    padding: '4px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {item.verification_status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.2rem 1.5rem' }}>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    <button className="btn-gov" style={{ background: '#2196F3', color: 'white', padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => { setSelectedFarmer(item); setIsEditing(false); }}>
                                                        <Eye size={14} /> View
                                                    </button>
                                                    <button className="btn-gov" style={{ background: '#F44336', color: 'white', padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleDeleteFarmer(item)}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                    {item.verification_status === 'pending' && (
                                                        <>
                                                            <button className="btn-gov" style={{ background: '#4CAF50', color: 'white', padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleFarmerStatus(item.id, 'approved')}>✓</button>
                                                            <button className="btn-gov" style={{ background: '#F44336', color: 'white', padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleFarmerStatus(item.id, 'rejected')}>✕</button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ===== CLAIM HISTORY TAB ===== */}
            {activeTab === 'history' && (
                <div className="animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--deep-forest)' }}>
                            <Clock size={20} /> All Claim History ({claims.length})
                        </h3>
                        {claims.length > 0 && (
                            <button className="btn-gov" style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                onClick={() => {
                                    const headers = 'Claim Number,Farmer,Survey,Damage %,Type,Amount,Status,Date\n';
                                    const rows = claims.map(c =>
                                        `${c.claim_number},${c.farmer_name},${c.land_survey},${c.damage_percentage}%,${c.damage_type || ''},₹${c.claim_amount},${c.claim_status},${new Date(c.created_at).toLocaleDateString('en-IN')}`
                                    ).join('\n');
                                    const blob = new Blob([headers + rows], { type: 'text/csv' });
                                    const a = document.createElement('a');
                                    a.href = URL.createObjectURL(blob);
                                    a.download = `claims_export_${new Date().toISOString().slice(0, 10)}.csv`;
                                    a.click();
                                }}>
                                <Download size={14} /> Export CSV
                            </button>
                        )}
                    </div>

                    {claims.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', opacity: 0.6 }}>
                            <FileCheck size={48} style={{ marginBottom: '1rem' }} />
                            <h3>No Claims Yet</h3>
                            <p>No claims have been submitted.</p>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#F9FAFB', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem 1.5rem', opacity: 0.6, fontSize: '0.8rem' }}>CLAIM ID</th>
                                        <th style={{ padding: '1rem 1.5rem', opacity: 0.6, fontSize: '0.8rem' }}>FARMER</th>
                                        <th style={{ padding: '1rem 1.5rem', opacity: 0.6, fontSize: '0.8rem' }}>SURVEY #</th>
                                        <th style={{ padding: '1rem 1.5rem', opacity: 0.6, fontSize: '0.8rem' }}>DAMAGE %</th>
                                        <th style={{ padding: '1rem 1.5rem', opacity: 0.6, fontSize: '0.8rem' }}>AMOUNT</th>
                                        <th style={{ padding: '1rem 1.5rem', opacity: 0.6, fontSize: '0.8rem' }}>STATUS</th>
                                        <th style={{ padding: '1rem 1.5rem', opacity: 0.6, fontSize: '0.8rem' }}>DATE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {claims.map(claim => (
                                        <tr key={claim.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '1.2rem 1.5rem', fontWeight: 'bold', fontSize: '0.85rem' }}>{claim.claim_number}</td>
                                            <td style={{ padding: '1.2rem 1.5rem' }}>{claim.farmer_name}</td>
                                            <td style={{ padding: '1.2rem 1.5rem' }}>{claim.land_survey}</td>
                                            <td style={{ padding: '1.2rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '50px', height: '6px', background: '#eee', borderRadius: '3px' }}>
                                                        <div style={{ width: `${Math.min(claim.damage_percentage, 100)}%`, height: '100%', background: claim.damage_percentage > 50 ? '#C62828' : '#FF9800', borderRadius: '3px' }}></div>
                                                    </div>
                                                    {claim.damage_percentage}%
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.2rem 1.5rem', fontWeight: 'bold', color: 'var(--paddy-green)' }}>₹{claim.claim_amount?.toLocaleString()}</td>
                                            <td style={{ padding: '1.2rem 1.5rem' }}>
                                                <span style={{
                                                    background: getStatusColor(claim.claim_status) + '20',
                                                    color: getStatusColor(claim.claim_status),
                                                    padding: '4px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {claim.claim_status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.2rem 1.5rem', fontSize: '0.85rem', opacity: 0.7 }}>
                                                {new Date(claim.created_at).toLocaleDateString('en-IN')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ===== RATE SETTINGS TAB ===== */}
            {activeTab === 'settings' && (
                <div className="animate-fade-in">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--deep-forest)' }}>
                        <IndianRupee size={20} /> Insurance Rate Settings
                    </h3>

                    <div className="glass-card">
                        <p style={{ marginBottom: '1.5rem', opacity: 0.7 }}>
                            Configure insurance rates per Acre and Cent. These rates are used to calculate claim amounts for farmers.
                        </p>

                        {rates.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No rates configured. They will be auto-created when a farmer submits a claim.</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#F9FAFB', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem 1.5rem', opacity: 0.6, fontSize: '0.8rem' }}>CROP TYPE</th>
                                        <th style={{ padding: '1rem 1.5rem', opacity: 0.6, fontSize: '0.8rem' }}>RATE / ACRE (₹)</th>
                                        <th style={{ padding: '1rem 1.5rem', opacity: 0.6, fontSize: '0.8rem' }}>RATE / CENT (₹)</th>
                                        <th style={{ padding: '1rem 1.5rem', opacity: 0.6, fontSize: '0.8rem' }}>LAST UPDATED</th>
                                        <th style={{ padding: '1rem 1.5rem', opacity: 0.6, fontSize: '0.8rem' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rates.map(rate => (
                                        <tr key={rate.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '1.2rem 1.5rem', fontWeight: 600 }}>{rate.crop_type}</td>
                                            <td style={{ padding: '1.2rem 1.5rem' }}>
                                                {editingRate === rate.id ? (
                                                    <input
                                                        className="gov-input"
                                                        style={{ width: '140px', padding: '0.5rem' }}
                                                        type="number"
                                                        value={rateForm.rate_per_acre}
                                                        onChange={e => setRateForm({ ...rateForm, rate_per_acre: e.target.value })}
                                                    />
                                                ) : (
                                                    <span style={{ fontWeight: 700, color: 'var(--paddy-green)' }}>₹{rate.rate_per_acre?.toLocaleString()}</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1.2rem 1.5rem' }}>
                                                {editingRate === rate.id ? (
                                                    <input
                                                        className="gov-input"
                                                        style={{ width: '140px', padding: '0.5rem' }}
                                                        type="number"
                                                        value={rateForm.rate_per_cent}
                                                        onChange={e => setRateForm({ ...rateForm, rate_per_cent: e.target.value })}
                                                    />
                                                ) : (
                                                    <span style={{ fontWeight: 700, color: 'var(--paddy-green)' }}>₹{rate.rate_per_cent?.toLocaleString()}</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1.2rem 1.5rem', fontSize: '0.85rem', opacity: 0.7 }}>
                                                {rate.updated_at ? new Date(rate.updated_at).toLocaleDateString('en-IN') : '-'}
                                            </td>
                                            <td style={{ padding: '1.2rem 1.5rem' }}>
                                                {editingRate === rate.id ? (
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            className="btn-gov"
                                                            style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                                                            disabled={rateSaving}
                                                            onClick={async () => {
                                                                setRateSaving(true);
                                                                try {
                                                                    const res = await masterService.updateRate(rate.id, {
                                                                        rate_per_acre: parseFloat(rateForm.rate_per_acre),
                                                                        rate_per_cent: parseFloat(rateForm.rate_per_cent)
                                                                    });
                                                                    // Update local state immediately
                                                                    setRates(prev => prev.map(r =>
                                                                        r.id === rate.id ? { ...r, ...res.data.rate } : r
                                                                    ));
                                                                    setEditingRate(null);
                                                                    toast.success('Rate updated successfully!');
                                                                } catch (err) {
                                                                    toast.error('Failed to update: ' + (err.response?.data?.detail || err.message));
                                                                } finally {
                                                                    setRateSaving(false);
                                                                }
                                                            }}
                                                        >
                                                            <Save size={14} /> {rateSaving ? 'Saving...' : 'Save'}
                                                        </button>
                                                        <button
                                                            className="btn-gov"
                                                            style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#eee', color: '#333' }}
                                                            onClick={() => setEditingRate(null)}
                                                        >
                                                            <XCircle size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        className="btn-gov"
                                                        style={{ padding: '6px 16px', fontSize: '0.8rem', background: '#E8F5E9', color: 'var(--paddy-green)' }}
                                                        onClick={() => {
                                                            setEditingRate(rate.id);
                                                            setRateForm({
                                                                rate_per_acre: rate.rate_per_acre?.toString() || '',
                                                                rate_per_cent: rate.rate_per_cent?.toString() || ''
                                                            });
                                                        }}
                                                    >
                                                        <Pencil size={14} /> Edit
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* Formula Reference */}
                        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#F9FAFB', borderRadius: '12px' }}>
                            <h4 style={{ margin: '0 0 0.5rem', color: 'var(--deep-forest)' }}>Formula Reference</h4>
                            <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', opacity: 0.7 }}>
                                <strong>Sum Insured</strong> = Area × Rate per unit (Acre or Cent)<br />
                                <strong>Claim Amount</strong> = Sum Insured × (Damage % / 100)
                            </p>
                        </div>

                        {/* Price List Table from PDF */}
                        <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#E8F5E9', borderRadius: '12px', border: '1px solid #A5D6A7' }}>
                            <h4 style={{ margin: '0 0 1rem', color: 'var(--deep-forest)' }}>Claim Amount Reference Table (Rate: ₹50,000/Acre)</h4>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--paddy-green)', color: 'white' }}>
                                            <th style={{ padding: '10px', textAlign: 'left' }}>Area</th>
                                            <th style={{ padding: '10px', textAlign: 'right' }}>Sum Insured</th>
                                            <th style={{ padding: '10px', textAlign: 'right' }}>5% (Healthy)</th>
                                            <th style={{ padding: '10px', textAlign: 'right' }}>20% (Mild)</th>
                                            <th style={{ padding: '10px', textAlign: 'right' }}>40% (Moderate)</th>
                                            <th style={{ padding: '10px', textAlign: 'right' }}>65% (Severe)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[35, 50, 40, 80].map(area => {
                                            const sum = area * 50000;
                                            return (
                                                <tr key={area} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                                    <td style={{ padding: '10px', fontWeight: 600 }}>{area} Acre</td>
                                                    <td style={{ padding: '10px', textAlign: 'right' }}>₹{sum.toLocaleString()}</td>
                                                    <td style={{ padding: '10px', textAlign: 'right', color: '#4CAF50', fontWeight: 600 }}>₹{(sum * 0.05).toLocaleString()}</td>
                                                    <td style={{ padding: '10px', textAlign: 'right', color: '#FF9800', fontWeight: 600 }}>₹{(sum * 0.20).toLocaleString()}</td>
                                                    <td style={{ padding: '10px', textAlign: 'right', color: '#F57C00', fontWeight: 600 }}>₹{(sum * 0.40).toLocaleString()}</td>
                                                    <td style={{ padding: '10px', textAlign: 'right', color: '#C62828', fontWeight: 600 }}>₹{(sum * 0.65).toLocaleString()}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== CLAIM REVIEW MODAL ===== */}
            {selectedClaim && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                    padding: '20px'
                }} onClick={() => setSelectedClaim(null)}>
                    <div className="glass-card animate-scale-in" style={{ width: '90%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', background: 'white', padding: '2rem' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ color: 'var(--deep-forest)', margin: 0, fontSize: '1.3rem' }}>Review Claim</h2>
                            <button onClick={() => setSelectedClaim(null)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        {/* Claim Details */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div>
                                <p style={{ opacity: 0.6, fontSize: '0.8rem', marginBottom: '4px' }}>Claim Number</p>
                                <p style={{ fontWeight: 'bold' }}>{selectedClaim.claim_number}</p>
                            </div>
                            <div>
                                <p style={{ opacity: 0.6, fontSize: '0.8rem', marginBottom: '4px' }}>Farmer</p>
                                <p style={{ fontWeight: 'bold' }}>{selectedClaim.farmer_name}</p>
                            </div>
                            <div>
                                <p style={{ opacity: 0.6, fontSize: '0.8rem', marginBottom: '4px' }}>Survey Number</p>
                                <p style={{ fontWeight: 'bold' }}>#{selectedClaim.land_survey}</p>
                            </div>
                            <div>
                                <p style={{ opacity: 0.6, fontSize: '0.8rem', marginBottom: '4px' }}>Damage Percentage</p>
                                <p style={{ fontWeight: 'bold', color: selectedClaim.damage_percentage > 50 ? '#C62828' : '#FF9800', fontSize: '1.2rem' }}>{selectedClaim.damage_percentage}%</p>
                            </div>
                            <div>
                                <p style={{ opacity: 0.6, fontSize: '0.8rem', marginBottom: '4px' }}>Calculated Amount</p>
                                <p style={{ fontWeight: 'bold', color: 'var(--paddy-green)', fontSize: '1.2rem' }}>₹{selectedClaim.claim_amount?.toLocaleString()}</p>
                            </div>
                            <div>
                                <p style={{ opacity: 0.6, fontSize: '0.8rem', marginBottom: '4px' }}>Status</p>
                                <span style={{
                                    background: getStatusColor(selectedClaim.claim_status) + '20',
                                    color: getStatusColor(selectedClaim.claim_status),
                                    padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase'
                                }}>{selectedClaim.claim_status}</span>
                            </div>
                        </div>

                        {selectedClaim.is_fraud_suspected && (
                            <div style={{ background: '#FFEBEE', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <AlertTriangle size={20} color="#C62828" />
                                <div>
                                    <strong style={{ color: '#C62828' }}>Fraud Alert</strong>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>GPS location mismatch detected. Please investigate before approving.</p>
                                </div>
                            </div>
                        )}

                        {/* Approve Amount */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Approved Payment Amount (₹)</label>
                            <input
                                className="gov-input"
                                style={{ width: '100%' }}
                                type="number"
                                placeholder="Enter amount to approve"
                                value={approveAmount}
                                onChange={e => setApproveAmount(e.target.value)}
                            />
                            <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '4px' }}>Original calculated amount: ₹{selectedClaim.claim_amount?.toLocaleString()}</p>
                        </div>

                        {/* Admin Notes */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Admin Notes</label>
                            <textarea
                                className="gov-input"
                                style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                                placeholder="Add your review notes here..."
                                value={adminNotes}
                                onChange={e => setAdminNotes(e.target.value)}
                            />
                        </div>

                        {/* Rejection Reason */}
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Rejection Reason (if rejecting)</label>
                            <input
                                className="gov-input"
                                style={{ width: '100%' }}
                                placeholder="e.g., Insufficient evidence, false claim, etc."
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                            <button
                                className="btn-gov"
                                style={{ flex: 1, background: '#4CAF50', color: 'white', padding: '12px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                onClick={() => handleClaimAction(selectedClaim.id, 'approve')}
                            >
                                <CheckCircle size={18} /> Approve & Pay
                            </button>
                            <button
                                className="btn-gov"
                                style={{ flex: 1, background: '#F44336', color: 'white', padding: '12px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                onClick={() => handleClaimAction(selectedClaim.id, 'reject')}
                            >
                                <XCircle size={18} /> Reject Claim
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== FARMER DETAILS MODAL ===== */}
            {selectedFarmer && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                    padding: '20px'
                }} onClick={() => setSelectedFarmer(null)}>
                    <div className="glass-card" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', background: 'white', padding: '2rem' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ color: 'var(--deep-forest)', margin: 0 }}>Farmer Details</h2>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {!isEditing ? (
                                    <>
                                        <button onClick={() => handleEditFarmer(selectedFarmer)} className="btn-gov" style={{ background: '#FF9800', color: 'white', padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Pencil size={14} /> Edit
                                        </button>
                                        <button onClick={() => handleDeleteFarmer(selectedFarmer)} className="btn-gov" style={{ background: '#F44336', color: 'white', padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={handleSaveFarmer} className="btn-gov" style={{ background: 'var(--paddy-green)', color: 'white', padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Save size={14} /> Save
                                        </button>
                                        <button onClick={() => setIsEditing(false)} className="btn-gov" style={{ background: '#eee', color: '#333', padding: '6px 12px', fontSize: '0.8rem' }}>
                                            Cancel
                                        </button>
                                    </>
                                )}
                                <button onClick={() => setSelectedFarmer(null)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', marginLeft: '10px' }}>×</button>
                            </div>
                        </div>

                        {isEditing ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.85rem' }}>Full Name</label>
                                    <input className="gov-input" style={{ width: '100%' }} value={editFormData.full_name} onChange={e => setEditFormData({ ...editFormData, full_name: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.85rem' }}>Phone</label>
                                    <input
                                        className="gov-input"
                                        style={{ width: '100%' }}
                                        value={editFormData.phone}
                                        maxLength={10}
                                        placeholder="10-digit mobile number"
                                        onChange={e => {
                                            if (/^\d*$/.test(e.target.value) && e.target.value.length <= 10) setEditFormData({ ...editFormData, phone: e.target.value });
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.85rem' }}>Village</label>
                                    <input className="gov-input" style={{ width: '100%' }} value={editFormData.village} onChange={e => setEditFormData({ ...editFormData, village: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.85rem' }}>District</label>
                                    <input className="gov-input" style={{ width: '100%' }} value={editFormData.district} onChange={e => setEditFormData({ ...editFormData, district: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.85rem' }}>Land Area (Acres)</label>
                                    <input className="gov-input" style={{ width: '100%' }} type="number" value={editFormData.land_area} onChange={e => setEditFormData({ ...editFormData, land_area: e.target.value })} />
                                </div>
                                <div style={{ background: '#FFF3E0', padding: '10px', borderRadius: '8px', border: '1px dashed #FF9800', gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.85rem', color: '#E65100' }}>Reset Password <span style={{ fontWeight: 400 }}>(Optional)</span></label>
                                    <input
                                        type="password"
                                        className="gov-input"
                                        style={{ width: '100%' }}
                                        placeholder="Enter new password to reset"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div>
                                    <p style={{ opacity: 0.6, fontSize: '0.8rem', marginBottom: '4px' }}>Full Name</p>
                                    <p style={{ fontWeight: 'bold' }}>{selectedFarmer.full_name}</p>
                                </div>
                                <div>
                                    <p style={{ opacity: 0.6, fontSize: '0.8rem', marginBottom: '4px' }}>Phone</p>
                                    <p style={{ fontWeight: 'bold' }}>{selectedFarmer.phone}</p>
                                </div>
                                <div>
                                    <p style={{ opacity: 0.6, fontSize: '0.8rem', marginBottom: '4px' }}>Location</p>
                                    <p style={{ fontWeight: 'bold' }}>{selectedFarmer.place}, {selectedFarmer.district}</p>
                                </div>
                                <div>
                                    <p style={{ opacity: 0.6, fontSize: '0.8rem', marginBottom: '4px' }}>Land Area</p>
                                    <p style={{ fontWeight: 'bold' }}>{selectedFarmer.land_area} Acres</p>
                                </div>
                                <div>
                                    <p style={{ opacity: 0.6, fontSize: '0.8rem', marginBottom: '4px' }}>Status</p>
                                    <span style={{
                                        background: selectedFarmer.verification_status === 'approved' ? '#E8F5E9' : selectedFarmer.verification_status === 'rejected' ? '#FFEBEE' : '#FFF3E0',
                                        color: selectedFarmer.verification_status === 'approved' ? '#2E7D32' : selectedFarmer.verification_status === 'rejected' ? '#C62828' : '#E65100',
                                        padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase'
                                    }}>{selectedFarmer.verification_status}</span>
                                </div>
                                <div>
                                    <p style={{ opacity: 0.6, fontSize: '0.8rem', marginBottom: '4px' }}>Registered</p>
                                    <p style={{ fontWeight: 'bold' }}>{selectedFarmer.created_at ? new Date(selectedFarmer.created_at).toLocaleDateString('en-IN') : 'N/A'}</p>
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: '2rem' }}>
                            <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--paddy-green)' }}>Documents</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <p style={{ fontSize: '0.85rem', marginBottom: '8px', fontWeight: 600 }}>Farmer Photo</p>
                                    {selectedFarmer.photo_url ? (
                                        <img src={`http://localhost:8000${selectedFarmer.photo_url}`} alt="Farmer" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', height: '180px', border: '1px solid #eee' }} />
                                    ) : (
                                        <div style={{ padding: '2rem', background: '#f5f5f5', borderRadius: '8px', textAlign: 'center', fontSize: '0.8rem', opacity: 0.6, height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Photo</div>
                                    )}
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.85rem', marginBottom: '8px', fontWeight: 600 }}>Land Document</p>
                                    {selectedFarmer.document_url ? (
                                        selectedFarmer.document_url.endsWith('.pdf') ? (
                                            <a href={`http://localhost:8000${selectedFarmer.document_url}`} target="_blank" rel="noreferrer" className="btn-gov" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', textDecoration: 'none' }}>📄 View PDF</a>
                                        ) : (
                                            <img src={`http://localhost:8000${selectedFarmer.document_url}`} alt="Land Doc" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', height: '180px', border: '1px solid #eee' }} />
                                        )
                                    ) : (
                                        <div style={{ padding: '2rem', background: '#f5f5f5', borderRadius: '8px', textAlign: 'center', fontSize: '0.8rem', opacity: 0.6, height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Document</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {selectedFarmer.verification_status === 'pending' && !isEditing && (
                            <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                                <button className="btn-gov" style={{ flex: 1, background: '#4CAF50', color: 'white', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => { handleFarmerStatus(selectedFarmer.id, 'approved'); }}>
                                    <CheckCircle size={18} /> Approve Farmer
                                </button>
                                <button className="btn-gov" style={{ flex: 1, background: '#F44336', color: 'white', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => { handleFarmerStatus(selectedFarmer.id, 'rejected'); }}>
                                    <XCircle size={18} /> Reject Farmer
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
