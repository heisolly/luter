-- Create table for storing Yjs document updates
CREATE TABLE IF NOT EXISTS public.yjs_documents (
  room text NOT NULL,
  state bytea NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (room)
);

-- Enable RLS
ALTER TABLE public.yjs_documents ENABLE ROW LEVEL SECURITY;

-- Create policies (modify according to your auth logic)
CREATE POLICY "Allow authenticated access to yjs_documents"
  ON public.yjs_documents
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
