
-- Restrict has_role SECURITY DEFINER function: only authenticated users need it (for RLS evaluation).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

-- Remove broad SELECT policies on storage.objects for public buckets.
-- Public buckets serve files via CDN directly; the SELECT policy only controls listing API.
DROP POLICY IF EXISTS "anyone can view movie images" ON storage.objects;
DROP POLICY IF EXISTS "public read book-covers" ON storage.objects;
