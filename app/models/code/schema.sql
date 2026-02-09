-- Code Database Schema

-- Users table (for code-related user data)
CREATE TABLE IF NOT EXISTS code_users (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  code_preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  path TEXT NOT NULL,
  content TEXT,
  language VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, path)
);

-- Terminals table
CREATE TABLE IF NOT EXISTS terminals (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'inactive',
  environment VARCHAR(50) DEFAULT 'development',
  last_activity TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Terminal Commands
CREATE TABLE IF NOT EXISTS terminal_commands (
  id SERIAL PRIMARY KEY,
  terminal_id INTEGER REFERENCES terminals(id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  output TEXT,
  status VARCHAR(50) DEFAULT 'completed',
  exit_code INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_code_users_user_id ON code_users(user_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_files_project_id ON files(project_id);
CREATE INDEX idx_terminals_user_id ON terminals(user_id);
CREATE INDEX idx_terminals_project_id ON terminals(project_id);
CREATE INDEX idx_terminal_commands_terminal_id ON terminal_commands(terminal_id);

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_ai_users_updated_at
BEFORE UPDATE ON ai_users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_sessions_updated_at
BEFORE UPDATE ON ai_sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_code_users_updated_at
BEFORE UPDATE ON code_users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at
BEFORE UPDATE ON files
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_terminals_updated_at
BEFORE UPDATE ON terminals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
