-- Migration: Add 'result' to reference_images.ref_type CHECK constraint
-- Run this in Supabase SQL Editor

ALTER TABLE reference_images DROP CONSTRAINT IF EXISTS reference_images_ref_type_check;
ALTER TABLE reference_images ADD CONSTRAINT reference_images_ref_type_check
  CHECK (ref_type IN ('source', 'sref', 'cref', 'oref', 'result'));
