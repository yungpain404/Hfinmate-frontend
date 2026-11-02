# HFinmate — Personal Finance App (Mobile Client)

**HFinmate** is a personal expense-tracking mobile application built with **React Native + Expo** and **TypeScript**, following a strict **MVVM (Model – View – ViewModel)** architecture. It pairs with the [HFinmate Backend](https://github.com/yungpain404/Hfinmate-backend) REST API for authentication and cloud sync, while keeping all data locally available for an offline-first experience.

---

## 1. Features

- **Google Sign-In with Firebase Authentication**
  - Bottom-sheet login modal (`GoogleAuthBottomSheet`) shown on first launch.
  - Native Google Sign-In (`@react-native-google-signin/google-signin`) with graceful Expo/Web fallbacks.
  - Google profiles are synchronized with the backend (`POST /v1/auth/google`) to issue JWT sessions.
  - Multiple accounts saved on the device, with one-tap account switching.
- **Home Dashboard** — balance cards, current-month spending rhythm chart, and recent expense groups.
- **Transaction Ledger** — instant search, filter chips (All / Income / Expense), item deletion, and tap-through to the source daily sheet.
- **Daily Expense Calculator** — day-by-day itemized records with inline formula evaluation and change detection (no-op saves are skipped).
- **Fixed Expenses** — recurring monthly costs (rent, utilities, parking, fuel) with quick inline editing. Sheets are archived per month, so **fixed expenses and statistics reset automatically when a new month starts**.
- **Analytics & Reports** — 12-month spending bar charts, category breakdown percentages, and calendar timeline statistics, all scoped to the selected month.
- **Multi-account data isolation** — local storage keys are namespaced per signed-in Google account, with automatic migration of legacy unscoped keys and per-account sync/restore of transactions, daily sheets, fixed expenses, and budget goals.
- **Offline-First Architecture** — persistent local caching through `@react-native-async-storage/async-storage`, with automatic fallback to local data when the network is unavailable.

---

## 2. Technology Stack

| Layer / Role | Technology |
| :--- | :--- |
| **Framework** | [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) (SDK 57) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (strict mode) |
| **Architecture** | MVVM (Model – View – ViewModel) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) |
| **Navigation** | [React Navigation](https://reactnavigation.org/) (Native Stack & Bottom Tabs) |
| **HTTP Client** | [Axios](https://axios-http.com/) with request/response interceptors |
| **Authentication** | [Firebase Authentication](https://firebase.google.com/docs/auth) (modular SDK) + Google native sign-in |
| **Local Storage** | `@react-native-async-storage/async-storage` (account-scoped) |
| **Graphics & Icons** | `@expo/vector-icons`, `react-native-svg` |
| **CI / Builds** | [EAS Build](https://docs.expo.dev/build/introduction/) (`eas.json` profiles: development, preview, production) |

---

## 3. Project Structure (MVVM)

```text
HFinmate-frontend/
├── assets/                     # App assets, icons, splash images
├── src/
│   ├── models/                 # Entities, DTOs and API contracts (data layer)
│   ├── services/               # API client, storage, Firebase and repositories
│   │   ├── api/                # Axios instance configuration and base URL
│   │   ├── firebase/           # Firebase app and FirebaseAuthService
│   │   ├── storage/            # Type-safe AsyncStorage wrapper + account scoping
│   │   ├── repositories/       # Data abstraction (Auth, Transaction, Dashboard, ...)
│   │   └── eventBus.ts         # Expense change event bus
│   ├── viewmodels/             # Business-logic hooks (Zustand-backed)
│   ├── views/                  # Screen components (Home, Analytics, ...)
│   ├── components/             # Reusable UI components (GoogleAuthBottomSheet, ...)
│   ├── hooks/                  # Shared hooks (auth session, month rollover, ...)
│   ├── navigation/             # Navigation stacks and bottom tab navigator
│   ├── theme/                  # Design tokens (colors, spacing, typography, radius)
│   └── utils/                  # Date/month helpers
├── App.tsx                     # Entry point: navigation and auth modal
├── metro.config.js             # Metro config for Firebase CJS and package exports
├── app.json                    # Expo application manifest
├── eas.json                    # EAS build profiles
├── package.json
└── tsconfig.json
```

> 📖 For the full architectural design and layer responsibilities, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 4. Getting Started

### 4.1. Prerequisites

- **Node.js** 18+ and npm
- **Expo Go** on a device, or an Android/iOS emulator
- A running instance of the [HFinmate backend](https://github.com/yungpain404/Hfinmate-backend)

### 4.2. Installation

```bash
npm install
```

### 4.3. Environment variables

Copy the example file and fill in your own credentials:

```bash
cp .env.example .env
```

| Variable | Description |
| :--- | :--- |
| `EXPO_PUBLIC_API_URL` | Backend base URL (e.g. `https://hfinmate-backend.onrender.com/v1`) |
| `EXPO_PUBLIC_FIREBASE_*` | Firebase web app configuration (Firebase Console → Project settings) |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Web Client ID |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Google OAuth Android Client ID |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google OAuth iOS Client ID |

### 4.4. Run

```bash
npm start          # start the Expo dev server
npm run android    # run on Android
npm run ios        # run on iOS
npm run web        # run on web
```

### 4.5. Quality checks

```bash
npm run lint       # ESLint (expo lint)
npx tsc --noEmit   # TypeScript type-check
```

### 4.6. Build with EAS

```bash
npx eas-cli build --profile preview --platform android
npx eas-cli build --profile production --platform all
```

---

## 5. Related Repositories

| Repository | Description |
| :--- | :--- |
| [HFinmate Backend](https://github.com/yungpain404/Hfinmate-backend) | Node.js + Express + TypeScript REST API (JWT auth, sync, analytics) |

---

## 6. License

This project is licensed under the terms in [LICENSE](LICENSE).
