/*
Test script to check warehouse data directly from Supabase
Copy and paste this into the Supabase SQL editor to check warehouse status
*/

-- Check if warehouses table exists and has data
SELECT 
  'warehouses' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE type = 'central') as central_count,
  COUNT(*) FILTER (WHERE type = 'zonal') as zonal_count,
  COUNT(*) FILTER (WHERE is_active = true) as active_count
FROM warehouses;

-- Show sample warehouse data
SELECT 
  id,
  name,
  type,
  parent_warehouse_id,
  is_active,
  created_at
FROM warehouses 
ORDER BY type, name 
LIMIT 10;

-- Check parent-child relationships
SELECT 
  p.name as parent_name,
  p.type as parent_type,
  c.name as child_name,
  c.type as child_type
FROM warehouses p
JOIN warehouses c ON c.parent_warehouse_id = p.id
ORDER BY p.name, c.name;

-- Check for orphaned warehouses (zonal warehouses without parent)
SELECT 
  name,
  type,
  parent_warehouse_id,
  'Orphaned - no parent central warehouse' as issue
FROM warehouses 
WHERE type = 'zonal' 
AND (parent_warehouse_id IS NULL OR parent_warehouse_id NOT IN (
  SELECT id FROM warehouses WHERE type = 'central'
));