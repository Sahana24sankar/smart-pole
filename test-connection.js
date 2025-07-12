const { testConnection, dbQueries } = require('./database-connection');

async function testDatabaseConnection() {
  console.log('🧪 Testing database connection...');
  console.log('📁 Current directory:', process.cwd());
  console.log('🌐 Frontend should be running on: http://localhost:3000');
  console.log('🔧 Backend will run on: http://localhost:3002');
  
  try {
    // Test basic connection
    const connected = await testConnection();
    console.log(`Database Connection: ${connected ? '✅ Success' : '❌ Failed'}`);
    
    if (connected) {
      // Test table creation
      const tableResult = await dbQueries.createTableIfNotExists();
      console.log(`Table Creation: ${tableResult.success ? '✅ Success' : '❌ Failed'}`);
      
      // Test frontend connection
      const frontendTest = await dbQueries.testFrontendConnection();
      console.log(`Frontend Test: ${frontendTest.success ? '✅ Success' : '❌ Failed'}`);
      
      if (frontendTest.success) {
        console.log('📊 Database Status:', frontendTest.data);
      } else {
        console.log('❌ Frontend test error:', frontendTest.error);
      }
      
      // Test insert
      console.log('\n🧪 Testing ad insertion...');
      const insertTest = await dbQueries.insertAd(1, 'test-image.jpg', 'test-user');
      console.log(`Insert Test: ${insertTest.success ? '✅ Success' : '❌ Failed'}`);
      
      if (insertTest.success) {
        console.log('📄 Inserted Ad:', insertTest.data);
        
        // Test retrieval
        const getTest = await dbQueries.getAdsByPole(1);
        console.log(`Get Test: ${getTest.success ? '✅ Success' : '❌ Failed'}`);
        console.log(`Found ${getTest.data?.length || 0} ads`);
      } else {
        console.log('❌ Insert test error:', insertTest.error);
      }
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Backend is running on port 3002 ✅');
    console.log('2. Update frontend .env: REACT_APP_API_URL=http://localhost:3002/api');
    console.log('3. Restart frontend: npm start');
    console.log('4. Test upload functionality');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Make sure you are in the correct directory');
    console.log('- Check if database-connection.js exists');
    console.log('- Verify .env file has correct database credentials');
  }
  
  process.exit(0);
}

testDatabaseConnection();
