import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

export interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
  iconColor?: string;
  backgroundColor?: string;
}

const AVATAR_PALETTE = [
  '#004B2C', // HFinmate Deep Green
  '#1E88E5', // Google Blue
  '#2E7D32', // Forest Green
  '#E53935', // Google Red
  '#FB8C00', // Amber Orange
  '#8E24AA', // Royal Purple
  '#00897B', // Teal
  '#0284C7', // Sky Blue
];

/**
 * Computes initials from display name or email
 */
function extractInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return words[0].slice(0, 1).toUpperCase();
  }
  if (email && email.trim()) {
    return email.trim().charAt(0).toUpperCase();
  }
  return '';
}

/**
 * Computes a deterministic vibrant color based on seed string
 */
function getInitialsColor(seed: string): string {
  if (!seed) return theme.colors.primary;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}

/**
 * UserAvatar Component
 * Primary: Renders remote user.photoURL with smooth edge caching.
 * Fallback: If photoURL is null, empty, or fails to load (network error/404),
 * falls back gracefully to a generated initials avatar or default person icon.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  name,
  email,
  size = 34,
  style,
  iconColor = '#FFFFFF',
  backgroundColor,
}) => {
  const [imageError, setImageError] = useState(false);

  // Reset error state if avatarUrl changes
  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const hasValidPhoto = Boolean(avatarUrl && avatarUrl.trim().length > 0 && !imageError);
  const initials = extractInitials(name, email);
  const seedString = name || email || '';
  const fallbackBgColor = backgroundColor || (initials ? getInitialsColor(seedString) : '#E2E8F0');

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: hasValidPhoto ? '#F1F5F9' : fallbackBgColor,
        },
        style,
      ]}
    >
      {hasValidPhoto ? (
        <Image
          source={{ uri: avatarUrl! }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : initials ? (
        <Text
          style={[
            styles.initialsText,
            {
              fontSize: Math.round(size * 0.42),
              color: '#FFFFFF',
            },
          ]}
          numberOfLines={1}
        >
          {initials}
        </Text>
      ) : (
        <Ionicons
          name="person"
          size={Math.round(size * 0.52)}
          color={iconColor === '#FFFFFF' ? '#64748B' : iconColor}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initialsText: {
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
