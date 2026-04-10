// frontend/src/pages/KeralaStats.jsx
import { useState, useEffect } from 'react';
import { keralaService } from '../services/api';
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

                {/* District Hazard Map */}
                <div className="glass-card">
                    <h3 style={{ color: '#C62828', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={22} color="#D32F2F" /> District Hazard Map
                    </h3>
                    <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                        {risks.map((risk, idx) => (
                            <div key={idx} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '1rem', marginBottom: '0.6rem', borderRadius: '12px',
                                background: risk.risk_level === 'Critical' ? '#FFEBEE' : risk.risk_level === 'High' ? '#FFF3E0' : '#F1F8E9',
                                borderLeft: `4px solid ${risk.risk_level === 'Critical' ? '#C62828' : risk.risk_level === 'High' ? '#F57C00' : '#43A047'}`
                            }}>
                                <div>
                                    <h4 style={{ margin: 0, color: '#3E2723', fontSize: '0.95rem' }}>{risk.district}</h4>
                                    <span style={{ fontSize: '0.8rem', color: '#5D4037', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                        <AlertTriangle size={12} /> {risk.hazard}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        fontWeight: 700, padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem',
                                        background: 'rgba(255,255,255,0.6)',
                                        color: risk.risk_level === 'Critical' ? '#C62828' : risk.risk_level === 'High' ? '#EF6C00' : '#2E7D32'
                                    }}>
                                        {risk.risk_level.toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '3px' }}>{risk.monsoon_days} Rainy Days</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
