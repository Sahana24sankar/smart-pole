import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthContainer } from './components/Auth';
import { Home } from './components/Home';
import Loading from './components/Loading';
import './App.css';

function AppContent() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  if (isLoading) {
    return <Loading message="Checking authentication..." />;
  }

  return (
    <div className="App">
      {isAuthenticated ? (
        <Home onLogout={logout} user={user} />
      ) : (
        <AuthContainer />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
