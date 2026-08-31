# EcoLift Backend Implementation Plan

## 1. Database Schema

- [x] `supabase/schema.sql` — tables, enums, triggers, RLS policies
- [x] `supabase/seed.sql` — seed data for collectors, vehicle types

## 2. Environment Setup

- [x] `.env.example` — Supabase URL + anon key placeholders
- [x] Update `.gitignore` to allow `.env`

## 3. Types

- [x] `src/types/auth.ts` (expand) + `profile.ts`, `order.ts`, `wallet.ts`, `notification.ts`, `schedule.ts`, `collector.ts`, `index.ts`

## 4. Service Layer

- [x] `src/services/auth.ts` (refine)
- [x] `src/services/profile.ts`
- [x] `src/services/wallet.ts`
- [x] `src/services/orders.ts`
- [x] `src/services/notifications.ts`
- [x] `src/services/schedules.ts`
- [x] `src/services/collector.ts`

## 5. Auth Context

- [x] Complete `src/context/AuthContext.tsx` — wire signIn/signUp/signOut, expose them

## 6. App Integration

- [x] Wire `login.tsx` to real Supabase auth
- [x] Verify with TypeScript checker

## 7. Web Build Fixes

- [x] Fix web bundling failure from `react-native-maps` (native-only) via platform extensions
  - `components/ecolift-map.tsx` (re-export shim)
  - `components/ecolift-map.native.tsx` (Google Map, native only)
  - `components/ecolift-map.web.tsx` (vector preview, web safe)
- [x] Web-safe Supabase storage adapter in `src/lib/supabase.ts`
- [x] Switch `web.output` from `static` to `single` to avoid SSG `window is not defined` from Supabase auth
- [x] Verify `expo export --platform web` succeeds
- [x] Verify TypeScript passes (`tsc --noEmit`)

## 8. Google Sign-In / Sign-Up

- [x] Add `signInWithGoogle` to `src/services/auth.ts` (Supabase OAuth)
- [x] Expose `signInWithGoogle` in `src/context/AuthContext.tsx`
- [x] Add "Continue with Google" button + Google "G" icon to `app/login.tsx`
- [x] Verify TypeScript passes (`tsc --noEmit`)

## 9. Launch-Ready Backend Overhaul

- [x] **Secure Atomic Database RPCs (`supabase/schema.sql`)**:
  - `top_up_wallet`: Safe wallet credit with row-locking & transaction logs
  - `debit_wallet`: Safe balance checks & debit with transaction logs
  - `accept_order`: Atomic order matching, collector assignment & job creation
  - `complete_order`: Automatic completion, job state sync & collector wallet payouts
- [x] **Database Performance & Security**:
  - Added indexes on orders, collector jobs, wallet transactions, notifications
  - Fixed RLS policies for unassigned order discovery by active collectors
  - Locked down direct balance updates on `wallets` table
- [x] **Real-Time Supabase Subscriptions**:
  - `subscribeToCustomerOrders`: Live status updates for customers
  - `subscribeToPendingOrders`: Instant order notification for active collectors
  - `subscribeToCollectorJobs`: Real-time job feeds for collectors
  - `subscribeToNotifications`: Real-time push notification feeds
- [x] **Service Layer Refactoring**:
  - Updated `wallet.ts`, `orders.ts`, `collector.ts`, and `notifications.ts`
  - Zero TypeScript errors across entire codebase (`tsc --noEmit`)

## 10. Production Readiness Pass

- [x] **Security**:
  - Removed hardcoded Google Maps API key from `googleMaps.ts` and `app.json`;
    now sourced via `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` env var
  - Removed hardcoded Google Maps key from `app/(tabs)/index.tsx` geocoding
  - Replaced hardcoded password with per-phone deterministic derivation
- [x] **Backend Integration**:
  - Rewired `context/AppContext.tsx` to load real data from Supabase services
    (wallet, orders, notifications, schedules, collector jobs, earnings)
  - Persist top-ups, notifications, schedules to backend when authenticated
- [x] **Navigation & Config**:
  - Registered `chat` and `payment-methods` screens in root layout
  - Added `typecheck`, `export:web`, and `preview` scripts to `package.json`
  - Updated `.env.example` with all required env vars
- [x] **Verification**:
  - `npx tsc --noEmit` passes with zero errors
  - `npx expo lint` passes with zero errors
  - `npx expo export --platform web` succeeds
  - Confirmed `.env` is git-ignored (secret keys never committed)
