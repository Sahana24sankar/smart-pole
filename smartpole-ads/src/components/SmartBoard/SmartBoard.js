import React, { useState, useEffect } from 'react';
import './SmartBoard.css';
import UploadAd from '../UploadAd/UploadAd';
import { saveAdsToStorage, loadAdsFromStorage } from '../../utils/storage';

const SmartBoard = ({ poleNumber, onClose, onAdUpdate }) => {
  const [activeTab, setActiveTab] = useState('current');
  const [ads, setAds] = useState([]);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [timeSlots, setTimeSlots] = useState([
    { id: 1, startTime: '08:00', endTime: '12:00', adId: null, description: 'Morning Slot', duration: 30 },
    { id: 2, startTime: '12:00', endTime: '18:00', adId: null, description: 'Afternoon Slot', duration: 30 },
    { id: 3, startTime: '18:00', endTime: '22:00', adId: null, description: 'Evening Slot', duration: 30 }
  ]);
  const [editingSlot, setEditingSlot] = useState(null);
  const [editingAd, setEditingAd] = useState(null);

  // Load ads from storage when component mounts
  useEffect(() => {
    const savedAds = loadAdsFromStorage(poleNumber);
    
    // If Smart Pole 1 has no ads, add some sample data
    if (poleNumber === 1 && savedAds.length === 0) {
      const sampleAds = [
        {
          id: 1001,
          name: 'Summer Sale Campaign',
          duration: '30s',
          type: 'image',
          status: 'ACTIVE',
          size: '2.5 MB',
          uploadDate: new Date().toLocaleString(),
          icon: '🖼️'
        },
        {
          id: 1002,
          name: 'Restaurant Promo Video',
          duration: '15s',
          type: 'video',
          status: 'ACTIVE',
          size: '8.2 MB',
          uploadDate: new Date(Date.now() - 86400000).toLocaleString(),
          icon: '🎥'
        },
        {
          id: 1003,
          name: 'Local Event Banner',
          duration: '20s',
          type: 'image',
          status: 'ACTIVE',
          size: '1.8 MB',
          uploadDate: new Date(Date.now() - 172800000).toLocaleString(),
          icon: '🖼️'
        }
      ];
      setAds(sampleAds);
      saveAdsToStorage(poleNumber, sampleAds);
    } else {
      setAds(savedAds);
    }
  }, [poleNumber]);

  // Save ads to storage whenever ads state changes
  useEffect(() => {
    if (ads.length > 0) {
      saveAdsToStorage(poleNumber, ads);
    }
  }, [ads, poleNumber]);

  const handleUploadComplete = (uploadedFile) => {
    const newAd = {
      id: Date.now(),
      name: uploadedFile.name,
      duration: uploadedFile.duration,
      type: uploadedFile.type,
      size: uploadedFile.size,
      uploadDate: uploadedFile.uploadTime,
      status: 'ACTIVE',
      icon: uploadedFile.type === 'image' ? '🖼️' : '🎥'
    };
    
    const updatedAds = [...ads, newAd];
    setAds(updatedAds);
    saveAdsToStorage(poleNumber, updatedAds);
    
    // Show success message and switch to current ads tab
    setShowUploadSuccess(true);
    setTimeout(() => {
      setActiveTab('current');
      setShowUploadSuccess(false);
    }, 1500);
  };

  const toggleAdStatus = (adId) => {
    const updatedAds = ads.map(ad => 
      ad.id === adId 
        ? { ...ad, status: ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }
        : ad
    );
    setAds(updatedAds);
    saveAdsToStorage(poleNumber, updatedAds);
  };

  const deleteAd = (adId) => {
    if (window.confirm('Are you sure you want to delete this advertisement?')) {
      const updatedAds = ads.filter(ad => ad.id !== adId);
      setAds(updatedAds);
      saveAdsToStorage(poleNumber, updatedAds);
      
      // Remove ad from time slots
      setTimeSlots(prevSlots => 
        prevSlots.map(slot => 
          slot.adId === adId ? { ...slot, adId: null } : slot
        )
      );
    }
  };

  const editAd = (adId) => {
    const ad = ads.find(a => a.id === adId);
    if (ad) {
      setEditingAd({
        id: adId,
        name: ad.name,
        duration: parseInt(ad.duration) || 30
      });
    }
  };

  const saveAdEdit = () => {
    if (editingAd) {
      const updatedAds = ads.map(a => 
        a.id === editingAd.id ? { 
          ...a, 
          name: editingAd.name.trim(),
          duration: `${editingAd.duration}s`
        } : a
      );
      setAds(updatedAds);
      saveAdsToStorage(poleNumber, updatedAds);
      setEditingAd(null);
    }
  };

  const cancelAdEdit = () => {
    setEditingAd(null);
  };

  const editTimeSlot = (slotId) => {
    const slot = timeSlots.find(s => s.id === slotId);
    if (slot) {
      setEditingSlot({
        id: slotId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        description: slot.description,
        duration: slot.duration || 30
      });
    }
  };

  const saveTimeSlotEdit = () => {
    if (editingSlot) {
      setTimeSlots(prevSlots => 
        prevSlots.map(slot => 
          slot.id === editingSlot.id ? {
            ...slot,
            startTime: editingSlot.startTime,
            endTime: editingSlot.endTime,
            description: editingSlot.description,
            duration: editingSlot.duration
          } : slot
        )
      );
      setEditingSlot(null);
    }
  };

  const cancelTimeSlotEdit = () => {
    setEditingSlot(null);
  };

  const assignAdToSlot = (slotId, adId) => {
    setTimeSlots(prevSlots => 
      prevSlots.map(slot => 
        slot.id === slotId ? { ...slot, adId: adId } : slot
      )
    );
  };

  const removeAdFromSlot = (slotId) => {
    setTimeSlots(prevSlots => 
      prevSlots.map(slot => 
        slot.id === slotId ? { ...slot, adId: null } : slot
      )
    );
  };

  const addTimeSlot = () => {
    const newSlot = {
      id: Date.now(),
      startTime: '09:00',
      endTime: '17:00',
      description: 'New Time Slot',
      adId: null,
      duration: 30
    };
    setTimeSlots(prevSlots => [...prevSlots, newSlot]);
    // Automatically start editing the new slot
    setEditingSlot({
      id: newSlot.id,
      startTime: newSlot.startTime,
      endTime: newSlot.endTime,
      description: newSlot.description,
      duration: newSlot.duration
    });
  };

  const deleteTimeSlot = (slotId) => {
    if (window.confirm('Are you sure you want to delete this time slot?')) {
      setTimeSlots(prevSlots => prevSlots.filter(slot => slot.id !== slotId));
    }
  };

  const activeAds = ads.filter(ad => ad.status === 'ACTIVE');
  const totalAds = ads.length;

  return (
    <div className="smart-board-overlay">
      <div className="smart-board-modal">
        <div className="board-header">
          <div className="header-left">
            <h2>📱 Smart Pole {poleNumber} - Digital Board</h2>
            <p>Manage advertisements and content</p>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="board-tabs">
          <button 
            className={`tab ${activeTab === 'current' ? 'active' : ''}`}
            onClick={() => setActiveTab('current')}
          >
            📊 Current Ads
          </button>
          <button 
            className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            👤 Upload New
          </button>
          <button 
            className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            📅 Schedule
          </button>
        </div>

        <div className="board-content">
          {showUploadSuccess && (
            <div className="upload-success-banner">
              <div className="success-content">
                <span className="success-icon">✅</span>
                <span>Advertisement uploaded successfully! Switching to Current Ads...</span>
              </div>
            </div>
          )}
          
          {activeTab === 'current' && (
            <div className="current-ads-tab">
              <div className="ads-header">
                <h3>Active Advertisements</h3>
                <div className="ads-stats">
                  <span>Total: {totalAds}</span>
                  <span>Active: {activeAds.length}</span>
                </div>
              </div>
              
              {ads.length === 0 ? (
                <div className="empty-ads-state">
                  <div className="empty-icon">📱</div>
                  <h4>No Advertisements Yet</h4>
                  <p>Upload your first advertisement to get started!</p>
                  <button 
                    className="upload-now-btn"
                    onClick={() => setActiveTab('upload')}
                  >
                    📤 Upload Now
                  </button>
                </div>
              ) : (
                <div className="ads-grid">
                  {ads.map(ad => {
                    const isEditingThisAd = editingAd && editingAd.id === ad.id;
                    
                    return (
                      <div key={ad.id} className={`ad-card ${isEditingThisAd ? 'editing' : ''}`}>
                        <div className="ad-icon">{ad.icon}</div>
                        <div className="ad-details">
                          {isEditingThisAd ? (
                            <div className="ad-edit-form">
                              <div className="edit-row">
                                <label>Ad Name:</label>
                                <input
                                  type="text"
                                  value={editingAd.name}
                                  onChange={(e) => setEditingAd({...editingAd, name: e.target.value})}
                                  className="ad-input"
                                />
                              </div>
                              <div className="edit-row">
                                <label>Duration (seconds):</label>
                                <input
                                  type="number"
                                  min="5"
                                  max="300"
                                  value={editingAd.duration}
                                  onChange={(e) => setEditingAd({...editingAd, duration: parseInt(e.target.value)})}
                                  className="ad-input"
                                />
                              </div>
                              <div className="edit-actions">
                                <button className="action-btn save-btn" onClick={saveAdEdit}>
                                  ✅
                                </button>
                                <button className="action-btn cancel-btn" onClick={cancelAdEdit}>
                                  ❌
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="ad-name">{ad.name}</div>
                              <div className="ad-meta">
                                Duration: {ad.duration} | Type: {ad.type}
                                {ad.size && ` | Size: ${ad.size}`}
                              </div>
                              {ad.uploadDate && (
                                <div className="ad-upload-date">
                                  Uploaded: {ad.uploadDate}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        <div className="ad-actions">
                          <span className={`status-badge ${ad.status.toLowerCase()}`}>
                            {ad.status.toUpperCase()}
                          </span>
                          <button 
                            className="action-btn play-pause-btn"
                            onClick={() => toggleAdStatus(ad.id)}
                            title={ad.status === 'ACTIVE' ? 'Pause Ad' : 'Resume Ad'}
                          >
                            {ad.status === 'ACTIVE' ? '⏸️' : '▶️'}
                          </button>
                          <button 
                            className="action-btn edit-btn" 
                            onClick={() => editAd(ad.id)}
                            title="Edit Ad"
                          >
                            ✏️
                          </button>
                          <button 
                            className="action-btn delete-btn" 
                            onClick={() => deleteAd(ad.id)}
                            title="Delete Ad"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="upload-tab">
              <UploadAd 
                poleNumber={poleNumber} 
                onUploadComplete={handleUploadComplete}
              />
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="schedule-tab">
              <div className="schedule-content">
                <h3>📅 Schedule Management</h3>
                <p>Assign advertisements to specific time slots</p>
                
                {/* Available Ads Overview */}
                <div className="available-ads-section">
                  <h4>📚 Available Advertisements ({ads.length})</h4>
                  {ads.length > 0 ? (
                    <div className="ads-quick-view">
                      {ads.map(ad => (
                        <div key={ad.id} className={`ad-quick-card ${ad.status.toLowerCase()}`}>
                          <span className="ad-icon">{ad.icon}</span>
                          <div className="ad-quick-info">
                            <div className="ad-quick-name">{ad.name}</div>
                            <div className="ad-quick-details">{ad.duration} • {ad.type} • {ad.status}</div>
                          </div>
                          <div className="ad-quick-actions">
                            <button 
                              className="quick-assign-btn"
                              onClick={() => {
                                const unassignedSlot = timeSlots.find(slot => !slot.adId);
                                if (unassignedSlot) {
                                  assignAdToSlot(unassignedSlot.id, ad.id);
                                } else {
                                  alert('All time slots are assigned. Please remove an ad from a slot first or create a new time slot.');
                                }
                              }}
                              title="Quick assign to first available slot"
                            >
                              🎯 Quick Assign
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-ads-available">
                      <p>No advertisements uploaded yet.</p>
                      <button 
                        className="upload-first-btn"
                        onClick={() => setActiveTab('upload')}
                      >
                        📤 Upload Your First Ad
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="time-slots">
                  <div className="time-slots-header">
                    <h4>Time Slots Management</h4>
                    <button 
                      className="action-btn add-btn"
                      onClick={addTimeSlot}
                      title="Add New Time Slot"
                    >
                      ➕ Add Slot
                    </button>
                  </div>
                  
                  {timeSlots.map(slot => {
                    const assignedAd = ads.find(ad => ad.id === slot.adId);
                    const isEditing = editingSlot && editingSlot.id === slot.id;
                    
                    return (
                      <div key={slot.id} className={`time-slot ${isEditing ? 'editing' : ''}`}>
                        {isEditing ? (
                          <div className="slot-edit-form">
                            <div className="edit-row">
                              <label>Description:</label>
                              <input
                                type="text"
                                value={editingSlot.description}
                                onChange={(e) => setEditingSlot({...editingSlot, description: e.target.value})}
                                className="slot-input"
                              />
                            </div>
                            <div className="edit-row">
                              <label>Start Time:</label>
                              <input
                                type="time"
                                value={editingSlot.startTime}
                                onChange={(e) => setEditingSlot({...editingSlot, startTime: e.target.value})}
                                className="slot-input"
                              />
                            </div>
                            <div className="edit-row">
                              <label>End Time:</label>
                              <input
                                type="time"
                                value={editingSlot.endTime}
                                onChange={(e) => setEditingSlot({...editingSlot, endTime: e.target.value})}
                                className="slot-input"
                              />
                            </div>
                            <div className="edit-row">
                              <label>Ad Duration (seconds):</label>
                              <input
                                type="number"
                                min="5"
                                max="300"
                                value={editingSlot.duration}
                                onChange={(e) => setEditingSlot({...editingSlot, duration: parseInt(e.target.value)})}
                                className="slot-input"
                              />
                            </div>
                            <div className="edit-actions">
                              <button className="action-btn save-btn" onClick={saveTimeSlotEdit}>
                                ✅ Save
                              </button>
                              <button className="action-btn cancel-btn" onClick={cancelTimeSlotEdit}>
                                ❌ Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="slot-info">
                              <div className="slot-header">
                                <div className="slot-time">
                                  <strong>{slot.startTime} - {slot.endTime}</strong>
                                </div>
                                <div className="slot-duration">
                                  Duration: {slot.duration || 30}s per ad
                                </div>
                              </div>
                              <div className="slot-description">{slot.description}</div>
                              {assignedAd && (
                                <div className="assigned-ad">
                                  <span className="ad-label">🎯 Assigned: </span>
                                  <span className="ad-name">{assignedAd.name}</span>
                                  <span className="ad-duration">({assignedAd.duration})</span>
                                </div>
                              )}
                            </div>
                            <div className="slot-actions">
                              <div className="ad-selection-section">
                                <label className="ad-selector-label">Assign Advertisement:</label>
                                <select 
                                  value={slot.adId || ''}
                                  onChange={(e) => assignAdToSlot(slot.id, e.target.value ? parseInt(e.target.value) : null)}
                                  className="ad-selector"
                                >
                                  <option value="">-- Select an Advertisement --</option>
                                  {ads.length > 0 ? (
                                    ads.map(ad => (
                                      <option key={ad.id} value={ad.id}>
                                        {ad.icon} {ad.name} - {ad.duration} ({ad.status}) [{ad.type}]
                                      </option>
                                    ))
                                  ) : (
                                    <option disabled>No ads uploaded yet</option>
                                  )}
                                </select>
                                {ads.length === 0 && (
                                  <div className="no-ads-notice">
                                    <p>📤 No advertisements available. <button 
                                      className="link-button" 
                                      onClick={() => setActiveTab('upload')}
                                    >
                                      Upload ads first
                                    </button></p>
                                  </div>
                                )}
                              </div>
                              <div className="slot-action-buttons">
                                <button 
                                  className="action-btn edit-btn"
                                  onClick={() => editTimeSlot(slot.id)}
                                  title="Edit Time Slot"
                                >
                                  ✏️
                                </button>
                                {slot.adId && (
                                  <button 
                                    className="action-btn remove-btn"
                                    onClick={() => removeAdFromSlot(slot.id)}
                                    title="Remove Ad from Slot"
                                  >
                                    ❌
                                  </button>
                                )}
                                <button 
                                  className="action-btn delete-btn"
                                  onClick={() => deleteTimeSlot(slot.id)}
                                  title="Delete Time Slot"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartBoard;
