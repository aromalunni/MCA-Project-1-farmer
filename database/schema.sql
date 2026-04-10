-- National Smart Crop Insurance & Claim Management System - Database Schema
-- Government Model (Enterprise Grade)

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('farmer', 'officer', 'district_admin', 'state_admin', 'super_admin', 'admin')),
    phone TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Farmer Profiles (KYC & Documents)
CREATE TABLE IF NOT EXISTS farmer_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    aadhar_number TEXT UNIQUE,
    bank_account TEXT,
    village TEXT,
    panchayat TEXT,
    district TEXT,
    state TEXT,
    pin_code TEXT,
    photo_url TEXT,
    ownership_proof_url TEXT,
    verification_status TEXT DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Land Records (GPS & Area)
CREATE TABLE IF NOT EXISTS land_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    survey_number TEXT NOT NULL,
    area REAL NOT NULL,
    unit TEXT DEFAULT 'Acre', -- Acre, Cent
    crop_type TEXT NOT NULL,
    irrigation_type TEXT,
    latitude REAL,
    longitude REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Crops Master Data
CREATE TABLE IF NOT EXISTS crops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_name TEXT UNIQUE NOT NULL,
    crop_code TEXT UNIQUE NOT NULL,
    season TEXT NOT NULL CHECK(season IN ('rabi', 'kharif', 'summer')),
    base_rate REAL NOT NULL, -- Insurance sum insured per unit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insurance Rates (Configurable by Admin)
CREATE TABLE IF NOT EXISTS insurance_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_type TEXT UNIQUE NOT NULL,
    rate_per_acre REAL NOT NULL,
    threshold_damage REAL DEFAULT 33.0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Claims Workflow (Multi-Level)
CREATE TABLE IF NOT EXISTS claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_number TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    land_id INTEGER NOT NULL,
    crop_id INTEGER NOT NULL,
    sum_insured REAL NOT NULL,
    damage_percentage REAL NOT NULL,
    damage_type TEXT, -- Flood, Drought, Pest, Storm
    claim_amount REAL NOT NULL,
    claim_status TEXT NOT NULL DEFAULT 'requested', 
    -- requested, verified, approved, processing, completed, rejected
    
    image_url TEXT,
    latitude REAL,
    longitude REAL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    is_fraud_suspected BOOLEAN DEFAULT 0,
    fraud_details TEXT,
    
    officer_recommendation TEXT, -- approve, reject
    officer_notes TEXT,
    district_admin_notes TEXT,
    rejection_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (land_id) REFERENCES land_records(id) ON DELETE CASCADE,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT, -- Claim, User, Land
    resource_id INTEGER,
    details TEXT,
    ip_address TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Dashboard Stats (Aggregated)
CREATE TABLE IF NOT EXISTS dashboard_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_claims INTEGER DEFAULT 0,
    approved_claims INTEGER DEFAULT 0,
    rejected_claims INTEGER DEFAULT 0,
    total_claim_amount REAL DEFAULT 0,
    total_farmers INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_land_records_user ON land_records(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_claims_user ON claims(user_id);

