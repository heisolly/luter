-- Create material_analysis table for caching AI-generated content
CREATE TABLE IF NOT EXISTS material_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one analysis per material per user
  UNIQUE(material_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_material_analysis_material_id ON material_analysis(material_id);
CREATE INDEX IF NOT EXISTS idx_material_analysis_user_id ON material_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_material_analysis_created_at ON material_analysis(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE material_analysis ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own analysis
CREATE POLICY "Users can view their own material analysis" ON material_analysis
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy for users to insert their own analysis
CREATE POLICY "Users can insert their own material analysis" ON material_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own analysis
CREATE POLICY "Users can update their own material analysis" ON material_analysis
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for users to delete their own analysis
CREATE POLICY "Users can delete their own material analysis" ON material_analysis
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_material_analysis_updated_at
  BEFORE UPDATE ON material_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
