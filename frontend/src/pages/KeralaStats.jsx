// frontend/src/pages/KeralaStats.jsx
import { useState, useEffect, useRef } from 'react';
import { keralaService } from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import {
    CloudRain,
    Wind,
    Droplets,
    Thermometer,
    AlertTriangle,
    Sprout,
    TrendingUp,
    MapPin,
    Leaf,
    CheckCircle,
    Activity,
    Loader
} from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function KeralaStats() {
    const [monsoon, setMonsoon] = useState(null);
    const [spices, setSpices] = useState([]);
    const [crops, setCrops] = useState([]);
    const [risks, setRisks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [monsoonRes, spiceRes, cropRes, riskRes] = await Promise.all([
                    keralaService.getMonsoonData(),
                    keralaService.getSpiceMarket(),
                    keralaService.getCropMonitor(),
                    keralaService.getDistrictRisks()
                ]);
                setMonsoon(monsoonRes.data);
                setSpices(spiceRes.data);
                setCrops(cropRes.data);
                setRisks(riskRes.data);
            } catch (err) {
                console.error("Failed to fetch Kerala data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const rainfallData = {
        labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
        datasets: [{
            label: 'Rainfall (mm)',
            data: [650, 720, 580, 400, 300, 200],
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            borderRadius: 6,
        }],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Monsoon Rainfall Trend 2023' },
        },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { grid: { display: false } }
        }
    };

    if (loading) return (
        <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader className="spin" size={32} color="var(--paddy-green)" />
        </div>
    );

    return (
        <div className="dashboard-container animate-fade-in">
            {/* Hero Section */}
            <div style={{
                background: 'linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.35)), url(/kerala_bg.png)',
                backgroundSize: 'cover', backgroundPosition: 'center',
                color: 'white', padding: '3.5rem 2rem', marginBottom: '2rem', textAlign: 'center',
                borderRadius: 'var(--radius-xl)', overflow: 'hidden'
            }}>
                <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem', fontWeight: 700, textShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                    Kerala Agriculture Intelligence
                </h1>
                <p style={{ opacity: 0.95, fontSize: '1.05rem', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                    Real-time monsoon tracking, spice markets, and crop analytics
                </p>
            </div>

            {/* Monsoon + Rainfall Chart Row */}
            <div className="gov-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '2rem' }}>
                {/* Monsoon Tracking */}
                <div className="glass-card" style={{ background: '#E1F5FE', border: '1px solid #B3E5FC' }}>
                    <h3 style={{ color: '#0277BD', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CloudRain size={22} /> Monsoon Tracking
                    </h3>
                    {monsoon && (
                        <>
                            <p style={{ fontWeight: 600, color: '#01579B', marginBottom: '1rem', fontSize: '1.1rem' }}>
                                {monsoon.status}
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
                                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
                                    <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 4px' }}>Rainfall</p>
                                    <p style={{ fontWeight: 700, color: '#0277BD', margin: 0, fontSize: '1.1rem' }}>{monsoon.current_rainfall}</p>
                                    <p style={{ fontSize: '0.7rem', color: '#999', margin: 0 }}>Total: {monsoon.total_rainfall}</p>
                                </div>
                                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
                                    <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 4px' }}>Humidity</p>
                                    <p style={{ fontWeight: 700, color: '#039BE5', margin: 0, fontSize: '1.1rem' }}>{monsoon.humidity}</p>
                                </div>
                                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
                                    <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 4px' }}>Wind</p>
                                    <p style={{ fontWeight: 700, color: '#546E7A', margin: 0, fontSize: '1.1rem' }}>{monsoon.wind_speed}</p>
                                </div>
                                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
                                    <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 4px' }}>Forecast</p>
                                    <p style={{ fontWeight: 600, color: '#555', margin: 0, fontSize: '0.8rem', fontStyle: 'italic' }}>"{monsoon.forecast}"</p>
                                </div>
                            </div>
                            {monsoon.alerts?.map((alert, idx) => (
                                <div key={idx} style={{
                                    background: alert.level === 'Orange' ? '#FFF3E0' : '#FFF9C4',
                                    borderLeft: `4px solid ${alert.level === 'Orange' ? '#EF6C00' : '#FBC02D'}`,
                                    padding: '0.8rem', borderRadius: '8px', marginBottom: '0.5rem',
                                    display: 'flex', alignItems: 'center', gap: '10px'
                                }}>
                                    <AlertTriangle size={18} color={alert.level === 'Orange' ? '#EF6C00' : '#FBC02D'} />
                                    <div>
                                        <strong style={{ fontSize: '0.85rem' }}>{alert.type} - {alert.level} Alert</strong>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#555' }}>{alert.message}</p>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* Rainfall Chart */}
                <div className="glass-card">
                    <h3 style={{ color: '#1565C0', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={22} /> Rainfall Trends
                    </h3>
                    <div style={{ height: '320px' }}>
                        <Bar options={options} data={rainfallData} />
                    </div>
                </div>
            </div>

            {/* Crop Monitor */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#2E7D32', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sprout size={22} color="#43A047" /> Critical Crop Monitor
                </h3>
                <div className="gov-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                    {crops.map((crop, index) => (
                        <div key={index} className="glass-card" style={{ borderTop: `4px solid ${crop.status === 'Stable' ? '#43A047' : '#FF9800'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                <h4 style={{ color: '#2E7D32', margin: 0 }}>{crop.name}</h4>
                                <span style={{
                                    background: crop.status === 'Stable' ? '#E8F5E9' : '#FFF3E0',
                                    color: crop.status === 'Stable' ? '#2E7D32' : '#EF6C00',
                                    padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                                    display: 'flex', alignItems: 'center', gap: '4px'
                                }}>
                                    {crop.status === 'Stable' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                                    {crop.status}
                                </span>
                            </div>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3E2723', margin: '0 0 4px' }}>
                                ₹{crop.current_price} <span style={{ fontSize: '0.85rem', color: '#795548', fontWeight: 400 }}>/ {crop.unit}</span>
                            </p>
                            <p style={{ fontSize: '0.8rem', color: '#888', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <TrendingUp size={12} /> Range: {crop.price_range}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Spice Market + District Risk Row */}
            <div className="gov-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {/* Spice Market */}
                <div className="glass-card">
                    <h3 style={{ color: '#BF360C', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Leaf size={22} color="#FF5722" /> Spice Market Intelligence
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: '#FBE9E7' }}>
                                    <th style={{ textAlign: 'left', padding: '10px', color: '#795548', fontSize: '0.75rem' }}>Spice</th>
                                    <th style={{ textAlign: 'right', padding: '10px', color: '#795548', fontSize: '0.75rem' }}>Price (₹/kg)</th>
                                    <th style={{ textAlign: 'center', padding: '10px', color: '#795548', fontSize: '0.75rem' }}>Trend</th>
                                    <th style={{ textAlign: 'right', padding: '10px', color: '#795548', fontSize: '0.75rem' }}>Market</th>
                                </tr>
                            </thead>
                            <tbody>
                                {spices.map((spice, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '10px', fontWeight: 500 }}>{spice.name}</td>
                                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>₹{spice.price}</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '3px',
                                                padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem',
                                                background: spice.trend === 'up' ? '#E8F5E9' : spice.trend === 'down' ? '#FFEBEE' : '#F5F5F5',
                                                color: spice.trend === 'up' ? 'green' : spice.trend === 'down' ? 'red' : '#666'
                                            }}>
                                                {spice.trend === 'up' ? '↑ Up' : spice.trend === 'down' ? '↓ Down' : '● Stable'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'right', color: '#666', fontSize: '0.8rem' }}>{spice.market}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* District Hazard Map - Interactive */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.2rem', background: '#C62828', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={18} /> <strong>Kerala District Risk Map</strong>
                    </div>
                    <KeralaDistrictMap risks={risks} />
                </div>
            </div>

            {/* Full Width Kerala Map */}
            <div className="glass-card" style={{ marginTop: '2rem', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.2rem', background: 'var(--paddy-green)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={18} /> <strong>Kerala Agriculture Map - All Districts</strong>
                </div>
                <KeralaFullMap />
            </div>
        </div>
    );
}

// Kerala District coordinates for all 14 districts
const KERALA_DISTRICTS = [
    { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366, crops: 'Paddy, Coconut, Banana' },
    { name: 'Kollam', lat: 8.8932, lng: 76.6141, crops: 'Cashew, Coconut, Rubber' },
    { name: 'Pathanamthitta', lat: 9.2648, lng: 76.7870, crops: 'Rubber, Pepper, Coconut' },
    { name: 'Alappuzha', lat: 9.4981, lng: 76.3388, crops: 'Paddy, Coconut, Fish farming' },
    { name: 'Kottayam', lat: 9.5916, lng: 76.5222, crops: 'Rubber, Pepper, Coconut' },
    { name: 'Idukki', lat: 9.9189, lng: 77.1025, crops: 'Cardamom, Tea, Pepper' },
    { name: 'Ernakulam', lat: 9.9816, lng: 76.2999, crops: 'Coconut, Paddy, Banana' },
    { name: 'Thrissur', lat: 10.5276, lng: 76.2144, crops: 'Paddy, Coconut, Banana' },
    { name: 'Palakkad', lat: 10.7867, lng: 76.6548, crops: 'Paddy, Sugarcane, Coconut' },
    { name: 'Malappuram', lat: 11.0510, lng: 76.0711, crops: 'Paddy, Arecanut, Pepper' },
    { name: 'Kozhikode', lat: 11.2588, lng: 75.7804, crops: 'Coconut, Paddy, Pepper' },
    { name: 'Wayanad', lat: 11.6854, lng: 76.1320, crops: 'Coffee, Pepper, Cardamom' },
    { name: 'Kannur', lat: 11.8745, lng: 75.3704, crops: 'Coconut, Cashew, Pepper' },
    { name: 'Kasaragod', lat: 12.4996, lng: 74.9869, crops: 'Coconut, Arecanut, Cashew' },
];

function KeralaDistrictMap({ risks }) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);

    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        const map = L.map(mapRef.current).setView([10.1, 76.4], 7.5);
        mapInstance.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        // Add risk markers for districts that have risk data
        risks.forEach(risk => {
            const district = KERALA_DISTRICTS.find(d =>
                d.name.toLowerCase().includes(risk.district?.toLowerCase()) ||
                risk.district?.toLowerCase().includes(d.name.toLowerCase())
            );
            if (!district) return;

            const color = risk.risk_level === 'Critical' ? '#C62828' : risk.risk_level === 'High' ? '#F57C00' : '#43A047';

            const circleMarker = L.circleMarker([district.lat, district.lng], {
                radius: risk.risk_level === 'Critical' ? 14 : risk.risk_level === 'High' ? 11 : 8,
                fillColor: color,
                color: 'white',
                weight: 2,
                fillOpacity: 0.8
            }).addTo(map);

            circleMarker.bindPopup(`
                <div style="min-width:180px">
                    <strong style="font-size:1rem;color:${color}">${risk.district}</strong>
                    <hr style="margin:6px 0;border:none;border-top:1px solid #eee"/>
                    <p style="margin:4px 0;font-size:0.85rem">Hazard: <strong>${risk.hazard}</strong></p>
                    <p style="margin:4px 0;font-size:0.85rem">Risk Level: <strong style="color:${color}">${risk.risk_level.toUpperCase()}</strong></p>
                    <p style="margin:4px 0;font-size:0.85rem">Rainy Days: <strong>${risk.monsoon_days}</strong></p>
                </div>
            `);
        });

        return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
    }, [risks]);

    return <div ref={mapRef} style={{ height: '350px', width: '100%' }}></div>;
}

function KeralaFullMap() {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);

    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        const map = L.map(mapRef.current).setView([10.1, 76.4], 7.5);
        mapInstance.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        const greenIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });

        KERALA_DISTRICTS.forEach(d => {
            L.marker([d.lat, d.lng], { icon: greenIcon })
                .addTo(map)
                .bindPopup(`
                    <div style="min-width:180px">
                        <strong style="color:#00843D;font-size:1.05rem">${d.name}</strong>
                        <hr style="margin:6px 0;border:none;border-top:1px solid #eee"/>
                        <p style="margin:4px 0;font-size:0.85rem">Major Crops:</p>
                        <p style="margin:2px 0;font-size:0.85rem;font-weight:600">${d.crops}</p>
                    </div>
                `);
        });

        return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
    }, []);

    return <div ref={mapRef} style={{ height: '450px', width: '100%' }}></div>;
}
