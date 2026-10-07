# HFinmate - Frontend Mobile App

Ứng dụng sổ chi tiêu cá nhân thông minh **HFinmate**, được xây dựng trên nền tảng **React Native (Expo)** và **TypeScript**, tuân thủ nghiêm ngặt nguyên lý kiến trúc **MVVM (Model - View - ViewModel)**.

---

## 1. Giới Thiệu & Điểm Nổi Bật

- **Giao diện hiện đại & Thân thiện**: Tone màu chủ đạo Forest Emerald thanh lịch, hỗ trợ tối ưu hiển thị trên cả iOS, Android và Web.
- **Xác thực Google với Firebase Authentication**:
  - Tích hợp Bottom Sheet đăng nhập bằng Google mượt mà ngay khi mở ứng dụng.
  - Tự động đồng bộ tài khoản Google với Backend REST API (`POST /v1/auth/google`) để lấy phiên làm việc JWT.
  - Hỗ trợ chế độ trải nghiệm nhanh (Demo Mode) và hoạt động offline ổn định.
- **Quản lý thu chi toàn diện**:
  - **Trang chủ (Dashboard)**: Theo dõi số dư, nhịp chi tiêu tháng hiện tại và danh sách các ngày chi gần nhất.
  - **Sổ giao dịch (Transactions)**: Tra cứu nhanh, lọc theo phân loại (Tất cả / Thu / Chi), tìm kiếm theo từ khóa và xóa giao dịch.
  - **Chi tiêu theo ngày (Daily Expenses)**: Bảng kê chi tiêu từng ngày kèm bộ tính toán tức thời.
  - **Chi phí cố định (Fixed Expenses)**: Quản lý các khoản phí định kỳ (tiền trọ, điện nước, gửi xe, xăng xe) với tính năng chỉnh sửa nhanh (inline edit).
  - **Báo cáo & Thống kê (Analytics)**: Biểu đồ cột nhịp chi 12 tháng, cơ cấu phần trăm danh mục và thống kê theo lịch.
- **Lưu trữ & Ngoại tuyến (Offline-First)**: Lưu trữ dữ liệu an toàn với `@react-native-async-storage/async-storage`, tự động chuyển đổi sang bộ đệm cục bộ khi mất kết nối mạng.

---

## 2. Công Nghệ Sử Dụng

| Thành phần | Công nghệ / Thư viện |
| :--- | :--- |
| **Framework** | [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) (SDK 57) |
| **Ngôn ngữ** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) |
| **Kiến trúc** | MVVM (Model - View - ViewModel) |
| **Quản lý trạng thái** | [Zustand](https://github.com/pmndrs/zustand) |
| **Điều hướng** | [React Navigation](https://reactnavigation.org/) (Native Stack & Bottom Tabs) |
| **HTTP Client** | [Axios](https://axios-http.com/) kèm interceptors |
| **Xác thực** | [Firebase Authentication](https://firebase.google.com/docs/auth) (Modular SDK) |
| **Lưu trữ cục bộ** | `@react-native-async-storage/async-storage` |
| **Icons & Đồ họa** | `@expo/vector-icons`, `react-native-svg` |

---

## 3. Cấu Trúc Dự Án (MVVM)

```text
HFinmate-frontend/
├── assets/                     # Hình ảnh, icons, splash screen
├── src/
│   ├── models/                 # Entities, DTOs & API Contracts (Data layer)
│   ├── services/               # ApiClient, StorageService, Firebase & Repositories
│   │   ├── api/                # Cấu hình Axios instance & Base URL
│   │   ├── firebase/           # Cấu hình Firebase App & FirebaseAuthService
│   │   ├── storage/            # Wrapper AsyncStorage type-safe
│   │   └── repositories/       # Tầng trừu tượng dữ liệu (Auth, Transaction, Dashboard, ...)
│   ├── viewmodels/             # Custom hooks chứa UI logic & Business logic (Zustand)
│   ├── views/                  # Màn hình hiển thị JSX (HomeScreen, AnalyticsScreen, ...)
│   ├── components/             # Reusable UI components & Bottom Sheet đăng nhập
│   ├── navigation/             # Cấu hình Stack & Bottom Tab Navigation
│   └── theme/                  # Design tokens (Colors, Spacing, Typography, Radius)
├── App.tsx                     # Root component nạp Navigation & GoogleAuthBottomSheet
├── metro.config.js             # Cấu hình Metro Bundler cho Firebase CJS & Package Exports
├── app.json                    # Cấu hình Expo Application
├── package.json
└── tsconfig.json
```

> 📖 Chi tiết về nguyên lý thiết kế và phân tầng dữ liệu xem tại [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 4. Hướng Dẫn Cài Đặt & Khởi Chạy

### 4.1. Yêu cầu môi trường
- **Node.js**: Phiên bản 18.x trở lên.
- **npm** hoặc **yarn**.
- Thiết bị cài đặt ứng dụng **Expo Go** (có trên Google Play Store và Apple App Store) hoặc Simulator / Emulator.

### 4.2. Cài đặt thư viện
Tại thư mục `HFinmate-frontend`, chạy:
```bash
npm install
```

### 4.3. Cấu hình biến môi trường (`.env`)
Tạo file `.env` từ file mẫu `.env.example`:
```bash
cp .env.example .env
```

Nội dung cấu hình chuẩn:
```env
# 1. Địa chỉ Backend API Base URL
# - Dành cho iOS Simulator hoặc Web: http://localhost:5000/v1
# - Dành cho Android Emulator: http://10.0.2.2:5000/v1
# - Dành cho Thiết bị thật (chạy Expo Go qua Wi-Fi chung): http://<IP_MAY_TINH>:5000/v1
EXPO_PUBLIC_API_URL=http://localhost:5000/v1

# 2. Cấu hình Firebase Authentication
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyA_DEMO_KEY_HFINMATE_FIREBASE_AUTH_2026
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=hfinmate-app.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=hfinmate-app
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=hfinmate-app.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### 4.4. Khởi chạy ứng dụng

- **Khởi động Expo Metro Bundler**:
  ```bash
  npx expo start
  ```
- **Khởi động với cờ xóa bộ nhớ đệm (Khuyên dùng khi cập nhật thư viện)**:
  ```bash
  npx expo start -c
  ```
- **Chạy trên trình duyệt Web**:
  ```bash
  npx expo start --web
  ```
- **Kết nối thiết bị di động**:
  - **Android**: Mở ứng dụng **Expo Go** và quét mã QR trên màn hình terminal.
  - **iOS**: Mở ứng dụng **Camera** mặc định và quét mã QR để mở trong **Expo Go**.

---

## 5. Các Lệnh Hữu Ích

```bash
# Kiểm tra lỗi cú pháp và kiểu dữ liệu TypeScript
npx tsc --noEmit

# Kiểm tra quy chuẩn mã nguồn bằng ESLint
npm run lint

# Khởi chạy Metro Bundler
npm start

# Mở nhanh trên Android Emulator
npm run android

# Mở nhanh trên iOS Simulator
npm run ios
```

---

## 6. Kết Nối Backend

Để ứng dụng hoạt động đầy đủ chức năng và đồng bộ dữ liệu:
1. Đảm bảo dịch vụ `HFinmate-backend` đang chạy tại cổng `5000`:
   ```bash
   cd ../HFinmate-backend
   npm run dev
   ```
2. Kiểm tra trạng thái máy chủ Backend:
   - Sức khỏe dịch vụ: `http://localhost:5000/health`
   - Tài liệu API: `../HFinmate-backend/docs/api_documentation.md`
