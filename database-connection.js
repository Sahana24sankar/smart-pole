// Database connection configuration
const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'ai-chatbot.c7mkqkyiqpit.ap-south-1.rds.amazonaws.com',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'SmartPole',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Web3things!',
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('rds.amazonaws.com') ? { rejectUnauthorized: false } : false,
  // Connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased timeout for AWS
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully!');
    
    // Test query to check existing tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 Existing tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
};

// Database query helper functions
const dbQueries = {
  // Get all records from pole_images
  async getAllAds() {
    try {
      const result = await pool.query(`
        SELECT id, poletype, image, isactive, createddate, updateddate, createdby, updatedby 
        FROM pole_images 
        ORDER BY createddate DESC
      `);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('Error fetching ads:', error);
      return { success: false, error: error.message };
    }
  },

  // Get ads for specific pole type
  async getAdsByPole(poleType) {
    try {
      console.log(`📡 Fetching ads for pole: ${poleType}`);
      
      const result = await pool.query(`
        SELECT id, poletype, image::text as image, isactive, createddate, updateddate, createdby, updatedby 
        FROM pole_images 
        WHERE poletype = $1 
        ORDER BY createddate DESC
      `, [poleType]);
      
      console.log(`✅ Found ${result.rows.length} ads for pole ${poleType}`);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('❌ Error fetching ads by pole:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Enhanced method to fix the image column type issue
  async fixImageColumnType() {
    try {
      console.log('🔧 Fixing image column type from BYTEA to VARCHAR...');
      
      // Check current column type
      const columnInfo = await pool.query(`
        SELECT data_type, character_maximum_length 
        FROM information_schema.columns 
        WHERE table_name = 'pole_images' AND column_name = 'image'
      `);
      
      console.log('Current image column type:', columnInfo.rows[0]);
      
      // If it's BYTEA, we need to alter it to VARCHAR
      if (columnInfo.rows[0]?.data_type === 'bytea') {
        console.log('🔄 Converting BYTEA column to VARCHAR...');
        
        // First, drop the column and recreate it as VARCHAR
        await pool.query(`
          ALTER TABLE pole_images 
          DROP COLUMN IF EXISTS image CASCADE;
        `);
        
        await pool.query(`
          ALTER TABLE pole_images 
          ADD COLUMN image VARCHAR(255) NOT NULL DEFAULT 'placeholder.jpg';
        `);
        
        console.log('✅ Image column converted to VARCHAR(255)');
      } else if (columnInfo.rows[0]?.data_type !== 'character varying') {
        await pool.query(`
          ALTER TABLE pole_images 
          ALTER COLUMN image TYPE VARCHAR(255)
        `);
        console.log('✅ Image column type fixed to VARCHAR(255)');
      } else {
        console.log('✅ Image column is already VARCHAR');
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error fixing column type:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Enhanced insert method that works with both BYTEA and VARCHAR
  async insertAd(poleType, imagePath, createdBy = 'system') {
    try {
      console.log(`📡 Inserting ad: pole=${poleType}, image=${imagePath}, user=${createdBy}`);
      
      // Try inserting as text first
      try {
        const result = await pool.query(`
          INSERT INTO pole_images (poletype, image, isactive, createddate, createdby) 
          VALUES ($1, $2, $3, NOW(), $4) 
          RETURNING id, poletype, image, isactive, createddate, createdby
        `, [poleType, imagePath, true, createdBy]);
        
        console.log(`✅ Ad inserted successfully with ID: ${result.rows[0].id}`);
        return { success: true, data: result.rows[0] };
      } catch (insertError) {
        if (insertError.message.includes('bytea')) {
          console.log('🔄 Column is BYTEA, fixing it first...');
          await this.fixImageColumnType();
          
          // Retry after fixing
          const result = await pool.query(`
            INSERT INTO pole_images (poletype, image, isactive, createddate, createdby) 
            VALUES ($1, $2, $3, NOW(), $4) 
            RETURNING id, poletype, image, isactive, createddate, createdby
          `, [poleType, imagePath, true, createdBy]);
          
          console.log(`✅ Ad inserted successfully after column fix with ID: ${result.rows[0].id}`);
          return { success: true, data: result.rows[0] };
        } else {
          throw insertError;
        }
      }
    } catch (error) {
      console.error('❌ Error inserting ad:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Update ad status
  async updateAdStatus(adId, isActive, updatedBy = 'system') {
    try {
      const result = await pool.query(`
        UPDATE pole_images 
        SET isactive = $1, updateddate = NOW(), updatedby = $2 
        WHERE id = $3 
        RETURNING *
      `, [isActive, updatedBy, adId]);
      return { success: true, data: result.rows[0] };
    } catch (error) {
      console.error('Error updating ad:', error);
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
      console.error('Error deleting ad:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if pole_images table exists and get its structure
  async checkTableStructure() {
    try {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'pole_images' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('Error checking table structure:', error);
      return { success: false, error: error.message };
    }
  },

  // Create table if not exists - with better error handling
  async createTableIfNotExists() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS pole_images (
          id SERIAL PRIMARY KEY,
          poletype INTEGER NOT NULL,
          image VARCHAR(255) NOT NULL,
          isactive BOOLEAN DEFAULT true,
          createddate TIMESTAMP DEFAULT NOW(),
          updateddate TIMESTAMP,
          createdby VARCHAR(100) DEFAULT 'system',
          updatedby VARCHAR(100)
        );
      `);
      console.log('✅ pole_images table ready');
      
      // Add some indexes for better performance
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_pole_images_poletype ON pole_images(poletype);
        CREATE INDEX IF NOT EXISTS idx_pole_images_active ON pole_images(isactive);
      `);
      
      return { success: true };
    } catch (error) {
      console.error('Error creating table:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Test frontend-backend connectivity with better error handling
  async testFrontendConnection() {
    try {
      // First test basic connection
      const basicTest = await pool.query('SELECT NOW() as current_time');
      
      // Then test table access
      const tableTest = await pool.query(`
        SELECT COUNT(*) as total_ads, 
               COUNT(CASE WHEN isactive = true THEN 1 END) as active_ads
        FROM pole_images
      `);
      
      return { 
        success: true, 
        data: {
          connected: true,
          timestamp: basicTest.rows[0].current_time,
          totalAds: parseInt(tableTest.rows[0].total_ads),
          activeAds: parseInt(tableTest.rows[0].active_ads),
          database: process.env.DB_NAME || 'SmartPole',
          host: process.env.DB_HOST || 'AWS RDS'
        }
      };
    } catch (error) {
      console.error('Frontend connection test failed:', error.message);
      
      // Try to create table if it doesn't exist
      if (error.message.includes('does not exist')) {
        console.log('🔄 Table missing, attempting to create...');
        await this.createTableIfNotExists();
        return this.testFrontendConnection(); // Retry
      }
      
      return { 
        success: false, 
        data: { connected: false },
        error: error.message 
      };
    }
  },

  // Get all ads with image information
  async getAllAdsWithImages() {
    try {
      const result = await pool.query(`
        SELECT id, poletype, image, isactive, createddate, updateddate, createdby, updatedby 
        FROM pole_images 
        ORDER BY createddate DESC
      `);
      
      const processedRows = result.rows.map(row => ({
        ...row,
        image: typeof row.image === 'string' ? row.image : row.image.toString('utf8'),
        imageUrl: `http://localhost:3002/uploads/${typeof row.image === 'string' ? row.image : row.image.toString('utf8')}`
      }));
      
      return { success: true, data: processedRows };
    } catch (error) {
      console.error('Error fetching all ads:', error);
      return { success: false, error: error.message };
    }
  },

  // Clean up test data
  async cleanupTestData() {
    try {
      const result = await pool.query(`
        DELETE FROM pole_images 
        WHERE createdby = 'test-user' OR image LIKE 'test-%'
        RETURNING *
      `);
      
      console.log(`🧹 Cleaned up ${result.rows.length} test records`);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('Error cleaning test data:', error);
      return { success: false, error: error.message };
    }
  },

  // Fix the table structure to ensure image is VARCHAR
  async fixImageColumnType() {
    try {
      console.log('🔧 Fixing image column type...');
      
      // Check current column type
      const columnInfo = await pool.query(`
        SELECT data_type, character_maximum_length 
        FROM information_schema.columns 
        WHERE table_name = 'pole_images' AND column_name = 'image'
      `);
      
      console.log('Current image column type:', columnInfo.rows[0]);
      
      // If it's not VARCHAR, alter it
      if (columnInfo.rows[0]?.data_type !== 'character varying') {
        await pool.query(`
          ALTER TABLE pole_images 
          ALTER COLUMN image TYPE VARCHAR(255)
        `);
        console.log('✅ Image column type fixed to VARCHAR(255)');
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error fixing column type:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Clean existing binary data - fixed method
  async cleanupBinaryImageData() {
    try {
      console.log('🧹 Cleaning up binary image data...');
      
      // First, let's check what we have
      const checkResult = await pool.query(`
        SELECT id, poletype, image, createdby, 
               CASE 
                 WHEN image ~ '^[A-Za-z0-9._-]+\.(jpg|jpeg|png|gif|mp4|webm)$' THEN 'text'
                 ELSE 'binary'
               END as image_type
        FROM pole_images
      `);
      
      console.log(`📊 Found ${checkResult.rows.length} total records`);
      
      // Delete records that look like binary or test data
      const result = await pool.query(`
        DELETE FROM pole_images 
        WHERE createdby = 'test-user' 
           OR image LIKE 'test-%'
           OR NOT (image ~ '^[A-Za-z0-9._-]+\.(jpg|jpeg|png|gif|mp4|webm)$')
        RETURNING id, createdby, image
      `);
      
      console.log(`🗑️ Removed ${result.rows.length} problematic records`);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('❌ Error cleaning binary data:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Add a method to check upload readiness
  async checkUploadReadiness() {
    try {
      // Check table exists and structure
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'pole_images'
        );
      `);
      
      if (!tableCheck.rows[0].exists) {
        await this.createTableIfNotExists();
      }
      
      // Check column types
      const columnCheck = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'pole_images' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Table structure:', columnCheck.rows);
      
      return { 
        success: true, 
        data: {
          tableExists: tableCheck.rows[0].exists,
          columns: columnCheck.rows
        }
      };
    } catch (error) {
      console.error('❌ Upload readiness check failed:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Add a method to view database contents easily
  async viewDatabaseContents() {
    try {
      console.log('🔍 Checking database contents...');
      
      const result = await pool.query(`
        SELECT 
          id, 
          poletype, 
          image, 
          isactive, 
          createddate, 
          createdby,
          LENGTH(image::text) as image_length,
          CASE 
            WHEN image ~ '^[A-Za-z0-9._-]+\.(jpg|jpeg|png|gif|mp4|webm)$' THEN 'FILENAME'
            ELSE 'OTHER'
          END as image_type
        FROM pole_images 
        ORDER BY createddate DESC
        LIMIT 10
      `);
      
      console.log(`📊 Found ${result.rows.length} records in database:`);
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id}`);
        console.log(`   - Pole: ${row.poletype}`);
        console.log(`   - Image: ${row.image}`);
        console.log(`   - Type: ${row.image_type}`);
        console.log(`   - Active: ${row.isactive}`);
        console.log(`   - Created: ${row.createddate}`);
        console.log(`   - Created by: ${row.createdby}`);
        console.log('   ---');
      });
      
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('❌ Error viewing database:', error.message);
      return { success: false, error: error.message };
    }
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database connections...');
  await pool.end();
  process.exit(0);
});

module.exports = {
  pool,
  testConnection,
  dbQueries
};
