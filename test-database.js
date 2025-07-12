// Test PostgreSQL connection and explore your database
const { testConnection, dbQueries } = require('./database-connection');

async function runDatabaseTests() {
  console.log('🔍 Testing PostgreSQL Database Connection...\n');
  
  // Test 1: Basic connection
  console.log('1. Testing database connection...');
  const connected = await testConnection();
  
  if (!connected) {
    console.log('❌ Cannot connect to database. Please check your credentials.');
    return;
  }
  
  // Test 2: Check table structure
  console.log('\n2. Checking pole_images table structure...');
  const structure = await dbQueries.checkTableStructure();
  if (structure.success) {
    console.log('📋 Table columns:');
    structure.data.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'})`);
    });
  }
  
  // Test 3: Get existing data
  console.log('\n3. Checking existing data...');
  const allAds = await dbQueries.getAllAds();
  if (allAds.success) {
    console.log(`📊 Found ${allAds.data.length} records in pole_images table`);
    if (allAds.data.length > 0) {
      console.log('Sample records:');
      allAds.data.slice(0, 3).forEach(ad => {
        console.log(`  - ID: ${ad.id}, Pole: ${ad.poletype}, Image: ${ad.image}, Active: ${ad.isactive}`);
      });
    }
  }
  
  // Test 4: Test insert (optional)
  console.log('\n4. Testing insert operation...');
  const testInsert = await dbQueries.insertAd(1, 'test-image.jpg', 'test-user');
  if (testInsert.success) {
    console.log('✅ Insert test successful:', testInsert.data);
    
    // Clean up test record
    await dbQueries.deleteAd(testInsert.data.id);
    console.log('🧹 Test record cleaned up');
  }
  
  console.log('\n🎉 Database connection tests completed!');
}

// Run the tests
runDatabaseTests().catch(console.error);
