-- =============================================================
-- STARLORD GROUP — Database Schema
-- Project: zphpfahgyerabtpvtwol.supabase.co
-- Extracted: 2026-06-29T22:24:07.076Z
-- Method: Supabase REST API introspection
--
-- NOTE: This is structural introspection, not a full DDL dump.
-- Foreign keys, indexes, triggers, RLS policies, and constraints
-- are NOT included. For those, use the Supabase Dashboard.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- Table: public.products  (38 rows)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE products (
  "id" text NOT NULL, -- e.g. "d5de6742-849a-4e30-bd80-2f0217e5089b"
  "name" text, -- e.g. "Defender iPhone case"
  "description" text, -- e.g. "shockproof armor phone case with a slide camera cover and 360° rotatab
  "category" text, -- e.g. "new-arrivals"
  "price" integer, -- e.g. 10500
  "old_price" text,
  "stock" integer, -- e.g. 996
  "image_url" text, -- e.g. ""
  "badge" text, -- e.g. ""
  "is_active" boolean, -- e.g. true
  "created_at" timestamp with time zone, -- e.g. "2026-03-13T16:28:52.713403+00:00"
  "has_variations" boolean, -- e.g. true
  "name_rw" text,
  "description_rw" text,
  "search_text" text,
  "embedding" text
);

-- Sample row:
-- {"id":"d5de6742-849a-4e30-bd80-2f0217e5089b","name":"Defender iPhone case","description":"shockproof armor phone case with a slide camera cover and 360° rotatable ring kickstand.  Available for all iP

-- ─────────────────────────────────────────────────────────────
-- Table: public.product_images  (199 rows)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE product_images (
  "id" text NOT NULL, -- e.g. "11d01b0b-20f9-46fc-ab22-bde8c5093584"
  "product_id" text, -- e.g. "02867ff2-91a5-40e7-818c-6837d1555e04"
  "url" text, -- e.g. "https://images.starlordgroup.rw/products/02867ff2-91a5-40e7-818c-6837d
  "sort_order" integer, -- e.g. 0
  "created_at" timestamp with time zone -- e.g. "2026-05-26T17:46:45.480032+00:00"
);

-- Sample row:
-- {"id":"11d01b0b-20f9-46fc-ab22-bde8c5093584","product_id":"02867ff2-91a5-40e7-818c-6837d1555e04","url":"https://images.starlordgroup.rw/products/02867ff2-91a5-40e7-818c-6837d1555e04/6fd7a574-346d-4b42

-- ─────────────────────────────────────────────────────────────
-- Table: public.product_variations  (24 rows)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE product_variations (
  "id" text NOT NULL, -- e.g. "cfb04eb8-1722-4dff-a363-503bcee48f5f"
  "product_id" text, -- e.g. "965e083c-31d1-473b-8055-fd66bf90a7a2"
  "name" text, -- e.g. "MODELS"
  "options" jsonb, -- e.g. ["11","11 PRO","11 PRO MAX","12","12 PRO","12 PRO MAX","13","13 PRO","1
  "is_required" boolean, -- e.g. true
  "sort_order" integer, -- e.g. 0
  "created_at" timestamp with time zone, -- e.g. "2026-04-12T11:40:01.324109+00:00"
  "option_images" jsonb -- e.g. {}
);

-- Sample row:
-- {"id":"cfb04eb8-1722-4dff-a363-503bcee48f5f","product_id":"965e083c-31d1-473b-8055-fd66bf90a7a2","name":"MODELS","options":["11","11 PRO","11 PRO MAX","12","12 PRO","12 PRO MAX","13","13 PRO","13 PRO 

-- ─────────────────────────────────────────────────────────────
-- Table: public.categories  (4 rows)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE categories (
  "id" text NOT NULL, -- e.g. "d71bfe01-5447-4e0a-8288-a5ee45d94185"
  "name" text, -- e.g. "Accessories"
  "slug" text, -- e.g. "accessories"
  "description" text, -- e.g. ""
  "image_url" text, -- e.g. ""
  "is_active" boolean, -- e.g. true
  "sort_order" integer, -- e.g. 2
  "created_at" timestamp with time zone, -- e.g. "2026-03-14T00:11:15.253477+00:00"
  "show_in_nav" boolean -- e.g. true
);

-- Sample row:
-- {"id":"d71bfe01-5447-4e0a-8288-a5ee45d94185","name":"Accessories","slug":"accessories","description":"","image_url":"","is_active":true,"sort_order":2,"created_at":"2026-03-14T00:11:15.253477+00:00","

-- ─────────────────────────────────────────────────────────────
-- Table: public.orders  (39 rows)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE orders (
  "id" text NOT NULL, -- e.g. "131ea7d0-5753-49b8-bfef-cd5b50f4c51f"
  "reference" text, -- e.g. "SL-C6LXAN"
  "user_id" text,
  "customer_name" text, -- e.g. "tuyizere chrispin"
  "customer_phone" text, -- e.g. "0789000001"
  "delivery_address" text, -- e.g. "kimironko"
  "subtotal" integer, -- e.g. 25000
  "delivery_fee" integer, -- e.g. 0
  "total" integer, -- e.g. 25000
  "status" text, -- e.g. "cancelled"
  "payment_method" text CHECK (payment_method IN ('mtn', 'airtel', 'card')), -- e.g. "mtn"
  "payment_status" text, -- e.g. "pending"
  "idempotency_key" text, -- e.g. "01912681-39b4-4105-8071-91b67721fafa"
  "created_at" timestamp with time zone, -- e.g. "2026-05-12T11:36:26.511676+00:00"
  "delivery_slot" text, -- e.g. "Morning 9:00 AM - 12:00 PM"
  "updated_at" timestamp with time zone, -- e.g. "2026-05-12T11:39:49.578468+00:00"
  "return_slot" text,
  "review_token" text, -- e.g. "12e65363-a807-4e03-aa80-73d8d99793d3"
  "irembopay_transaction_id" text,
  "payment_expires_at" timestamp with time zone -- e.g. "2026-05-12T11:51:26.454+00:00"
);

-- Sample row:
-- {"id":"131ea7d0-5753-49b8-bfef-cd5b50f4c51f","reference":"SL-C6LXAN","user_id":null,"customer_name":"tuyizere chrispin","customer_phone":"0789000001","delivery_address":"kimironko","subtotal":25000,"d

-- ─────────────────────────────────────────────────────────────
-- Table: public.order_items  (37 rows)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE order_items (
  "id" text NOT NULL, -- e.g. "95a483d1-43aa-46a1-9dfe-563fd52d61c7"
  "order_id" text, -- e.g. "fde6f1e0-6e74-4535-ae4d-775e3d23ab3e"
  "product_id" text, -- e.g. "96859473-5443-4c68-82bd-faaa4c7f9295"
  "quantity" integer, -- e.g. 1
  "price_at_time" integer, -- e.g. 8000
  "variations" jsonb -- e.g. [{"name":"MODELS","option":"11 PRO MAX"}]
);

-- Sample row:
-- {"id":"95a483d1-43aa-46a1-9dfe-563fd52d61c7","order_id":"fde6f1e0-6e74-4535-ae4d-775e3d23ab3e","product_id":"96859473-5443-4c68-82bd-faaa4c7f9295","quantity":1,"price_at_time":8000,"variations":[{"nam

-- ─────────────────────────────────────────────────────────────
-- Table: public.users  (16 rows)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE users (
  "id" text NOT NULL, -- e.g. "d269d354-6b93-46a8-9d54-66674b133fb8"
  "phone" text, -- e.g. "0790902420"
  "full_name" text, -- e.g. "NIYIBIZI Prince"
  "email" text, -- e.g. "princeniyibizi4@gmail.com"
  "role" text, -- e.g. "customer"
  "password_set" boolean, -- e.g. true
  "created_at" timestamp with time zone -- e.g. "2026-04-13T07:29:36.296826+00:00"
);

-- Sample row:
-- {"id":"d269d354-6b93-46a8-9d54-66674b133fb8","phone":"0790902420","full_name":"NIYIBIZI Prince","email":"princeniyibizi4@gmail.com","role":"customer","password_set":true,"created_at":"2026-04-13T07:29

-- ─────────────────────────────────────────────────────────────
-- Table: public.reviews  (3 rows)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE reviews (
  "id" text NOT NULL, -- e.g. "acfb9b1f-2765-4e22-aac7-b7c2d8ad43cc"
  "product_id" text, -- e.g. "fb5afc5a-225d-452a-8f5c-46e0f40b7849"
  "user_id" text,
  "order_id" text, -- e.g. "9a6e5183-237f-4613-90b4-d5ca1a200f1d"
  "rating" integer, -- e.g. 5
  "comment" text, -- e.g. "The service was top notch"
  "is_visible" boolean, -- e.g. true
  "created_at" timestamp with time zone, -- e.g. "2026-05-02T17:56:46.39304+00:00"
  "reviewer_name" text -- e.g. "Bellamy"
);

-- Sample row:
-- {"id":"acfb9b1f-2765-4e22-aac7-b7c2d8ad43cc","product_id":"fb5afc5a-225d-452a-8f5c-46e0f40b7849","user_id":null,"order_id":"9a6e5183-237f-4613-90b4-d5ca1a200f1d","rating":5,"comment":"The service was 

-- ─────────────────────────────────────────────────────────────
-- Table: public.banners  (4 rows)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE banners (
  "id" text NOT NULL, -- e.g. "295fa7e2-d522-42b8-89ce-c51ac959adda"
  "title" text, -- e.g. "AirPods "
  "subtitle" text, -- e.g. "High quality sound at an affordable price"
  "button_text" text, -- e.g. "Buy Airpods"
  "button_link" text, -- e.g. "/products/5831178f-9da5-4621-b14d-7ed5a867e7b9"
  "image_url" text, -- e.g. "https://images.starlordgroup.rw/products/banners/banner-448fb4cc-ff2e-
  "sort_order" integer, -- e.g. 6
  "is_active" boolean, -- e.g. true
  "created_at" timestamp with time zone -- e.g. "2026-04-12T12:41:16.791169+00:00"
);

-- Sample row:
-- {"id":"295fa7e2-d522-42b8-89ce-c51ac959adda","title":"AirPods ","subtitle":"High quality sound at an affordable price","button_text":"Buy Airpods","button_link":"/products/5831178f-9da5-4621-b14d-7ed5

-- ─────────────────────────────────────────────────────────────
-- Table: public.promotions  (3 rows)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE promotions (
  "id" text NOT NULL, -- e.g. "f170c1a5-c493-4846-a370-75487cbd933d"
  "name" text, -- e.g. "Test Promo"
  "discount_type" text, -- e.g. "percent"
  "discount_value" integer, -- e.g. 20
  "starts_at" timestamp with time zone, -- e.g. "2026-05-18T01:01:00+00:00"
  "ends_at" timestamp with time zone, -- e.g. "2026-05-18T01:10:00+00:00"
  "is_active" boolean, -- e.g. true
  "created_at" timestamp with time zone -- e.g. "2026-05-18T01:02:57.898724+00:00"
);

-- Sample row:
-- {"id":"f170c1a5-c493-4846-a370-75487cbd933d","name":"Test Promo","discount_type":"percent","discount_value":20,"starts_at":"2026-05-18T01:01:00+00:00","ends_at":"2026-05-18T01:10:00+00:00","is_active"

-- ─────────────────────────────────────────────────────────────
-- Table: public.promotion_products  (15 rows)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE promotion_products (
  "promotion_id" text, -- e.g. "c27c2cc0-7415-41ee-b6cb-fb24f0fb097d"
  "product_id" text -- e.g. "fdd0cc07-922d-4433-b341-ffc5267e9f85"
);

-- Sample row:
-- {"promotion_id":"c27c2cc0-7415-41ee-b6cb-fb24f0fb097d","product_id":"fdd0cc07-922d-4433-b341-ffc5267e9f85"}

-- ─────────────────────────────────────────────────────────────
-- Table: public.settings  (2 rows)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE settings (
  "key" text, -- e.g. "delivery_fee"
  "value" text -- e.g. "0"
);

-- Sample row:
-- {"key":"delivery_fee","value":"0"}

-- ─────────────────────────────────────────────────────────────
-- Table: public.admin_logs  (345 rows)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE admin_logs (
  "id" text NOT NULL, -- e.g. "753c0be0-42c0-445f-8f50-8fbd04cb74cc"
  "action" text, -- e.g. "PRODUCT_UPDATED"
  "entity_type" text, -- e.g. "product"
  "entity_id" text, -- e.g. "c908daf9-ff75-49c1-bfa2-ae965a6973ef"
  "entity_ref" text, -- e.g. "Cases"
  "details" jsonb, -- e.g. {}
  "created_at" timestamp with time zone -- e.g. "2026-04-13T07:31:33.03418+00:00"
);

-- Sample row:
-- {"id":"753c0be0-42c0-445f-8f50-8fbd04cb74cc","action":"PRODUCT_UPDATED","entity_type":"product","entity_id":"c908daf9-ff75-49c1-bfa2-ae965a6973ef","entity_ref":"Cases","details":{},"created_at":"2026-

-- ─────────────────────────────────────────────────────────────
-- Table: public.processed_webhooks  (0 rows)
-- ─────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS processed_webhooks;

CREATE TABLE processed_webhooks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id text NOT NULL UNIQUE,
  order_id text NOT NULL,
  payload jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- =============================================================
-- SUMMARY
-- =============================================================
-- Tables found:    14
-- Tables missing:  0
--
-- Found tables:
--   products: 16 columns, 38 rows
--   product_images: 5 columns, 199 rows
--   product_variations: 8 columns, 24 rows
--   categories: 9 columns, 4 rows
--   orders: 20 columns, 39 rows
--   order_items: 6 columns, 37 rows
--   users: 7 columns, 16 rows
--   reviews: 9 columns, 3 rows
--   banners: 9 columns, 4 rows
--   promotions: 8 columns, 3 rows
--   promotion_products: 2 columns, 15 rows
--   settings: 2 columns, 2 rows
--   admin_logs: 7 columns, 345 rows
--   processed_webhooks: 4 columns, 0 rows

-- =============================================================
-- KNOWN CHECK CONSTRAINTS (from runtime errors)
-- =============================================================
-- orders.payment_method: CHECK (payment_method IN ('mtn', 'airtel', 'card'))
--   ⚠️ The IremboPay webhook normalizes payment methods:
--      MOMO_PUSH / MTN_MOMO → 'mtn'
--      AIRTEL_MONEY          → 'airtel'
--      ONLINE_CARD / CARD     → 'card'
-- =============================================================

-- =============================================================
-- RPC FUNCTIONS (inferred from code)
-- =============================================================
-- deduct_stock(p_product_id UUID, p_quantity INT)
-- restore_stock(p_product_id UUID, p_quantity INT)
-- =============================================================