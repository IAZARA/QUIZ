/*
  # Initial Schema Setup for Real-time Polling Application

  1. New Tables
    - `questions`
      - `id` (uuid, primary key)
      - `content` (text, the question text)
      - `option_a` (text)
      - `option_b` (text)
      - `option_c` (text)
      - `correct_option` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `created_by` (uuid, references auth.users)
    
    - `votes`
      - `id` (uuid, primary key)
      - `question_id` (uuid, references questions)
      - `selected_option` (text)
      - `created_at` (timestamp)
      - `voter_id` (text, anonymous identifier)

  2. Security
    - Enable RLS on both tables
    - Questions table:
      - Anyone can read active questions
      - Only authenticated users can create/update questions
    - Votes table:
      - Anyone can create votes
      - Everyone can read votes
      - Users can only vote once per question
*/

-- Create questions table
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  correct_option text,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create votes table
CREATE TABLE votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  selected_option text NOT NULL,
  created_at timestamptz DEFAULT now(),
  voter_id text NOT NULL
);

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Policies for questions
CREATE POLICY "Anyone can read active questions"
  ON questions
  FOR SELECT
  USING (is_active = true OR auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create questions"
  ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own questions"
  ON questions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Policies for votes
CREATE POLICY "Anyone can create votes"
  ON votes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM votes v
      WHERE v.question_id = votes.question_id
      AND v.voter_id = votes.voter_id
    )
  );

CREATE POLICY "Anyone can read votes"
  ON votes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create unique constraint to prevent duplicate votes
CREATE UNIQUE INDEX votes_voter_question_unique 
  ON votes (question_id, voter_id);