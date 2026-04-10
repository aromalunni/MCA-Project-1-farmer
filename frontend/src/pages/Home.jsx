// frontend/src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { claimService, landService, masterService } from '../services/api';
import {
  Leaf,
  Map,
  FilePlus,
  History,
  TrendingUp,
  User,
  ChevronRight,
  ShieldCheck,
  IndianRupee,
  AlertTriangle,
  Droplets,
  Sun,
  Bug,
  Wind
} from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';

export default function Home({ user }) {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [recentClaims, setRecentClaims] = useState([]);
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, claimsRes] = await Promise.all([
        claimService.getStats(),
        claimService.getMyClaims()
      ]);
      setStats(statsRes.data);
      setRecentClaims(claimsRes.data.slice(0, 5));
    } catch (err) {
      console.error(err);
    }
    try {
      const ratesRes = await masterService.getPublicRates();
      setRates(ratesRes.data);
    } catch (err) {
      console.error('Rates fetch failed', err);
    }
    setLoading(false);
  };

  const damageTypes = [
    { type: 'Flood', icon: <Droplets size={24} />, color: '#1565C0', bg: '#E3F2FD', desc: 'Heavy rainfall, waterlogging, river overflow' },
    { type: 'Drought', icon: <Sun size={24} />, color: '#E65100', bg: '#FFF3E0', desc: 'Prolonged dry spell, water scarcity' },
    { type: 'Pest Attack', icon: <Bug size={24} />, color: '#2E7D32', bg: '#E8F5E9', desc: 'Insect infestation, disease outbreak' },
    { type: 'Storm', icon: <Wind size={24} />, color: '#4527A0', bg: '#EDE7F6', desc: 'Cyclone, heavy wind, hailstorm' }
  ];

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <div className="glass-card mb-4" style={{
        background: 'linear-gradient(135deg, var(--paddy-green), var(--deep-forest))',
        color: 'white',
        border: 'none',
        padding: '3rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{t('welcome')}, {user?.full_name}</h1>
            <p style={{ opacity: 0.9, fontSize: '1.1rem' }}>{t('yourPartner')}</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: '24px' }}>
            <ShieldCheck size={48} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="gov-grid mb-4">
        <Link to="/lands" className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: 'rgba(0,132,61,0.1)', padding: '16px', borderRadius: '16px' }}>
            <Map color="var(--paddy-green)" size={32} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0 }}>{t('myLands')}</h3>
            <p style={{ margin: 0, opacity: 0.6, fontSize: '0.9rem' }}>{t('manageRecords')}</p>
          </div>
          <ChevronRight opacity={0.3} />
        </Link>

        <Link to="/upload" className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: 'rgba(239,108,0,0.1)', padding: '16px', borderRadius: '16px' }}>
            <FilePlus color="var(--status-pending)" size={32} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0 }}>{t('submitClaim')}</h3>
            <p style={{ margin: 0, opacity: 0.6, fontSize: '0.9rem' }}>{t('reportDamage')}</p>
          </div>
          <ChevronRight opacity={0.3} />
        </Link>

        <Link to="/claims" className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: 'rgba(21,101,192,0.1)', padding: '16px', borderRadius: '16px' }}>
            <History color="var(--status-completed)" size={32} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0 }}>{t('claimHistory')}</h3>
            <p style={{ margin: 0, opacity: 0.6, fontSize: '0.9rem' }}>{t('trackSettlements')}</p>
          </div>
          <ChevronRight opacity={0.3} />
        </Link>
      </div>

      <div className="gov-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Recent Claims */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={20} /> {t('recentActivities')}
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {recentClaims.map(claim => (
                <tr key={claim.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '1rem 0' }}>
                    <p style={{ fontWeight: '600', margin: 0 }}>{claim.claim_number}</p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: 0 }}>{claim.created_at ? new Date(claim.created_at).toLocaleDateString() : ''}</p>
                  </td>
                  <td style={{ padding: '1rem 0' }}>
                    <p style={{ margin: 0 }}>{claim.damage_type || 'Crop Damage'}</p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: 0 }}>₹{claim.claim_amount?.toLocaleString()}</p>
                  </td>
                  <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                    <span className={`badge badge-${claim.claim_status}`}>{claim.claim_status}</span>
                  </td>
                </tr>
              ))}
              {recentClaims.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>{t('noRecentClaims')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Info Card */}
        <div className="glass-card" style={{ background: '#FFF8E1', border: '1px solid #FFE082' }}>
          <h4 style={{ color: '#F57F17', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <AlertTriangle size={18} /> {t('farmerAlert')}
          </h4>
          <p style={{ fontSize: '0.9rem', color: '#5D4037' }}>
            {t('deadlineMsg')}
          </p>
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'white', borderRadius: '12px' }}>
            <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: 0 }}>{t('totalInsured')}</p>
            <h2 style={{ color: 'var(--paddy-green)', margin: 0 }}>₹{(stats?.total_claim_amount || 0).toLocaleString()}</h2>
          </div>
        </div>
      </div>

      {/* Insurance Rate Price List */}
      {rates && (
        <div className="glass-card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--deep-forest)' }}>
            <IndianRupee size={20} /> Insurance Rate - Price List
          </h3>
          <div className="gov-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Acre Rate Card */}
            <div style={{
              background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
              borderRadius: '16px', padding: '2rem', textAlign: 'center',
              border: '1px solid #A5D6A7'
            }}>
              <div style={{
                background: 'var(--paddy-green)', color: 'white', width: '50px', height: '50px',
                borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem', fontSize: '1.2rem', fontWeight: 700
              }}>A</div>
              <p style={{ opacity: 0.6, fontSize: '0.85rem', margin: '0 0 0.5rem', fontWeight: 600 }}>PER ACRE</p>
              <h2 style={{ color: 'var(--deep-forest)', margin: '0 0 0.5rem', fontSize: '2rem' }}>
                ₹{rates.rate_per_acre?.toLocaleString()}
              </h2>
              <p style={{ opacity: 0.5, fontSize: '0.8rem', margin: 0 }}>Insurance rate per Acre</p>
            </div>

            {/* Cent Rate Card */}
            <div style={{
              background: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
              borderRadius: '16px', padding: '2rem', textAlign: 'center',
              border: '1px solid #90CAF9'
            }}>
              <div style={{
                background: '#1565C0', color: 'white', width: '50px', height: '50px',
                borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem', fontSize: '1.2rem', fontWeight: 700
              }}>C</div>
              <p style={{ opacity: 0.6, fontSize: '0.85rem', margin: '0 0 0.5rem', fontWeight: 600 }}>PER CENT</p>
              <h2 style={{ color: '#0D47A1', margin: '0 0 0.5rem', fontSize: '2rem' }}>
                ₹{rates.rate_per_cent?.toLocaleString()}
              </h2>
              <p style={{ opacity: 0.5, fontSize: '0.8rem', margin: 0 }}>Insurance rate per Cent</p>
            </div>
          </div>

          {/* Quick Calculation Table */}
          <div style={{ marginTop: '1.5rem', background: '#F9FAFB', borderRadius: '12px', padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: 'var(--deep-forest)' }}>Quick Estimate (Acre)</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '8px', textAlign: 'left', opacity: 0.6 }}>Area</th>
                  <th style={{ padding: '8px', textAlign: 'right', opacity: 0.6 }}>Sum Insured</th>
                  <th style={{ padding: '8px', textAlign: 'right', opacity: 0.6 }}>5%</th>
                  <th style={{ padding: '8px', textAlign: 'right', opacity: 0.6 }}>20%</th>
                  <th style={{ padding: '8px', textAlign: 'right', opacity: 0.6 }}>40%</th>
                  <th style={{ padding: '8px', textAlign: 'right', opacity: 0.6 }}>65%</th>
                </tr>
              </thead>
              <tbody>
                {[35, 50, 40, 80].map(area => {
                  const sum = area * rates.rate_per_acre;
                  return (
                    <tr key={area} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '8px', fontWeight: 600 }}>{area} Acre</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>₹{sum.toLocaleString()}</td>
                      {[5, 20, 40, 65].map(dmg => (
                        <td key={dmg} style={{ padding: '8px', textAlign: 'right', color: 'var(--paddy-green)', fontWeight: 600 }}>
                          ₹{Math.round(sum * dmg / 100).toLocaleString()}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '1rem', textAlign: 'center' }}>
            Formula: Claim Amount = (Area × Rate) × (Damage % / 100) | Rates updated by admin
          </p>
        </div>
      )}

      {/* Type of Damage Section */}
      <div className="glass-card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--deep-forest)' }}>
          <AlertTriangle size={20} /> Types of Damage Covered
        </h3>
        <div className="gov-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {damageTypes.map(d => (
            <div key={d.type} style={{
              background: d.bg, borderRadius: '16px', padding: '1.5rem',
              border: `1px solid ${d.color}20`, transition: 'transform 0.2s',
            }}>
              <div style={{
                background: 'white', width: '48px', height: '48px', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem', color: d.color, boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                {d.icon}
              </div>
              <h4 style={{ margin: '0 0 0.5rem', color: d.color }}>{d.type}</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>{d.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

