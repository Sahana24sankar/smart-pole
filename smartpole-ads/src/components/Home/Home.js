import React, { useState } from 'react';
import SmartPole from '../SmartPole/SmartPole';
import SmartBoard from '../SmartBoard/SmartBoard';
import UploadAd from '../UploadAd/UploadAd';
import './Home.css';

const Home = ({ onLogout }) => {
  const [selectedPole, setSelectedPole] = useState(null);
  const [showSmartBoard, setShowSmartBoard] = useState(false);
  const [showUploadAd, setShowUploadAd] = useState(false);

  const smartPoles = [
    { id: 1, name: 'Smart Pole 1', location: 'Main Street & 1st Ave' },
    { id: 2, name: 'Smart Pole 2', location: 'Downtown Plaza' },
    { id: 3, name: 'Smart Pole 3', location: 'Shopping Center' },
    { id: 4, name: 'Smart Pole 4', location: 'Business District' },
    { id: 5, name: 'Smart Pole 5', location: 'Central Park' },
    { id: 6, name: 'Smart Pole 6', location: 'University Campus' },
    { id: 7, name: 'Smart Pole 7', location: 'Airport Terminal' },
    { id: 8, name: 'Smart Pole 8', location: 'Train Station' },
    { id: 9, name: 'Smart Pole 9', location: 'Sports Complex' },
    { id: 10, name: 'Smart Pole 10', location: 'City Hall' }
  ];

  const handlePoleClick = (poleNumber) => {
    setSelectedPole(poleNumber);
    setShowSmartBoard(true);
  };

  const handleCloseSmartBoard = () => {
    setShowSmartBoard(false);
    setSelectedPole(null);
  };

  const handleOpenUploadAd = () => {
    setShowUploadAd(true);
  };

  const handleCloseUploadAd = () => {
    setShowUploadAd(false);
  };

  const handleUploadComplete = (results) => {
    console.log('Upload completed:', results);
    // You can add logic here to refresh the dashboard or show notifications
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <h1 className="home-title">🏙️ Smart Poles Dashboard</h1>
          <p className="home-subtitle">Manage your digital advertising network</p>
        </div>
        <div className="header-actions">
          <button className="upload-btn" onClick={handleOpenUploadAd}>
            📤 Upload Ads
          </button>
          <button className="logout-btn" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </header>

      <main className="home-content">
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-number">10</div>
            <div className="stat-label">Total Poles</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">10</div>
            <div className="stat-label">Online</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">24</div>
            <div className="stat-label">Active Ads</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">98%</div>
            <div className="stat-label">Uptime</div>
          </div>
        </div>

        <div className="poles-section">
          <h2 className="section-title">📍 Smart Poles Network</h2>
          <div className="poles-grid">
            {smartPoles.map((pole) => (
              <SmartPole
                key={pole.id}
                poleNumber={pole.id}
                location={pole.location}
                onClick={handlePoleClick}
                isActive={selectedPole === pole.id}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Smart Board Modal */}
      {showSmartBoard && (
        <SmartBoard 
          poleNumber={selectedPole} 
          onClose={handleCloseSmartBoard}
        />
      )}

      {/* Upload Ad Modal */}
      {showUploadAd && (
        <div className="modal-overlay" onClick={handleCloseUploadAd}>
          <div className="modal-content upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📤 Upload Advertisement Content</h2>
              <button className="close-btn" onClick={handleCloseUploadAd}>×</button>
            </div>
            <UploadAd 
              poleNumber={selectedPole || 1} 
              onUploadComplete={handleUploadComplete}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
