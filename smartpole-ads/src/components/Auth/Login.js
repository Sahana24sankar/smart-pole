import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Login = ({ onSwitchToSignup }) => {
  const { login, loginWithGoogle, loginWithFacebook } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(formData);
      if (!result.success) {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
    } catch (err) {
      setError('Google login failed. Please try again.');
    }
  };

  const handleFacebookLogin = async () => {
    setError('');
    try {
      await loginWithFacebook();
    } catch (err) {
      setError('Facebook login failed. Please try again.');
    }
  };

  return (
    <div className="auth-form">
      <h2>Sign In</h2>
      {error && <div className="auth-error">{error}</div>}

      <div className="social-buttons">
        <button 
          type="button" 
          className="google-btn"
          onClick={handleGoogleLogin}
        >
          Sign in with Google
        </button>
        <button 
          type="button" 
          className="facebook-btn"
          onClick={handleFacebookLogin}
        >
          Sign in with Facebook
        </button>
      </div>

      <div className="separator">
        <span>or</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
        </div>

        <button 
          type="submit" 
          className="submit-btn" 
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="switch-prompt">
        Don't have an account? 
        <button onClick={onSwitchToSignup} className="switch-btn">
          Sign Up
        </button>
      </p>
    </div>
  );
};

export default Login;
