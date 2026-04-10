-- Sample Data for National Smart Crop Insurance System
-- Government Model

-- Insert Users (All Roles)
INSERT INTO users (username, email, password_hash, full_name, role, phone, address) VALUES
('farmer_kerala', 'farmer@kerala.gov.in', '$2b$12$R9h/lSAbvnn1.1y2zT8E.uJmJzX.1zX.1zX.1zX.1zX.1zX', 'Kuttan Pillai', 'farmer', '9847012345', 'Alappuzha, Kerala'),
('field_officer', 'officer@agri.kerala.gov.in', '$2b$12$R9h/lSAbvnn1.1y2zT8E.uJmJzX.1zX.1zX.1zX.1zX.1zX', 'Sasi Kumar', 'officer', '9847054321', 'District office, Alappuzha'),
('district_admin', 'district@agri.kerala.gov.in', '$2b$12$R9h/lSAbvnn1.1y2zT8E.uJmJzX.1zX.1zX.1zX.1zX.1zX', 'District Collector', 'district_admin', '9847000001', 'Collectorate, Alappuzha'),
('super_admin', 'admin@smartagri.gov.in', '$2b$12$R9h/lSAbvnn1.1y2zT8E.uJmJzX.1zX.1zX.1zX.1zX.1zX', 'System Administrator', 'super_admin', '9847099999', 'State Data Center, TVM');

-- Insert Farmer Profiles
INSERT INTO farmer_profiles (user_id, aadhar_number, bank_account, village, panchayat, district, state, pin_code, verification_status) VALUES
(1, '555566667777', 'KeralBank-123456', 'Kainakary', 'Kainakary North', 'Alappuzha', 'Kerala', '688501', 'approved');

-- Insert Land Records
INSERT INTO land_records (user_id, survey_number, area, unit, crop_type, irrigation_type, latitude, longitude) VALUES
(1, 'LR-101/2024', 2.5, 'Acre', 'Paddy (Rice)', 'Canal', 9.4981, 76.3388),
(1, 'LR-102/2024', 1.2, 'Acre', 'Coconut', 'Rainfed', 9.5012, 76.3415);

-- Insert Crops Master
INSERT INTO crops (crop_name, crop_code, season, base_rate) VALUES
('Paddy (Rice)', 'PADDY_KL', 'kharif', 50000),
('Coconut', 'COCO_KL', 'summer', 60000),
('Rubber', 'RUBBER_KL', 'kharif', 80000),
('Banana', 'BANANA_KL', 'summer', 55000);

-- Insert Insurance Rates
INSERT INTO insurance_rates (crop_type, rate_per_acre, threshold_damage) VALUES
('Paddy (Rice)', 50000, 33.0),
('Coconut', 60000, 33.0),
('Rubber', 80000, 33.0),
('Banana', 55000, 33.0);

-- Insert Claims
INSERT INTO claims (claim_number, user_id, land_id, crop_id, sum_insured, damage_percentage, damage_type, claim_amount, claim_status, image_url, latitude, longitude) VALUES
('CLM-2024-001', 1, 1, 1, 112500, 45, 'Flood', 50625, 'verified', 'https://images.unsplash.com/photo-1500382017468-f049863256f0?w=800', 9.4981, 76.3388),
('CLM-2024-002', 1, 2, 2, 72000, 20, 'Storm', 14400, 'requested', 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800', 9.5012, 76.3415);

-- Initialize Dashboard Stats
INSERT INTO dashboard_stats (total_claims, approved_claims, rejected_claims, total_claim_amount, total_farmers) VALUES
(2, 0, 0, 65025, 1);

