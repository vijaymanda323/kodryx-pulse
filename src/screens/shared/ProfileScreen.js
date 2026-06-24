import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../theme/colors';
import useAuth from '../../hooks/useAuth';
import Card from '../../components/Card';
import Button from '../../components/Button';
import InputField from '../../components/InputField';

const ProfileScreen = () => {
  const { user, logout, changePassword, setupSecurity } = useAuth();
  
  // Change Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loadingPass, setLoadingPass] = useState(false);

  // Security Question Form
  const [question, setQuestion] = useState(user?.securityQuestion || '');
  const [answer, setAnswer] = useState('');
  const [loadingSec, setLoadingSec] = useState(false);

  const handleChangePass = async () => {
    if (!currentPassword.trim() || !newPassword.trim()) {
      Alert.alert('Validation', 'Both current and new password are required');
      return;
    }
    setLoadingPass(true);
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoadingPass(false);
    }
  };

  const handleSetupSecurity = async () => {
    if (!question.trim() || !answer.trim()) {
      Alert.alert('Validation', 'Both question and answer are required');
      return;
    }
    setLoadingSec(true);
    try {
      await setupSecurity(user.email, question, answer);
      Alert.alert('Success', 'Security question updated');
      setAnswer('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save security question');
    } finally {
      setLoadingSec(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header Card */}
        <Card style={styles.profileHeaderCard} useGradient gradientColors={[colors.navy, colors.navyDeep]}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatarCircle, { backgroundColor: user?.avatar?.bg || colors.primary }]}>
              <Text style={[styles.avatarText, { color: user?.avatar?.color || '#FFFFFF' }]}>{user?.avatar?.initials || user?.name?.[0]}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.nameText, { color: '#FFFFFF' }]}>{user?.name}</Text>
              <Text style={styles.roleText}>{user?.role} · {user?.designation || 'Staff'}</Text>
              <Text style={styles.emailText}>{user?.email}</Text>
            </View>
          </View>
        </Card>

      {/* Account Info */}
      <Text style={styles.sectionTitle}>Corporate Profile Details</Text>
      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Department</Text>
          <Text style={styles.infoValue}>{user?.department || 'General'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mobile</Text>
          <Text style={styles.infoValue}>{user?.mobileNumber || '—'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date of Birth</Text>
          <Text style={styles.infoValue}>{user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '—'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>PAN Card</Text>
          <Text style={styles.infoValue}>{user?.panDetails || '—'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Aadhaar Card</Text>
          <Text style={styles.infoValue}>{user?.aadharCard || '—'}</Text>
        </View>
      </Card>

      {/* Security Setup */}
      <Text style={styles.sectionTitle}>Security Settings</Text>
      <Card style={styles.securityCard}>
        <Text style={styles.cardSubtitle}>Configure Backup Security Question</Text>
        <InputField
          label="Security Question"
          value={question}
          onChangeText={setQuestion}
          placeholder="e.g. What was your first pet's name?"
          icon="help-circle-outline"
        />
        <InputField
          label="Security Answer"
          value={answer}
          onChangeText={setAnswer}
          placeholder="Enter answer"
          secureTextEntry
          icon="lock-closed-outline"
        />
        <Button
          title={loadingSec ? 'Saving...' : 'Update Security Question'}
          onPress={handleSetupSecurity}
          loading={loadingSec}
          variant="primary"
        />
      </Card>

      {/* Change Password */}
      <Card style={styles.securityCard}>
        <Text style={styles.cardSubtitle}>Change Account Password</Text>
        <InputField
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter current password"
          secureTextEntry
          icon="key-outline"
        />
        <InputField
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Enter new password"
          secureTextEntry
          icon="lock-closed-outline"
        />
        <Button
          title={loadingPass ? 'Updating...' : 'Update Password'}
          onPress={handleChangePass}
          loading={loadingPass}
          variant="primary"
        />
      </Card>

        <Button
          title="Log Out Account"
          onPress={logout}
          variant="danger"
          style={{ marginTop: 10 }}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  profileHeaderCard: {
    marginTop: 10,
    marginBottom: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  nameText: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  roleText: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    marginTop: 4,
  },
  emailText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: 12,
    marginTop: 10,
  },
  infoCard: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  infoValue: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  securityCard: {
    marginBottom: 20,
  },
  cardSubtitle: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: 16,
  },
  logoutBtn: {
    backgroundColor: colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  logoutBtnText: {
    color: colors.text,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.md,
  },
});

export default ProfileScreen;
