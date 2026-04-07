import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../AuthContext'; // Import useAuth hook

const Login = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth(); // Use the login function from AuthContext

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const data = await response.json();
      login(data.token); // Use login from AuthContext
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/google/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Google login failed');
      }

      const data = await response.json();
      login(data.token); // Use login from AuthContext
      // The App.js useEffect will handle redirection to /role-selection if role is 'unassigned'
      // Otherwise, it will navigate to /dashboard (or wherever it normally goes)
      navigate('/dashboard'); // Navigate to dashboard, let App.js handle further redirection
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>Login</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label>Username or Email</label>
          <input
            type="text"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            placeholder="Enter username or email"
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="login-btn">Login</button>
        <p className="switch-form">
          Don't have an account? <a href="/register">Register here</a>
        </p>
        <div className="or-divider">
          <span>OR</span>
        </div>
        <div className="google-login-container">
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => {
              console.log('Login Failed');
            }}
            render={renderProps => (
              <button onClick={renderProps.onClick} disabled={renderProps.disabled} className="google-sign-in-btn">
                <svg className="google-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M44.5 24c0-.9-.08-1.78-.25-2.63H24v4.9h11.95c-.53 2.9-2.22 5.39-4.78 7.02l-1.07.9L36.3 36.6c3.48-3.23 5.5-7.98 5.5-13.6C41.8 19.34 40.52 15.65 38.33 12.63L36.3 9.77l-2.69 1.95c-1.52-1.12-3.32-1.8-5.26-1.8-4.22 0-7.85 2.87-9.13 6.94L16.2 24.5l-2.6-1.95c-.07-.5-.1-.98-.1-1.55 0-1.8.33-3.53.94-5.07L11.5 13.9 8.8 11.9c-2.3 3.63-3.6 7.9-3.6 12.1 0 5.43 1.76 10.37 4.96 14.47l2.67-1.93c-2.5-3.3-4-7.4-4-11.84 0-4.63 1.15-8.98 3.25-12.75L24 16.38l-.75.76C21.6 15.54 18.23 13.88 14.5 13.88c-2.73 0-5.3 1.05-7.25 2.8L24 10.8l.24-.26C24.8 9.9 26.68 9 28.5 9c2.4 0 4.67.9 6.4 2.4l.2.18 2.65-2.1L39.4 6.6c-2.76-2.58-6.3-4-10.9-4-7.58 0-14.1 4.54-17 10.94l-.23.5-3.2 2.37-2.62-2.1c-1.8 2.76-2.82 5.9-2.82 9.2 0 4.22 1.17 8.16 3.1 11.53l.2.33 2.5 1.8c-2.3 3.6-3.6 7.9-3.6 12.1 0 .9.08 1.78.25 2.63H24v-4.9h-11.95c.53-2.9 2.22-5.39 4.78-7.02l1.07-.9L11.7 11.4c-3.48 3.23-5.5 7.98-5.5 13.6C6.2 28.66 7.48 32.35 9.67 35.37l2.03 2.9l2.69-1.95c1.52 1.12 3.32 1.8 5.26 1.8 4.22 0 7.85-2.87 9.13-6.94L31.8 23.5l2.6 1.95c.07.5.1.98.1 1.55 0 1.8-.33 3.53-.94 5.07L36.5 34.1l2.7 2c2.3-3.63 3.6-7.9 3.6-12.1 0-5.43-1.76-10.37-4.96-14.47l-2.67 1.93c2.5 3.3 4 7.4 4 11.84 0 4.63-1.15 8.98-3.25 12.75L24 31.62l.75-.76c2.4-2.4 5.77-4.06 9.5-4.06 2.73 0 5.3-1.05 7.25-2.8L24 37.2l-.24.26C23.2 38.1 21.32 39 19.5 39c-2.4 0-4.67-.9-6.4-2.4l-.2-.18-2.65 2.1L8.6 41.4c2.76 2.58 6.3 4 10.9 4 7.58 0 14.1-4.54 17-10.94l.23-.5 3.2-2.37 2.62 2.1c1.8-2.76 2.82-5.9 2.82-9.2 0-4.22-1.17-8.16-3.1-11.53l-.2-.33-2.5-1.8z" fill="#4285F4"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M24 21.25V26.75H33.25C32.83 28.58 31.75 30.17 30.25 31.29L33.9 34.12C36.7 31.42 38.33 27.76 38.33 24C38.33 23.08 38.25 22.17 38.08 21.25H24V21.25Z" fill="#188038"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M24 41.13C27.13 41.13 29.88 40.04 31.95 38.13L28.1 35.29C27.18 35.91 26.13 36.33 25 36.33C22.25 36.33 19.88 34.58 18.9 31.91L15.12 34.8C17.02 36.88 20.25 41.13 24 41.13V41.13Z" fill="#FABC05"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M9.67 35.37C9.25 34.2 9 32.96 9 31.63C9 30.3 9.25 29.06 9.67 27.9L5.05 24.12C4.1 26.29 3.6 28.84 3.6 31.63C3.6 34.42 4.1 36.97 5.05 39.14L9.67 35.37V35.37Z" fill="#EA4335"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M24 6.87C26.11 6.87 28.08 7.6 29.67 9.1L32.75 6C30.68 4.09 27.42 2.87 24 2.87C20.12 2.87 16.85 4.3 14.28 6.75L18.06 9.63C19.04 8.71 20.42 6.87 24 6.87V6.87Z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            )}
          />
        </div>
      </form>
    </div>
  );
};

export default Login;