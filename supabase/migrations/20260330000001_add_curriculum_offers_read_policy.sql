CREATE POLICY "Allow authenticated read access to curriculum offers" ON "public"."curriculum_offers" FOR SELECT USING (auth.role() = 'authenticated');
