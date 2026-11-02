import React, { useState, useEffect } from 'react';
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

interface YearPickerModalProps {
  visible: boolean;
  selectedYear: string;
  onClose: () => void;
  onSelect: (year: string) => void;
}

const buildYears = (): string[] => {
  const current = new Date().getFullYear();
  return [
    `Năm ${current}`,
    `Năm ${current - 1}`,
    `Năm ${current - 2}`,
    `Năm ${current - 3}`,
    'Năm chưa xác định',
  ];
};

export const YearPickerModal: React.FC<YearPickerModalProps> = ({
  visible,
  selectedYear,
  onClose,
  onSelect,
}) => {
  // Built on every render so a session crossing New Year never keeps offering
  // the year list captured when the bundle loaded.
  const years = buildYears();
  const activeYear = selectedYear || years[0];

  const [currentSelected, setCurrentSelected] = useState<string>(activeYear);

  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentSelected(activeYear);
    }
  }, [visible, activeYear]);

  const handleConfirm = () => {
    onSelect(currentSelected);
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
                <Text style={styles.headerTitle}>Chọn năm thống kê</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="#71857A" />
                </TouchableOpacity>
              </View>

              {/* Year list */}
              <View style={styles.yearList}>
                {years.map((y) => {
                  const isSelected = currentSelected === y;
                  return (
                    <TouchableOpacity
                      key={y}
                      activeOpacity={0.7}
                      style={[
                        styles.yearRow,
                        isSelected && styles.yearRowSelected,
                      ]}
                      onPress={() => setCurrentSelected(y)}
                    >
                      <Text
                        style={[
                          styles.yearText,
                          isSelected && styles.yearTextSelected,
                        ]}
                      >
                        {y}
                      </Text>
                      {isSelected ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={theme.colors.primary}
                        />
                      ) : (
                        <View style={styles.emptyCircle} />
                      )}
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
  yearList: {
    gap: 10,
    marginBottom: 20,
  },
  yearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F7F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#E8EFEA',
  },
  yearRowSelected: {
    backgroundColor: '#EAF5EF',
    borderColor: '#78BFA0',
  },
  yearText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#17271F',
  },
  yearTextSelected: {
    color: '#1A6A4C',
    fontWeight: '700',
  },
  emptyCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1E6DC',
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
