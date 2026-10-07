import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  style,
  textStyle,
}) => {
  return (
    <View style={[styles.badge, styles[variant], styles[`size_${size}`], style]}>
      <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  size_sm: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  size_md: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  // Variant Backgrounds
  success: {
    backgroundColor: theme.colors.incomeLight,
  },
  danger: {
    backgroundColor: theme.colors.expenseLight,
  },
  warning: {
    backgroundColor: theme.colors.warningLight,
  },
  info: {
    backgroundColor: theme.colors.infoLight,
  },
  neutral: {
    backgroundColor: theme.colors.surface,
  },
  primary: {
    backgroundColor: theme.colors.primaryMuted,
  },
  // Text
  text: {
    fontWeight: '600',
  },
  textSize_sm: {
    fontSize: 11,
  },
  textSize_md: {
    fontSize: 12,
  },
  text_success: {
    color: '#065F46',
  },
  text_danger: {
    color: '#991B1B',
  },
  text_warning: {
    color: '#92400E',
  },
  text_info: {
    color: '#155E75',
  },
  text_neutral: {
    color: theme.colors.textSecondary,
  },
  text_primary: {
    color: theme.colors.primaryDark,
  },
});
