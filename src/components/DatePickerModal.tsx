import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DatePickerModalProps {
  visible: boolean;
  currentDate?: Date;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
}

const DAYS_OF_WEEK = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  currentDate = new Date(),
  onClose,
  onSelectDate,
}) => {
  const [viewDate, setViewDate] = useState<Date>(currentDate);
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);

  useEffect(() => {
    if (visible && currentDate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewDate(currentDate);
      setSelectedDate(currentDate);
    }
  }, [visible, currentDate]);

  const today = useMemo(() => new Date(), []);
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }, []);
  const dayBefore = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    return d;
  }, []);

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleConfirm = () => {
    onSelectDate(selectedDate);
    onClose();
  };

  const handleQuickSelect = (date: Date) => {
    setSelectedDate(date);
    setViewDate(date);
  };

  // Calendar calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const isSelected = (day: number) => {
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    );
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
                <Text style={styles.headerTitle}>Chọn ngày ghi chi tiêu</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="#71857A" />
                </TouchableOpacity>
              </View>

              {/* Quick Preset Buttons */}
              <View style={styles.presetRow}>
                <TouchableOpacity
                  style={[
                    styles.presetChip,
                    isSameDay(selectedDate, today) && styles.presetChipActive,
                  ]}
                  onPress={() => handleQuickSelect(today)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      isSameDay(selectedDate, today) && styles.presetTextActive,
                    ]}
                  >
                    Hôm nay
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetChip,
                    isSameDay(selectedDate, yesterday) && styles.presetChipActive,
                  ]}
                  onPress={() => handleQuickSelect(yesterday)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      isSameDay(selectedDate, yesterday) && styles.presetTextActive,
                    ]}
                  >
                    Hôm qua
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetChip,
                    isSameDay(selectedDate, dayBefore) && styles.presetChipActive,
                  ]}
                  onPress={() => handleQuickSelect(dayBefore)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      isSameDay(selectedDate, dayBefore) && styles.presetTextActive,
                    ]}
                  >
                    {dayBefore.getDate()} thg {dayBefore.getMonth() + 1}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Month Navigator */}
              <View style={styles.monthNav}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.navArrow}>
                  <Ionicons name="chevron-back" size={20} color="#1A6A4C" />
                </TouchableOpacity>
                <Text style={styles.monthLabel}>
                  Tháng {month + 1}, {year}
                </Text>
                <TouchableOpacity onPress={handleNextMonth} style={styles.navArrow}>
                  <Ionicons name="chevron-forward" size={20} color="#1A6A4C" />
                </TouchableOpacity>
              </View>

              {/* Days of Week Header */}
              <View style={styles.weekHeader}>
                {DAYS_OF_WEEK.map((d) => (
                  <Text key={d} style={styles.weekDayText}>
                    {d}
                  </Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.gridContainer}>
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <View key={`empty-${idx}`} style={styles.dayCell} />;
                  }
                  const selected = isSelected(day);
                  return (
                    <TouchableOpacity
                      key={`day-${day}`}
                      activeOpacity={0.7}
                      style={[styles.dayCell, selected && styles.dayCellSelected]}
                      onPress={() => setSelectedDate(new Date(year, month, day))}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          selected && styles.dayTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Footer Actions */}
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
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#17271F',
  },
  closeBtn: {
    padding: 4,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F7F6',
    borderWidth: 1,
    borderColor: '#E8EFEA',
  },
  presetChipActive: {
    backgroundColor: '#EAF5EF',
    borderColor: '#78BFA0',
  },
  presetText: {
    fontSize: 12,
    color: '#4B6255',
    fontWeight: '500',
  },
  presetTextActive: {
    color: '#1A6A4C',
    fontWeight: '700',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAF5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#17271F',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekDayText: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#8CA095',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayCell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: '#1A6A4C',
  },
  dayText: {
    fontSize: 14,
    color: '#17271F',
    fontWeight: '500',
  },
  dayTextSelected: {
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
