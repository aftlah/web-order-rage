-- Script Update Supabase (Final Adjustment)
-- Script ini aman dijalankan meski database Anda masih menggunakan struktur lama (is_hangaround).

-- ==========================================
-- 1. UPDATE STRUKTUR TABEL MEMBERS
-- ==========================================

-- A. Tambahkan kolom role jika belum ada
ALTER TABLE members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Hoodlum';

-- B. Migrasi data lama dari 'is_hangaround' ke 'role'
DO $$
BEGIN
    -- Cek apakah kolom is_hangaround masih ada
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'is_hangaround') THEN
        
        -- Update member yang is_hangaround=TRUE menjadi 'Hangaround'
        -- Hanya update jika role masih 'Hoodlum' (default) atau NULL
        UPDATE members 
        SET role = 'Hangaround' 
        WHERE is_hangaround = true AND (role IS NULL OR role = 'Hoodlum');

        -- Update member yang is_hangaround=FALSE menjadi 'Hoodlum'
        UPDATE members 
        SET role = 'Hoodlum' 
        WHERE is_hangaround = false AND (role IS NULL OR role = 'Hoodlum');
        
    END IF;
END $$;

-- C. Hapus kolom is_hangaround
ALTER TABLE members DROP COLUMN IF EXISTS is_hangaround;

-- ==========================================
-- 2. SETUP SECURITY (RLS POLICIES)
-- ==========================================

-- Pastikan RLS aktif
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Reset policy lama untuk menghindari error duplikat
DROP POLICY IF EXISTS "Public Read Members" ON members;
DROP POLICY IF EXISTS "Authenticated CRUD Members" ON members;
DROP POLICY IF EXISTS "Izinkan hapus member untuk user login" ON members;

-- Policy 1: Semua orang bisa BACA daftar member (agar dashboard bisa load)
CREATE POLICY "Public Read Members" 
ON members FOR SELECT 
USING (true);

-- Policy 2: Hanya user LOGIN yang bisa Insert/Update/Delete member
CREATE POLICY "Authenticated CRUD Members" 
ON members FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- -- Orders Table Policies --

DROP POLICY IF EXISTS "Public Read Orders" ON orders;
DROP POLICY IF EXISTS "Authenticated CRUD Orders" ON orders;

CREATE POLICY "Public Read Orders" 
ON orders FOR SELECT 
USING (true);

CREATE POLICY "Authenticated CRUD Orders" 
ON orders FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);
