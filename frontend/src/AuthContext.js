import React, { createContext, useContext, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(localStorage.getItem('token'));
  const decodeToken = (t) => {
    try {
      const decoded = jwtDecode(t);
      return {
        id: decoded.id,
        role: decoded.role,
        username: decoded.username,
        verificationStatus: decoded.verificationStatus || 'none',
      };
    } catch (error) {
      console.error("Invalid token:", error);
      return null;
    }
  };

  const [user, setUserState] = useState(() => {
    const savedToken = localStorage.getItem('token');
    return savedToken ? decodeToken(savedToken) : null;
  });

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setTokenState(newToken);
    const decodedUser = decodeToken(newToken);
    setUserState(decodedUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setTokenState(null);
    setUserState(null);
  };

  // Function to manually update user details in context
  const updateUser = (newUserData) => {
    setUserState(prevUser => ({ ...prevUser, ...newUserData }));
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
