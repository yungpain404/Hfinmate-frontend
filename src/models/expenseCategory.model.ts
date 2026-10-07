import { Ionicons } from '@expo/vector-icons';

export interface ExpenseCategoryDef {
  id: string;
  name: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  examples: string;
}

// All categories (including Sinh hoạt for fixed expenses and overview statistics)
export const ALL_EXPENSE_CATEGORIES: ExpenseCategoryDef[] = [
  {
    id: 'food',
    name: 'Ăn uống',
    color: '#1A6A4C', // Deep forest emerald (dominant)
    icon: 'restaurant-outline',
    examples: 'Bún, cơm, gà, bánh, trà tắc...',
  },
  {
    id: 'transport',
    name: 'Di chuyển',
    color: '#E5A00D', // Golden yellow (màu vàng)
    icon: 'car-outline',
    examples: 'Grab, xăng, gửi xe, xe buýt...',
  },
  {
    id: 'living',
    name: 'Sinh hoạt',
    color: '#8EBFA6', // Soft sage green
    icon: 'home-outline',
    examples: 'Nước, tiền phòng, điện, đồ sinh hoạt...',
  },
  {
    id: 'personal',
    name: 'Cá nhân',
    color: '#C88D38', // Warm amber / golden
    icon: 'person-outline',
    examples: 'Hớt tóc, mua sắm, mỹ phẩm...',
  },
  {
    id: 'photo',
    name: 'Photo',
    color: '#2563EB', // Blue (xanh dương)
    icon: 'document-text-outline',
    examples: 'Photo tài liệu, in ấn, văn phòng phẩm...',
  },
  {
    id: 'entertainment',
    name: 'Giải trí',
    color: '#5B75A6', // Steel blue
    icon: 'game-controller-outline',
    examples: 'Xem phim, game, cà phê giao lưu...',
  },
  {
    id: 'other',
    name: 'Khác',
    color: '#8C9B92', // Muted slate
    icon: 'ellipsis-horizontal-circle-outline',
    examples: 'Chi phí phát sinh khác...',
  },
];

// Daily expense categories for the select box (Sinh hoạt is excluded as requested)
export const EXPENSE_CATEGORIES: ExpenseCategoryDef[] = ALL_EXPENSE_CATEGORIES.filter(
  (c) => c.name !== 'Sinh hoạt'
);

export function getCategoryByName(name?: string): ExpenseCategoryDef {
  if (!name) return EXPENSE_CATEGORIES[0];
  const normalized = name.trim().toLowerCase();
  const found = ALL_EXPENSE_CATEGORIES.find(
    (c) => c.name.toLowerCase() === normalized || c.id.toLowerCase() === normalized
  );
  if (found) return found;

  // Partial match heuristic
  if (normalized.includes('ăn') || normalized.includes('uống') || normalized.includes('cơm') || normalized.includes('bún')) {
    return ALL_EXPENSE_CATEGORIES[0];
  }
  if (normalized.includes('xe') || normalized.includes('xăng') || normalized.includes('grab')) {
    return ALL_EXPENSE_CATEGORIES[1];
  }
  if (normalized.includes('sinh hoạt') || normalized.includes('nước') || normalized.includes('phòng') || normalized.includes('trọ')) {
    return ALL_EXPENSE_CATEGORIES[2]; // Sinh hoạt
  }
  if (normalized.includes('cá nhân') || normalized.includes('tóc') || normalized.includes('áo') || normalized.includes('quần')) {
    return ALL_EXPENSE_CATEGORIES[3];
  }
  if (normalized.includes('photo') || normalized.includes('in') || normalized.includes('sách')) {
    return ALL_EXPENSE_CATEGORIES[4];
  }
  if (normalized.includes('giải trí') || normalized.includes('game') || normalized.includes('phim')) {
    return ALL_EXPENSE_CATEGORIES[5];
  }

  return ALL_EXPENSE_CATEGORIES[ALL_EXPENSE_CATEGORIES.length - 1]; // 'Khác'
}

export function detectCategoryFromItemName(itemName: string): string | null {
  if (!itemName) return null;
  const lower = itemName.toLowerCase().trim();

  // Ăn uống
  if (/bún|cơm|phở|gà|bánh|trà|cà phê|cafe|nước mía|chè|hủ tiếu|mì|sữa|ăn|bánh mì|ốc/.test(lower)) {
    return 'Ăn uống';
  }
  // Di chuyển
  if (/xăng|gửi xe|grab|be|gojek|xe buýt|bus|vé xe|sửa xe|rửa xe|nhớt|bãi xe/.test(lower)) {
    return 'Di chuyển';
  }
  // Cá nhân
  if (/hớt tóc|cắt tóc|gội đầu|mỹ phẩm|sữa rửa mặt|kem|quần|áo|giày|dép|thuốc|khám/.test(lower)) {
    return 'Cá nhân';
  }
  // Photo
  if (/photo|in ấn|in tài liệu|giáo trình|văn phòng phẩm|bút|vở|tập|giấy/.test(lower)) {
    return 'Photo';
  }
  // Giải trí
  if (/xem phim|cinema|game|net|du lịch|vé xem|billiards|karaoke/.test(lower)) {
    return 'Giải trí';
  }

  return null;
}
