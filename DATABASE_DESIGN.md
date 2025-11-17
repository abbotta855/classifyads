# Database Design - Hybrid Approach

## Overview
This hybrid design combines the best features from both designs: flexibility, SEO-friendliness, maintainability, and completeness.

---

## 1. Users Table

```sql
users
├── id (bigint, primary key, auto_increment)
├── name (string, 255)
├── email (string, 255, unique)
├── password (string, 255)
├── role (enum: 'admin', 'seller', 'buyer', default: 'buyer')
├── location (string, 255, nullable) -- For GEO targeting
├── email_verified_at (timestamp, nullable)
├── remember_token (string, 100, nullable)
├── created_at (timestamp)
└── updated_at (timestamp)
```

**Key Features:**
- `role` for role-based access control (admin, seller, buyer)
- `location` for GEO targeting and search functionality
- Standard Laravel authentication fields

---

## 2. Categories Table (Self-Referential)

```sql
categories
├── id (bigint, primary key, auto_increment)
├── name (string, 255)
├── slug (string, 255, unique) -- SEO-friendly URLs
├── parent_id (bigint, nullable, foreign key -> categories.id)
├── description (text, nullable)
├── icon (string, 255, nullable)
├── total_ads (integer, default: 0) -- Cached count for performance
├── sort_order (integer, default: 0) -- Custom ordering
├── is_active (boolean, default: true) -- Enable/disable categories
├── created_at (timestamp)
└── updated_at (timestamp)
```

**Key Features:**
- Self-referential `parent_id` for unlimited hierarchy depth
- `slug` for SEO-friendly URLs
- `total_ads` cached for performance (updated via triggers/events)
- `is_active` for soft enable/disable
- `sort_order` for custom category ordering

**Relationships:**
- Self-referential: `parent_id` → `categories.id`
- One-to-many: `categories` → `ads` (via `category_id`)

---

## 3. Ads Table

```sql
ads
├── id (bigint, primary key, auto_increment)
├── user_id (bigint, foreign key -> users.id)
├── category_id (bigint, foreign key -> categories.id)
├── title (string, 255)
├── description (text)
├── price (decimal, 10, 2, nullable) -- Nullable for auction-only ads
├── status (enum: 'draft', 'active', 'sold', 'expired', 'removed', default: 'draft')
├── featured (boolean, default: false) -- For featured listings
├── location (string, 255, nullable) -- Ad-specific location
├── youtube_url (string, 500, nullable) -- Video URL
├── created_at (timestamp)
└── updated_at (timestamp)
```

**Key Features:**
- `status` enum for ad lifecycle management
- `featured` flag for premium listings
- `location` for GEO targeting (can override user location)
- `youtube_url` for video support
- `price` nullable (auction-only ads don't need price)

**Relationships:**
- Many-to-one: `ads` → `users` (seller)
- Many-to-one: `ads` → `categories`
- One-to-many: `ads` → `photos`
- One-to-one: `ads` → `ebooks` (optional)
- One-to-one: `ads` → `auctions` (optional)

---

## 4. Photos Table

```sql
photos
├── id (bigint, primary key, auto_increment)
├── ad_id (bigint, foreign key -> ads.id, onDelete: cascade)
├── photo_url (string, 500) -- Storage path/URL
├── photo_order (integer, default: 0) -- Display order (1-8)
├── is_primary (boolean, default: false) -- Main photo
├── created_at (timestamp)
└── updated_at (timestamp)
```

**Key Features:**
- `photo_order` for sorting (supports up to 8 photos per ad)
- `is_primary` flag for main/thumbnail photo
- Cascade delete when ad is removed

**Constraints:**
- Maximum 8 photos per ad (enforced in application logic)
- Only one `is_primary = true` per ad

---

## 5. Ebooks Table

```sql
ebooks
├── id (bigint, primary key, auto_increment)
├── ad_id (bigint, foreign key -> ads.id, onDelete: cascade, unique)
├── file_url (string, 500) -- Storage path/URL
├── file_size (bigint, nullable) -- File size in bytes
├── file_type (string, 50, nullable) -- MIME type (e.g., 'application/pdf')
├── price (decimal, 10, 2) -- E-book price (can differ from ad price)
├── unlocked (boolean, default: false) -- Auto-unlock after payment
├── download_count (integer, default: 0) -- Track downloads
├── created_at (timestamp)
└── updated_at (timestamp)
```

**Key Features:**
- One-to-one relationship with ads (unique `ad_id`)
- `unlocked` flag for automatic unlock after payment
- `download_count` for analytics
- File metadata for validation

---

## 6. Auctions Table

```sql
auctions
├── id (bigint, primary key, auto_increment)
├── ad_id (bigint, foreign key -> ads.id, onDelete: cascade, unique)
├── start_time (timestamp)
├── end_time (timestamp)
├── starting_bid (decimal, 10, 2) -- Initial bid amount
├── current_bid (decimal, 10, 2, nullable) -- Current highest bid
├── current_bidder_id (bigint, nullable, foreign key -> users.id) -- Current highest bidder
├── buy_now_price (decimal, 10, 2, nullable) -- Optional buy-now option
├── bid_increment (decimal, 10, 2, default: 1.00) -- Minimum bid increment
├── status (enum: 'pending', 'active', 'ended', 'cancelled', default: 'pending')
├── created_at (timestamp)
└── updated_at (timestamp)
```

**Key Features:**
- One-to-one relationship with ads
- `current_bidder_id` tracks who has the highest bid
- `bid_increment` for minimum bid increases
- `status` for auction lifecycle

**Relationships:**
- Many-to-one: `auctions` → `users` (current_bidder_id)
- One-to-many: `auctions` → `bids`

---

## 7. Bids Table

```sql
bids
├── id (bigint, primary key, auto_increment)
├── auction_id (bigint, foreign key -> auctions.id, onDelete: cascade)
├── user_id (bigint, foreign key -> users.id)
├── bid_amount (decimal, 10, 2)
├── is_winning (boolean, default: false) -- Current winning bid
├── created_at (timestamp)
└── updated_at (timestamp)
```

**Key Features:**
- Tracks all bids for history and analytics
- `is_winning` flag for current highest bid
- Cascade delete when auction is removed

**Indexes:**
- `(auction_id, bid_amount DESC)` for efficient querying
- `(user_id)` for user bid history

---

## 8. Ratings/Reviews Table

```sql
ratings
├── id (bigint, primary key, auto_increment)
├── user_id (bigint, foreign key -> users.id) -- Reviewer (buyer)
├── ad_id (bigint, foreign key -> ads.id, onDelete: cascade)
├── seller_id (bigint, foreign key -> users.id) -- Being reviewed (seller)
├── rating (integer, 1-5) -- Star rating
├── comment (text, nullable)
├── purchase_verified (boolean, default: false) -- Verified purchase
├── purchase_code (string, 100, nullable, unique) -- Unique code for verification
├── created_at (timestamp)
└── updated_at (timestamp)
```

**Key Features:**
- `purchase_verified` ensures only buyers can review
- `purchase_code` for verification (generated on purchase)
- `seller_id` for direct seller rating
- Rating range: 1-5 stars

**Constraints:**
- One review per user per ad (enforced in application logic)
- `purchase_verified = true` required for review submission

---

## 9. Wallet/Transactions Table

```sql
transactions
├── id (bigint, primary key, auto_increment)
├── user_id (bigint, foreign key -> users.id)
├── type (enum: 'deposit', 'withdraw', 'payment', 'refund', 'featured_listing', 'auction_deposit', 'ebook_purchase')
├── amount (decimal, 10, 2)
├── status (enum: 'pending', 'completed', 'failed', 'cancelled', default: 'pending')
├── payment_method (string, 50, nullable) -- 'paypal', 'wallet', etc.
├── payment_id (string, 255, nullable) -- PayPal transaction ID
├── description (text, nullable) -- Transaction description
├── related_ad_id (bigint, nullable, foreign key -> ads.id) -- Related ad if applicable
├── created_at (timestamp)
└── updated_at (timestamp)
```

**Key Features:**
- Comprehensive transaction types for all payment scenarios
- `payment_id` for PayPal webhook verification
- `related_ad_id` for linking transactions to ads
- `status` for transaction lifecycle

**Indexes:**
- `(user_id, created_at DESC)` for user transaction history
- `(status, created_at)` for pending transaction processing

---

## 10. Additional Tables (Laravel Defaults)

### Personal Access Tokens (Sanctum)
```sql
personal_access_tokens
├── id (bigint, primary key)
├── tokenable_type (string)
├── tokenable_id (bigint)
├── name (string)
├── token (string, 64, unique)
├── abilities (text, nullable)
├── last_used_at (timestamp, nullable)
├── expires_at (timestamp, nullable)
├── created_at (timestamp)
└── updated_at (timestamp)
```

---

## Relationships Summary

```
users
  ├── 1:N → ads (seller)
  ├── 1:N → bids (bidder)
  ├── 1:N → ratings (reviewer)
  ├── 1:N → ratings (seller being reviewed)
  └── 1:N → transactions

categories
  ├── N:1 → categories (parent category)
  └── 1:N → ads

ads
  ├── N:1 → users (seller)
  ├── N:1 → categories
  ├── 1:N → photos (up to 8)
  ├── 1:1 → ebooks (optional)
  ├── 1:1 → auctions (optional)
  └── 1:N → ratings

photos
  └── N:1 → ads

ebooks
  └── 1:1 → ads

auctions
  ├── 1:1 → ads
  ├── N:1 → users (current_bidder)
  └── 1:N → bids

bids
  ├── N:1 → auctions
  └── N:1 → users

ratings
  ├── N:1 → users (reviewer)
  ├── N:1 → users (seller)
  └── N:1 → ads

transactions
  ├── N:1 → users
  └── N:1 → ads (optional)
```

---

## Key Design Decisions

### 1. Self-Referential Categories
- **Why:** Unlimited hierarchy depth (category → subcategory → sub-subcategory)
- **Trade-off:** More complex queries, but more flexible

### 2. Cached `total_ads` in Categories
- **Why:** Performance for displaying ad counts
- **Implementation:** Update via Laravel Model Events or Database Triggers

### 3. Separate Photos Table
- **Why:** Supports up to 8 photos with ordering and primary photo flag
- **Alternative:** JSON column (less flexible for queries)

### 4. One-to-One for Ebooks and Auctions
- **Why:** Not all ads are ebooks or auctions
- **Implementation:** Unique constraint on `ad_id`

### 5. Purchase Code for Reviews
- **Why:** Ensures only verified buyers can review
- **Implementation:** Generate unique code on purchase completion

### 6. Comprehensive Transaction Types
- **Why:** Supports all payment scenarios (deposits, withdrawals, payments, refunds, featured listings, etc.)

---

## Indexes for Performance

```sql
-- Categories
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_is_active ON categories(is_active);

-- Ads
CREATE INDEX idx_ads_user_id ON ads(user_id);
CREATE INDEX idx_ads_category_id ON ads(category_id);
CREATE INDEX idx_ads_status ON ads(status);
CREATE INDEX idx_ads_featured ON ads(featured);
CREATE INDEX idx_ads_location ON ads(location); -- For GEO search

-- Photos
CREATE INDEX idx_photos_ad_id ON photos(ad_id);
CREATE INDEX idx_photos_is_primary ON photos(is_primary);

-- Auctions
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_end_time ON auctions(end_time); -- For active auctions

-- Bids
CREATE INDEX idx_bids_auction_id ON bids(auction_id, bid_amount DESC);
CREATE INDEX idx_bids_user_id ON bids(user_id);

-- Ratings
CREATE INDEX idx_ratings_ad_id ON ratings(ad_id);
CREATE INDEX idx_ratings_seller_id ON ratings(seller_id);
CREATE INDEX idx_ratings_purchase_verified ON ratings(purchase_verified);

-- Transactions
CREATE INDEX idx_transactions_user_id ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_status ON transactions(status, created_at);
CREATE INDEX idx_transactions_payment_id ON transactions(payment_id); -- For PayPal webhooks
```

---

## Migration Strategy

1. **Phase 1:** Update Users table (add `role`, `location`)
2. **Phase 2:** Refactor Categories (change to self-referential)
3. **Phase 3:** Create Ads, Photos tables
4. **Phase 4:** Create Ebooks, Auctions, Bids tables
5. **Phase 5:** Create Ratings, Transactions tables
6. **Phase 6:** Add indexes and constraints
7. **Phase 7:** Migrate existing data (if any)

---

## Notes

- All foreign keys use `onDelete('cascade')` where appropriate
- Timestamps (`created_at`, `updated_at`) on all tables for audit trail
- Use Laravel Eloquent relationships for easy querying
- Consider using database triggers or Laravel events to keep `total_ads` synchronized
- For 30M users, consider partitioning large tables (transactions, bids) by date

