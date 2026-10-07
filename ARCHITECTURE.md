# HFinmate - Kiến Trúc Ứng Dụng MVVM (Model - View - ViewModel)

HFinmate được thiết kế và triển khai tuân thủ nghiêm ngặt nguyên lý thiết kế **MVVM (Model - View - ViewModel)** trên nền tảng **React Native Expo (TypeScript)**.

---

## 1. Cấu Trúc Thư Mục Chuẩn

```text
src/
├── models/         # Entity Types, Interfaces, DTOs & API Contracts
├── services/       # Network API Client, Storage cục bộ, Repositories & Mock Data
├── viewmodels/     # Custom hooks chứa UI logic, business logic & UI states
├── views/          # Screen components & UI Presentation (Không gọi API trực tiếp)
├── components/     # UI components nguyên tử & biểu đồ tái sử dụng
├── navigation/     # Cấu hình Navigation Stacks, Bottom Tabs & Route Types
└── theme/          # Hệ thống Design Tokens (Colors, Spacing, Typography, Radius)
```

---

## 2. Chi Tiết Các Tầng MVVM

### 2.1. Model Layer (`src/models/` & `src/services/`)
- **Mục tiêu**: Quản lý dữ liệu thực thể, cấu trúc dữ liệu trao đổi (DTO) và việc tương tác dữ liệu (Network/Storage).
- **Quy tắc**: Tuyệt đối **không** chứa bất kỳ Hook UI (`useState`, `useEffect`) hay mã render JSX nào.
- **Models (`src/models/`)**:
  - `transaction.model.ts`: Entity `Transaction`, enum `TransactionType`, `TransactionCategory`, `CreateTransactionDTO`, `TransactionFilter`.
  - `wallet.model.ts`: Entity `WalletSummary`, `BudgetGoal`, `CategoryExpenseStat`.
  - `dashboard.model.ts`: Entity `HomeDashboardData`, `DailyRhythmBar`, `RecentDayExpenseGroup`.
  - `dailyExpense.model.ts`: Entity `DailyExpenseItem`, `DailyExpenseDayRecord`.
  - `analytics.model.ts`: Entity `YearlyAnalyticsData`, `MonthlyExpenseBar`, `CategoryExpenseBreakdown`.
  - `fixedExpense.model.ts`: Entity `FixedExpenseItem`, `FixedExpenseMonthData`.
  - `expenseCategory.model.ts`: Danh mục chi tiêu chuẩn và icon/màu sắc tương ứng.
  - `auth.model.ts`: Entity `User`, `LoginCredentials`, `AuthSession`.
  - `api.model.ts`: Cấu trúc generic `ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError`.
- **Services & Repositories (`src/services/`)**:
  - `api/apiClient.ts`: Cấu hình Axios instance tự động thích ứng môi trường (Android Emulator `10.0.2.2`, iOS/Web `localhost`, hoặc `EXPO_PUBLIC_API_URL`), interceptors chèn Auth token và chuẩn hóa lỗi `ApiError`.
  - `storage/storageService.ts`: Wrapper bao quanh `@react-native-async-storage/async-storage` có kiểm soát kiểu dữ liệu (Type-safe).
  - `mock/mockData.ts`: Dữ liệu ban đầu phục vụ fallback và kiểm thử offline.
  - `repositories/transactionRepository.ts`: Gọi REST API `/v1/transactions` (CRUD, reset) kết hợp lưu trữ cache cục bộ.
  - `repositories/walletRepository.ts`: Gọi REST API `/v1/wallet/*` (tổng quan số dư, mục tiêu ngân sách, thống kê).
  - `repositories/dashboardRepository.ts`: Gọi REST API `/v1/dashboard` nạp nhịp chi 30 ngày và các ngày gần đây.
  - `repositories/dailyExpenseRepository.ts`: Gọi REST API `/v1/daily-expenses` quản lý bảng kê chi tiêu theo ngày và tự động đồng bộ giao dịch.
  - `repositories/analyticsRepository.ts`: Gọi REST API `/v1/analytics/year` và `/v1/analytics/calendar`.
  - `repositories/fixedExpenseRepository.ts`: Gọi REST API `/v1/fixed-expenses` (CRUD khoản chi định kỳ, inline update).
  - `repositories/authRepository.ts`: Gọi REST API `/v1/auth/*` (đăng nhập, lấy thông tin me, cập nhật, đăng xuất) và quản lý session token.

### 2.2. ViewModel Layer (`src/viewmodels/`)
- **Mục tiêu**: Đóng gói toàn bộ logic nghiệp vụ (business logic), trạng thái giao diện (`isLoading`, `isRefreshing`, `error`, `data`), và các hàm xử lý hành vi người dùng (`handleRefresh`, `handleSubmit`, `handleDelete`).
- **Quy tắc**:
  - Viết dưới dạng **Custom Hooks** (kết hợp **Zustand** cho global state như Auth).
  - Hoàn toàn **độc lập với JSX và React Native UI components**.
  - Trả về state sạch (clean state) và các hàm tương tác gọn gàng cho View tiêu thụ.
- **Thành phần**:
  - `useHomeDashboardViewModel`: Cung cấp số liệu tổng quan, nhịp chi trong tháng và các ngày gần đây.
  - `useDailyExpenseViewModel`: Quản lý form nhập chi tiêu theo ngày với tính toán công thức tức thời.
  - `useAnalyticsViewModel`: Phân tích số liệu theo tháng hoặc năm, dữ liệu biểu đồ cột và cơ cấu chi tiêu.
  - `useFixedExpenseViewModel`: Quản lý danh mục chi phí cố định theo tháng kèm tính năng sửa inline nhanh.
  - `useWalletViewModel`: Cung cấp số dư tổng thể, báo cáo thu chi và mục tiêu tiết kiệm.
  - `useTransactionListViewModel`: Cung cấp danh sách sổ giao dịch, tìm kiếm, lọc theo phân loại và thao tác xóa.
  - `useCreateTransactionViewModel`: Quản lý form giao dịch đơn lẻ, validation rules và gửi bất đồng bộ.
  - `useAuthViewModel`: Quản lý trạng thái xác thực người dùng toàn cục với Zustand store (`login`, `logout`, `initAuth`).

### 2.3. View Layer (`src/views/`)
- **Mục tiêu**: Đảm nhận hiển thị giao diện và binding dữ liệu từ ViewModel.
- **Quy tắc**:
  - **Không** gọi API trực tiếp, **không** tính toán nghiệp vụ phức tạp trong component.
  - Tối ưu hiển thị responsive đa nền tảng (iOS & Android).
  - Xử lý mượt mà vùng an toàn viền màn hình (`SafeAreaView` / `useSafeAreaInsets`) và bàn phím ảo (`KeyboardAvoidingView`).
- **Màn hình**:
  - `HomeScreen`: Tổng quan số dư tài chính, biểu đồ nhịp chi tiêu tháng, các ngày gần đây và nút thêm nhanh.
  - `AnalyticsScreen`: Thống kê chi tiêu theo tháng hoặc theo năm, biểu đồ cột nhịp chi và cơ cấu danh mục chi tiết.
  - `FixedExpenseScreen`: Bảng quản lý chi phí cố định (nhà ở, điện nước, internet, thẻ tín dụng) với chỉnh sửa nhanh.
  - `TransactionsScreen`: Sổ giao dịch chi tiết kèm thanh tìm kiếm, bộ lọc chip (Tất cả / Thu / Chi) và thao tác xóa.
  - `AddTransactionScreen`: Giao diện ghi chép chi tiêu trong ngày với bộ chọn ngày, chọn phân loại và tính toán công thức tự động.
  - `ProfileScreen`: Thông tin người dùng, giới thiệu kiến trúc hệ thống và tính năng khôi phục dữ liệu mẫu.

### 2.4. Navigation Layer (`src/navigation/`)
- `RootNavigator`: Native Stack Navigator điều hướng giữa cụm chính (`MainTabs`), màn hình thêm chi tiêu (`AddTransaction`), sổ giao dịch (`Transactions`), và trang cá nhân (`Profile`).
- `BottomTabNavigator`: Bottom Tab Navigator bao gồm 3 tab chính:
  - **Tổng quan** (`HomeScreen`)
  - **Thống kê** (`AnalyticsScreen`)
  - **Cố định** (`FixedExpenseScreen`)
- Cùng thanh tiêu đề cố định đồng bộ `MainTopHeader` nằm xuyên suốt cả 3 màn hình tab.

---

## 3. Thành Phần Tái Sử Dụng (`src/components/`)
Được xây dựng theo Design System tối giản, linh hoạt và đồng bộ tone màu Forest Emerald:
- **UI Cơ Bản**:
  - `Button`: Hỗ trợ biến thể `primary`, `secondary`, `outline`, `danger`, `ghost` kèm trạng thái loading spinner.
  - `Input`: Tích hợp nhãn (label), icon tiền tố/hậu tố, thông báo lỗi validate.
  - `Card`: Hộp nội dung nổi (elevated) hoặc phẳng (flat) với shadow chuẩn theo từng OS.
  - `Badge`: Thẻ hiển thị trạng thái phân loại trực quan.
  - `Header`: Tiêu đề màn hình tích hợp nút điều hướng quay lại.
  - `EmptyState`: Trạng thái trống khi chưa có dữ liệu hoặc không tìm thấy kết quả.
  - `LoadingIndicator`: Vòng xoay tải dữ liệu tiêu chuẩn.
- **Component Chuyên Biệt**:
  - `MainTopHeader`: Thanh tiêu đề đỉnh cố định hiển thị lối tắt vào Sổ chi và Avatar hồ sơ.
  - `DailyRhythmChart`: Biểu đồ cột mini thể hiện nhịp chi tiêu các ngày trong tháng.
  - `YearlyBarChart`: Biểu đồ cột thống kê chi tiêu qua 12 tháng.
  - `DonutCategoryChart`: Biểu đồ tròn trực quan hóa cơ cấu chi tiêu.
  - `CategoryBreakdownSection`: Danh sách phân bổ chi phí theo danh mục kèm phần trăm.
  - `ExpenseCalendarView`: Lịch chi tiêu trực quan theo từng ngày.
  - `DatePickerModal`, `MonthYearPickerModal`, `YearPickerModal`: Bộ chọn ngày/tháng/năm linh hoạt.
  - `CategoryPickerModal`: Modal chọn danh mục chi tiêu với danh sách icon trực quan.
  - `EditFixedItemModal`: Modal cập nhật chi tiết khoản chi phí cố định.

---

## 4. Lệnh Vận Hành Dự Án

```bash
# Khởi động Expo Metro Bundler
npx expo start

# Chạy trên Android Emulator hoặc thiết bị thật
npx expo start --android

# Chạy trên iOS Simulator
npx expo start --ios

# Kiểm tra kiểu dữ liệu TypeScript
npx tsc --noEmit

# Kiểm tra Linter ESLint
npm run lint

# Kiểm tra độ tương thích Expo SDK
npx expo-doctor
```
