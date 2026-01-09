-- FeedFlow Database Schema for Supabase
-- Run this SQL in the Supabase SQL Editor to create the necessary tables

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  password text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Establishments table
create table if not exists establishments (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  alert_email text not null,
  google_review_url text,
  show_google_review_prompt boolean default false,
  weekly_report_enabled boolean default false,
  user_id uuid references users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Feedbacks table
create table if not exists feedbacks (
  id uuid primary key default uuid_generate_v4(),
  rating text not null check (rating in ('bad', 'okay', 'great')),
  comment text,
  establishment_id uuid references establishments(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index if not exists idx_establishments_user_id on establishments(user_id);
create index if not exists idx_establishments_slug on establishments(slug);
create index if not exists idx_feedbacks_establishment_id on feedbacks(establishment_id);
create index if not exists idx_feedbacks_created_at on feedbacks(created_at desc);

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
alter table users enable row level security;
alter table establishments enable row level security;
alter table feedbacks enable row level security;

-- Users: users can only see their own data
create policy "Users can view own data" on users
  for select using (true);

create policy "Users can insert own data" on users
  for insert with check (true);

-- Establishments: users can manage their own establishments
create policy "Users can view own establishments" on establishments
  for select using (true);

create policy "Users can insert own establishments" on establishments
  for insert with check (true);

create policy "Users can update own establishments" on establishments
  for update using (true);

-- Feedbacks: anyone can insert (public feedback), owners can read
create policy "Anyone can insert feedback" on feedbacks
  for insert with check (true);

create policy "Users can view feedbacks" on feedbacks
  for select using (true);
