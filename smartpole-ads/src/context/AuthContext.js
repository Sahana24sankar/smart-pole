import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('smartpole_user');
    const authToken = localStorage.getItem('smartpole_token');
    
    if (savedUser && authToken) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    
    setIsLoading(false);
  }, []);

  const loginWithGoogle = async () => {
    // Simulate Google login for demo
    const mockGoogleUser = {
      id: 'google_' + Date.now(),
      name: 'Demo User',
      email: 'demo@gmail.com',
      picture: 'https://lh3.googleusercontent.com/a/default-user',
      provider: 'google'
    };

    localStorage.setItem('smartpole_user', JSON.stringify(mockGoogleUser));
    localStorage.setItem('smartpole_token', mockGoogleUser.id);
    
    setUser(mockGoogleUser);
    setIsAuthenticated(true);
    return { success: true };
  };

  const loginWithFacebook = async () => {
    // Simulate Facebook login for demo
    const mockFacebookUser = {
      id: 'fb_' + Date.now(),
      name: 'Demo User',
      email: 'demo@facebook.com',
      picture: 'https://graph.facebook.com/default-user',
      provider: 'facebook'
    };

    localStorage.setItem('smartpole_user', JSON.stringify(mockFacebookUser));
    localStorage.setItem('smartpole_token', mockFacebookUser.id);
    
    setUser(mockFacebookUser);
    setIsAuthenticated(true);
    return { success: true };
  };

  const login = async (credentials) => {
    try {
      // Simulate email/password login
      const mockUser = {
        id: 'email_' + Date.now(),
        name: credentials.email.split('@')[0],
        email: credentials.email,
        provider: 'email'
      };

      localStorage.setItem('smartpole_user', JSON.stringify(mockUser));
      localStorage.setItem('smartpole_token', mockUser.id);
      
      setUser(mockUser);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('smartpole_user');
    localStorage.removeItem('smartpole_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      loginWithGoogle,
      loginWithFacebook,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
