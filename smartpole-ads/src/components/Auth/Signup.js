import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Signup = ({ onSwitchToLogin }) => {
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
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
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signup(formData);

      if (!result.success) {
        setError(result.error || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError('Signup failed. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = (provider) => {
    // Handle social signup logic here
    console.log(`${provider} signup`);
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <div className="auth-tabs">
          <button className="auth-tab active">Sign Up</button>
          <button className="auth-tab">Sign In</button>
        </div>
      </div>
      
      <div className="auth-content">
        <h2 className="auth-title">Create An Account</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <div className="input-icon">
              <span className="icon">👤</span>
            </div>
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="input-group">
            <div className="input-icon">
              <span className="icon">📧</span>
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="input-group">
            <div className="input-icon">
              <span className="icon">🔒</span>
            </div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <button type="button" className="password-toggle">
              <span className="icon">👁️</span>
            </button>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="social-login">
          <p className="social-text">Or sign up with</p>
          <div className="social-buttons">
            <button 
              className="social-btn google-btn"
              onClick={() => handleSocialSignup('Google')}
            >
              <span className="social-icon">G</span>
              Google
            </button>
            <button 
              className="social-btn facebook-btn"
              onClick={() => handleSocialSignup('Facebook')}
            >
              <span className="social-icon">f</span>
              Facebook
            </button>
          </div>
        </div>

        <div className="switch-auth">
          <p>
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="switch-link">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
