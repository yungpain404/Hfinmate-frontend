import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FixedExpenseItem } from '../models/fixedExpense.model';
import { theme } from '../theme';

interface EditFixedItemModalProps {
  visible: boolean;
  item: FixedExpenseItem | null;
  onClose: () => void;
  onSave: (
    id: string,
    amount: number | null,
    subtitle: string,
    extraNote?: { title: string; description: string } | null
  ) => void;
}

export const EditFixedItemModal: React.FC<EditFixedItemModalProps> = ({
  visible,
  item,
  onClose,
  onSave,
}) => {
  const [amountText, setAmountText] = useState<string>('');
  const [hasNote, setHasNote] = useState<boolean>(false);
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteDesc, setNoteDesc] = useState<string>('');

  useEffect(() => {
    if (item) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmountText(
        item.amount !== null && item.amount !== undefined && item.amount > 0
          ? new Intl.NumberFormat('vi-VN').format(item.amount)
          : ''
      );
      if (item.extraNote && item.extraNote.title && !item.extraNote.title.toLowerCase().includes('nguyên')) {
        setHasNote(true);
        setNoteTitle(item.extraNote.title);
        setNoteDesc(item.extraNote.description || '');
      } else {
        setHasNote(false);
        setNoteTitle('');
        setNoteDesc('');
      }
    }
  }, [item, visible]);

  if (!item) return null;

  const handleAmountChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    if (!clean) {
      setAmountText('');
      return;
    }
    const num = parseInt(clean, 10);
    setAmountText(new Intl.NumberFormat('vi-VN').format(num));
  };

  const handleConfirm = () => {
    const rawNumber = amountText.replace(/[^0-9]/g, '');
    const finalAmount = rawNumber ? parseInt(rawNumber, 10) : null;

    let finalNote: { title: string; description: string } | null = null;
    if (hasNote && (noteTitle.trim() || noteDesc.trim())) {
      finalNote = {
        title: noteTitle.trim() || 'Ghi chú',
        description: noteDesc.trim(),
      };
    }

    onSave(item.id, finalAmount, item.subtitle || '', finalNote);
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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardContainer}
          >
            <TouchableWithoutFeedback>
              <View style={styles.sheetContainer}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>
                    Ghi chú: {item.title}
                  </Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <Ionicons name="close" size={20} color="#71857A" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 10 }}
                >
                  {/* Amount Field */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>SỐ TIỀN (VND)</Text>
                    <View style={styles.amountInputRow}>
                      <TextInput
                        style={styles.amountInput}
                        value={amountText}
                        onChangeText={handleAmountChange}
                        placeholder="0 (để trống nếu chưa nhập)"
                        placeholderTextColor="#96A79E"
                        keyboardType="numeric"
                      />
                      <Text style={styles.currencySuffix}>đ</Text>
                    </View>
                  </View>

                  {/* Section Ghi chú */}
                  <View style={styles.noteSection}>
                    <View style={styles.noteHeaderRow}>
                      <Text style={styles.noteSectionTitle}>Ghi chú đính kèm</Text>
                      {!hasNote ? (
                        <TouchableOpacity
                          style={styles.addNoteBtn}
                          onPress={() => setHasNote(true)}
                        >
                          <Ionicons
                            name="add"
                            size={14}
                            color={theme.colors.primary}
                            style={{ marginRight: 2 }}
                          />
                          <Text style={styles.addNoteBtnText}>Thêm ghi chú</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.deleteNoteBtn}
                          onPress={() => {
                            setHasNote(false);
                            setNoteTitle('');
                            setNoteDesc('');
                          }}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={14}
                            color="#EF4444"
                            style={{ marginRight: 2 }}
                          />
                          <Text style={styles.deleteNoteBtnText}>Xóa ghi chú</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {hasNote && (
                      <View style={styles.noteBox}>
                        <TextInput
                          style={styles.noteTitleInput}
                          value={noteTitle}
                          onChangeText={setNoteTitle}
                          placeholder="Tiêu đề ghi chú..."
                          placeholderTextColor="#92400E"
                        />
                        <TextInput
                          style={styles.noteDescInput}
                          value={noteDesc}
                          onChangeText={setNoteDesc}
                          placeholder="Mô tả ghi chú (chưa cộng vào tổng)..."
                          placeholderTextColor="#92400E"
                          multiline
                        />
                      </View>
                    )}
                  </View>
                </ScrollView>

                {/* Footer Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                    <Text style={styles.cancelBtnText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={handleConfirm}
                  >
                    <Text style={styles.confirmBtnText}>Lưu thay đổi</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
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
  keyboardContainer: {
    width: '100%',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: '85%',
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
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71857A',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7F6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8EFEA',
    paddingHorizontal: 12,
  },
  amountInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    fontWeight: '700',
    color: '#17271F',
  },
  currencySuffix: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A6A4C',
    marginLeft: 6,
  },
  textInput: {
    height: 44,
    backgroundColor: '#F5F7F6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8EFEA',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#17271F',
  },
  noteSection: {
    marginTop: 6,
    marginBottom: 16,
  },
  noteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#17271F',
  },
  addNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF5EF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addNoteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A6A4C',
  },
  deleteNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deleteNoteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  noteBox: {
    backgroundColor: '#FEF6E9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE6BA',
    padding: 10,
  },
  noteTitleInput: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE6BA',
    paddingBottom: 6,
    marginBottom: 6,
  },
  noteDescInput: {
    fontSize: 12,
    color: '#B45309',
    minHeight: 40,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
