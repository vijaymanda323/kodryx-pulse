import React from 'react';
import { StyleSheet, Text, View, Image, ImageBackground } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, typography } from '../../theme/colors';
import Button from '../../components/Card';
import AppButton from '../../components/Button';

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>K</Text>
          </View>
          <Text style={styles.title}>Kodryx Pulse</Text>
          <Text style={styles.subtitle}>Unified Enterprise AI & Workflow Platform</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.tagline}>
            Streamline tasks, projects, payroll, and team metrics in one powerful workspace.
          </Text>
          <AppButton
            title="Get Started"
            onPress={() => navigation.navigate('Login')}
            variant="primary"
            style={styles.button}
          />
          <Text style={styles.version}>Version 1.0.0 · Secure Workspace</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    padding: 24,
    justifyContent: 'space-between',
    paddingTop: 100,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 20,
  },
  logoText: {
    color: colors.text,
    fontSize: 40,
    fontWeight: typography.weights.extraBold,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.extraBold,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
  },
  tagline: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  button: {
    width: '100%',
  },
  version: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 20,
  },
});

export default WelcomeScreen;
