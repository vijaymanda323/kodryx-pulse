import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../theme/colors';
import useAuth from '../../hooks/useAuth';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import Card from '../../components/Card';

const LoginScreen = ({ route, navigation }) => {
  const { role } = route.params || { role: 'Employee' };
  const { login, register, forgotPassword, resetPassword, getSecurityQuestion, resetPasswordSecurity } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Registration Fields
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [panDetails, setPanDetails] = useState('');
  const [aadharCard, setAadharCard] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  // Password recovery fields
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isSecurityMode, setIsSecurityMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');

  const getRoleConfig = (r) => {
    switch (r) {
      case 'Founding Team':
        return { icon: 'crown-outline', label: 'Founding Team', color: colors.accent };
      case 'Employee':
        return { icon: 'briefcase-outline', label: 'Employee', color: colors.success };
      case 'Intern':
        return { icon: 'school-outline', label: 'Intern', color: colors.warning };
      case 'HR':
        return { icon: 'people-outline', label: 'HR', color: colors.primary };
      default:
        return { icon: 'person-outline', label: 'User', color: colors.text };
    }
  };

  const roleConfig = getRoleConfig(role);

  const fillDemoCredentials = () => {
    if (role === 'Founding Team' || role === 'HR') {
      setEmail('ceo@kodryx.ai');
      setPassword('Hello@123');
    } else {
      setEmail('employee@kodryx.ai');
      setPassword('Hello@123');
    }
  };

  const handleAction = async () => {
    setLoading(true);
    try {
      if (isResetMode) {
        let res;
        if (isSecurityMode) {
          res = await resetPasswordSecurity(email, securityAnswer, password);
        } else {
          res = await resetPassword(email, otp, password);
        }
        Alert.alert('Success', res?.message || 'Password reset successful. Please log in.');
        setIsForgotMode(false);
        setIsResetMode(false);
        setIsSecurityMode(false);
        setPassword('');
        setOtp('');
        setSecurityAnswer('');
      } else if (isForgotMode) {
        try {
          const res = await getSecurityQuestion(email);
          if (res && res.securityQuestion) {
            setSecurityQuestion(res.securityQuestion);
            setIsSecurityMode(true);
            setIsResetMode(true);
            Alert.alert('Security Question Found', 'Please answer to reset password.');
            setLoading(false);
            return;
          }
        } catch (e) {
          // Fallback to OTP
        }
        const res = await forgotPassword(email);
        Alert.alert('OTP Sent', res?.message || 'OTP has been sent to your email.');
        setIsResetMode(true);
      } else if (isRegistering) {
        const res = await register({
          name,
          email,
          password,
          role,
          dateOfBirth,
          panDetails,
          aadharCard,
          mobileNumber
        });
        Alert.alert('Success', res?.message || 'Registration successful! Pending HR approval.');
        setIsRegistering(false);
        setPassword('');
      } else {
        await login(email, password, role);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Action failed';
      Alert.alert('Error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Card style={styles.loginCard}>
          <View style={styles.roleHeader}>
            <Ionicons name={roleConfig.icon} size={28} color={roleConfig.color} />
            <Text style={[styles.roleLabel, { color: roleConfig.color }]}>{roleConfig.label}</Text>
          </View>

          <Text style={styles.title}>
            {isRegistering ? 'Create Account' : isResetMode ? 'Reset Password' : isForgotMode ? 'Forgot Password' : 'Welcome Back'}
          </Text>
          <Text style={styles.subtitle}>
            {isRegistering ? 'Register for your workspace account' : 'Sign in to access your secure employee dashboard'}
          </Text>

          {isRegistering && (
            <>
              <InputField label="Full Name" value={name} onChangeText={setName} placeholder="John Doe" icon="person-outline" />
              <InputField label="Date of Birth" value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" icon="calendar-outline" />
              <View style={styles.row}>
                <InputField label="PAN Card" value={panDetails} onChangeText={setPanDetails} placeholder="ABCDE1234F" style={{ flex: 1, marginRight: 8 }} />
                <InputField label="Aadhaar Card" value={aadharCard} onChangeText={setAadharCard} placeholder="1234 5678 9012" style={{ flex: 1 }} />
              </View>
              <InputField label="Mobile Number" value={mobileNumber} onChangeText={setMobileNumber} placeholder="+91 9876543210" keyboardType="phone-pad" icon="call-outline" />
            </>
          )}

          <InputField
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@company.com"
            keyboardType="email-address"
            icon="mail-outline"
            disabled={isResetMode}
          />

          {isResetMode && isSecurityMode && (
            <View style={styles.securityBox}>
              <Text style={styles.securityLabel}>Security Question</Text>
              <Text style={styles.securityText}>{securityQuestion}</Text>
              <InputField label="Security Answer" value={securityAnswer} onChangeText={setSecurityAnswer} placeholder="Your answer" icon="lock-closed-outline" />
            </View>
          )}

          {isResetMode && !isSecurityMode && (
            <InputField label="6-Digit OTP" value={otp} onChangeText={setOtp} placeholder="123456" keyboardType="number-pad" icon="key-outline" />
          )}

          {(!isForgotMode || isResetMode) && (
            <InputField
              label={isResetMode ? 'New Password' : 'Password'}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              icon="lock-closed-outline"
            />
          )}

          {!isRegistering && !isForgotMode && (
            <TouchableOpacity onPress={() => setIsForgotMode(true)} style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <Button
            title={loading ? 'Processing...' : isResetMode ? 'Reset Password' : isForgotMode ? 'Send OTP' : isRegistering ? 'Register' : 'Sign In'}
            onPress={handleAction}
            loading={loading}
            variant="primary"
          />

          {!isForgotMode && (
            <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={styles.toggleModeBtn}>
              <Text style={styles.toggleModeText}>
                {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
          )}

          {isForgotMode && (
            <TouchableOpacity
              onPress={() => {
                setIsForgotMode(false);
                setIsResetMode(false);
                setIsSecurityMode(false);
              }}
              style={styles.toggleModeBtn}
            >
              <Text style={styles.toggleModeText}>Back to Sign In</Text>
            </TouchableOpacity>
          )}

          {!isRegistering && !isForgotMode && (
            <TouchableOpacity onPress={fillDemoCredentials} style={styles.demoBtn}>
              <Ionicons name="sparkles-outline" size={16} color={colors.accent} />
              <Text style={styles.demoText}>Quick Fill Demo Credentials</Text>
            </TouchableOpacity>
          )}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    marginLeft: 8,
    fontWeight: typography.weights.medium,
  },
  loginCard: {
    paddingVertical: 24,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginLeft: 8,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotText: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.sm,
  },
  toggleModeBtn: {
    alignItems: 'center',
    marginTop: 16,
  },
  toggleModeText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.accent + '50',
    borderRadius: 8,
    backgroundColor: colors.accent + '05',
  },
  demoText: {
    color: colors.accent,
    marginLeft: 6,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.sm,
  },
  securityBox: {
    backgroundColor: colors.cardBgSecondary,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  securityLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    marginBottom: 4,
  },
  securityText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: 12,
  },
});

export default LoginScreen;
