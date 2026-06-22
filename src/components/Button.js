import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography } from '../theme/colors';

const Button = ({
  onPress,
  title,
  variant = 'primary', // 'primary', 'secondary', 'danger', 'ghost'
  loading = false,
  disabled = false,
  style,
  textStyle
}) => {
  const isGhost = variant === 'ghost';
  
  const getGradientColors = () => {
    switch (variant) {
      case 'primary':
        return [colors.primary, colors.secondary];
      case 'secondary':
        return [colors.cardBgSecondary, colors.border];
      case 'danger':
        return ['#EA4335', '#C5221F'];
      default:
        return [colors.primary, colors.secondary];
    }
  };

  const getBorderColor = () => {
    if (variant === 'ghost') return colors.primary;
    return 'transparent';
  };

  const getTextColor = () => {
    if (isGhost) return colors.primary;
    if (variant === 'secondary') return colors.textSecondary;
    return colors.text;
  };

  if (isGhost) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          styles.button,
          { borderColor: getBorderColor(), borderWidth: 1, backgroundColor: 'transparent' },
          disabled && styles.disabled,
          style
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, disabled && styles.disabled, style]}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  disabled: {
    opacity: 0.5,
  }
});

export default Button;
