# NutriAI - Replit Agent Guide

## Overview

NutriAI is a mobile-first calorie tracking and nutrition assistant app built with Expo (React Native) on the frontend and Express.js on the backend. The app allows users to log food, track macronutrients (protein, carbs, fat), monitor water intake, view weekly analytics, and manage health goals. It features Google Sign-In authentication via Firebase, cloud data sync through Firebase Realtime Database, and local-first data persistence with AsyncStorage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture
- **Routing**: Expo Router with file-based routing (`app/` directory). Uses tab navigation (`app/(tabs)/`) with four main screens: Dashboard (index), Food Log, Analytics, and Profile. Modal screens exist for scan-result, privacy-policy, and terms.
- **State Management**: React Context for nutrition data (`NutritionProvider`) and authentication (`AuthProvider`), plus TanStack React Query for server-state management
- **Styling**: React Native StyleSheet with a custom theme system (`constants/colors.ts`) supporting light and dark mode via `useColorScheme()`
- **Fonts**: DM Sans font family loaded via `@expo-google-fonts/dm-sans`
- **Animations**: React Native Reanimated for animated UI elements like calorie rings and macro progress bars
- **UI Components**: Custom reusable components including `GlassCard`, `CalorieRing`, `MacroBar`, `ErrorBoundary`, and `KeyboardAwareScrollViewCompat`
- **Local Storage**: `@react-native-async-storage/async-storage` for offline data persistence and caching Firebase config

### Backend (Express.js)

- **Runtime**: Node.js with TypeScript, compiled via `tsx` in development and `esbuild` for production
- **API**: Minimal Express server running on port 5000. Currently serves one endpoint: `GET /api/firebase-config` which returns Firebase configuration from environment variables
- **CORS**: Custom CORS middleware that allows Replit domains and localhost origins
- **Static Serving**: In production, serves the Expo web build from a `dist/` directory with a landing page template
- **Build**: Uses `esbuild` to bundle server code to `server_dist/` for production

### Data Storage

- **Primary (User Data)**: Firebase Realtime Database — stores user goals, daily food logs, water intake, weight tracking, organized under `userData/{uid}/`
- **Local Cache**: AsyncStorage for offline-first experience; data syncs to Firebase when user is authenticated
- **Database Schema (PostgreSQL/Drizzle)**: A `users` table is defined in `shared/schema.ts` using Drizzle ORM with PostgreSQL dialect, but the app primarily uses Firebase for data. The Drizzle schema exists as scaffolding with a basic users table (id, username, password). The in-memory storage (`MemStorage`) in `server/storage.ts` is used instead of actually connecting to Postgres currently.
- **Drizzle Config**: Points to `DATABASE_URL` env var, outputs migrations to `./migrations/`, schema at `./shared/schema.ts`

### Authentication

- **Provider**: Google Sign-In via Firebase Authentication
- **Flow**: Uses `expo-auth-session` for OAuth on mobile, `GoogleAuthProvider` + `signInWithCredential` for Firebase auth
- **Persistence**: Auth state persisted via `getReactNativePersistence` with AsyncStorage on native platforms
- **Firebase Config**: Fetched from the Express server at `/api/firebase-config` to keep API keys server-side. Cached in AsyncStorage after first fetch.

### Key Design Decisions

1. **Firebase over PostgreSQL for user data**: The app uses Firebase Realtime Database for all user-facing data (food logs, goals, etc.) rather than PostgreSQL. This provides real-time sync, offline support, and simpler client-side data access. The Drizzle/PostgreSQL setup exists as scaffolding but is not actively used for the core app functionality.

2. **Local-first with cloud sync**: Nutrition data is stored locally in AsyncStorage first, then synced to Firebase when authenticated. This ensures the app works without sign-in and provides instant data access.

3. **Server-side Firebase config**: Firebase configuration is served from the Express backend rather than hardcoded in the client, keeping sensitive keys in environment variables.

4. **File-based routing**: Expo Router provides type-safe, file-system-based routing which simplifies navigation structure.

## External Dependencies

### Required Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (required by Drizzle config)
- `FIREBASE_API_KEY` — Firebase Web API key
- `FIREBASE_AUTH_DOMAIN` — Firebase auth domain
- `FIREBASE_DATABASE_URL` — Firebase Realtime Database URL
- `FIREBASE_PROJECT_ID` — Firebase project ID
- `FIREBASE_STORAGE_BUCKET` — Firebase storage bucket
- `FIREBASE_MESSAGING_SENDER_ID` — Firebase messaging sender ID
- `FIREBASE_APP_ID` — Firebase app ID
- `GOOGLE_WEB_CLIENT_ID` — Google OAuth web client ID
- `REPLIT_DEV_DOMAIN` — Auto-set by Replit for development
- `EXPO_PUBLIC_DOMAIN` — Set to `$REPLIT_DEV_DOMAIN:5000` for API access

### Third-Party Services
- **Firebase**: Authentication (Google Sign-In), Realtime Database (user data storage)
- **Google OAuth 2.0**: User authentication provider
- **Expo Services**: Build infrastructure, OTA updates, font loading

### Key NPM Packages
- `expo` ~54.0.27 — App framework
- `expo-router` ~6.0.17 — File-based routing
- `express` ^5.0.1 — Backend server
- `firebase` ^12.9.0 — Firebase SDK
- `drizzle-orm` ^0.39.3 — SQL ORM (PostgreSQL)
- `@tanstack/react-query` ^5.83.0 — Server state management
- `react-native-reanimated` ~4.1.1 — Animations
- `expo-auth-session` ^7.0.10 — OAuth authentication flow
- `pg` ^8.16.3 — PostgreSQL client