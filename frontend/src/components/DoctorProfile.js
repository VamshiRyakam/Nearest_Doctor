import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import AddressAutocomplete from './AddressAutocomplete';
import { COUNTRIES, getStates } from '../data/addressData';

const AVATAR_OPTIONS = [
  { file: 'avatar-doctor-male-adult.png', label: 'Male Doctor' },
  { file: 'avatar-doctor-male-adult-2.png', label: 'Male Doctor 2' },
  { file: 'avatar-doctor-male-elder.png', label: 'Senior Male Doctor' },
  { file: 'avatar-doctor-female-adult.png', label: 'Female Doctor' },
  { file: 'avatar-doctor-female-adult-2.png', label: 'Female Doctor 2' },
  { file: 'avatar-doctor-female-elder.png', label: 'Senior Female Doctor' },
];

const DoctorProfile = () => {
  const { token } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setUser(data);
        setFormData({
          fullName: data.fullName || '',
          age: data.age || '',
          phone: data.phone || '',
          country: data.country || '',
          streetAddress: data.streetAddress || '',
          aptSuiteUnit: data.aptSuiteUnit || '',
          city: data.city || '',
          state: data.state || '',
          zipCode: data.zipCode || '',
          latitude: data.latitude || '',
          longitude: data.longitude || '',
          formattedAddress: data.formattedAddress || '',
          addressVerified: data.addressVerified || false,
          username: data.username || '',
          profileImage: data.profileImage || '',
          password: '',
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchProfile();
  }, [token, apiUrl]);

  const handleAvatarSelect = async (filename) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${apiUrl}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profileImage: filename }),
      });
      if (!res.ok) throw new Error('Failed to update avatar');
      const updated = await res.json();
      setUser(updated);
      setFormData((prev) => ({ ...prev, profileImage: filename }));
      setShowAvatarPicker(false);
      setSuccess('Profile picture updated!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddressSelect = (addressData) => {
    setFormData((prev) => ({
      ...prev,
      streetAddress: addressData.streetAddress || '',
      city: addressData.city || '',
      state: addressData.state || '',
      country: addressData.country || '',
      zipCode: addressData.zipCode || '',
      latitude: addressData.latitude || '',
      longitude: addressData.longitude || '',
      formattedAddress: addressData.formattedAddress || '',
      addressVerified: true,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate required address fields
    if (!formData.country || !formData.city || !formData.state || !formData.streetAddress || !formData.zipCode) {
      setError('Please fill in all required address fields (Country, Street, City, State, Zip Code).');
      return;
    }

    try {
      const body = { ...formData };
      if (!body.password) delete body.password;
      if (body.age) body.age = parseInt(body.age, 10);

      const res = await fetch(`${apiUrl}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Update failed');
      }
      const updated = await res.json();
      setUser(updated);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
    setFormData({
      fullName: user.fullName || '',
      age: user.age || '',
      phone: user.phone || '',
      country: user.country || '',
      streetAddress: user.streetAddress || '',
      aptSuiteUnit: user.aptSuiteUnit || '',
      city: user.city || '',
      state: user.state || '',
      zipCode: user.zipCode || '',
      latitude: user.latitude || '',
      longitude: user.longitude || '',
      formattedAddress: user.formattedAddress || '',
      addressVerified: user.addressVerified || false,
      username: user.username || '',
      profileImage: user.profileImage || '',
      password: '',
    });
  };

  if (loading) return (
    <div className="profile-container">
      <div className="profile-card surface-card">
        <div className="profile-header">
          <div className="profile-icon-placeholder skeleton-circle">&nbsp;</div>
          <div className="skeleton-line skeleton-w60">&nbsp;</div>
          <div className="skeleton-line skeleton-w40">&nbsp;</div>
        </div>
        <div className="profile-details">
          {[...Array(6)].map((_, i) => (
            <div className="detail-item" key={i}>
              <div className="skeleton-line skeleton-w30">&nbsp;</div>
              <div className="skeleton-line skeleton-w50">&nbsp;</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  if (!user) return <div className="profile-container">Could not load profile.</div>;

  return (
    <div className="profile-container">
      <div className="profile-card surface-card">
        <div className="profile-header">
          <div className="profile-avatar-wrapper" onClick={() => setShowAvatarPicker(!showAvatarPicker)} title="Change profile picture">
            {user.profileImage ? (
              <img src={`/images/${user.profileImage}`} alt="Profile" className="profile-avatar-img" onContextMenu={(e) => e.preventDefault()} draggable="false" />
            ) : (
              <div className="profile-icon-placeholder">
                {(user.fullName || user.username || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="avatar-edit-badge">&#9998;</span>
          </div>
          {showAvatarPicker && (
            <div className="avatar-picker">
              <p className="avatar-picker-title">Choose your avatar</p>
              <div className="avatar-picker-grid">
                {AVATAR_OPTIONS.map((opt) => (
                  <img
                    key={opt.file}
                    src={`/images/${opt.file}`}
                    alt={opt.label}
                    title={opt.label}
                    className={`avatar-option ${user.profileImage === opt.file ? 'selected' : ''}`}
                    onClick={(e) => { e.stopPropagation(); handleAvatarSelect(opt.file); }}
                    onContextMenu={(e) => e.preventDefault()}
                    draggable="false"
                  />
                ))}
              </div>
            </div>
          )}
          <h2>{user.fullName || user.username}</h2>
          <p className="profile-role">{user.role}</p>
        </div>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        {!isEditing ? (
          <>
            <div className="profile-details">
              <div className="detail-item">
                <strong>Username</strong>
                <span>{user.username}</span>
              </div>
              <div className="detail-item">
                <strong>Email</strong>
                <span>{user.email || 'Not set'}</span>
              </div>
              <div className="detail-item">
                <strong>Full Name</strong>
                <span>{user.fullName || 'Not set'}</span>
              </div>
              <div className="detail-item">
                <strong>Age</strong>
                <span>{user.age || 'Not set'}</span>
              </div>
              <div className="detail-item">
                <strong>Phone</strong>
                <span>{user.phone || 'Not set'}</span>
              </div>
              <div className="detail-item">
                <strong>Address</strong>
                <span>
                  {user.formattedAddress || [user.streetAddress, user.aptSuiteUnit, user.city, user.state, user.zipCode, user.country].filter(Boolean).join(', ') || user.address || 'Not set'}
                  {user.addressVerified && <span className="address-verified-inline" title="Verified address"> &#10003;</span>}
                </span>
              </div>
              <div className="detail-item">
                <strong>Verification</strong>
                <span className={`status-${user.verificationStatus || 'none'}`}>
                  {(user.verificationStatus || 'none').charAt(0).toUpperCase() + (user.verificationStatus || 'none').slice(1)}
                </span>
              </div>
            </div>
            <button className="pill-button primary profile-edit-btn" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          </>
        ) : (
          <form onSubmit={handleSave} className="profile-edit-form">
            <div className="form-group">
              <label>Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Age</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} min="1" max="120" />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Search Address (auto-fill)</label>
              <AddressAutocomplete
                value={formData.formattedAddress}
                onChange={(val, isVerified) => {
                  if (!isVerified) {
                    setFormData((prev) => ({ ...prev, formattedAddress: val, addressVerified: false }));
                  }
                }}
                onAddressSelect={handleAddressSelect}
              />
            </div>

            <div className="address-fields-section">
              <div className="form-group">
                <label>Country <span style={{ color: '#e74c3c' }}>*</span></label>
                <select name="country" value={formData.country} onChange={(e) => { handleChange(e); setFormData((prev) => ({ ...prev, state: '' })); }} required>
                  <option value="">Select Country</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Street Address <span style={{ color: '#e74c3c' }}>*</span></label>
                <input type="text" name="streetAddress" value={formData.streetAddress} onChange={handleChange} placeholder="e.g. 1600 Amphitheatre Parkway" required />
              </div>
              <div className="form-group">
                <label>Apt, Suite, or Unit</label>
                <input type="text" name="aptSuiteUnit" value={formData.aptSuiteUnit} onChange={handleChange} placeholder="e.g. Suite 200" />
              </div>
              <div className="form-group">
                <label>City <span style={{ color: '#e74c3c' }}>*</span></label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Hyderabad" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>State <span style={{ color: '#e74c3c' }}>*</span></label>
                  {formData.country && getStates(formData.country).length > 0 ? (
                    <select name="state" value={formData.state} onChange={handleChange} required>
                      <option value="">Select State</option>
                      {getStates(formData.country).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="State / Province" required />
                  )}
                </div>
                <div className="form-group">
                  <label>Zip Code <span style={{ color: '#e74c3c' }}>*</span></label>
                  <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} placeholder="e.g. 500039" required />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>New Password (leave blank to keep current)</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} />
            </div>
            <div className="profile-edit-actions">
              <button type="submit" className="pill-button primary">Save</button>
              <button type="button" className="pill-button secondary" onClick={handleCancel}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DoctorProfile;
