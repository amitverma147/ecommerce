-- Bulk Wholesale Settings Migration
-- Run this in your Supabase SQL Editor

-- Create bulk_wholesale_settings table
CREATE TABLE IF NOT EXISTS bulk_wholesale_settings (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    min_quantity INTEGER NOT NULL DEFAULT 10,
    max_quantity INTEGER,
    bulk_price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    is_bulk_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_product_bulk_settings UNIQUE(product_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bulk_wholesale_product_id ON bulk_wholesale_settings(product_id);
CREATE INDEX IF NOT EXISTS idx_bulk_wholesale_enabled ON bulk_wholesale_settings(is_bulk_enabled);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE bulk_wholesale_settings ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read bulk settings
CREATE POLICY "Allow authenticated users to read bulk settings" ON bulk_wholesale_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy to allow service role to manage bulk settings
CREATE POLICY "Allow service role to manage bulk settings" ON bulk_wholesale_settings
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Insert sample data for testing (optional)
-- INSERT INTO bulk_wholesale_settings (product_id, min_quantity, max_quantity, bulk_price, discount_percentage) 
-- VALUES (1, 10, 100, 850.00, 15.0);

-- Verify table creation
SELECT 'bulk_wholesale_settings table created successfully' as status;