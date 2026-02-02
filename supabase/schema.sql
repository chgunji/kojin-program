-- 個人参加プログラム MVP データベーススキーマ
-- Supabase (PostgreSQL)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================
-- 1. profiles (プロフィール)
-- Supabase Auth の users テーブルに紐づく追加情報
-- ====================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  phone TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  age_group TEXT CHECK (age_group IN ('10s', '20s', '30s', '40s', '50s', '60s_plus')),
  area TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ====================================
-- 2. parks (施設・会場)
-- ====================================
CREATE TABLE parks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  area TEXT,
  prefecture TEXT,
  nearest_station TEXT,
  has_shower BOOLEAN DEFAULT FALSE,
  has_parking BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE parks ENABLE ROW LEVEL SECURITY;

-- Parks policies (公開読み取り可)
CREATE POLICY "Parks are viewable by everyone"
  ON parks FOR SELECT
  USING (true);

-- ====================================
-- 3. event_categories (カテゴリ)
-- ====================================
CREATE TABLE event_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;

-- Categories policies (公開読み取り可)
CREATE POLICY "Categories are viewable by everyone"
  ON event_categories FOR SELECT
  USING (true);

-- ====================================
-- 4. events (プログラム)
-- ====================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  park_id UUID NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES event_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  current_count INTEGER DEFAULT 0 CHECK (current_count >= 0),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  level TEXT CHECK (level IN ('beginner', 'enjoy', 'competitive', 'mix')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Events policies (公開読み取り可)
CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT
  USING (true);

-- Create index for common queries
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_park_id ON events(park_id);
CREATE INDEX idx_events_category_id ON events(category_id);
CREATE INDEX idx_events_status ON events(status);

-- ====================================
-- 5. bookings (申込)
-- ====================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  cancelled_at TIMESTAMPTZ,
  UNIQUE(user_id, event_id)
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Bookings policies
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_event_id ON bookings(event_id);

-- ====================================
-- 6. payments (決済)
-- ====================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  stripe_payment_id TEXT,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Payments policies (booking owner can view)
CREATE POLICY "Users can view payments for own bookings"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = payments.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

-- Create index
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_stripe_payment_id ON payments(stripe_payment_id);

-- ====================================
-- Triggers
-- ====================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ====================================
-- Sample Data (テスト用)
-- ====================================

-- カテゴリ
INSERT INTO event_categories (id, name, description, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111', '個人フットサル', '少人数で楽しむフットサル', 1),
  ('22222222-2222-2222-2222-222222222222', '個人ソサイチ', '7人制の大人数フットサル', 2),
  ('33333333-3333-3333-3333-333333333333', 'スクール', 'レベルアップを目指す練習会', 3);

-- 施設
INSERT INTO parks (id, name, address, area, prefecture, nearest_station, has_shower, has_parking, image_url) VALUES
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '新宿フットサルパーク', '東京都新宿区西新宿1-1-1', '関東', '東京都', '新宿駅 徒歩5分', true, false, '/images/parks/shinjuku.jpg'),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '渋谷フットサルコート', '東京都渋谷区道玄坂2-2-2', '関東', '東京都', '渋谷駅 徒歩8分', true, true, '/images/parks/shibuya.jpg'),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '横浜ソサイチ場', '神奈川県横浜市西区3-3-3', '関東', '神奈川県', '横浜駅 徒歩10分', false, true, '/images/parks/yokohama.jpg'),
  ('aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '大阪フットサルアリーナ', '大阪府大阪市中央区4-4-4', '関西', '大阪府', '梅田駅 徒歩7分', true, true, '/images/parks/osaka.jpg');

-- プログラム（イベント）
INSERT INTO events (park_id, category_id, title, description, date, start_time, end_time, price, capacity, current_count, status, level) VALUES
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '【新宿】エンジョイ個人フットサル', '初心者〜中級者向けの楽しく体を動かすフットサルです。', CURRENT_DATE + INTERVAL '1 day', '19:00', '21:00', 1500, 20, 8, 'open', 'enjoy'),
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '【新宿】ビギナー個人フットサル', 'フットサル初心者大歓迎！基礎から楽しめます。', CURRENT_DATE + INTERVAL '2 days', '14:00', '16:00', 1200, 16, 5, 'open', 'beginner'),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '【渋谷】ガチ個人フットサル', '経験者向けの本格的なゲームを楽しむフットサルです。', CURRENT_DATE + INTERVAL '3 days', '20:00', '22:00', 1800, 18, 15, 'open', 'competitive'),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '【横浜】個人ソサイチ', '7人制のソサイチで広いコートを駆け回ろう！', CURRENT_DATE + INTERVAL '4 days', '18:00', '20:00', 2000, 28, 20, 'open', 'mix'),
  ('aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '【大阪】週末エンジョイフットサル', '週末の昼間にリフレッシュ！', CURRENT_DATE + INTERVAL '5 days', '13:00', '15:00', 1400, 20, 12, 'open', 'enjoy'),
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', '【新宿】スキルアップスクール', 'プロコーチによる技術指導あり', CURRENT_DATE + INTERVAL '6 days', '10:00', '12:00', 2500, 12, 8, 'open', 'mix');
