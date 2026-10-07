import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { theme } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: keyof typeof theme.spacing;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'elevated',
  padding = 'md',
}) => {
  return (
    <View
      style={[
        styles.base,
        styles[variant],
        { padding: theme.spacing[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
  },
  elevated: {
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      default: {
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
    }),
    borderWidth: Platform.OS === 'ios' ? 0.5 : 0,
    borderColor: theme.colors.border,
  },
  outlined: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  flat: {
    backgroundColor: theme.colors.surface,
  },
});
