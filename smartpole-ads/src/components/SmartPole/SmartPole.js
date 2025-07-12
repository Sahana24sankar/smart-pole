import React, { useEffect, useState, useCallback } from 'react';
import { loadAdsFromStorage } from '../../utils/storage';
import './SmartPole.css';

const SmartPole = ({ poleNumber, location, onClick, isActive, onAdCountChange }) => {
  const [counts, setCounts] = useState({ active: 0, total: 0 });

  const updateCounts = useCallback(() => {
    const ads = loadAdsFromStorage(poleNumber);
    const activeCount = ads.filter(ad => ad.status.toLowerCase() === 'active').length;
    const totalCount = ads.length;
    setCounts({ active: activeCount, total: totalCount });
    if (onAdCountChange) {
      onAdCountChange(poleNumber, { active: activeCount, total: totalCount });
    }
  }, [poleNumber, onAdCountChange]);

  // Update counts when component mounts
  useEffect(() => {
    updateCounts();
    // Set up interval to check for changes
    const interval = setInterval(updateCounts, 1000);
    return () => clearInterval(interval);
  }, [poleNumber, updateCounts]);

  return (
    <div 
      className={`smart-pole-card ${isActive ? 'active' : ''}`}
      onClick={() => onClick(poleNumber)}
    >
      <div className="pole-header">
        <div className="pole-number">#{poleNumber}</div>
        <div className="pole-status online">
          <span className="status-dot"></span>
          Online
        </div>
      </div>
      
      <div className="pole-info">
        <h3>Smart Pole {poleNumber}</h3>
        <p className="pole-location">{location}</p>
      </div>
      
      <div className="pole-stats">
        <div className="stat">
          <span className="stat-label">ACTIVE ADS</span>
          <div className="stat-value-container">
            <span className="stat-value">{counts.active}</span>
            <span className="stat-total">/ {counts.total}</span>
          </div>
        </div>
        <div className="stat">
          <span className="stat-label">STATUS</span>
          <span className="stat-value">Active</span>
        </div>
      </div>
      
      <div className="pole-actions">
        <button className="manage-btn">
          📱 Manage Board
        </button>
      </div>
    </div>
  );
};

export default SmartPole;
