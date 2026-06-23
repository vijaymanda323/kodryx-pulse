import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../../theme/colors';

const WelcomeScreen = ({ navigation }) => {
  const roles = [
    {
      name: 'Founding Team',
      desc: 'Company-wide oversight, all projects and team analytics',
      icon: 'ribbon-outline',
      bg: '#F7F0DF',
      color: '#A07C30',
    },
    {
      name: 'Employee',
      desc: 'My tasks, work logs and productivity tracking',
      icon: 'briefcase-outline',
      bg: '#D1FAE5',
      color: '#065F46',
    },
    {
      name: 'Intern',
      desc: 'Assigned projects, mentors and learning milestones',
      icon: 'school-outline',
      bg: '#FEF3C7',
      color: '#92400E',
    },
    {
      name: 'HR',
      desc: 'People operations, hiring, compliance and policies',
      icon: 'people-outline',
      bg: '#FCE7F3',
      color: '#9D174D',
    },
  ];

  const handleRoleSelect = (roleName) => {
    navigation.navigate('Login', { role: roleName });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>GLOBAL AI PARTNER</Text>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="flash" size={24} color={colors.brand} />
            </View>
            <Text style={styles.title}>KODRYX Pulse</Text>
          </View>
          <Text style={styles.tagline}>Enterprise AI-powered workforce management platform</Text>
        </View>

        <View style={styles.grid}>
          {roles.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.card}
              onPress={() => handleRoleSelect(item.name)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </View>
              <View style={styles.arrowWrap}>
                <Ionicons name="chevron-forward" size={16} color={colors.onNavyMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footerText}>
          © 2026 KODRYX Pulse Inc. · All rights reserved
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  eyebrow: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: typography.weights.bold,
    letterSpacing: 2,
    marginBottom: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoIcon: {
    width: 38,
    height: 38,
    backgroundColor: colors.navyDeep,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(193, 154, 75, 0.35)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: typography.weights.extraBold,
    letterSpacing: -0.5,
  },
  tagline: {
    color: colors.onNavyMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  grid: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.navyDeep,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  cardDesc: {
    color: colors.onNavyMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  arrowWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: colors.onNavyMuted,
    fontSize: 11,
    marginTop: 40,
    textAlign: 'center',
  },
});

export default WelcomeScreen;
