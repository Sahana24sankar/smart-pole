// src/components/UploadAd/UploadAd.js
import React, { useState } from 'react';
import './UploadAd.css';

function UploadAd({ poleNumber, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Get API URL from environment variables
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

  const uploadFileToBackend = async (file) => {
    console.log('🚀 Starting file upload to backend...');
    console.log('API URL:', API_BASE_URL);
    console.log('File:', file.name, file.size, 'bytes');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('📡 Sending POST request to:', `${API_BASE_URL}/poles/${poleNumber || 1}/ads`);
      
      const response = await fetch(`${API_BASE_URL}/poles/${poleNumber || 1}/ads`, {
        method: 'POST',
        body: formData,
      });

      console.log('📨 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Upload response:', result);

      if (result.success) {
        return {
          success: true,
          data: result.ad,
          message: result.message || 'Upload successful'
        };
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  const handleFiles = async (files) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      // Validate file types
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
      if (!validTypes.includes(file.type)) {
        setStatus('❌ Please select an image (JPEG, JPG, PNG, GIF) or video (MP4, WebM).');
        return;
      }

      // Maximum file size (100MB)
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        setStatus('❌ File is too large. Maximum size is 100MB.');
        return;
      }

      // Start upload process
      setUploading(true);
      setStatus('📤 Uploading to backend...');
      setUploadProgress(0);

      // Simulate progress while uploading
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);

      // Upload to backend API
      const uploadResult = await uploadFileToBackend(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadResult.success && uploadResult.data) {
        const uploadedFile = {
          id: uploadResult.data.id || Date.now(),
          name: uploadResult.data.name || file.name,
          type: uploadResult.data.type || 'image',
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          duration: uploadResult.data.duration || '30s',
          uploadTime: new Date().toLocaleString(),
          status: uploadResult.data.status || 'ACTIVE',
          url: uploadResult.data.url || '',
          fileName: uploadResult.data.image || file.name,
          poletype: uploadResult.data.poletype || 1
        };

        setUploadedFiles(prev => [...prev, uploadedFile]);
        setStatus(`✅ ${uploadResult.message}`);
        setUploading(false);

        if (onUploadComplete) {
          onUploadComplete(uploadedFile);
        }

        // Clear progress after a delay
        setTimeout(() => {
          setUploadProgress(0);
        }, 2000);
      } else {
        setStatus(`❌ Upload failed: ${uploadResult.error || 'Unknown error'}`);
        setUploading(false);
        setUploadProgress(0);
      }
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  return (
    <div className="upload-ad-container">
      <div className="upload-header">
        <h3>📤 Upload New Advertisement</h3>
        <p>Upload content for Smart Pole {poleNumber || 1}</p>
        <p className="api-info">🔗 Backend: {API_BASE_URL}</p>
      </div>

      <div 
        className={`upload-dropzone ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          accept="image/*,video/mp4,video/webm"
          disabled={uploading}
          className="file-input-hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="upload-label">
          <div className="upload-icon">📁</div>
          <div className="upload-text">
            <strong>Drop files here or click to upload</strong>
          </div>
          <div className="upload-subtext">
            Supports Images (JPEG, PNG, GIF) and Videos (MP4, WebM) - max 100MB
            <br />
            <small>Will upload to backend API at {API_BASE_URL}</small>
          </div>
        </label>
      </div>

      {status && (
        <div className={`status-message ${status.includes('❌') ? 'error' : 'success'}`}>
          {status}
        </div>
      )}

      {uploading && (
        <div className="upload-progress">
          <div>
            <div className="spinner"></div>
            <span>Uploading to backend... {uploadProgress}%</span>
          </div>
          {uploadProgress > 0 && (
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files-list">
          <h4>Uploaded Files (Saved to Database):</h4>
          {uploadedFiles.map((file) => (
            <div key={file.id} className="file-item-card">
              <div className="file-icon">
                {file.type === 'image' ? '🖼️' : '🎥'}
              </div>
              <div className="file-details">
                <div className="file-name">{String(file.name || 'Untitled')}</div>
                <div className="file-meta">
                  Duration: {String(file.duration || '30s')} | Type: {String(file.type || 'image')} | Size: {String(file.size || '0 MB')}
                </div>
                <div className="file-upload-time">
                  Uploaded: {String(file.uploadTime || new Date().toLocaleString())}
                </div>
                <div className="file-backend-info">
                  📁 Saved as: {String(file.fileName || 'unknown')} | ID: {String(file.id || 'unknown')}
                </div>
                {file.url && (
                  <div className="file-url">
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      🔗 View Image
                    </a>
                  </div>
                )}
              </div>
              <div className="file-actions">
                <span className={`status-badge ${String(file.status || 'unknown').toLowerCase()}`}>
                  {String(file.status || 'UNKNOWN')}
                </span>
                <button 
                  className="action-btn info-btn"
                  title="File Info"
                  onClick={() => console.log('File info:', file)}
                >
                  ℹ️
                </button>
                <button 
                  className="action-btn edit-btn"
                  title="Edit"
                >
                  ✏️
                </button>
                <button 
                  className="action-btn delete-btn"
                  onClick={() => removeFile(file.id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UploadAd;
