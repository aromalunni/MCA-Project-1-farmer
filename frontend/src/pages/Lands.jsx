// frontend/src/pages/Lands.jsx
import { useState, useEffect, useRef } from 'react';
import { landService } from '../services/api';
import { Map, Plus, MapPin, Ruler, Sprout, Eye, EyeOff } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function Lands({ user }) {
    const [lands, setLands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showMap, setShowMap] = useState(true);
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const [newLand, setNewLand] = useState({
        survey_number: '', area: '', unit: 'Acre', crop_type: 'Paddy',
        irrigation_type: 'Canal', latitude: '', longitude: ''
    });

    useEffect(() => { fetchLands(); }, []);

    // Initialize/update map when lands change or showMap toggles
    useEffect(() => {
        if (!showMap || !mapRef.current) return;

        const validLands = lands.filter(l => l.latitude && l.longitude);
        if (validLands.length === 0) return;

        // Destroy previous map instance
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const center = [
            validLands.reduce((s, l) => s + l.latitude, 0) / validLands.length,
            validLands.reduce((s, l) => s + l.longitude, 0) / validLands.length
        ];

        const map = L.map(mapRef.current).setView(center, 13);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        const greenIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });

        validLands.forEach(land => {
            L.marker([land.latitude, land.longitude], { icon: greenIcon })
                .addTo(map)
                .bindPopup(`
                    <div style="min-width:160px">
                        <strong style="color:#00843D;font-size:1rem">Survey #${land.survey_number}</strong>
                        <hr style="margin:6px 0;border:none;border-top:1px solid #eee"/>
                        <p style="margin:4px 0;font-size:0.85rem">Crop: <strong>${land.crop_type}</strong></p>
                        <p style="margin:4px 0;font-size:0.85rem">Area: <strong>${land.area} ${land.unit}</strong></p>
                        <p style="margin:4px 0;font-size:0.8rem;color:#888">GPS: ${land.latitude?.toFixed(4)}, ${land.longitude?.toFixed(4)}</p>
                    </div>
                `);
        });

        // Fit bounds to show all markers
        if (validLands.length > 1) {
            const bounds = L.latLngBounds(validLands.map(l => [l.latitude, l.longitude]));
            map.fitBounds(bounds, { padding: [30, 30] });
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [lands, showMap]);

    const fetchLands = async () => {
        try { const res = await landService.getMyLands(); setLands(res.data); }
        catch (err) { console.error('Failed to fetch lands', err); }
        finally { setLoading(false); }
    };

    const handleAddLand = async (e) => {
        e.preventDefault();
        try {
            await landService.addLand(newLand);
            setShowAddForm(false);
            fetchLands();
            setNewLand({ survey_number: '', area: '', unit: 'Acre', crop_type: 'Paddy', irrigation_type: 'Canal', latitude: '', longitude: '' });
        } catch (err) { alert('Failed to add land record'); }
    };

    const validLands = lands.filter(l => l.latitude && l.longitude);

    return (
        <div className="dashboard-container animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ color: 'var(--paddy-green)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Map size={32} /> My Land Records
                    </h1>
                    <p style={{ opacity: 0.7 }}>Manage your agricultural plots for insurance claims</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-gov" style={{ background: showMap ? 'var(--paddy-green)' : '#eee', color: showMap ? 'white' : '#333' }} onClick={() => setShowMap(!showMap)}>
                        {showMap ? <EyeOff size={16} /> : <Eye size={16} />}
                        <span style={{ marginLeft: '6px' }}>{showMap ? 'Hide Map' : 'Show Map'}</span>
                    </button>
                    <button className="btn-gov" onClick={() => setShowAddForm(true)}>
                        <Plus size={18} style={{ marginRight: '6px' }} /> Add Land
                    </button>
                </div>
            </div>

            {/* MAP VIEW */}
            {showMap && validLands.length > 0 && (
                <div className="glass-card" style={{ padding: '0', overflow: 'hidden', marginBottom: '1.5rem', borderRadius: '16px' }}>
                    <div style={{ padding: '0.8rem 1.2rem', background: 'var(--paddy-green)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={18} /> <strong>Farm Land Map View</strong>
                        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', opacity: 0.8 }}>{validLands.length} plot(s) mapped</span>
                    </div>
                    <div ref={mapRef} style={{ height: '380px', width: '100%' }}></div>
                </div>
            )}

            {showMap && validLands.length === 0 && lands.length > 0 && (
                <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', marginBottom: '1.5rem', opacity: 0.6 }}>
                    <MapPin size={32} style={{ marginBottom: '0.5rem' }} />
                    <p>No GPS coordinates found. Add latitude/longitude to see lands on map.</p>
                </div>
            )}

            {/* LAND CARDS */}
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.9rem', opacity: 0.8 }}>
                            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}><Ruler size={14} /> {land.area} {land.unit}</p>
                            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}><Sprout size={14} /> {land.crop_type}</p>
                        </div>
                        {land.latitude && land.longitude && (
                            <div style={{ marginTop: '0.8rem', padding: '0.6rem', background: '#F1F8E9', borderRadius: '8px', fontSize: '0.8rem', color: '#558B2F' }}>
                                GPS: {land.latitude?.toFixed(4)}, {land.longitude?.toFixed(4)}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* ADD LAND MODAL */}
            {showAddForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', background: 'white', padding: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--deep-forest)', fontSize: '1.3rem' }}>Register Plot</h2>
                        <form onSubmit={handleAddLand}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Survey Number</label>
                                    <input className="gov-input" style={{ width: '100%' }} required value={newLand.survey_number} onChange={e => setNewLand({ ...newLand, survey_number: e.target.value })} placeholder="e.g. 123/45" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Area Size</label>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <input className="gov-input" type="number" step="0.01" required value={newLand.area} onChange={e => setNewLand({ ...newLand, area: e.target.value })} style={{ flex: 2 }} placeholder="0.00" />
                                        <select className="gov-input" value={newLand.unit} onChange={e => setNewLand({ ...newLand, unit: e.target.value })} style={{ flex: 1, padding: '0 5px' }}>
                                            <option>Acre</option><option>Cent</option><option>Hectare</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Major Crop</label>
                                <select className="gov-input" style={{ width: '100%' }} value={newLand.crop_type} onChange={e => setNewLand({ ...newLand, crop_type: e.target.value })}>
                                    {['Paddy', 'Coconut', 'Rubber', 'Banana', 'Pepper', 'Arecanut', 'Cardamom', 'Tea', 'Coffee'].map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>GPS Coordinates</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <input className="gov-input" type="number" step="0.000001" placeholder="Latitude (e.g. 9.9312)" value={newLand.latitude} onChange={e => setNewLand({ ...newLand, latitude: e.target.value })} required />
                                    <input className="gov-input" type="number" step="0.000001" placeholder="Longitude (e.g. 76.2673)" value={newLand.longitude} onChange={e => setNewLand({ ...newLand, longitude: e.target.value })} required />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" className="btn-gov" style={{ background: '#eee', color: '#333', flex: 1 }} onClick={() => setShowAddForm(false)}>Cancel</button>
                                <button type="submit" className="btn-gov" style={{ flex: 1 }}>Register Plot</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {lands.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                    <Map size={64} style={{ marginBottom: '1rem' }} />
                    <h3>No Lands Registered</h3>
                    <p>Register your first agricultural plot to start insuring crops.</p>
                </div>
            )}
        </div>
    );
}
