-- Fix Bug 1: Cannot Create folders
-- When users create a folder, it is inserted into the global courses table with source_type = 'user_folder'
-- Allow authenticated users to insert into courses if source_type is 'user_folder'

DROP POLICY IF EXISTS "Users can create custom folders" ON courses;

CREATE POLICY "Users can create custom folders" ON courses 
FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' AND source_type = 'user_folder'
);

-- Note: the 'courses' table might already have an insert policy, but if it was restricted to service_role, this will allow users.

-- Fix Bug 2: Sharing link redirects to dashboard
-- When a user opens a link, they call joinMaterial, which tries to insert into material_collaborators
-- Allow authenticated users to join a material they have the link to.
-- Since the materialId is unguessable (UUID), having the ID is proof of sharing.

DROP POLICY IF EXISTS "Users can join shared materials" ON material_collaborators;

CREATE POLICY "Users can join shared materials" ON material_collaborators 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id
);

-- Additionally, ensure materials are readable if you are a collaborator
-- This policy might already exist, but redefining to be safe:

DROP POLICY IF EXISTS "Collaborators can read materials" ON materials;

CREATE POLICY "Collaborators can read materials" ON materials
FOR SELECT
USING (
  user_id = auth.uid() OR
  id IN (
    SELECT material_id FROM material_collaborators WHERE user_id = auth.uid()
  )
);
