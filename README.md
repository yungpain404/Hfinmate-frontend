# HFinmate - Mobile Frontend Application

**HFinmate** is a smart personal expense tracking mobile application built on **React Native (Expo)** and **TypeScript**, strictly adhering to the **MVVM (Model - View - ViewModel)** architectural pattern.

---

## 1. Overview & Key Features

- **Modern & Elegant Design**: Forest Emerald brand theme with responsive layouts optimized across iOS, Android, and Web.
- **Google Authentication with Firebase**:
  - Seamless bottom-sheet login modal (`GoogleAuthBottomSheet`) prompted on initial application launch.
  - Automatically synchronizes Google profiles with the Backend REST API (`POST /v1/auth/google`) to issue JWT sessions.
  - Built-in Demo Test mode and resilient offline fallback support.
- **Comprehensive Expense Management**:
  - **Home Dashboard**: Real-time balance cards, current month spending rhythm, and recent expense groups.
  - **Transaction Ledger**: Instant search, filter chips (All / Income / Expense), and item deletion.
  - **Daily Expense Calculator**: Day-by-day itemized record keeper with instant formula evaluation.
  - **Fixed Expenses**: Manage recurring monthly costs (rent, utilities, parking, fuel) with quick inline editing.
  - **Analytics & Reports**: 12-month spending bar charts, category breakdown percentages, and calendar timeline stats.
- **Offline-First Architecture**: Persistent local data caching via `@react-native-async-storage/async-storage` with seamless network recovery.

---

## 2. Technology Stack

| Layer / Role | Technology |
| :--- | :--- |
| **Framework** | [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) (SDK 57) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) |
| **Architecture** | MVVM (Model - View - ViewModel) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) |
| **Navigation** | [React Navigation](https://reactnavigation.org/) (Native Stack & Bottom Tabs) |
| **HTTP Client** | [Axios](https://axios-http.com/) with request/response interceptors |
| **Authentication** | [Firebase Authentication](https://firebase.google.com/docs/auth) (Modular SDK) |
| **Local Storage** | `@react-native-async-storage/async-storage` |
| **Graphics & Icons** | `@expo/vector-icons`, `react-native-svg` |

---

## 3. Project Directory Structure (MVVM)

```text
HFinmate-frontend/
├── assets/                     # App assets, icons, splash images
├── src/
│   ├── models/                 # Entities, DTOs & API Contracts (Data layer)
│   ├── services/               # Network ApiClient, Storage, Firebase & Repositories
│   │   ├── api/                # Axios instance configuration & Base URL
│   │   ├── firebase/           # Firebase App & FirebaseAuthService
│   │   ├── storage/            # Type-safe AsyncStorage wrapper
│   │   └── repositories/       # Data abstraction layer (Auth, Transaction, Dashboard, ...)
│   ├── viewmodels/             # Custom hooks containing UI & business logic (Zustand)
│   ├── views/                  # Presentation Screen components (HomeScreen, AnalyticsScreen, ...)
│   ├── components/             # Reusable atomic UI components & GoogleAuthBottomSheet
│   ├── navigation/             # Navigation stacks & Bottom tab navigator
│   └── theme/                  # Design tokens (Colors, Spacing, Typography, Radius)
├── App.tsx                     # Application entry point with Navigation & Auth Modal
├── metro.config.js             # Metro Bundler configuration for Firebase CJS & Package Exports
├── app.json                    # Expo application manifest
├── package.json
└── tsconfig.json
```

> 📖 For full architectural design principles and layer responsibilities, refer to [ARCHITECTURE.md](ARCHITECTURE.md).
