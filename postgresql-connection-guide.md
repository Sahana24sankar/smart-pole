# PostgreSQL Database Connection Guide

## 🔗 Quick Database Connection Setup

### 1. Find Your PostgreSQL Credentials
You need these details from your PostgreSQL setup:
- **Host**: Usually `localhost` (or IP address if remote)
- **Port**: Usually `5432` (default PostgreSQL port)
- **Database Name**: The name you see in pgAdmin (e.g., `smartpole`)
- **Username**: Your PostgreSQL username (often `postgres`)
- **Password**: Your PostgreSQL password

### 2. Update Environment Variables
Create/edit the `.env` file in your project root:

```bash
# Copy the example file
copy .env.example .env
```

Edit `.env` with your actual database details:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartpole
DB_USER=postgres
DB_PASSWORD=your_actual_password_here
```

### 3. Test Your Connection
```bash
# Install dependencies first
npm install

# Test the connection
node test-database.js
```

### 4. Expected Output
If successful, you should see:
```
✅ Database connected successfully!
📋 Existing tables:
  - pole_images
📊 Found X records in pole_images table
🎉 Database connection tests completed!
```

## 🛠️ Troubleshooting

### Connection Failed?
**Error:** `ECONNREFUSED` or `connection refused`
- ✅ Make sure PostgreSQL server is running
- ✅ Check if the port (5432) is correct
- ✅ Verify host address (localhost vs IP)

**Error:** `password authentication failed`
- ✅ Double-check username and password
- ✅ Make sure the user exists in PostgreSQL
- ✅ Check if user has permissions to access the database

**Error:** `database does not exist`
- ✅ Verify database name spelling
- ✅ Create the database if it doesn't exist
- ✅ Check if you're connecting to the right PostgreSQL instance

### Common Connection Strings
```javascript
// Local PostgreSQL (default)
postgresql://postgres:password@localhost:5432/smartpole

// Remote PostgreSQL
postgresql://username:password@hostname:5432/database_name

// With SSL (for cloud databases)
postgresql://username:password@hostname:5432/database_name?ssl=true
```

## 📊 Using Your Existing Data

Your current `pole_images` table structure:
- `id` - Primary key
- `poletype` - Smart pole identifier 
- `image` - Image/file name
- `isactive` - Boolean status
- `createddate` - Creation timestamp
- `updateddate` - Last update timestamp
- `createdby` - Creator username
- `updatedby` - Last updater username

The connection code will work with this existing structure and allow you to:
- ✅ View existing ads
- ✅ Upload new ads
- ✅ Update ad status
- ✅ Delete ads
- ✅ Filter ads by pole type

## 🚀 Next Steps

Once connection is working:
1. Start the backend server: `npm run dev`
2. Update frontend to use real backend: Edit `smartpole-ads/.env`
3. Set `REACT_APP_MOCK_MODE=false`
4. Start frontend: `cd smartpole-ads && npm start`

Your frontend will now load real data from PostgreSQL instead of mock data!
