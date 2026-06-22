import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme/colors';

const Badge = ({ children, variant = 'info' }) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: 'rgba(57, 193, 140, 0.15)', text: colors.success };
      case 'danger':
      case 'error':
        return { bg: 'rgba(240, 84, 84, 0.15)', text: colors.danger };
      case 'warning':
        return { bg: 'rgba(255, 211, 105, 0.15)', text: colors.warning };
      case 'info':
        return { bg: 'rgba(61, 132, 255, 0.15)', text: colors.info };
      default:
        return { bg: colors.border, text: colors.textSecondary };
    }
  };

  const styleColors = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: styleColors.bg }]}>
      <Text style={[styles.text, { color: styleColors.text }]}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
});

export default Badge;
