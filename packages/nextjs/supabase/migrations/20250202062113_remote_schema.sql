-- Initial Schema Setup
CREATE TABLE prompts (
    id BIGINT PRIMARY KEY,  -- matches blockchain promptId
    game_id BIGINT NOT NULL,
    prompt_text TEXT NOT NULL,
    creator_address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_agent_a BOOLEAN NOT NULL,
    status TEXT DEFAULT 'pending',
    tx_hash TEXT,
    block_number BIGINT
);

CREATE TABLE ai_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id BIGINT REFERENCES prompts(id),
    agent TEXT NOT NULL CHECK (agent IN ('A', 'B')),
    response_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_users table
CREATE TABLE admin_users (
    address TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_responses ENABLE ROW LEVEL SECURITY;

-- Everyone can read prompts
CREATE POLICY "Public can view prompts"
ON prompts FOR SELECT
TO PUBLIC
USING (true);

-- Only authenticated users can insert prompts
CREATE POLICY "Authenticated users can insert prompts"
ON prompts FOR INSERT
TO authenticated
WITH CHECK (creator_address = auth.jwt()->>'sub'); 

-- Only admins can update prompt status
CREATE POLICY "Admins can update prompts"
ON prompts FOR UPDATE
TO authenticated
USING (auth.jwt()->>'sub' IN (SELECT address FROM admin_users));
