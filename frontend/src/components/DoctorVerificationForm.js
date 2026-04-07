import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

const DoctorVerificationForm = () => {
  const { token, user, login, updateUser } = useAuth();
  const [licenseNumber, setLicenseNumber] = useState('');
  const [institution, setInstitution] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [document, setDocument] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [fetchingStatus, setFetchingStatus] = useState(true);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Fetch current verification status and keep context in sync with DB status.
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/verification/status`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setVerificationData(data);
          if (data?.verificationStatus && data.verificationStatus !== user?.verificationStatus) {
            updateUser({ verificationStatus: data.verificationStatus });
          }
        }
      } catch (err) {
        console.error('Error fetching verification status:', err);
      } finally {
        setFetchingStatus(false);
      }
    };

    fetchStatus();

    let intervalId;
    const currentStatus = verificationData?.verificationStatus || user?.verificationStatus;
    if (currentStatus === 'pending') {
      intervalId = setInterval(fetchStatus, 15000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [token, apiUrl, user?.verificationStatus, verificationData?.verificationStatus, updateUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('licenseNumber', licenseNumber);
    formData.append('institution', institution);
    formData.append('specialization', specialization);
    formData.append('document', document);

    try {
      const response = await fetch(`${apiUrl}/api/verification/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Submission failed.');
      }

      // Update token with new verificationStatus (pending)
      if (data.token) {
        login(data.token);
      }

      setVerificationData({ verificationStatus: 'pending', verification: data.verification });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingStatus) {
    return (
      <div className="verification-container">
        <div className="verification-card surface-card">
          <p className="verification-loading">Loading verification status...</p>
        </div>
      </div>
    );
  }

  const status = verificationData?.verificationStatus || user?.verificationStatus || 'unverified';

  if (status === 'verified') {
    return (
      <div className="verification-container">
        <div className="verification-card surface-card">
          <div className="verification-status-icon approved">&#10003;</div>
          <h2>Verification Approved</h2>
          <p className="verification-message">Your account has been verified. Opening your dashboard...</p>
        </div>
      </div>
    );
  }

  // Pending — waiting for admin
  if (status === 'pending') {
    return (
      <div className="verification-container">
        <div className="verification-card surface-card">
          <div className="verification-status-icon pending">&#9203;</div>
          <h2>Verification Under Review</h2>
          <p className="verification-message">
            Your documents have been submitted and are currently being reviewed by our admin team.
            You will gain full access once your account is approved.
          </p>
          {verificationData?.verification && (
            <div className="verification-details">
              <div className="detail-row">
                <span className="detail-label">License #</span>
                <span className="detail-value">{verificationData.verification.licenseNumber}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Institution</span>
                <span className="detail-value">{verificationData.verification.institution}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Specialization</span>
                <span className="detail-value">{verificationData.verification.specialization}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Submitted</span>
                <span className="detail-value">{new Date(verificationData.verification.submittedAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Rejected — show reason + allow re-upload
  const isRejected = status === 'rejected';

  return (
    <div className="verification-container">
      <div className="verification-card surface-card">
        <h2>{isRejected ? 'Verification Rejected' : 'Doctor Verification'}</h2>

        {isRejected && verificationData?.verification?.rejectionReason && (
          <div className="verification-rejection">
            <strong>Reason for rejection:</strong>
            <p>{verificationData.verification.rejectionReason}</p>
            <p className="verification-resubmit-hint">Please correct the issues and re-submit your documents below.</p>
          </div>
        )}

        {!isRejected && (
          <p className="verification-subtitle">
            To access doctor features, please verify your medical credentials.
          </p>
        )}

        <p className="verification-required-note" style={{ fontSize: '0.85rem', color: '#e74c3c', marginBottom: '0.5rem' }}>
          All fields marked with <span style={{ color: '#e74c3c' }}>*</span> are required.
        </p>

        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit} className="verification-form">
          <div className="form-group">
            <label>Medical License Number <span style={{ color: '#e74c3c' }}>*</span></label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="e.g. MCI-12345"
              required
            />
          </div>
          <div className="form-group">
            <label>Institution / Hospital <span style={{ color: '#e74c3c' }}>*</span></label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. Apollo Hospital, Delhi"
              required
            />
          </div>
          <div className="form-group">
            <label>Specialization <span style={{ color: '#e74c3c' }}>*</span></label>
            <input
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g. Cardiology"
              required
            />
          </div>
          <div className="form-group">
            <label>Upload License / Registration Proof <span style={{ color: '#e74c3c' }}>*</span></label>
            <div className="file-upload-wrapper">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setDocument(e.target.files[0])}
                required
                id="doc-upload"
              />
              <label htmlFor="doc-upload" className="file-upload-label">
                {document ? document.name : 'Choose file (PDF, JPG, or PNG — max 5MB)'}
              </label>
            </div>
          </div>
          <button type="submit" className="verification-submit-btn" disabled={loading}>
            {loading ? 'Submitting...' : (isRejected ? 'Re-submit for Verification' : 'Submit for Verification')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DoctorVerificationForm;
