// frontend/src/pages/Lands.jsx
import { useState, useEffect } from 'react';
import { landService } from '../services/api';
import { Map, Plus, Trash2, MapPin, Ruler, Sprout } from 'lucide-react';

export default function Lands({ user }) {
    const [lands, setLands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newLand, setNewLand] = useState({
        survey_number: '',
        area: '',
        unit: 'Acre',
        crop_type: 'Paddy',
        irrigation_type: 'Canal',
        latitude: '',
        longitude: ''
    });

    useEffect(() => {
        fetchLands();
    }, []);

    const fetchLands = async () => {
        try {
            const res = await landService.getMyLands();
            setLands(res.data);
        } catch (err) {
            console.error('Failed to fetch lands', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddLand = async (e) => {
        e.preventDefault();
        try {
            await landService.addLand(newLand);
            setShowAddForm(false);
            fetchLands();
            setNewLand({
                survey_number: '',
                area: '',
                unit: 'Acre',
                crop_type: 'Paddy',
                irrigation_type: 'Canal',
                latitude: '',
                longitude: ''
            });
        } catch (err) {
            alert('Failed to add land record');
        }
    };



    return (
        <div className="dashboard-container animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ color: 'var(--paddy-green)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Map size={32} /> My Land Records
                    </h1>
                    <p style={{ opacity: 0.7 }}>Manage your agricultural plots for insurance claims</p>
                </div>
                <button className="btn-gov" onClick={() => setShowAddForm(true)}>
                    <Plus size={20} style={{ marginRight: '8px' }} /> Register New Land
                </button>
            </div>

            <div className="gov-grid">
                {lands.map(land => (
                    <div key={land.id} className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ background: 'rgba(0,132,61,0.1)', padding: '10px', borderRadius: '12px' }}>
                                <MapPin color="var(--paddy-green)" />
                            </div>
                            <span className="badge badge-approved">Verified</span>
                        </div>
                        <h3 style={{ marginBottom: '0.5rem' }}>Survey #{land.survey_number}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
                            <p><Ruler size={14} /> {land.area} {land.unit}</p>
                            <p><Sprout size={14} /> {land.crop_type}</p>
                        </div>
                        <div className="map-view" style={{ height: '120px', marginTop: '1.5rem', fontSize: '0.8rem' }}>
                            📍 GPS: {land.latitude?.toFixed(4)}, {land.longitude?.toFixed(4)}
                        </div>
                    </div>
                ))}
            </div>

            {showAddForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', background: 'white', padding: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--deep-forest)', fontSize: '1.5rem' }}>Register Plot</h2>
                        <form onSubmit={handleAddLand}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Survey Number</label>
                                    <input
                                        className="gov-input"
                                        style={{ width: '100%' }}
                                        required
                                        value={newLand.survey_number}
                                        onChange={e => setNewLand({ ...newLand, survey_number: e.target.value })}
                                        placeholder="e.g. 123/45"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Area Size</label>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <input
                                            className="gov-input"
                                            type="number"
                                            step="0.01"
                                            required
                                            value={newLand.area}
                                            onChange={e => setNewLand({ ...newLand, area: e.target.value })}
                                            style={{ flex: 2 }}
                                            placeholder="0.00"
                                        />
                                        <select
                                            className="gov-input"
                                            value={newLand.unit}
                                            onChange={e => setNewLand({ ...newLand, unit: e.target.value })}
                                            style={{ flex: 1, padding: '0 5px' }}
                                        >
                                            <option>Acre</option>
                                            <option>Cent</option>
                                            <option>Hectare</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Major Crop</label>
                                <select
                                    className="gov-input"
                                    style={{ width: '100%' }}
                                    value={newLand.crop_type}
                                    onChange={e => setNewLand({ ...newLand, crop_type: e.target.value })}
                                >
                                    {['Paddy', 'Coconut', 'Rubber', 'Banana', 'Pepper', 'Arecanut', 'Cardamom', 'Tea', 'Coffee'].map(c => (
                                        <option key={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>GPS Coordinates (Manual Entry)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <input
                                        className="gov-input"
                                        type="number"
                                        step="0.000001"
                                        placeholder="Latitude (e.g. 9.9312)"
                                        value={newLand.latitude}
                                        onChange={e => setNewLand({ ...newLand, latitude: e.target.value })}
                                        required
                                    />
                                    <input
                                        className="gov-input"
                                        type="number"
                                        step="0.000001"
                                        placeholder="Longitude (e.g. 76.2673)"
                                        value={newLand.longitude}
                                        onChange={e => setNewLand({ ...newLand, longitude: e.target.value })}
                                        required
                                    />
                                </div>
                                <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '5px' }}>
                                    Please enter precise coordinates from your land documents or a GPS device.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
                                <button type="button" className="btn-gov" style={{ background: '#eee', color: '#333', flex: 1 }} onClick={() => setShowAddForm(false)}>Cancel</button>
                                <button type="submit" className="btn-gov" style={{ flex: 1, background: 'var(--paddy-green)', color: 'white' }}>Register Plot</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {lands.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '5rem', opacity: 0.5 }}>
                    <Map size={64} style={{ marginBottom: '1rem' }} />
                    <h3>No Lands Registered</h3>
                    <p>Register your first agricultural plot to start insuring crops.</p>
                </div>
            )}
        </div>
    );
}
