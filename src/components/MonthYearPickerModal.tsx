import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface MonthYearPickerModalProps {
  visible: boolean;
  currentMonth?: number; // 1-12
  currentYear?: number;
  onClose: () => void;
  onSelect: (month: number, year: number) => void;
}

const MONTHS = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

export const MonthYearPickerModal: React.FC<MonthYearPickerModalProps> = ({
  visible,
  currentMonth = new Date().getMonth() + 1,
  currentYear = new Date().getFullYear(),
  onClose,
  onSelect,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  React.useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedMonth(currentMonth || (new Date().getMonth() + 1));
      setSelectedYear(currentYear || new Date().getFullYear());
    }
  }, [visible, currentMonth, currentYear]);

  const handleConfirm = () => {
    onSelect(selectedMonth, selectedYear);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Chọn tháng & năm</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="#71857A" />
                </TouchableOpacity>
              </View>

              {/* Year Navigation */}
              <View style={styles.yearNavRow}>
                <TouchableOpacity
                  onPress={() => setSelectedYear((y) => y - 1)}
                  style={styles.navArrow}
                >
                  <Ionicons name="chevron-back" size={20} color={theme.colors.primary} />
                </TouchableOpacity>

                <Text style={styles.yearLabel}>Năm {selectedYear}</Text>

                <TouchableOpacity
                  onPress={() => setSelectedYear((y) => y + 1)}
                  style={styles.navArrow}
                >
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>

              {/* 12 Months Grid */}
              <View style={styles.monthsGrid}>
                {MONTHS.map((label, idx) => {
                  const mNum = idx + 1;
                  const isSelected = selectedMonth === mNum;
                  return (
                    <TouchableOpacity
                      key={label}
                      activeOpacity={0.7}
                      style={[
                        styles.monthCell,
                        isSelected && styles.monthCellSelected,
                      ]}
                      onPress={() => setSelectedMonth(mNum)}
                    >
                      <Text
                        style={[
                          styles.monthText,
                          isSelected && styles.monthTextSelected,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                  <Text style={styles.confirmBtnText}>Xác nhận chọn</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 39, 31, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#17271F',
  },
  closeBtn: {
    padding: 4,
  },
  yearNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  navArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EAF5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#17271F',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  monthCell: {
    width: '31.5%',
    backgroundColor: '#F5F7F6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8EFEA',
  },
  monthCellSelected: {
    backgroundColor: '#1A6A4C',
    borderColor: '#1A6A4C',
  },
  monthText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#17271F',
  },
  monthTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F5F7F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71857A',
  },
  confirmBtn: {
    flex: 1.5,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#1A6A4C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
