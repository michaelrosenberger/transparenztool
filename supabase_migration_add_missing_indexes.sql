-- Add missing indexes for foreign keys to improve query performance
-- Foreign keys without covering indexes can lead to slow queries

-- ============================================
-- TABLE: meals
-- ============================================

-- Add index for created_by foreign key
CREATE INDEX IF NOT EXISTS idx_meals_created_by 
  ON meals(created_by);

-- Add index for meal_date if it's used for filtering/sorting
CREATE INDEX IF NOT EXISTS idx_meals_created_at 
  ON meals(created_at DESC);

-- ============================================
-- TABLE: meal_menus (if it has foreign keys)
-- ============================================

-- Add index for meal_ids array (GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_meal_menus_meal_ids 
  ON meal_menus USING GIN(meal_ids);

-- Add index for menu_date for filtering/sorting
CREATE INDEX IF NOT EXISTS idx_meal_menus_menu_date 
  ON meal_menus(menu_date DESC);

-- ============================================
-- TABLE: user_roles
-- ============================================

-- Add index for user_id foreign key
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
  ON user_roles(user_id);

-- Add composite index for user_id + role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role 
  ON user_roles(user_id, role);

-- ============================================
-- TABLE: orders
-- ============================================

-- Add index for status for filtering
CREATE INDEX IF NOT EXISTS idx_orders_status 
  ON orders(status);

-- Add index for created_at for sorting (if column exists)
-- CREATE INDEX IF NOT EXISTS idx_orders_created_at 
--   ON orders(created_at DESC);

-- ============================================
-- TABLE: storage
-- ============================================

-- Add index for created_at for sorting (if column exists)
-- CREATE INDEX IF NOT EXISTS idx_storage_created_at 
--   ON storage(created_at DESC);

-- ============================================
-- TABLE: ingredients
-- ============================================

-- Add index for name for searching
CREATE INDEX IF NOT EXISTS idx_ingredients_name 
  ON ingredients(name);

-- ============================================
-- Add comments for documentation
-- ============================================

COMMENT ON INDEX idx_meals_created_by IS 
  'Index for meals.created_by foreign key to improve join performance';

COMMENT ON INDEX idx_meal_menus_meal_ids IS 
  'GIN index for efficient array operations on meal_ids';

COMMENT ON INDEX idx_user_roles_user_id_role IS 
  'Composite index for fast user role lookups';
