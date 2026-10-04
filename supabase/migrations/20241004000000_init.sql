-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('PLAYER', 'BANKER');
CREATE TYPE game_status AS ENUM ('WAITING', 'ACTIVE', 'FINISHED');
CREATE TYPE transaction_type AS ENUM (
    'INITIAL_BALANCE', 
    'PLAYER_TO_PLAYER', 
    'PLAYER_TO_BANK', 
    'BANK_TO_PLAYER', 
    'BANK_DEBIT_PLAYER', 
    'BANK_ADJUSTMENT'
);
CREATE TYPE transaction_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- 2. Create Tables

-- PROFILES
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    display_name VARCHAR NOT NULL,
    role user_role DEFAULT 'PLAYER'::user_role NOT NULL,
    avatar_seed VARCHAR,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- GAMES
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    banker_id UUID REFERENCES profiles(id) NOT NULL,
    status game_status DEFAULT 'WAITING'::game_status NOT NULL,
    initial_balance BIGINT DEFAULT 1500 NOT NULL,
    show_player_balances BOOLEAN DEFAULT true NOT NULL,
    allow_join_after_start BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);

-- GAME_PLAYERS
CREATE TABLE game_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    player_id UUID REFERENCES profiles(id) NOT NULL,
    balance BIGINT DEFAULT 0 NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    status VARCHAR DEFAULT 'ACTIVE' NOT NULL,
    UNIQUE(game_id, player_id)
);

-- TRANSACTIONS
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    sender_player_id UUID REFERENCES profiles(id),
    receiver_player_id UUID REFERENCES profiles(id),
    sender_type VARCHAR NOT NULL, -- 'PLAYER' or 'BANK'
    receiver_type VARCHAR NOT NULL, -- 'PLAYER' or 'BANK'
    amount BIGINT NOT NULL CHECK (amount > 0),
    type transaction_type NOT NULL,
    category VARCHAR,
    description TEXT,
    status transaction_status DEFAULT 'PENDING'::transaction_status NOT NULL,
    idempotency_key VARCHAR UNIQUE NOT NULL,
    created_by UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Bankers can view all profiles in their games" 
ON profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM game_players gp 
    JOIN games g ON g.id = gp.game_id 
    WHERE gp.player_id = profiles.id AND g.banker_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Players can view profiles in their games"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM game_players gp1
    JOIN game_players gp2 ON gp1.game_id = gp2.game_id
    WHERE gp1.player_id = profiles.id AND gp2.player_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- Games Policies
CREATE POLICY "Users can view games they are part of"
ON games FOR SELECT
USING (
  banker_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM game_players WHERE game_id = games.id AND player_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Bankers can create games"
ON games FOR INSERT
WITH CHECK (banker_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Bankers can update their games"
ON games FOR UPDATE
USING (banker_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Game_Players Policies
CREATE POLICY "Users can view players in their games"
ON game_players FOR SELECT
USING (
  EXISTS (SELECT 1 FROM games WHERE id = game_players.game_id AND banker_id = (SELECT id FROM profiles WHERE user_id = auth.uid())) OR
  EXISTS (SELECT 1 FROM game_players gp WHERE gp.game_id = game_players.game_id AND gp.player_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- Transactions Policies
CREATE POLICY "Users can view transactions in their games"
ON transactions FOR SELECT
USING (
  EXISTS (SELECT 1 FROM games WHERE id = transactions.game_id AND banker_id = (SELECT id FROM profiles WHERE user_id = auth.uid())) OR
  EXISTS (SELECT 1 FROM game_players WHERE game_id = transactions.game_id AND player_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- 4. Create secure functions for money operations
CREATE OR REPLACE FUNCTION transfer_player_to_player(
  p_game_id UUID,
  p_sender_id UUID,
  p_receiver_id UUID,
  p_amount BIGINT,
  p_category VARCHAR,
  p_description TEXT,
  p_idempotency_key VARCHAR
) RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_sender_balance BIGINT;
  v_game_status game_status;
  v_caller_profile_id UUID;
BEGIN
  -- Get caller profile id
  SELECT id INTO v_caller_profile_id FROM profiles WHERE user_id = auth.uid();
  IF v_caller_profile_id IS NULL OR v_caller_profile_id != p_sender_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Validate game
  SELECT status INTO v_game_status FROM games WHERE id = p_game_id;
  IF v_game_status != 'ACTIVE' THEN
    RAISE EXCEPTION 'Game is not active';
  END IF;
  
  -- Prevent duplicate transactions
  IF EXISTS (SELECT 1 FROM transactions WHERE idempotency_key = p_idempotency_key) THEN
    SELECT id INTO v_transaction_id FROM transactions WHERE idempotency_key = p_idempotency_key;
    RETURN v_transaction_id; -- Safely return existing transaction
  END IF;

  -- Lock rows and check balance
  SELECT balance INTO v_sender_balance 
  FROM game_players 
  WHERE game_id = p_game_id AND player_id = p_sender_id FOR UPDATE;

  PERFORM 1 FROM game_players WHERE game_id = p_game_id AND player_id = p_receiver_id FOR UPDATE;

  IF v_sender_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Update balances
  UPDATE game_players SET balance = balance - p_amount 
  WHERE game_id = p_game_id AND player_id = p_sender_id;

  UPDATE game_players SET balance = balance + p_amount 
  WHERE game_id = p_game_id AND player_id = p_receiver_id;

  -- Insert transaction
  INSERT INTO transactions (
    game_id, sender_player_id, receiver_player_id, sender_type, receiver_type, amount, type, category, description, status, idempotency_key, created_by
  ) VALUES (
    p_game_id, p_sender_id, p_receiver_id, 'PLAYER', 'PLAYER', p_amount, 'PLAYER_TO_PLAYER', p_category, p_description, 'SUCCESS', p_idempotency_key, v_caller_profile_id
  ) RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
