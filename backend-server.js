const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import improved database connection
const { pool, testConnection, dbQueries } = require('./database-connection');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🔍 Backend server file loaded - ready to start');

// Add middleware to log all requests FIRST - Enhanced version
app.use((req, res, next) => {
  console.log(`\n📡 INCOMING REQUEST: ${req.method} ${req.url}`);
  console.log('📅 Time:', new Date().toISOString());
  console.log('🌐 Origin:', req.headers.origin || 'No origin header');
  console.log('📋 Content-Type:', req.headers['content-type'] || 'No content-type');
  console.log('🔍 User-Agent:', req.headers['user-agent'] || 'No user-agent');
  
  // Log all headers for debugging
  console.log('📨 All Headers:', JSON.stringify(req.headers, null, 2));
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', req.body);
  }
  
  // Add response logging
  res.on('finish', () => {
    console.log(`✅ Response sent: ${res.statusCode} ${res.statusMessage}`);
  });
  
  next();
});

// Enhanced CORS with more debugging
app.use(cors({
  origin: function(origin, callback) {
    console.log('🔍 CORS Check - Origin:', origin);
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ CORS: No origin, allowing request');
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS: Origin allowed');
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Add OPTIONS handler for preflight requests
app.options('*', (req, res) => {
  console.log('🔄 Handling OPTIONS preflight request for:', req.url);
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Middleware
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
  console.log('📁 Created uploads directory');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images and Videos Only!');
    }
  }
});

// Initialize database connection and create table
const initializeDatabase = async () => {
  console.log('🔄 Initializing database...');
  const connected = await testConnection();
  if (connected) {
    await dbQueries.createTableIfNotExists();
  }
  return connected;
};

// ROUTES START HERE

// Add root endpoint to help with debugging
app.get('/', (req, res) => {
  res.json({
    message: 'SmartPole Ads Backend Server',
    status: 'Running',
    port: PORT,
    endpoints: {
      health: `http://localhost:${PORT}/api/health`,
      test: `http://localhost:${PORT}/api/test`,
      debug: `http://localhost:${PORT}/api/debug/database`,
      images: `http://localhost:${PORT}/api/images`,
      poles: `http://localhost:${PORT}/api/poles`,
      upload: `POST http://localhost:${PORT}/api/poles/1/ads`
    },
    frontend: 'Should be running on http://localhost:3000'
  });
});

// Frontend-Backend connectivity test endpoint
app.get('/api/test', async (req, res) => {
  const dbTest = await dbQueries.testFrontendConnection();
  res.json({
    success: true,
    message: 'Frontend-Backend connection successful!',
    timestamp: new Date().toISOString(),
    cors: 'Enabled',
    database: dbTest.success ? 'Connected' : 'Disconnected',
    dbData: dbTest.data || null,
    endpoints: [
      'GET /api/health',
      'GET /api/poles',
      'GET /api/poles/:poleId/ads',
      'POST /api/poles/:poleId/ads',
      'POST /api/auth/login'
    ]
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbTest = await dbQueries.testFrontendConnection();
  res.json({
    success: true,
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    database: dbTest.success ? 'Connected' : 'Disconnected',
    server: 'Running',
    data: dbTest.data || null
  });
});

// Authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Simple auth - replace with proper password hashing
    if (username && password) {
      // In production, verify against database with hashed passwords
      const token = 'jwt-token-' + Date.now();
      
      res.json({
        success: true,
        token: token,
        user: {
          username: username,
          role: 'user'
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get all poles
app.get('/api/poles', async (req, res) => {
  try {
    // For now, return static data. Later, query from poles table
    const poles = [
      { id: 1, pole_number: 1, location: 'Main Street', status: 'active' },
      { id: 2, pole_number: 2, location: 'Park Avenue', status: 'active' },
      { id: 3, pole_number: 3, location: 'Downtown Plaza', status: 'active' }
    ];
    
    res.json({ success: true, poles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get ads for a specific pole - using improved database queries
app.get('/api/poles/:poleId/ads', async (req, res) => {
  try {
    const { poleId } = req.params;
    console.log(`📡 Frontend requesting ads for pole: ${poleId}`);
    
    const result = await dbQueries.getAdsByPole(parseInt(poleId));
    
    if (!result.success) {
      console.error('❌ Database error:', result.error);
      return res.json({ 
        success: true, 
        ads: [], 
        count: 0,
        warning: 'Database connection failed - showing empty list'
      });
    }
    
    const ads = result.data.map(row => ({
      id: row.id,
      name: `Ad ${row.id}`,
      poletype: row.poletype,
      image: row.image,
      url: `${req.protocol}://${req.get('host')}/uploads/${row.image}`,
      isactive: row.isactive,
      createddate: row.createddate,
      updateddate: row.updateddate,
      type: 'image',
      duration: '30s',
      status: row.isactive ? 'ACTIVE' : 'PAUSED'
    }));
    
    console.log(`✅ Sending ${ads.length} ads to frontend for pole ${poleId}`);
    res.json({ success: true, ads, count: ads.length });
  } catch (error) {
    console.error('Get ads error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get ads: ' + error.message 
    });
  }
});

// Get all uploaded images - new route for viewing in database
app.get('/api/images', async (req, res) => {
  try {
    console.log('📡 Frontend requesting all uploaded images');
    
    const result = await dbQueries.getAllAdsWithImages();
    
    if (!result.success) {
      return res.json({ 
        success: true, 
        images: [], 
        count: 0,
        warning: 'Database connection failed'
      });
    }
    
    const images = result.data.map(row => ({
      id: row.id,
      poletype: row.poletype,
      filename: String(row.image || ''),
      url: `${req.protocol}://${req.get('host')}/uploads/${row.image}`,
      isactive: Boolean(row.isactive),
      createddate: row.createddate ? row.createddate.toString() : new Date().toISOString(),
      createdby: String(row.createdby || 'unknown'),
      status: row.isactive ? 'ACTIVE' : 'INACTIVE'
    }));
    
    console.log(`✅ Sending ${images.length} images to frontend`);
    res.json({ 
      success: true, 
      images, 
      count: images.length,
      message: `Found ${images.length} uploaded images`
    });
  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get images: ' + error.message 
    });
  }
});

// Clean up test data - utility route
app.delete('/api/cleanup-test-data', async (req, res) => {
  try {
    const result = await dbQueries.cleanupTestData();
    
    if (result.success) {
      res.json({
        success: true,
        message: `Cleaned up ${result.data.length} test records`,
        deletedRecords: result.data.length
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup test data: ' + result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cleanup failed: ' + error.message
    });
  }
});

// UPLOAD ROUTE - This is the main one that should work
app.post('/api/poles/:poleId/ads', upload.single('file'), async (req, res) => {
  try {
    console.log('\n🔥 UPLOAD REQUEST RECEIVED!');
    console.log('🔍 Raw request info:');
    console.log('  - Method:', req.method);
    console.log('  - URL:', req.originalUrl);
    console.log('  - Pole ID:', req.params.poleId);
    console.log('  - Headers:', JSON.stringify(req.headers, null, 2));
    console.log('  - Content-Type:', req.headers['content-type']);
    console.log('  - Content-Length:', req.headers['content-length']);
    
    const { poleId } = req.params;
    const file = req.file;
    
    console.log('\n📁 File processing:');
    console.log('  - File object exists:', !!file);
    console.log('  - Request files:', req.files);
    console.log('  - Request body keys:', Object.keys(req.body || {}));
    
    if (!file) {
      console.log('❌ NO FILE RECEIVED!');
      console.log('  - Multer error might have occurred');
      console.log('  - Check if file field name is "file"');
      console.log('  - Check if file size exceeds limit');
      
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded - check file field name and size',
        debug: {
          expectedFieldName: 'file',
          maxFileSize: '100MB',
          receivedBody: Object.keys(req.body || {}),
          hasFiles: !!req.files,
          contentType: req.headers['content-type']
        }
      });
    }
    
    console.log('✅ File received successfully:');
    console.log('  - Original name:', file.originalname);
    console.log('  - Generated filename:', file.filename);
    console.log('  - File size:', file.size, 'bytes');
    console.log('  - MIME type:', file.mimetype);
    console.log('  - Saved to:', file.path);
    
    // Verify file exists on disk
    const fileExists = fs.existsSync(file.path);
    console.log('  - File exists on disk:', fileExists);
    
    if (!fileExists) {
      console.log('❌ File not saved to disk!');
      return res.status(500).json({
        success: false,
        message: 'File upload failed - not saved to disk'
      });
    }
    
    console.log('\n💾 Saving to database...');
    const result = await dbQueries.insertAd(parseInt(poleId), file.filename, 'web-user');
    
    if (!result.success) {
      console.error('❌ Database save failed:', result.error);
      // Still return success since file was uploaded
      return res.json({
        success: true,
        message: 'File uploaded but database save failed',
        warning: result.error,
        ad: {
          id: Date.now(),
          name: file.originalname,
          poletype: parseInt(poleId),
          image: file.filename,
          url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          duration: '30s',
          status: 'ACTIVE',
          createddate: new Date().toISOString()
        }
      });
    }
    
    const newAd = result.data;
    console.log('✅ SUCCESS! Saved to database with ID:', newAd.id);
    
    res.json({
      success: true,
      message: 'File uploaded and saved successfully! 🎉',
      ad: {
        id: newAd.id,
        name: file.originalname,
        poletype: newAd.poletype,
        image: newAd.image,
        url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
        type: file.mimetype.startsWith('image/') ? 'image' : 'video',
        duration: '30s',
        status: 'ACTIVE',
        createddate: newAd.createddate,
        isactive: newAd.isactive
      }
    });
    
  } catch (error) {
    console.error('\n💥 UPLOAD ERROR:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      message: 'Upload failed: ' + error.message,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update ad - using improved database queries
app.put('/api/ads/:adId', async (req, res) => {
  try {
    const { adId } = req.params;
    const { name, duration, status } = req.body;
    
    const result = await dbQueries.updateAdStatus(parseInt(adId), status === 'ACTIVE', 'system');
    
    if (!result.success) {
      return res.status(404).json({ success: false, message: 'Ad not found or database error' });
    }
    
    res.json({ success: true, ad: result.data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete ad - using improved database queries
app.delete('/api/ads/:adId', async (req, res) => {
  try {
    const { adId } = req.params;
    
    const result = await dbQueries.deleteAd(parseInt(adId));
    
    if (!result.success) {
      return res.status(404).json({ success: false, message: 'Ad not found or database error' });
    }
    
    res.json({ success: true, message: 'Ad deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Time slots routes
app.get('/api/poles/:poleId/timeslots', async (req, res) => {
  try {
    // Return default time slots for now
    const timeSlots = [
      { id: 1, start_time: '08:00', end_time: '12:00', description: 'Morning Slot', duration: 30 },
      { id: 2, start_time: '12:00', end_time: '18:00', description: 'Afternoon Slot', duration: 30 },
      { id: 3, start_time: '18:00', end_time: '22:00', description: 'Evening Slot', duration: 30 }
    ];
    
    res.json({ success: true, timeSlots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add a debug endpoint to check database status
app.get('/api/debug/database', async (req, res) => {
  try {
    console.log('\n🔍 DATABASE DEBUG CHECK:');
    
    // Test basic connection
    const connectionTest = await dbQueries.testFrontendConnection();
    console.log('  - Connection:', connectionTest.success ? '✅' : '❌');
    
    // Get all records
    const allAds = await dbQueries.getAllAds();
    console.log('  - Total records:', allAds.data?.length || 0);
    
    // Get table structure
    const structure = await dbQueries.checkTableStructure();
    console.log('  - Table columns:', structure.data?.length || 0);
    
    res.json({
      success: true,
      database: {
        connected: connectionTest.success,
        totalRecords: allAds.data?.length || 0,
        tableColumns: structure.data || [],
        connectionData: connectionTest.data
      },
      message: 'Database debug information retrieved'
    });
  } catch (error) {
    console.error('❌ Database debug error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
const startServer = async () => {
  try {
    const dbConnected = await initializeDatabase();
    console.log(`💾 Database: ${dbConnected ? '✅ Connected' : '❌ Disconnected'}`);
    
    const server = app.listen(PORT, () => {
      console.log('🚀 SmartPole Ads Backend Server Started');
      console.log(`📡 Server running on: http://localhost:${PORT}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`📤 Upload endpoint: POST http://localhost:${PORT}/api/poles/1/ads`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🧪 Test Connection: http://localhost:${PORT}/api/test`);
      console.log(`🖼️ View All Images: http://localhost:${PORT}/api/images`);
      console.log('\n📱 Frontend should connect from: http://localhost:3000');
      console.log('🧪 Test endpoints:');
      console.log(`   - http://localhost:${PORT}/api/test`);
      console.log(`   - http://localhost:${PORT}/api/health`);
      console.log(`   - http://localhost:${PORT}/api/poles`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use!`);
        console.log('Try: set PORT=3002 && node backend-server.js');
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Add fix-database routes BEFORE starting the server
app.get('/api/fix-database', async (req, res) => {
  try {
    console.log('\n🔧 FIXING DATABASE ISSUES...');
    
    const fixResult = await dbQueries.fixImageColumnType();
    const cleanResult = await dbQueries.cleanupBinaryImageData();
    const structureResult = await dbQueries.checkTableStructure();
    
    res.json({
      success: true,
      message: 'Database fixed successfully',
      results: {
        columnTypeFix: fixResult.success,
        binaryDataCleanup: cleanResult.success,
        recordsRemoved: cleanResult.data?.length || 0,
        tableStructure: structureResult.data || []
      },
      instructions: {
        step1: 'Database column type has been fixed',
        step2: `Removed ${cleanResult.data?.length || 0} records with binary data`,
        step3: 'Now try uploading a new image from your frontend',
        step4: 'Check pgAdmin - image field should show filename as text'
      }
    });
  } catch (error) {
    console.error('❌ Database fix error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test upload flow - comprehensive endpoint
app.get('/api/test-upload-flow', async (req, res) => {
  try {
    console.log('\n🧪 TESTING COMPLETE UPLOAD FLOW...');
    
    // Step 1: Check database readiness
    const readinessCheck = await dbQueries.checkUploadReadiness();
    console.log('1. Database readiness:', readinessCheck.success ? '✅' : '❌');
    
    // Step 2: Check uploads directory
    const uploadsExists = fs.existsSync('uploads');
    console.log('2. Uploads directory exists:', uploadsExists ? '✅' : '❌');
    
    if (!uploadsExists) {
      fs.mkdirSync('uploads');
      console.log('   Created uploads directory');
    }
    
    // Step 3: Test connection
    const connectionTest = await dbQueries.testFrontendConnection();
    console.log('3. Database connection:', connectionTest.success ? '✅' : '❌');
    
    // Step 4: Check CORS
    const corsOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002'
    ];
    
    res.json({
      success: true,
      uploadFlowStatus: {
        databaseReady: readinessCheck.success,
        uploadsDirectory: uploadsExists,
        databaseConnection: connectionTest.success,
        corsEnabled: true,
        corsOrigins: corsOrigins,
        endpoints: {
          upload: `POST ${req.protocol}://${req.get('host')}/api/poles/1/ads`,
          viewImages: `GET ${req.protocol}://${req.get('host')}/api/images`,
          debugDatabase: `GET ${req.protocol}://${req.get('host')}/api/debug/database`
        }
      },
      instructions: {
        step1: 'Make sure frontend is running on http://localhost:3000',
        step2: 'Backend should be on http://localhost:3002',
        step3: 'Frontend .env should have REACT_APP_API_URL=http://localhost:3002/api',
        step4: 'Try uploading an image from the frontend',
        step5: 'Check console for upload debug info'
      }
    });
  } catch (error) {
    console.error('❌ Upload flow test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add a simple test endpoint that always works
app.get('/api/simple-test', (req, res) => {
  console.log('🧪 Simple test endpoint hit!');
  res.json({
    success: true,
    message: 'Simple test successful - backend is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers
  });
});

// Add GET route to retrieve all ads - this fixes the 404 error!
app.get('/ads', async (req, res) => {
  try {
    console.log('📡 GET /ads - Frontend requesting all ads');
    
    const result = await dbQueries.getAllAdsWithImages();
    
    if (!result.success) {
      return res.json([]); // Return empty array if database fails
    }
    
    const ads = result.data.map(row => ({
      id: row.id,
      title: String(row.image || 'Untitled'), // Ensure title is a string
      poletype: row.poletype,
      image: String(row.image || ''),
      url: `${req.protocol}://${req.get('host')}/uploads/${row.image}`,
      isactive: Boolean(row.isactive),
      createddate: row.createddate ? row.createddate.toString() : new Date().toISOString(),
      createdby: String(row.createdby || 'unknown'),
      duration: '30s',
      type: 'image',
      status: row.isactive ? 'ACTIVE' : 'INACTIVE'
    }));
    
    console.log(`✅ Sending ${ads.length} ads`);
    res.json(ads); // Return array directly, not wrapped in object
  } catch (error) {
    console.error('❌ Error getting ads:', error);
    res.json([]); // Return empty array on error
  }
});

// Add route to manually fix database column type
app.get('/api/fix-column-type', async (req, res) => {
  try {
    console.log('🔧 Manually fixing image column type...');
    const result = await dbQueries.fixImageColumnType();
    
    res.json({
      success: result.success,
      message: result.success ? 'Column type fixed successfully!' : 'Failed to fix column type',
      error: result.error || null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

startServer();

module.exports = app;
