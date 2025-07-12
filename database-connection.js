// Enhanced Database connection configuration for SmartPole Ads
const { Pool } = require('pg');
require('dotenv').config();

console.log('🚀 Starting SmartPole Database Connection...');

// PostgreSQL connection pool with enhanced configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'ai-chatbot.c7mkqkyiqpit.ap-south-1.rds.amazonaws.com',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'SmartPole',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Web3things!',
  ssl: {
    rejectUnauthorized: false // Required for AWS RDS
  },
  // Enhanced connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  acquireTimeoutMillis: 15000,
  createTimeoutMillis: 15000,
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200,
});

// Enhanced connection test with auto-setup
const testConnection = async () => {
  try {
    console.log('🔄 Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connected successfully!');
    
    // Auto-setup database structure
    await setupDatabase();
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('🔧 Attempting to fix common issues...');
    
    // Try to reconnect with different SSL settings
    try {
      const fallbackPool = new Pool({
        ...pool.options,
        ssl: false
      });
      const testClient = await fallbackPool.connect();
      console.log('✅ Connected without SSL');
      testClient.release();
      await fallbackPool.end();
      return true;
    } catch (fallbackError) {
      console.error('❌ Fallback connection also failed:', fallbackError.message);
      return false;
    }
  }
};

// Auto-setup database structure
const setupDatabase = async () => {
  try {
    console.log('🔧 Setting up database structure...');
    
    // Create table with proper structure
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pole_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        poletype INTEGER NOT NULL,
        image VARCHAR(500) NOT NULL,
        isactive BOOLEAN DEFAULT true,
        createddate TIMESTAMP DEFAULT NOW(),
        updateddate TIMESTAMP,
        createdby VARCHAR(100) DEFAULT 'web-user',
        updatedby VARCHAR(100)
      );
    `);
    
    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_pole_images_poletype ON pole_images(poletype);
      CREATE INDEX IF NOT EXISTS idx_pole_images_active ON pole_images(isactive);
      CREATE INDEX IF NOT EXISTS idx_pole_images_created ON pole_images(createddate);
    `);
    
    // Check if image column needs fixing
    const columnCheck = await pool.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pole_images' AND column_name = 'image'
    `);
    
    if (columnCheck.rows[0]?.data_type === 'bytea') {
      console.log('🔄 Converting image column from BYTEA to VARCHAR...');
      await pool.query(`
        ALTER TABLE pole_images 
        ALTER COLUMN image TYPE VARCHAR(500) USING image::text;
      `);
      console.log('✅ Image column converted successfully');
    }
    
    console.log('✅ Database structure ready!');
    return true;
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    return false;
  }
};

// Simplified database operations
const dbQueries = {
  // Test connection with health check
  async healthCheck() {
    try {
      const result = await pool.query(`
        SELECT 
          NOW() as timestamp,
          COUNT(*) as total_ads,
          COUNT(CASE WHEN isactive = true THEN 1 END) as active_ads
        FROM pole_images
      `);
      
      return {
        success: true,
        data: {
          connected: true,
          timestamp: result.rows[0].timestamp,
          totalAds: parseInt(result.rows[0].total_ads),
          activeAds: parseInt(result.rows[0].active_ads),
          database: 'SmartPole',
          status: 'healthy'
        }
      };
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      return {
        success: false,
        error: error.message,
        data: { connected: false, status: 'unhealthy' }
      };
    }
  },

  // Insert new advertisement
  async insertAd(poleType, imagePath, createdBy = 'web-user') {
    try {
      console.log(`📡 Inserting ad: pole=${poleType}, image=${imagePath}, user=${createdBy}`);
      
      const result = await pool.query(`
        INSERT INTO pole_images (poletype, image, isactive, createddate, createdby) 
        VALUES ($1, $2, $3, NOW(), $4) 
        RETURNING id, poletype, image, isactive, createddate, createdby
      `, [poleType, imagePath, true, createdBy]);
      
      console.log(`✅ Ad inserted successfully with ID: ${result.rows[0].id}`);
      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('❌ Error inserting ad:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Get ads by pole type
  async getAdsByPole(poleType) {
    try {
      console.log(`📡 Fetching ads for pole: ${poleType}`);
      
      const result = await pool.query(`
        SELECT id, poletype, image, isactive, createddate, updateddate, createdby, updatedby 
        FROM pole_images 
        WHERE poletype = $1 AND isactive = true
        ORDER BY createddate DESC
      `, [poleType]);
      
      console.log(`✅ Found ${result.rows.length} ads for pole ${poleType}`);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('❌ Error fetching ads by pole:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Get all active ads
  async getAllActiveAds() {
    try {
      const result = await pool.query(`
        SELECT id, poletype, image, isactive, createddate, updateddate, createdby, updatedby 
        FROM pole_images 
        WHERE isactive = true
        ORDER BY createddate DESC
      `);
      
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('❌ Error fetching all ads:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Update ad status
  async updateAdStatus(adId, isActive, updatedBy = 'web-user') {
    try {
      const result = await pool.query(`
        UPDATE pole_images 
        SET isactive = $1, updateddate = NOW(), updatedby = $2 
        WHERE id = $3 
        RETURNING *
      `, [isActive, updatedBy, adId]);
      
      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('❌ Error updating ad status:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Delete ad
  async deleteAd(adId) {
    try {
      const result = await pool.query(`
        DELETE FROM pole_images 
        WHERE id = $1 
        RETURNING *
      `, [adId]);
      
      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('❌ Error deleting ad:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Clean database (for testing)
  async cleanDatabase() {
    try {
      const result = await pool.query(`
        DELETE FROM pole_images 
        WHERE createdby = 'test-user' OR image LIKE 'test-%'
        RETURNING *
      `);
      
      console.log(`🧹 Cleaned up ${result.rows.length} test records`);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('❌ Error cleaning database:', error.message);
      return { success: false, error: error.message };
    }
  },

  // View database contents (for debugging)
  async viewContents(limit = 10) {
    try {
      const result = await pool.query(`
        SELECT 
          id, 
          poletype, 
          image, 
          isactive, 
          createddate, 
          createdby,
          LENGTH(image) as image_length
        FROM pole_images 
        ORDER BY createddate DESC
        LIMIT $1
      `, [limit]);
      
      console.log(`📊 Database contains ${result.rows.length} records:`);
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id}`);
        console.log(`   - Pole: ${row.poletype}`);
        console.log(`   - Image: ${row.image}`);
        console.log(`   - Active: ${row.isactive}`);
        console.log(`   - Created: ${row.createddate.toISOString()}`);
        console.log(`   - Created by: ${row.createdby}`);
        console.log('   ---');
      });
      
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('❌ Error viewing database contents:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Missing functions that backend-server.js expects
  async testFrontendConnection() {
    return await this.healthCheck();
  },

  async getAllAdsWithImages() {
    return await this.getAllActiveAds();
  },

  async getAllAds() {
    try {
      const result = await pool.query(`
        SELECT id, poletype, image, isactive, createddate, updateddate, createdby, updatedby 
        FROM pole_images 
        ORDER BY createddate DESC
      `);
      
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('❌ Error fetching all ads:', error.message);
      return { success: false, error: error.message };
    }
  },

  async cleanupTestData() {
    return await this.cleanDatabase();
  },

  async checkTableStructure() {
    try {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'pole_images'
        ORDER BY ordinal_position
      `);
      
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('❌ Error checking table structure:', error.message);
      return { success: false, error: error.message };
    }
  },

  async fixImageColumnType() {
    try {
      console.log('🔧 Fixing image column type to VARCHAR...');
      await pool.query(`
        ALTER TABLE pole_images 
        ALTER COLUMN image TYPE VARCHAR(500) USING COALESCE(image::text, '')
      `);
      
      console.log('✅ Image column type fixed successfully');
      return { success: true, message: 'Column type fixed to VARCHAR(500)' };
    } catch (error) {
      console.error('❌ Error fixing column type:', error.message);
      return { success: false, error: error.message };
    }
  },

  async cleanupBinaryImageData() {
    try {
      const result = await pool.query(`
        DELETE FROM pole_images 
        WHERE image IS NULL OR image = '' OR LENGTH(image) > 500
        RETURNING *
      `);
      
      console.log(`🧹 Cleaned up ${result.rows.length} records with invalid image data`);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('❌ Error cleaning up binary data:', error.message);
      return { success: false, error: error.message };
    }
  },

  async checkUploadReadiness() {
    try {
      // Check if table exists and has correct structure
      const tableCheck = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'pole_images'
      `);
      
      if (tableCheck.rows.length === 0) {
        return { success: false, error: 'Table pole_images does not exist' };
      }
      
      // Check column structure
      const columnCheck = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'pole_images' AND column_name = 'image'
      `);
      
      const imageColumnType = columnCheck.rows[0]?.data_type;
      const isReady = imageColumnType === 'character varying' || imageColumnType === 'varchar';
      
      return { 
        success: isReady, 
        data: { 
          tableExists: true, 
          imageColumnType: imageColumnType,
          isReady: isReady 
        } 
      };
    } catch (error) {
      console.error('❌ Error checking upload readiness:', error.message);
      return { success: false, error: error.message };
    }
  }
};

// Initialize database on module load
const initializeDatabase = async () => {
  console.log('🔄 Initializing SmartPole database...');
  
  const connectionSuccess = await testConnection();
  if (connectionSuccess) {
    console.log('🎉 SmartPole database ready for use!');
    
    // Run a quick health check
    const health = await dbQueries.healthCheck();
    if (health.success) {
      console.log(`📊 Database status: ${health.data.totalAds} total ads, ${health.data.activeAds} active`);
    }
  } else {
    console.log('⚠️ Database connection failed. Please check your configuration.');
  }
  
  return connectionSuccess;
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🔄 Closing database connections...');
  try {
    await pool.end();
    console.log('✅ Database connections closed successfully');
  } catch (error) {
    console.error('❌ Error closing database connections:', error.message);
  }
  process.exit(0);
};

// Handle process termination
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Auto-initialize when module is loaded
initializeDatabase();

module.exports = {
  pool,
  testConnection,
  dbQueries,
  initializeDatabase,
  gracefulShutdown
};
