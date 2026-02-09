-- AI Database Schema

-- Users table (for AI-related user data)
CREATE TABLE IF NOT EXISTS ai_users (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  ai_preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Models table
CREATE TABLE IF NOT EXISTS ai_models (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Sessions table
CREATE TABLE IF NOT EXISTS ai_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  model_id INTEGER REFERENCES ai_models(id),
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- AI Training Data
CREATE TABLE IF NOT EXISTS ai_training_data (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  input_data JSONB NOT NULL,
  output_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_ai_users_user_id ON ai_users(user_id);
CREATE INDEX idx_ai_sessions_user_id ON ai_sessions(user_id);
CREATE INDEX idx_ai_sessions_expires ON ai_sessions(expires_at);
CREATE INDEX idx_ai_training_data_user_id ON ai_training_data(user_id);

-- Add sample data for AI models
INSERT INTO ai_models (name, description, is_active) VALUES
  ('gpt-4', 'OpenAI GPT-4', true),
  ('claude-2', 'Anthropic Claude 2', true),
  ('llama-2', 'Meta LLaMA 2', true)
ON CONFLICT (name) DO NOTHING;
