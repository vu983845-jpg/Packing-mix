-- Mix Quality Tracking App - Supabase Schema Definition

-- Enable uuidossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users (We use public.users for explicit app role management)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer', -- roles: admin, user, viewer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_code VARCHAR(100) UNIQUE NOT NULL,
    product_name VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: quality_standards
CREATE TABLE IF NOT EXISTS quality_standards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    indicator_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'range', 'max', 'min'
    min_value NUMERIC,
    max_value NUMERIC,
    target_value NUMERIC,
    unit VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: inspections
CREATE TABLE IF NOT EXISTS inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    shift VARCHAR(50) NOT NULL,
    product_id UUID REFERENCES products(id),
    container_no VARCHAR(100),
    isp_no VARCHAR(100),
    inspector_name VARCHAR(255) NOT NULL,
    remarks TEXT,
    cluster_count INTEGER NOT NULL DEFAULT 11,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'submitted'
    result VARCHAR(50), -- 'PASS', 'FAIL', 'CLUSTER_ABNORMAL'
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: inspection_values
CREATE TABLE IF NOT EXISTS inspection_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
    indicator_name VARCHAR(100) NOT NULL,
    cluster_no INTEGER NOT NULL,
    value NUMERIC,
    UNIQUE(inspection_id, indicator_name, cluster_no)
);

-- Table: inspection_summary
CREATE TABLE IF NOT EXISTS inspection_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
    indicator_name VARCHAR(100) NOT NULL,
    avg_value NUMERIC,
    pass_fail VARCHAR(50), -- 'pass', 'fail', 'warning'
    fail_reason TEXT,
    UNIQUE(inspection_id, indicator_name)
);

-- RLS Setups (Disabled for full public access to allow testing without deep auth first, can adjust in production)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE quality_standards DISABLE ROW LEVEL SECURITY;
ALTER TABLE inspections DISABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_values DISABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_summary DISABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- SEED DATA
-- -------------------------------------------------------------

-- 1. Insert admin user
INSERT INTO users (id, email, name, role) 
VALUES ('c29db42d-2099-4c12-861f-a3d5b0c9a751', 'admin@factory.local', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 2. Insert sample product
INSERT INTO products (id, product_code, product_name, active)
VALUES ('p09db42d-2099-4c12-861f-a3d5b0c9a752', 'MIX-001', 'Mix Hạt Dinh Dưỡng Tiêu Chuẩn', TRUE)
ON CONFLICT (product_code) DO NOTHING;

-- 3. Insert standards for MIX-001 based on prompt requirements
INSERT INTO quality_standards (product_id, indicator_name, rule_type, min_value, max_value)
VALUES 
    ('p09db42d-2099-4c12-861f-a3d5b0c9a752', 'Hạt', 'range', 300, 320),
    ('p09db42d-2099-4c12-861f-a3d5b0c9a752', 'Bể', 'max', NULL, 30),
    ('p09db42d-2099-4c12-861f-a3d5b0c9a752', 'LP ss', 'max', NULL, 2),
    ('p09db42d-2099-4c12-861f-a3d5b0c9a752', 'A', 'max', NULL, 1.5),
    ('p09db42d-2099-4c12-861f-a3d5b0c9a752', 'B', 'max', NULL, 4),
    ('p09db42d-2099-4c12-861f-a3d5b0c9a752', 'C', 'max', NULL, 7.5),
    ('p09db42d-2099-4c12-861f-a3d5b0c9a752', 'Vết dao', 'max', NULL, 8),
    ('p09db42d-2099-4c12-861f-a3d5b0c9a752', 'Lụa', 'max', NULL, 8),
    ('p09db42d-2099-4c12-861f-a3d5b0c9a752', 'Total defect', 'max', NULL, 29);
