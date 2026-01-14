/*
  # GigFlow MVP Database Schema

  1. New Tables
    - `gigs`
      - `id` (uuid, primary key)
      - `title` (text, required) - Gig title
      - `description` (text, required) - Gig description
      - `budget` (numeric, required) - Budget amount
      - `owner_id` (uuid, references auth.users) - User who posted the gig
      - `status` (text, default 'open') - Either 'open' or 'assigned'
      - `created_at` (timestamp)
    
    - `bids`
      - `id` (uuid, primary key)
      - `gig_id` (uuid, references gigs) - The gig being bid on
      - `freelancer_id` (uuid, references auth.users) - User placing the bid
      - `message` (text, required) - Bid message
      - `price` (numeric, required) - Bid price
      - `status` (text, default 'pending') - 'pending', 'hired', or 'rejected'
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Gigs: Anyone can read open gigs, authenticated users can create gigs, owners can update their gigs
    - Bids: Authenticated users can create bids, gig owners can read all bids for their gigs, freelancers can read their own bids
*/

-- Create gigs table
CREATE TABLE IF NOT EXISTS gigs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  budget numeric NOT NULL CHECK (budget > 0),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned')),
  created_at timestamptz DEFAULT now()
);

-- Create bids table
CREATE TABLE IF NOT EXISTS bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id uuid REFERENCES gigs(id) ON DELETE CASCADE NOT NULL,
  freelancer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  price numeric NOT NULL CHECK (price > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'hired', 'rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(gig_id, freelancer_id)
);

-- Enable RLS
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Gigs policies
CREATE POLICY "Anyone can view open gigs"
  ON gigs FOR SELECT
  USING (status = 'open' OR auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create gigs"
  ON gigs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Gig owners can update their gigs"
  ON gigs FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Bids policies
CREATE POLICY "Authenticated users can create bids"
  ON bids FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = freelancer_id AND
    auth.uid() != (SELECT owner_id FROM gigs WHERE id = gig_id)
  );

CREATE POLICY "Gig owners can view all bids for their gigs"
  ON bids FOR SELECT
  TO authenticated
  USING (
    auth.uid() = (SELECT owner_id FROM gigs WHERE id = gig_id)
  );

CREATE POLICY "Freelancers can view their own bids"
  ON bids FOR SELECT
  TO authenticated
  USING (auth.uid() = freelancer_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gigs_status ON gigs(status);
CREATE INDEX IF NOT EXISTS idx_gigs_owner ON gigs(owner_id);
CREATE INDEX IF NOT EXISTS idx_bids_gig ON bids(gig_id);
CREATE INDEX IF NOT EXISTS idx_bids_freelancer ON bids(freelancer_id);