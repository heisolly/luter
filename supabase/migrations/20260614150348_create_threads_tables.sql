CREATE TABLE document_threads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id text NOT NULL,
  resolved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  author_id uuid REFERENCES auth.users,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE document_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id uuid REFERENCES document_threads(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  author_id uuid REFERENCES auth.users,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Turn on Realtime for these tables
alter publication supabase_realtime add table document_threads;
alter publication supabase_realtime add table document_comments;
