-- ====================================================================
-- OFFICEBAZZAR HIDDEN ADMIN & STORAGE POLICIES
-- Idempotent Migration: RLS policies for products, categories, brands,
-- and Supabase Storage bucket for product images.
-- ====================================================================

-- 1. Create public storage bucket for product images if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'products',
    'products',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880;

-- 2. Storage Object RLS Policies
-- Public read access for product images
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public product images are viewable by everyone'
    ) THEN
        CREATE POLICY "Public product images are viewable by everyone" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'products');
    END IF;
END $$;

-- Admin/Staff write access for product images
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Admins can upload product images'
    ) THEN
        CREATE POLICY "Admins can upload product images" 
        ON storage.objects FOR INSERT 
        WITH CHECK (
            bucket_id = 'products' AND (
                EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff'))
                OR auth.role() = 'service_role'
            )
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Admins can update product images'
    ) THEN
        CREATE POLICY "Admins can update product images" 
        ON storage.objects FOR UPDATE 
        USING (
            bucket_id = 'products' AND (
                EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff'))
                OR auth.role() = 'service_role'
            )
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Admins can delete product images'
    ) THEN
        CREATE POLICY "Admins can delete product images" 
        ON storage.objects FOR DELETE 
        USING (
            bucket_id = 'products' AND (
                EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff'))
                OR auth.role() = 'service_role'
            )
        );
    END IF;
END $$;

-- 3. Products Table RLS Policies
-- Allow admins to insert products
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' AND schemaname = 'public' AND policyname = 'Admins can insert products'
    ) THEN
        CREATE POLICY "Admins can insert products" 
        ON products FOR INSERT 
        WITH CHECK (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff'))
            OR auth.role() = 'service_role'
        );
    END IF;
END $$;

-- Allow admins to update products
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' AND schemaname = 'public' AND policyname = 'Admins can update products'
    ) THEN
        CREATE POLICY "Admins can update products" 
        ON products FOR UPDATE 
        USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff'))
            OR auth.role() = 'service_role'
        );
    END IF;
END $$;

-- Allow admins to delete products
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' AND schemaname = 'public' AND policyname = 'Admins can delete products'
    ) THEN
        CREATE POLICY "Admins can delete products" 
        ON products FOR DELETE 
        USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff'))
            OR auth.role() = 'service_role'
        );
    END IF;
END $$;

-- Update SELECT policy so admins see both published and draft products, while public sees only published
DROP POLICY IF EXISTS "Public products viewable by everyone" ON products;
CREATE POLICY "Products viewable based on role" 
ON products FOR SELECT 
USING (
    is_active = TRUE
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff'))
    OR auth.role() = 'service_role'
);

-- 4. Categories Table RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'categories' AND schemaname = 'public' AND policyname = 'Admins can insert categories'
    ) THEN
        CREATE POLICY "Admins can insert categories" 
        ON categories FOR INSERT 
        WITH CHECK (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff'))
            OR auth.role() = 'service_role'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'categories' AND schemaname = 'public' AND policyname = 'Admins can update categories'
    ) THEN
        CREATE POLICY "Admins can update categories" 
        ON categories FOR UPDATE 
        USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff'))
            OR auth.role() = 'service_role'
        );
    END IF;
END $$;

-- 5. Brands Table RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'brands' AND schemaname = 'public' AND policyname = 'Admins can insert brands'
    ) THEN
        CREATE POLICY "Admins can insert brands" 
        ON brands FOR INSERT 
        WITH CHECK (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff'))
            OR auth.role() = 'service_role'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'brands' AND schemaname = 'public' AND policyname = 'Admins can update brands'
    ) THEN
        CREATE POLICY "Admins can update brands" 
        ON brands FOR UPDATE 
        USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff'))
            OR auth.role() = 'service_role'
        );
    END IF;
END $$;

-- 6. Ensure exactly the authorized admin accounts have the admin role in profiles
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        UPDATE profiles
        SET role = 'admin'
        WHERE LOWER(email) IN ('sales4@officebazzar.com', 'marketing@officebazzar.com');
    END IF;
END $$;
