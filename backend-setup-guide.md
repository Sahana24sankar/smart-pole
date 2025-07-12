# SmartPole Backend Setup Guide

## 1. Create Backend Server

### Option A: Node.js + Express + PostgreSQL
```bash
# Create backend directory
mkdir smartpole-backend
cd smartpole-backend

# Initialize npm project
npm init -y

# Install dependencies
npm install express pg cors dotenv bcryptjs jsonwebtoken multer
npm install -D nodemon
```

### Option B: Use your existing backend
If you already have a backend server, skip to step 2.

## 2. Backend Structure
```
smartpole-backend/
├── server.js
├── routes/
│   ├── auth.js
│   ├── poles.js
│   └── ads.js
├── middleware/
│   └── auth.js
├── config/
│   └── database.js
└── uploads/
```

## 3. Environment Variables (.env)
```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartpole
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
```

## 4. Database Schema
Your current table structure:
- pole_images (id, poletype, image, isactive, createddate, updateddate, createdby, updatedby)

Recommended additional tables:
- users (id, username, email, password_hash, role, created_at)
- poles (id, pole_number, location, status, created_at)
- time_slots (id, pole_id, start_time, end_time, description, duration)
- ad_assignments (id, time_slot_id, ad_id, assigned_at)

## 5. Setup Instructions

### Step 1: Setup Backend & Database Connection
```bash
# Navigate to the project root
cd c:\Users\sahan\OneDrive\Desktop\smartpole-ads

# Install backend dependencies
npm install

# Create .env file from template
copy .env.example .env

# Edit .env file with your PostgreSQL database credentials
# Update these values in .env:
# DB_HOST=localhost (or your PostgreSQL server address)
# DB_PORT=5432 (or your PostgreSQL port)
# DB_NAME=smartpole (or your database name)
# DB_USER=postgres (or your PostgreSQL username)
# DB_PASSWORD=your_actual_password

# Create uploads directory
mkdir uploads

# Test your database connection
node test-database.js
```

**Important:** Make sure your PostgreSQL server is running and you have the correct credentials!

### Step 2: Update Database Schema
Add these tables to your PostgreSQL database:

```sql
-- Users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Poles table
CREATE TABLE poles (
    id SERIAL PRIMARY KEY,
    pole_number INTEGER UNIQUE NOT NULL,
    location VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time slots table
CREATE TABLE time_slots (
    id SERIAL PRIMARY KEY,
    pole_id INTEGER REFERENCES poles(id),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description VARCHAR(255),
    duration INTEGER DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ad assignments table
CREATE TABLE ad_assignments (
    id SERIAL PRIMARY KEY,
    time_slot_id INTEGER REFERENCES time_slots(id),
    ad_id INTEGER REFERENCES pole_images(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample poles
INSERT INTO poles (pole_number, location, status) VALUES
(1, 'Main Street', 'active'),
(2, 'Park Avenue', 'active'),
(3, 'Downtown Plaza', 'active');
```

### Step 3: Start Backend Server
```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

### Step 4: Update Frontend Configuration
```bash
# Navigate to frontend directory
cd smartpole-ads

# Update .env file
# Set REACT_APP_MOCK_MODE=false to use real backend
# Set REACT_APP_API_URL=http://localhost:3001/api

# Start frontend
npm start
```

### Step 5: Test Connection
1. Start backend server (port 3001)
2. Start frontend server (port 3000)
3. Open browser to http://localhost:3000
4. Check browser console for any API connection errors

## 6. API Endpoints

### Authentication
- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - User logout

### Poles
- GET `/api/poles` - Get all poles
- GET `/api/poles/:poleId/ads` - Get ads for specific pole
- POST `/api/poles/:poleId/ads` - Upload new ad
- GET `/api/poles/:poleId/timeslots` - Get time slots for pole

### Ads
- PUT `/api/ads/:adId` - Update ad details
- DELETE `/api/ads/:adId` - Delete ad

### Time Slots
- PUT `/api/timeslots/:slotId` - Update time slot
- POST `/api/timeslots/:slotId/assign` - Assign ad to slot

## 7. File Upload Flow
1. User selects file in frontend
2. Frontend sends FormData to `/api/poles/:poleId/ads`
3. Backend processes file with multer
4. File saved to `/uploads` directory
5. Database record created in `pole_images` table
6. Response sent back with file details

## 8. Development vs Production
- Development: Uses mock data fallback if backend unavailable
- Production: Set `REACT_APP_MOCK_MODE=false` for real backend only
