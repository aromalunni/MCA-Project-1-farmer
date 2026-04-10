// frontend/src/pages/Claims.jsx
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { claimService } from '../services/api';
import {
  FileCheck,
  Clock,
  MapPin,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  History,
  Info,
  CheckCircle,
  X,
  Printer,
  Download
} from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';

export default function Claims() {
  const { t } = useLanguage();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const receiptRef = useRef(null);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const res = await claimService.getMyClaims();
      setClaims(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Claim Receipt - ${selectedClaim.claim_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #222; }
            .receipt { max-width: 700px; margin: 0 auto; border: 2px solid #00843D; border-radius: 12px; padding: 30px; }
            .header { text-align: center; border-bottom: 2px solid #00843D; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { color: #00843D; font-size: 22px; margin-bottom: 4px; }
            .header p { color: #666; font-size: 13px; }
            .badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
            .badge-approved { background: #E8F5E9; color: #2E7D32; }
            .badge-requested { background: #FFF3E0; color: #E65100; }
            .badge-verified { background: #E3F2FD; color: #1565C0; }
            .badge-rejected { background: #FFEBEE; color: #C62828; }
            .badge-paid { background: #E8F5E9; color: #1B5E20; }
            .claim-no { font-size: 18px; font-weight: 700; color: #00843D; margin: 10px 0; }
            .date { font-size: 13px; color: #888; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { text-align: left; padding: 10px 12px; background: #F5F5F5; font-size: 12px; color: #666; text-transform: uppercase; border-bottom: 1px solid #ddd; }
            td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
            .amount-row td { font-weight: 700; font-size: 16px; color: #00843D; border-top: 2px solid #00843D; }
            .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px dashed #ccc; font-size: 12px; color: #999; }
            .stamp { display: inline-block; border: 2px solid #00843D; color: #00843D; padding: 6px 20px; border-radius: 8px; font-weight: 700; font-size: 14px; transform: rotate(-5deg); margin-top: 15px; }
            @media print { body { padding: 10px; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <script>window.onload = function() { window.print(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusBadgeClass = (status) => {
    return `badge badge-${status}`;
  };

  return (
    <div className="dashboard-container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--paddy-green)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <History size={32} /> {t('myClaims') || 'My Claims History'}
          </h1>
          <p style={{ opacity: 0.7 }}>{t('trackClaims') || 'Track your crop insurance settlements and benefits'}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {claims.map(claim => (
          <div key={claim.id} className="glass-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedClaim(claim)}>
            <div className="responsive-row-claim">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0 }}>{claim.claim_number}</h3>
                  <span className={`badge badge-${claim.claim_status}`}>{claim.claim_status}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.6 }}>
                  <MapPin size={14} /> {claim.land_area ? `${claim.land_area} Acre` : `Survey #${claim.land_survey}`} • {new Date(claim.created_at).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p style={{ margin: 0, opacity: 0.6, fontSize: '0.8rem' }}>{t('assessedDamage') || 'ASSESSED DAMAGE'}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={16} color="var(--status-rejected)" />
                  <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{claim.damage_percentage}%</span>
                </div>
              </div>

              <div>
                <p style={{ margin: 0, opacity: 0.6, fontSize: '0.8rem' }}>{t('settlementValue') || 'SETTLEMENT VALUE'}</p>
                <h3 style={{ margin: 0, color: 'var(--paddy-green)' }}>₹{claim.claim_amount?.toLocaleString()}</h3>
              </div>

              <button className="btn-gov" style={{ padding: '8px' }}>
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Status Timeline or Rejection Note */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
              {claim.claim_status === 'rejected' ? (
                <div style={{
                  color: '#C62828', background: '#FFEBEE', padding: '1rem', borderRadius: '8px',
                  display: 'flex', alignItems: 'flex-start', gap: '12px'
                }}>
                  <AlertTriangle size={20} style={{ marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Claim Rejected</strong>
                    <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
                      {claim.rejection_reason || 'This claim did not meet the verification criteria based on field assessment.'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ position: 'relative', marginBottom: '1rem', padding: '0 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                      {['requested', 'verified', 'approved', 'paid'].map((step, index) => {
                        const statusOrder = ['requested', 'verified', 'approved', 'paid'];
                        const currentIdx = statusOrder.indexOf(claim.claim_status);
                        const isCompleted = index <= currentIdx;
                        return (
                          <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                            <div style={{
                              width: '24px', height: '24px', borderRadius: '50%',
                              background: isCompleted ? 'var(--paddy-green)' : '#eee',
                              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '12px', marginBottom: '0.5rem', transition: 'all 0.3s'
                            }}>
                              {isCompleted ? <CheckCircle size={14} /> : index + 1}
                            </div>
                            <span style={{
                              fontSize: '0.75rem', fontWeight: isCompleted ? '600' : '400',
                              color: isCompleted ? 'var(--deep-forest)' : '#888', textTransform: 'capitalize'
                            }}>{step}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{
                      position: 'absolute', top: '12px', left: '12.5%', right: '12.5%',
                      height: '2px', background: '#eee', zIndex: 0
                    }}>
                      <div style={{
                        width: `${(['requested', 'verified', 'approved', 'paid'].indexOf(claim.claim_status) / 3) * 100}%`,
                        height: '100%', background: 'var(--paddy-green)', transition: 'width 0.5s ease-in-out'
                      }}></div>
                    </div>
                  </div>
                  {claim.claim_status === 'requested' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#666', background: '#F9FAFB', padding: '0.8rem', borderRadius: '8px', marginTop: '1rem' }}>
                      <Clock size={16} color="var(--paddy-green)" />
                      <span>Estimated processing time: 7-10 working days pending inspection.</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {claims.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '5rem', opacity: 0.5 }}>
          <History size={64} style={{ marginBottom: '1rem' }} />
          <h3>No Claims History</h3>
          <p>You haven't filed any crop insurance claims yet.</p>
        </div>
      )}

      {/* ===== RECEIPT MODAL (Portal to body) ===== */}
      {selectedClaim && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }} onClick={() => setSelectedClaim(null)}>
          <div style={{
            background: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px',
            maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }} onClick={e => e.stopPropagation()}>

            {/* Modal Top Bar */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '1rem 1.5rem', borderBottom: '1px solid #eee', position: 'sticky',
              top: 0, background: 'white', zIndex: 1, borderRadius: '16px 16px 0 0'
            }}>
              <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={18} color="var(--paddy-green)" /> Claim Receipt
              </h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={handlePrint} className="btn-gov" style={{
                  padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <Printer size={14} /> Print
                </button>
                <button onClick={handlePrint} className="btn-gov" style={{
                  padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', background: '#1565C0'
                }}>
                  <Download size={14} /> PDF
                </button>
                <button onClick={() => setSelectedClaim(null)} style={{
                  background: '#f5f5f5', border: 'none', cursor: 'pointer', padding: '6px',
                  borderRadius: '8px', display: 'flex'
                }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Receipt Content */}
            <div ref={receiptRef} style={{ padding: '1.5rem 2rem 2rem' }}>
              <div className="receipt">
                {/* Header */}
                <div style={{ textAlign: 'center', paddingBottom: '1.2rem', marginBottom: '1.2rem', borderBottom: '2px solid #00843D' }}>
                  <h1 style={{ color: '#00843D', fontSize: '1.3rem', margin: '0 0 2px' }}>PMFBY - Crop Insurance</h1>
                  <p style={{ color: '#888', fontSize: '0.8rem', margin: 0 }}>Government of Kerala - Smart Crop Portal</p>
                  <span style={{
                    display: 'inline-block', marginTop: '10px', padding: '3px 14px', borderRadius: '20px',
                    fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                    background: selectedClaim.claim_status === 'approved' ? '#E8F5E9' :
                      selectedClaim.claim_status === 'rejected' ? '#FFEBEE' :
                        selectedClaim.claim_status === 'verified' ? '#E3F2FD' :
                          selectedClaim.claim_status === 'paid' ? '#E8F5E9' : '#FFF3E0',
                    color: selectedClaim.claim_status === 'approved' ? '#2E7D32' :
                      selectedClaim.claim_status === 'rejected' ? '#C62828' :
                        selectedClaim.claim_status === 'verified' ? '#1565C0' :
                          selectedClaim.claim_status === 'paid' ? '#1B5E20' : '#E65100'
                  }}>
                    {selectedClaim.claim_status}
                  </span>
                </div>

                {/* Claim No & Date Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <div>
                    <p style={{ fontSize: '0.7rem', opacity: 0.5, margin: '0 0 2px', textTransform: 'uppercase' }}>Claim Number</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#00843D', margin: 0 }}>{selectedClaim.claim_number}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.7rem', opacity: 0.5, margin: '0 0 2px', textTransform: 'uppercase' }}>Date & Time</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>
                      {new Date(selectedClaim.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: 0 }}>
                      {new Date(selectedClaim.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                </div>

                {/* Details Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px 10px', background: '#F5F5F5', fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', borderBottom: '1px solid #ddd' }}>Item</th>
                      <th style={{ textAlign: 'right', padding: '8px 10px', background: '#F5F5F5', fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', borderBottom: '1px solid #ddd' }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px', fontSize: '0.85rem' }}>Land Area</td>
                      <td style={{ padding: '10px', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600 }}>
                        {selectedClaim.land_area ? `${selectedClaim.land_area} Acre` : `Survey #${selectedClaim.land_survey}`}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px', fontSize: '0.85rem' }}>Type of Damage</td>
                      <td style={{ padding: '10px', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600 }}>{selectedClaim.damage_type || 'General'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px', fontSize: '0.85rem' }}>Damage Percentage</td>
                      <td style={{ padding: '10px', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600, color: '#E65100' }}>{selectedClaim.damage_percentage}%</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px', fontSize: '0.85rem' }}>Sum Insured</td>
                      <td style={{ padding: '10px', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600 }}>₹{selectedClaim.sum_insured?.toLocaleString() || '—'}</td>
                    </tr>
                    <tr style={{ borderTop: '2px solid #00843D' }}>
                      <td style={{ padding: '12px 10px', fontSize: '0.95rem', fontWeight: 700 }}>Claim Amount</td>
                      <td style={{ padding: '12px 10px', fontSize: '1.15rem', textAlign: 'right', fontWeight: 700, color: '#00843D' }}>₹{selectedClaim.claim_amount?.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Status Box */}
                <div style={{
                  marginTop: '1.2rem', padding: '0.8rem 1rem', borderRadius: '8px', fontSize: '0.8rem',
                  background: selectedClaim.claim_status === 'approved' || selectedClaim.claim_status === 'paid' ? '#E8F5E9' :
                    selectedClaim.claim_status === 'rejected' ? '#FFEBEE' : '#FFF8E1'
                }}>
                  <strong>Status: </strong>
                  {selectedClaim.claim_status === 'approved' && 'Your claim has been approved. Settlement will be processed shortly.'}
                  {selectedClaim.claim_status === 'rejected' && `Claim rejected. Reason: ${selectedClaim.rejection_reason || 'Did not meet verification criteria.'}`}
                  {selectedClaim.claim_status === 'requested' && 'Your claim is under review. Estimated processing: 7-10 working days.'}
                  {selectedClaim.claim_status === 'verified' && 'Field verification complete. Awaiting admin approval.'}
                  {selectedClaim.claim_status === 'paid' && 'Payment has been processed to your registered bank account.'}
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed #ccc' }}>
                  <div style={{
                    display: 'inline-block', border: '2px solid #00843D', color: '#00843D',
                    padding: '4px 16px', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem',
                    transform: 'rotate(-3deg)', marginBottom: '0.8rem'
                  }}>
                    PMFBY OFFICIAL
                  </div>
                  <p style={{ fontSize: '0.7rem', color: '#aaa', margin: 0 }}>
                    This is a computer-generated receipt. No signature required.
                  </p>
                  <p style={{ fontSize: '0.7rem', color: '#aaa', margin: '3px 0 0' }}>
                    Generated on: {new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
