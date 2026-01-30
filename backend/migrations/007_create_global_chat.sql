-- Create global_chat table for community-wide chat
CREATE TABLE IF NOT EXISTS global_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT NOT NULL DEFAULT 'Anonymous',
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_global_chat_created_at ON global_chat(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_chat_user_id ON global_chat(user_id);

-- Enable RLS
ALTER TABLE global_chat ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read messages
CREATE POLICY "Anyone can read global chat" ON global_chat
  FOR SELECT USING (true);

-- Allow authenticated users to insert messages
CREATE POLICY "Authenticated users can insert messages" ON global_chat
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete own messages" ON global_chat
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for global_chat
ALTER PUBLICATION supabase_realtime ADD TABLE global_chat;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_global_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_global_chat_updated_at ON global_chat;
CREATE TRIGGER trigger_global_chat_updated_at
  BEFORE UPDATE ON global_chat
  FOR EACH ROW
  EXECUTE FUNCTION update_global_chat_updated_at();

-- Add comment to table
COMMENT ON TABLE global_chat IS 'Global community chat messages for Road Patrol SF';
