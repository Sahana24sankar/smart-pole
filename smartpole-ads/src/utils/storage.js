// Local storage utilities for persisting ads data

const STORAGE_KEY = 'smartpole_ads';

// Save ads to storage
export const saveAdsToStorage = (poleNumber, ads) => {
  try {
    const existingData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    existingData[poleNumber] = ads;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('adsUpdated', {
      detail: { poleNumber, ads }
    }));
    return true;
  } catch (error) {
    console.error('Error saving ads to storage:', error);
    return false;
  }
};

// Load ads from storage
export const loadAdsFromStorage = (poleNumber) => {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return data[poleNumber] || [];
  } catch (error) {
    console.error('Error loading ads from storage:', error);
    return [];
  }
};

// Delete ad from storage
export const deleteAdFromStorage = (poleNumber, adId) => {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (data[poleNumber]) {
      data[poleNumber] = data[poleNumber].filter(ad => ad.id !== adId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      // Dispatch update event
      window.dispatchEvent(new CustomEvent('adsUpdated', {
        detail: { poleNumber, ads: data[poleNumber] }
      }));
    }
    return true;
  } catch (error) {
    console.error('Error deleting ad from storage:', error);
    return false;
  }
};

// Update ad in storage
export const updateAdInStorage = (poleNumber, updatedAd) => {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (data[poleNumber]) {
      data[poleNumber] = data[poleNumber].map(ad => 
        ad.id === updatedAd.id ? { ...ad, ...updatedAd } : ad
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      // Dispatch update event
      window.dispatchEvent(new CustomEvent('adsUpdated', {
        detail: { poleNumber, ads: data[poleNumber] }
      }));
    }
    return true;
  } catch (error) {
    console.error('Error updating ad in storage:', error);
    return false;
  }
};

// Get ad counts for a pole
export const getAdCounts = (poleNumber) => {
  try {
    const ads = loadAdsFromStorage(poleNumber);
    return {
      active: ads.filter(ad => ad.status.toUpperCase() === 'ACTIVE').length,
      total: ads.length
    };
  } catch (error) {
    console.error('Error getting ad counts:', error);
    return { active: 0, total: 0 };
  }
};
