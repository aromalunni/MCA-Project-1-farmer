// frontend/src/pages/Lands.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { landService } from '../services/api';
import { Map, Plus, MapPin, Ruler, Sprout, Eye, EyeOff, Navigation, Search, Loader, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function Lands({ user }) {
    const [lands, setLands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showMap, setShowMap] = useState(true);
    const [gpsLoading, setGpsLoading] = useState(false);
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const formMapRef = useRef(null);
    const formMapInstanceRef = useRef(null);
    const formMarkerRef = useRef(null);

    // Location finder state
    const [searchLat, setSearchLat] = useState('');
    const [searchLng, setSearchLng] = useState('');

    const [newLand, setNewLand] = useState({
        survey_number: '', area: '', unit: 'Acre', crop_type: 'Paddy',
        irrigation_type: 'Canal', latitude: '', longitude: ''
    });

    useEffect(() => { fetchLands(); }, []);

    // Main map - show all lands
    useEffect(() => {
        if (!showMap || !mapRef.current) return;
        const validLands = lands.filter(l => l.latitude && l.longitude);
        if (validLands.length === 0) return;

        if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }

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

        if (validLands.length > 1) {
            map.fitBounds(L.latLngBounds(validLands.map(l => [l.latitude, l.longitude])), { padding: [30, 30] });
        }

        return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
    }, [lands, showMap]);

    // Form mini-map - live preview when entering coordinates
    const updateFormMap = useCallback((lat, lng) => {
        if (!formMapRef.current) return;
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        if (isNaN(latNum) || isNaN(lngNum) || latNum === 0 || lngNum === 0) return;

        if (!formMapInstanceRef.current) {
            formMapInstanceRef.current = L.map(formMapRef.current).setView([latNum, lngNum], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OSM'
            }).addTo(formMapInstanceRef.current);
        } else {
            formMapInstanceRef.current.setView([latNum, lngNum], 15);
        }

        if (formMarkerRef.current) {
            formMarkerRef.current.setLatLng([latNum, lngNum]);
        } else {
            const redIcon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
            });
            formMarkerRef.current = L.marker([latNum, lngNum], { icon: redIcon }).addTo(formMapInstanceRef.current);
        }
        formMarkerRef.current.bindPopup(`<strong>Your Location</strong><br/>Lat: ${latNum.toFixed(6)}<br/>Lng: ${lngNum.toFixed(6)}`).openPopup();
    }, []);

    // Cleanup form map when modal closes
    useEffect(() => {
        if (!showAddForm && formMapInstanceRef.current) {
            formMapInstanceRef.current.remove();
            formMapInstanceRef.current = null;
            formMarkerRef.current = null;
        }
    }, [showAddForm]);

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

    // Get GPS location from browser
    const getMyLocation = (target) => {
        if (!navigator.geolocation) { alert('GPS not supported in your browser'); return; }
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude.toFixed(6);
                const lng = pos.coords.longitude.toFixed(6);
                if (target === 'form') {
                    setNewLand(prev => ({ ...prev, latitude: lat, longitude: lng }));
                    setTimeout(() => updateFormMap(lat, lng), 300);
                } else {
                    setSearchLat(lat);
                    setSearchLng(lng);
                }
                setGpsLoading(false);
            },
            (err) => {
                alert('Could not get GPS location. Please enter manually.');
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Search location on main map
    const handleSearchLocation = () => {
        const lat = parseFloat(searchLat);
        const lng = parseFloat(searchLng);
        if (isNaN(lat) || isNaN(lng)) { alert('Enter valid latitude and longitude'); return; }

        if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 16);
            const redIcon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
            });
            L.marker([lat, lng], { icon: redIcon }).addTo(mapInstanceRef.current)
                .bindPopup(`<strong>Searched Location</strong><br/>Lat: ${lat}<br/>Lng: ${lng}`).openPopup();
        }
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
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn-gov" style={{ background: showMap ? 'var(--paddy-green)' : '#eee', color: showMap ? 'white' : '#333' }} onClick={() => setShowMap(!showMap)}>
                        {showMap ? <EyeOff size={16} /> : <Eye size={16} />}
                        <span style={{ marginLeft: '6px' }}>{showMap ? 'Hide Map' : 'Show Map'}</span>
                    </button>
                    <button className="btn-gov" onClick={() => setShowAddForm(true)}>
                        <Plus size={18} style={{ marginRight: '6px' }} /> Add Land
                    </button>
                </div>
            </div>

            {/* MAP VIEW with Location Finder */}
            {showMap && (
                <div className="glass-card" style={{ padding: '0', overflow: 'hidden', marginBottom: '1.5rem', borderRadius: '16px' }}>
                    <div style={{ padding: '0.8rem 1.2rem', background: 'var(--paddy-green)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={18} /> <strong>Farm Land Map View</strong>
                        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', opacity: 0.8 }}>{validLands.length} plot(s)</span>
                    </div>

                    {/* Location Finder Bar */}
                    <div style={{ padding: '0.8rem 1rem', background: '#F5F5F5', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid #e0e0e0' }}>
                        <Search size={16} style={{ opacity: 0.5 }} />
                        <input
                            className="gov-input"
                            style={{ flex: 1, minWidth: '100px', padding: '0.5rem', fontSize: '0.85rem' }}
                            placeholder="Latitude"
                            type="number" step="0.000001"
                            value={searchLat}
                            onChange={e => setSearchLat(e.target.value)}
                        />
                        <input
                            className="gov-input"
                            style={{ flex: 1, minWidth: '100px', padding: '0.5rem', fontSize: '0.85rem' }}
                            placeholder="Longitude"
                            type="number" step="0.000001"
                            value={searchLng}
                            onChange={e => setSearchLng(e.target.value)}
                        />
                        <button className="btn-gov" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={handleSearchLocation}>
                            <Search size={14} /> Find
                        </button>
                        <button className="btn-gov" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#1565C0' }} onClick={() => getMyLocation('search')} disabled={gpsLoading}>
                            {gpsLoading ? <Loader className="spin" size={14} /> : <Navigation size={14} />} My GPS
                        </button>
                    </div>

                    {validLands.length > 0 ? (
                        <div ref={mapRef} style={{ height: '400px', width: '100%' }}></div>
                    ) : (
                        <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                            <MapPin size={48} style={{ marginBottom: '1rem' }} />
                            <p>No lands with GPS coordinates. Add a land plot to see it on the map.</p>
                            <p style={{ fontSize: '0.8rem' }}>Or enter coordinates above to find a location.</p>
                        </div>
                    )}
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

            {/* ADD LAND MODAL with Live Map Preview */}
            {showAddForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '600px', background: 'white', padding: '2rem', maxHeight: '90vh', overflow: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ color: 'var(--deep-forest)', fontSize: '1.3rem', margin: 0 }}>Register Plot</h2>
                            <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
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

                            {/* GPS with Live Map */}
                            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#F1F8E9', borderRadius: '12px', border: '1px solid #C8E6C9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                    <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MapPin size={16} color="var(--paddy-green)" /> GPS Location
                                    </label>
                                    <button type="button" className="btn-gov" style={{ padding: '4px 12px', fontSize: '0.75rem', background: '#1565C0' }}
                                        onClick={() => getMyLocation('form')} disabled={gpsLoading}>
                                        {gpsLoading ? <Loader className="spin" size={12} /> : <Navigation size={12} />}
                                        <span style={{ marginLeft: '4px' }}>Use My GPS</span>
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
                                    <input className="gov-input" type="number" step="0.000001" placeholder="Latitude" required
                                        value={newLand.latitude}
                                        onChange={e => {
                                            setNewLand({ ...newLand, latitude: e.target.value });
                                            updateFormMap(e.target.value, newLand.longitude);
                                        }}
                                    />
                                    <input className="gov-input" type="number" step="0.000001" placeholder="Longitude" required
                                        value={newLand.longitude}
                                        onChange={e => {
                                            setNewLand({ ...newLand, longitude: e.target.value });
                                            updateFormMap(newLand.latitude, e.target.value);
                                        }}
                                    />
                                </div>

                                {/* Live Map Preview */}
                                <div ref={formMapRef} style={{
                                    height: '200px', width: '100%', borderRadius: '10px', overflow: 'hidden',
                                    border: '2px solid #A5D6A7',
                                    background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {(!newLand.latitude || !newLand.longitude) && (
                                        <p style={{ color: '#888', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>
                                            Enter coordinates or click "Use My GPS" to see location preview
                                        </p>
                                    )}
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
