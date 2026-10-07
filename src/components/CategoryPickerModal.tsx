import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EXPENSE_CATEGORIES } from '../models/expenseCategory.model';

interface CategoryPickerModalProps {
  visible: boolean;
  selectedCategory: string;
  onClose: () => void;
  onSelect: (categoryName: string) => void;
}

export const CategoryPickerModal: React.FC<CategoryPickerModalProps> = ({
  visible,
  selectedCategory,
  onClose,
  onSelect,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Drag Handle Indicator */}
              <View style={styles.dragHandle} />

              {/* Header Row */}
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headerTitle}>Chọn loại khoản chi</Text>
                  <Text style={styles.headerSubtitle}>
                    Phân loại giúp tự động phân tích ở trang Thống kê
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.6}
                  style={styles.closeBtn}
                  onPress={onClose}
                >
                  <Ionicons name="close" size={20} color="#71857A" />
                </TouchableOpacity>
              </View>

              {/* Categories List */}
              <ScrollView
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {EXPENSE_CATEGORIES.map((cat) => {
                  const isSelected =
                    selectedCategory.trim().toLowerCase() ===
                    cat.name.trim().toLowerCase();

                  return (
                    <TouchableOpacity
                      key={cat.id}
                      activeOpacity={0.7}
                      style={[
                        styles.categoryItemRow,
                        isSelected && styles.categoryItemRowSelected,
                      ]}
                      onPress={() => {
                        onSelect(cat.name);
                        onClose();
                      }}
                    >
                      {/* Left Icon Badge */}
                      <View
                        style={[
                          styles.iconBadge,
                          { backgroundColor: `${cat.color}18` },
                        ]}
                      >
                        <Ionicons name={cat.icon} size={20} color={cat.color} />
                      </View>

                      {/* Middle: Category Name & Examples */}
                      <View style={styles.categoryDetails}>
                        <Text
                          style={[
                            styles.categoryName,
                            isSelected && styles.categoryNameSelected,
                          ]}
                        >
                          {cat.name}
                        </Text>
                        <Text style={styles.categoryExamples} numberOfLines={1}>
                          {cat.examples}
                        </Text>
                      </View>

                      {/* Right: Checkmark Icon */}
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleSelected,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 39, 31, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDE5E0',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#17271F',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#71857A',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F7F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  categoryScroll: {
    paddingHorizontal: 16,
  },
  categoryScrollContent: {
    paddingBottom: 10,
  },
  categoryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#F0F5F2',
    backgroundColor: '#FFFFFF',
  },
  categoryItemRowSelected: {
    borderColor: '#78BFA0',
    backgroundColor: '#F4FAF6',
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
    paddingRight: 10,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#17271F',
    marginBottom: 2,
  },
  categoryNameSelected: {
    color: '#1A6A4C',
  },
  categoryExamples: {
    fontSize: 12,
    color: '#71857A',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CFDCD4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#1A6A4C',
    backgroundColor: '#1A6A4C',
  },
});
