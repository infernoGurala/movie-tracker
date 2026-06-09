-- ============================================================
-- movie-tracker — Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Table: users
-- ============================================================
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username      text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name  text,
  bio           text,
  favourite_quote text,
  avatar_url    text,
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT username_format CHECK (
    username ~ '^[a-z0-9_]{3,20}$'
  ),
  CONSTRAINT bio_length CHECK (char_length(bio) <= 200),
  CONSTRAINT quote_length CHECK (char_length(favourite_quote) <= 150)
);

CREATE UNIQUE INDEX idx_users_username ON users (username);

-- ============================================================
-- Table: film_logs
-- ============================================================
CREATE TABLE film_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id         integer NOT NULL,
  title           text NOT NULL,
  poster_path     text,
  release_year    integer,
  genres          text[] DEFAULT '{}',
  runtime_minutes integer,
  watched_date    date NOT NULL,
  rating          smallint NOT NULL,
  review          text,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT rating_range CHECK (rating >= 1 AND rating <= 10),
  CONSTRAINT review_length CHECK (char_length(review) <= 500)
);

CREATE INDEX idx_film_logs_user_id ON film_logs (user_id);
CREATE INDEX idx_film_logs_user_watched ON film_logs (user_id, watched_date);
CREATE INDEX idx_film_logs_tmdb_id ON film_logs (tmdb_id);
CREATE INDEX idx_film_logs_created_at ON film_logs (created_at DESC);

-- ============================================================
-- Table: favourites
-- ============================================================
CREATE TABLE favourites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id       integer NOT NULL,
  title         text NOT NULL,
  poster_path   text,
  release_year  integer,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT unique_user_favourite UNIQUE (user_id, tmdb_id)
);

CREATE INDEX idx_favourites_user_id ON favourites (user_id);

-- ============================================================
-- Table: follows
-- ============================================================
CREATE TABLE follows (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON follows (follower_id);
CREATE INDEX idx_follows_following ON follows (following_id);

-- ============================================================
-- Row Level Security (informational — applied via Supabase dashboard)
-- ============================================================
-- Note: Since we use SUPABASE_SERVICE_KEY (service role), RLS is
-- bypassed on the server side. These policies are for reference
-- if you want to enable direct client access later.
--
-- users:      SELECT public, UPDATE own row
-- film_logs:  SELECT public (except review), INSERT/UPDATE/DELETE own
-- favourites: SELECT public, INSERT/UPDATE/DELETE own
-- follows:    SELECT public, INSERT own (follower_id = auth.uid()),
--             DELETE own
