import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { theme } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  ...rest
}) => {
  const getContainerStyle = (): ViewStyle[] => {
    const list: ViewStyle[] = [styles.base, styles[`size_${size}`]];

    switch (variant) {
      case 'primary':
        list.push(styles.variantPrimary);
        break;
      case 'secondary':
        list.push(styles.variantSecondary);
        break;
      case 'outline':
        list.push(styles.variantOutline);
        break;
      case 'danger':
        list.push(styles.variantDanger);
        break;
      case 'ghost':
        list.push(styles.variantGhost);
        break;
    }

    if (disabled || isLoading) {
      list.push(styles.disabled);
    }

    if (style) {
      list.push(style);
    }

    return list;
  };

  const getTextStyle = (): TextStyle[] => {
    const list: TextStyle[] = [styles.baseText, styles[`textSize_${size}`]];

    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        list.push(styles.textLight);
        break;
      case 'outline':
        list.push(styles.textOutline);
        break;
      case 'ghost':
        list.push(styles.textGhost);
        break;
    }

    if (textStyle) {
      list.push(textStyle);
    }

    return list;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || isLoading}
      style={getContainerStyle()}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : '#FFFFFF'}
        />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
          <Text style={getTextStyle()}>{title}</Text>
          {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIconContainer: {
    marginRight: theme.spacing.sm,
  },
  rightIconContainer: {
    marginLeft: theme.spacing.sm,
  },
  // Sizes
  size_sm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  size_md: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  size_lg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  // Variants
  variantPrimary: {
    backgroundColor: theme.colors.primary,
  },
  variantSecondary: {
    backgroundColor: theme.colors.secondary,
  },
  variantOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  variantDanger: {
    backgroundColor: theme.colors.expense,
  },
  variantGhost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  // Typography
  baseText: {
    fontWeight: '600',
  },
  textSize_sm: {
    fontSize: 13,
  },
  textSize_md: {
    fontSize: 15,
  },
  textSize_lg: {
    fontSize: 17,
  },
  textLight: {
    color: '#FFFFFF',
  },
  textOutline: {
    color: theme.colors.primary,
  },
  textGhost: {
    color: theme.colors.textSecondary,
  },
});
