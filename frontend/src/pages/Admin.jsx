// frontend/src/pages/Admin.jsx
import { useState, useEffect } from 'react';
import { claimService, dashboardService } from '../services/api';
import '../styles/Admin.css';

export default function Admin({ user }) {
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [claimsRes, statsRes] = await Promise.all([
        claimService.listClaims(),
        claimService.getClaimsSummary()
      ]);
      setClaims(claimsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClaim = async () => {
    if (!selectedClaim || !updateStatus) {
      setError('Please select status');
      return;
    }

    setUpdating(true);
    try {
      await claimService.updateClaimStatus(selectedClaim.id, {
        claim_status: updateStatus,
        rejection_reason: updateStatus === 'rejected' ? rejectionReason : null
      });

      setError('');
      setSelectedClaim(null);
      setUpdateStatus('');
      setRejectionReason('');
      await fetchData();
    } catch (err) {
      setError('Failed to update claim');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (user?.role !== 'admin' && user?.role !== 'officer') {
    return <div className="alert alert-danger">Access denied. Admin only.</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Manage crop insurance claims</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Claims</h3>
            <p className="stat-value">{stats.total_claims}</p>
          </div>
          <div className="stat-card">
            <h3>Approved</h3>
            <p className="stat-value approved">{stats.approved_claims}</p>
          </div>
          <div className="stat-card">
            <h3>Rejected</h3>
            <p className="stat-value rejected">{stats.rejected_claims}</p>
          </div>
          <div className="stat-card">
            <h3>Total Approved Amount</h3>
            <p className="stat-value">₹{stats.approved_claim_amount.toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="admin-grid">
        <div className="claims-section">
          <h2>All Claims</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Claim #</th>
                <th>Status</th>
                <th>Damage %</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {claims.map(claim => (
                <tr key={claim.id}>
                  <td>{claim.claim_number}</td>
                  <td>
                    <span className={`badge badge-${
                      claim.claim_status === 'approved' ? 'success' :
                      claim.claim_status === 'rejected' ? 'danger' :
                      claim.claim_status === 'paid' ? 'info' : 'warning'
                    }`}>
                      {claim.claim_status}
                    </span>
                  </td>
                  <td>{claim.damage_percentage.toFixed(1)}%</td>
                  <td>₹{claim.claim_amount.toLocaleString()}</td>
                  <td>
                    <button
                      className="btn-small"
                      onClick={() => {
                        setSelectedClaim(claim);
                        setUpdateStatus(claim.claim_status);
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedClaim && (
          <div className="update-section">
            <h2>Update Claim</h2>
            <div className="claim-details-modal">
              <p><strong>Claim #:</strong> {selectedClaim.claim_number}</p>
              <p><strong>Current Status:</strong> {selectedClaim.claim_status}</p>
              <p><strong>Damage %:</strong> {selectedClaim.damage_percentage}%</p>

              <div className="form-group">
                <label>New Status *</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              {updateStatus === 'rejected' && (
                <div className="form-group">
                  <label>Rejection Reason *</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection"
                    rows="3"
                  />
                </div>
              )}

              <div className="button-group">
                <button
                  onClick={handleUpdateClaim}
                  className="btn-primary"
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Update Claim'}
                </button>
                <button
                  onClick={() => {
                    setSelectedClaim(null);
                    setUpdateStatus('');
                    setRejectionReason('');
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
