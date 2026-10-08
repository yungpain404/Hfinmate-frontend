import React, { useState } from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { DEFAULT_GOOGLE_AVATAR_URI } from '../constants/avatar';

export interface UserAvatarProps {
  avatarUrl?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
  iconColor?: string;
  backgroundColor?: string;
}

/**
 * UserAvatar
 * Renders user's Google/profile avatar when available,
 * otherwise displays an elegant user icon fallback.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  size = 34,
  style,
  iconColor = theme.colors.primary,
  backgroundColor = '#EAF5EF',
}) => {
  const [imageError, setImageError] = useState(false);

  const effectiveAvatar = avatarUrl || DEFAULT_GOOGLE_AVATAR_URI;

  // Reset error state if avatarUrl changes
  const [lastUrl, setLastUrl] = useState<string | null | undefined>(effectiveAvatar);
  if (effectiveAvatar !== lastUrl) {
    setLastUrl(effectiveAvatar);
    setImageError(false);
  }

  const hasValidAvatar = Boolean(effectiveAvatar && !imageError);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      {hasValidAvatar ? (
        <Image
          source={{ uri: effectiveAvatar }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <Ionicons
          name="person"
          size={Math.round(size * 0.52)}
          color={iconColor}
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
});
