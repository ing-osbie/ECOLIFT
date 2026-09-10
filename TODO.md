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

## 11. AI Waste & Material Classification System Overhaul

- [x] **Eliminated Hardcoded Fallbacks**:
  - Removed all hardcoded `"Clear PET Plastic Beverage Bottle"`, `"93% Match"`, and static heuristics
  - Fixed initial state in `app/(tabs)/classify.tsx` to start in a clean `idle` state
- [x] **Genuine Vision Model Integration**:
  - Updated model candidates to active Google Gemini endpoints: `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`
  - Upgraded API payload to standard protobuf JSON mapping (`inlineData` and `mimeType`) with request timeouts
- [x] **Expanded Taxonomy & Material Distinction**:
  - Full taxonomy covering 10 categories: `e_waste`, `metal`, `plastic`, `paper`, `glass`, `organic`, `textiles`, `hazardous`, `non_waste`, `unknown`
  - Explicit separation between `objectType` (e.g. `laptop`) and underlying `material` (e.g. `aluminum, PCBs, battery`)
- [x] **Confidence Thresholding & Top-K Alternatives**:
  - High ($\ge 80\%$), Medium ($60\%-79\%$), and Low ($<60\%$) confidence levels
  - Low confidence or unidentifiable items trigger an "Unable to Confidently Identify Item" warning with a retake prompt; never defaulted to plastic
  - Top-K alternative matches parsed and displayed in UI
- [x] **Category-Specific Guidance**:
  - Dynamic bin color, bin type, recyclability status, CO2 savings, and actionable disposal guidance (e.g. e-waste depot vs curbside bins vs battery kiosks)
- [x] **State Management & Race-Condition Guard**:
  - Immediate clearance of stale results on new capture
  - Request ID tracking to discard superseded requests
- [x] **Safe Offline Handling**:
  - Transparently returns "Offline Identification Unavailable" ($0\%$ confidence) when offline or unconfigured; no fabricated classifications
- [x] **Workspace Configuration**:
  - Configured `.vscode/settings.json` with PostgreSQL file associations for Supabase `.sql` files, resolving false-positive MSSQL diagnostics

## 12. Google Profile Picture Sync & Gallery Avatar Upload (Users & Drivers)

- [x] **Google OAuth Profile Picture Auto-Sync**:
  - Updated `handle_new_user()` trigger in [`supabase/schema.sql`](file:///Users/osbie/Downloads/ecolift_app/supabase/schema.sql) and created [`supabase/google_avatar_sync.sql`](file:///Users/osbie/Downloads/ecolift_app/supabase/google_avatar_sync.sql) migration to extract `avatar_url` or `picture` from `auth.users.raw_user_meta_data`.
  - Updated `ensure_my_profile` function to retrieve `avatar_url` from auth user metadata when profile is created or repaired.
  - Added automatic metadata sync in [`src/services/profile.ts`](file:///Users/osbie/Downloads/ecolift_app/src/services/profile.ts) (`getProfile`) so existing and newly authenticated users immediately back-populate their Google avatar into `public.profiles`.
  - Enhanced [`src/services/auth.ts`](file:///Users/osbie/Downloads/ecolift_app/src/services/auth.ts) (`signInWithGoogle`) and [`app/auth/callback.tsx`](file:///Users/osbie/Downloads/ecolift_app/app/auth/callback.tsx) to sync Google metadata on session exchange.
  - Enhanced [`app/login.tsx`](file:///Users/osbie/Downloads/ecolift_app/app/login.tsx) (`handleGoogleSignIn`) to dynamically load real profile name and route based on user role (e.g. `/(tabs-collector)` for drivers).
- [x] **Gallery Profile Picture Upload for Drivers / Collectors**:
  - Replaced static placeholder icon on the collector profile in [`app/(tabs-collector)/profile.tsx`](file:///Users/osbie/Downloads/ecolift_app/app/(tabs-collector)/profile.tsx) with a real avatar image (`user?.avatar_url || COLLECTOR_AVATAR_URI`).
  - Added Camera badge overlay and touchable upload action allowing drivers to pick pictures directly from their mobile gallery via `expo-image-picker`.
  - Implemented upload via `uploadAvatar()`, refreshed profile with `refreshProfile()`, and provided real-time loading spinner and custom alert feedback.
  - Displays dynamic driver name (`user?.full_name || userName || "Kwame Mensah"`).
- [x] **Gallery Profile Picture Upload for Customers / Citizens**:
  - Added Camera badge overlay to customer profile avatar on [`app/(tabs)/profile.tsx`](file:///Users/osbie/Downloads/ecolift_app/app/(tabs)/profile.tsx) for 1-tap direct gallery uploads with instant feedback.
  - Fixed [`app/edit-profile.tsx`](file:///Users/osbie/Downloads/ecolift_app/app/edit-profile.tsx) where `displayAvatar` ignored `user?.avatar_url`.
  - Preserved picked MIME type and updated `uploadAvatar()` call in edit profile.
- [x] **Universal Header & Screen Avatar Fallback Fixes**:
  - [`app/(tabs)/classify.tsx`](file:///Users/osbie/Downloads/ecolift_app/app/(tabs)/classify.tsx): Replaced hardcoded sample image with `user?.avatar_url || DEFAULT_CUSTOMER_AVATAR`.
  - [`app/(tabs-collector)/index.tsx`](file:///Users/osbie/Downloads/ecolift_app/app/(tabs-collector)/index.tsx): Replaced static collector avatar with `user?.avatar_url || COLLECTOR_AVATAR_URI`.
- [x] **Resilient Avatar Upload Service**:
  - [`src/services/profile.ts`](file:///Users/osbie/Downloads/ecolift_app/src/services/profile.ts) (`uploadAvatar`): Added native Blob and base64 ArrayBuffer fallback (`expo-file-system/legacy`), unique timestamped storage paths `${userId}/avatar_${Date.now()}.${ext}`, and cache-busting URLs (`?t=...`) for instant rendering.
- [x] **Verification**:
  - Verified with `npx tsc --noEmit` (0 errors).
