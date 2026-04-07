import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

const AVATAR_OPTIONS = [
  { file: 'avatar-male-child.png', label: 'Boy' },
  { file: 'avatar-female-child.png', label: 'Girl' },
  { file: 'avatar-male-adult.png', label: 'Man' },
  { file: 'avatar-female-adult.png', label: 'Woman' },
  { file: 'avatar-male-senior.png', label: 'Elder Man' },
  { file: 'avatar-female-senior.png', label: 'Elder Woman' },
  { file: 'avatar-male-elder.png', label: 'Old Man' },
  { file: 'avatar-female-elder.png', label: 'Old Woman' },
];

const PatientProfile = () => {
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
          address: data.address || '',
          bloodGroup: data.bloodGroup || '',
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

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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
      address: user.address || '',
      bloodGroup: user.bloodGroup || '',
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
                <strong>Blood Group</strong>
                <span>{user.bloodGroup || 'Not set'}</span>
              </div>
              <div className="detail-item">
                <strong>Address</strong>
                <span>{user.address || 'Not set'}</span>
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
              <label>Blood Group</label>
              <input type="text" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} placeholder="e.g. O+, A-, B+" />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} />
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

export default PatientProfile;