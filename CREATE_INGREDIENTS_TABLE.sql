-- Create ingredients table
CREATE TABLE IF NOT EXISTS public.ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to available ingredients
CREATE POLICY "Allow public read access to available ingredients"
    ON public.ingredients
    FOR SELECT
    USING (is_available = true);

-- Policy: Allow authenticated users to read all ingredients
CREATE POLICY "Allow authenticated users to read all ingredients"
    ON public.ingredients
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow admins full access
CREATE POLICY "Allow admins full access to ingredients"
    ON public.ingredients
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
    )
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
    );

-- Create storage bucket for ingredient images
INSERT INTO storage.buckets (id, name, public)
VALUES ('ingredient-images', 'ingredient-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ingredient images
CREATE POLICY "Allow public read access to ingredient images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'ingredient-images');

CREATE POLICY "Allow admins to upload ingredient images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'ingredient-images'
        AND (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
    );

CREATE POLICY "Allow admins to update ingredient images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'ingredient-images'
        AND (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
    );

CREATE POLICY "Allow admins to delete ingredient images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'ingredient-images'
        AND (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ingredients_updated_at
    BEFORE UPDATE ON public.ingredients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some default ingredients
INSERT INTO public.ingredients (name, is_available) VALUES
    ('Tomaten', true),
    ('Karotten', true),
    ('Salat', true),
    ('Gurken', true),
    ('Paprika', true),
    ('Zucchini', true),
    ('Kartoffeln', true),
    ('Zwiebeln', true),
    ('Knoblauch', true),
    ('Brokkoli', true)
ON CONFLICT (name) DO NOTHING;
