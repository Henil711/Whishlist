/*
  # Wishlist Price Tracker Database Schema

  ## Overview
  Complete database schema for a multi-platform price tracking application with user authentication,
  product management, price history tracking, and notification system.

  ## New Tables

  ### 1. `profiles`
  User profile information extending Supabase auth.users
  - `id` (uuid, FK to auth.users) - Primary key
  - `email` (text) - User email address
  - `full_name` (text) - User's full name
  - `notification_enabled` (boolean) - Email notification preference
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last profile update

  ### 2. `products`
  Tracked products from various e-commerce platforms
  - `id` (uuid) - Primary key
  - `user_id` (uuid, FK) - Owner of the wishlist item
  - `url` (text) - Original product URL
  - `platform` (text) - E-commerce platform (amazon, flipkart, walmart, aliexpress, other)
  - `product_id` (text) - Platform-specific product identifier
  - `title` (text) - Product name/title
  - `image_url` (text) - Product image URL
  - `current_price` (numeric) - Latest tracked price
  - `currency` (text) - Currency code (USD, INR, etc)
  - `target_price` (numeric) - User's desired price alert threshold
  - `lowest_price` (numeric) - Historical lowest price
  - `highest_price` (numeric) - Historical highest price
  - `is_available` (boolean) - Stock availability status
  - `last_checked_at` (timestamptz) - Last scrape timestamp
  - `check_frequency` (integer) - Hours between checks (default 24)
  - `created_at` (timestamptz) - Product addition date
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. `price_history`
  Historical price data for trend analysis
  - `id` (uuid) - Primary key
  - `product_id` (uuid, FK) - Reference to products table
  - `price` (numeric) - Recorded price
  - `currency` (text) - Currency code
  - `is_available` (boolean) - Availability at time of check
  - `checked_at` (timestamptz) - Timestamp of price check
  - `created_at` (timestamptz) - Record creation timestamp

  ### 4. `notifications`
  Price drop alerts and system notifications
  - `id` (uuid) - Primary key
  - `user_id` (uuid, FK) - Recipient user
  - `product_id` (uuid, FK) - Related product
  - `type` (text) - Notification type (price_drop, back_in_stock, target_reached)
  - `title` (text) - Notification title
  - `message` (text) - Notification content
  - `old_price` (numeric) - Previous price (for price drops)
  - `new_price` (numeric) - New price (for price drops)
  - `is_read` (boolean) - Read status
  - `sent_at` (timestamptz) - Email send timestamp (null if not sent)
  - `created_at` (timestamptz) - Notification creation timestamp

  ### 5. `scraping_logs`
  Logging and monitoring for scraping operations
  - `id` (uuid) - Primary key
  - `product_id` (uuid, FK) - Related product
  - `status` (text) - success, failed, rate_limited, blocked
  - `error_message` (text) - Error details if failed
  - `response_time` (integer) - Scrape duration in milliseconds
  - `created_at` (timestamptz) - Log entry timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own data
  - Authenticated access required for all operations

  ## Indexes
  - Optimized for common query patterns
  - Product lookups by user and platform
  - Price history queries by product and date range
  - Notification queries by user and read status

  ## Important Notes
  - All timestamps use timestamptz for timezone awareness
  - Numeric type used for prices to maintain precision
  - Foreign key constraints ensure data integrity
  - Cascading deletes clean up related records
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  notification_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('amazon', 'flipkart', 'walmart', 'aliexpress', 'other')),
  product_id text NOT NULL,
  title text NOT NULL,
  image_url text,
  current_price numeric(10, 2),
  currency text DEFAULT 'USD',
  target_price numeric(10, 2),
  lowest_price numeric(10, 2),
  highest_price numeric(10, 2),
  is_available boolean DEFAULT true,
  last_checked_at timestamptz,
  check_frequency integer DEFAULT 24,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, url)
);

-- Create price_history table
CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price numeric(10, 2) NOT NULL,
  currency text DEFAULT 'USD',
  is_available boolean DEFAULT true,
  checked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('price_drop', 'back_in_stock', 'target_reached', 'scraping_error')),
  title text NOT NULL,
  message text NOT NULL,
  old_price numeric(10, 2),
  new_price numeric(10, 2),
  is_read boolean DEFAULT false,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create scraping_logs table
CREATE TABLE IF NOT EXISTS scraping_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'rate_limited', 'blocked')),
  error_message text,
  response_time integer,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for optimized queries
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_platform ON products(platform);
CREATE INDEX IF NOT EXISTS idx_products_last_checked ON products(last_checked_at);
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_checked_at ON price_history(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_product_id ON scraping_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_created_at ON scraping_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for products
CREATE POLICY "Users can view own products"
  ON products FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for price_history
CREATE POLICY "Users can view price history for own products"
  ON price_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = price_history.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert price history"
  ON price_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = price_history.product_id
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for scraping_logs
CREATE POLICY "Users can view logs for own products"
  ON scraping_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = scraping_logs.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert scraping logs"
  ON scraping_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile automatically
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();