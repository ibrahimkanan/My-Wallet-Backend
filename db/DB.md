# محفظتي (My Wallet) — Database Documentation

PostgreSQL, hosted on Neon. Raw schema: `my_wallet_schema.sql`.

## Table of Contents
1. [Overview](#overview)
2. [ENUM Types](#enum-types)
3. [users](#users)
4. [otp_codes](#otp_codes)
5. [refresh_tokens](#refresh_tokens)
6. [wallets](#wallets)
7. [categories](#categories)
8. [recurring_transactions](#recurring_transactions)
9. [transactions](#transactions)
10. [budgets](#budgets)
11. [Key Design Decisions](#key-design-decisions)
12. [Auth Flow Summary](#auth-flow-summary)

---

## Overview

Core entity relationships (all one-to-many unless noted):

```
users ─┬─< refresh_tokens
        ├─< wallets
        ├─< categories
        ├─< recurring_transactions
        ├─< transactions
        └─< budgets

wallets ─┬─< transactions
          └─< recurring_transactions

categories ─┬─< transactions
             ├─< recurring_transactions
             └─< budgets

recurring_transactions ─< transactions   (via recurring_transaction_id)

otp_codes  → standalone, keyed by email (not linked to users.id)
```

---

## ENUM Types

| Type | Values |
|---|---|
| `wallet_type` | `cash`, `bank`, `card` |
| `tx_type` | `income`, `expense` |
| `recurrence_frequency` | `daily`, `weekly`, `monthly`, `yearly` |

---

## users

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `name` | VARCHAR(100), **nullable** | Not known at signup — set later from profile |
| `email` | VARCHAR(255), UNIQUE, NOT NULL | Identity for OTP login |
| `password_hash` | TEXT, **nullable** | Optional — only set if user adds a password later |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**Why nullable `name`/`password_hash`:** auth is passwordless email-OTP. An account is created automatically the moment a new email verifies its first code — there's no separate signup form, so neither field is known yet.

---

## otp_codes

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `email` | VARCHAR(255), NOT NULL | Not a FK — user may not exist yet |
| `code_hash` | TEXT, NOT NULL | Hash the code (like a password), never store raw |
| `expires_at` | TIMESTAMPTZ, NOT NULL | e.g. `now() + 10 minutes` |
| `consumed` | BOOLEAN, default `false` | Set `true` after first successful use — single-use |
| `created_at` | TIMESTAMPTZ | |

**Index:** `idx_otp_email` on `email`.

**Why keyed by email, not `user_id`:** the same request-otp/verify-otp endpoints handle both login and signup. On verify, the app looks up a user by email — creates one on the fly if none exists.

**Reminders when implementing:**
- Rate-limit `request-otp` per email (e.g. don't allow a new code within 60s of the last one) — can be done with a plain query against this table, no external tool needed.
- Always hash the code before storing.

---

## refresh_tokens

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users.id, CASCADE) | |
| `token_hash` | TEXT, NOT NULL | Hash the token, never store raw |
| `device_info` | VARCHAR(255) | e.g. "iPhone 14 - Expo app" |
| `expires_at` | TIMESTAMPTZ, NOT NULL | |
| `revoked` | BOOLEAN, default `false` | For logout / manual revocation |
| `created_at` | TIMESTAMPTZ | |
| `last_used_at` | TIMESTAMPTZ, nullable | |

**Indexes:** `idx_refresh_user` on `user_id`, `idx_refresh_hash` on `token_hash`.

**Why a separate table (not a column on `users`):** a user can be logged in from multiple devices at once; each session gets its own row. Access tokens (short-lived JWT) are never stored anywhere — verified statelessly via signature + expiry.

---

## wallets

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users.id, CASCADE) | |
| `name` | VARCHAR(100), NOT NULL | e.g. "كاش", "بنك العربي" |
| `type` | `wallet_type`, NOT NULL | cash / bank / card |
| `balance` | NUMERIC(12,2), default 0 | **Cached** running balance |
| `created_at` | TIMESTAMPTZ | |

**Index:** `idx_wallets_user` on `user_id`.

**Why `balance` is cached:** recomputing it from all transactions on every read would be slow. Update it directly whenever a transaction is added/edited/deleted.

---

## categories

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users.id, CASCADE) | Per-user, not global |
| `name` | VARCHAR(100), NOT NULL | e.g. "أكل ومطاعم" |
| `type` | `tx_type`, NOT NULL | income or expense |
| `icon` | VARCHAR(50), nullable | For UI |
| `created_at` | TIMESTAMPTZ | |

**Constraint:** `UNIQUE(user_id, name)` — no duplicate category names per user.
**Index:** `idx_categories_user` on `user_id`.

---

## recurring_transactions

Templates for subscriptions, rent, etc. — a background job reads this table and generates rows in `transactions` when due.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users.id, CASCADE) | |
| `wallet_id` | UUID (FK → wallets.id, CASCADE) | |
| `category_id` | UUID (FK → categories.id, SET NULL) | Nullable |
| `type` | `tx_type`, NOT NULL | |
| `amount` | NUMERIC(12,2), CHECK > 0 | |
| `note` | TEXT | |
| `frequency` | `recurrence_frequency`, NOT NULL | |
| `start_date` | DATE, NOT NULL | |
| `end_date` | DATE, nullable | NULL = repeats indefinitely |
| `next_due_date` | DATE, NOT NULL | When the next tx should be generated |
| `is_active` | BOOLEAN, default `true` | |
| `created_at` | TIMESTAMPTZ | |

**Indexes:** `idx_recurring_due` on `next_due_date` (partial, `WHERE is_active = true` — this is what the generator job scans), `idx_recurring_user` on `user_id`.

---

## transactions

The core table — both manual entries and rows auto-generated from `recurring_transactions`.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users.id, CASCADE) | |
| `wallet_id` | UUID (FK → wallets.id, CASCADE) | |
| `category_id` | UUID (FK → categories.id, SET NULL) | Nullable — survives category deletion |
| `recurring_transaction_id` | UUID (FK → recurring_transactions.id, SET NULL) | Nullable — set only if auto-generated |
| `type` | `tx_type`, NOT NULL | |
| `amount` | NUMERIC(12,2), CHECK > 0 | |
| `note` | TEXT | |
| `transaction_date` | DATE, NOT NULL | |
| `created_at` | TIMESTAMPTZ | |

**Indexes:** `idx_tx_user_date` on `(user_id, transaction_date)` — powers the monthly/yearly Charts page — plus `idx_tx_wallet` and `idx_tx_category`.

---

## budgets

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users.id, CASCADE) | |
| `category_id` | UUID (FK → categories.id, CASCADE), **nullable** | `NULL` = the overall budget |
| `amount` | NUMERIC(12,2), CHECK > 0 | |
| `month` | SMALLINT, CHECK 1–12 | |
| `year` | SMALLINT | |
| `created_at` | TIMESTAMPTZ | |

**Budget model:**
- `category_id IS NULL` → the **overall** monthly budget (e.g. 700 JD) — every expense, regardless of category, subtracts from this.
- `category_id = <uuid>` → an **optional** extra limit for one specific category, on top of the overall budget.

**Constraints:**
- `UNIQUE(user_id, category_id, month, year)` — one budget row per category per month.
- `idx_budgets_one_overall_per_period` (partial unique index, `WHERE category_id IS NULL`) — Postgres allows multiple `NULL`s in a normal `UNIQUE` constraint, so this partial index is what actually enforces "only one overall budget per user per month."

**Index:** `idx_budgets_user_period` on `(user_id, year, month)`.

---

## Key Design Decisions

- **Neon over Supabase** — building custom Express/JWT auth rather than relying on an auto-generated API + RLS, to avoid a repeat of a past Supabase security issue.
- **Neon Auth declined** — same reasoning; also part of the point is building auth as a learning exercise.
- **Passwordless email-OTP auth** — simpler UX for v1, no password-reset flow to build. Password stays optional for later.
- **Cached wallet balance** instead of summing transactions on every read.
- **Soft-nullable FKs on `transactions`/`recurring_transactions`** (`category_id`, `recurring_transaction_id` use `ON DELETE SET NULL`) so deleting a category or recurring template never deletes historical transactions.

---

## Auth Flow Summary

1. `POST /auth/request-otp` — takes email, generates a code, stores its hash in `otp_codes`, sends it via Resend.
2. `POST /auth/verify-otp` — takes email + code, validates against `otp_codes`, looks up the user by email (creates one if not found), returns access token + refresh token + `isNewUser` flag.
   - `isNewUser: true` → mobile app shows a welcome screen asking for name → saved via `PATCH /users/me`.
   - `isNewUser: false` → mobile app shows "welcome back" → home screen.
3. `POST /auth/refresh` — exchanges a valid refresh token for a new access token.
4. `POST /auth/logout` — marks the refresh token `revoked = true`.
