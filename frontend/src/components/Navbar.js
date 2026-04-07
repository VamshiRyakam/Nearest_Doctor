import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext'; // Import useAuth hook

const Navbar = () => {
  const { token, user, logout } = useAuth(); // Use token, user, and logout from AuthContext
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout(); // Use logout from AuthContext
    navigate('/login');
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  const renderNavLinks = () => {
    const userRole = user?.role; // Get userRole from the user object in AuthContext
    switch (userRole) {
      case 'patient':
        return (
          <>
            <li><Link to="/dashboard" onClick={closeMenu}>Dashboard</Link></li>
            <li><Link to="/profile" onClick={closeMenu}>Profile</Link></li>
            <li><Link to="/chat" onClick={closeMenu}>AI Chat</Link></li>
            <li><Link to="/doctors" onClick={closeMenu}>Find Doctors</Link></li>
            <li><Link to="/appointments/mine" onClick={closeMenu}>My Appointments</Link></li>
          </>
        );
      case 'doctor':
        return (
          <>
            <li><Link to="/dashboard" onClick={closeMenu}>Dashboard</Link></li>
            <li><Link to="/profile" onClick={closeMenu}>Profile</Link></li>
          </>
        );
      case 'admin':
        return (
          <>
            <li><Link to="/dashboard" onClick={closeMenu}>Dashboard</Link></li>
            <li><Link to="/profile" onClick={closeMenu}>Profile</Link></li>
          </>
        );
      case 'unassigned': // If user is unassigned, they should only see login/register options until role is set
        return (
          <>
            <li><Link to="/login" onClick={closeMenu}>Login</Link></li>
            <li><Link to="/register" onClick={closeMenu}>Register</Link></li>
          </>
        );
      default: // Not logged in
        return (
          <>
            <li><Link to="/login" onClick={closeMenu}>Login</Link></li>
            <li><Link to="/register" onClick={closeMenu}>Register</Link></li>
          </>
        );
    }
  };

  return (
    <header className="navbar surface-card">
      <div className="navbar-container page-width">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <span className="logo-mark">ND</span>
          <div className="logo-copy">
            <strong>Nearest Doctor</strong>
            <small>Decentralized care</small>
          </div>
        </Link>

        <button
          className="nav-toggle"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav-menu ${menuOpen ? 'open' : ''}`}>
          <ul>
            {renderNavLinks()}
          </ul>
          <div className="nav-cta">
            {token ? (
              <button className="pill-button secondary" onClick={handleLogout}>
                Logout
              </button>
            ) : (
              null
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
