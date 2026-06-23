import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../theme/colors';
import useAuth from '../../hooks/useAuth';
import Card from '../../components/Card';

const LoginScreen = ({ route, navigation }) => {
  const { role } = route.params || { role: 'Employee' };
  const { login, register, forgotPassword, resetPassword, getSecurityQuestion, resetPasswordSecurity } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        return { icon: 'ribbon-outline', label: 'Founding Team', color: colors.brandDark, bg: colors.brandLight };
      case 'Employee':
        return { icon: 'briefcase-outline', label: 'Employee', color: '#065F46', bg: '#D1FAE5' };
      case 'Intern':
        return { icon: 'school-outline', label: 'Intern', color: '#92400E', bg: '#FEF3C7' };
      case 'HR':
        return { icon: 'people-outline', label: 'HR', color: '#9D174D', bg: '#FCE7F3' };
      default:
        return { icon: 'person-outline', label: 'User', color: colors.text, bg: colors.backgroundSecondary };
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
      let errMsg = err.response?.data?.message || err.message || 'Action failed';
      if (typeof errMsg !== 'string') errMsg = JSON.stringify(errMsg);
      Alert.alert('Error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
          <Text style={styles.backText}>Back to role select</Text>
        </TouchableOpacity>

        <Card style={styles.loginCard}>
          {/* Logo */}
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="flash" size={16} color={colors.brand} />
            </View>
            <Text style={styles.logoText}>KODRYX Pulse</Text>
          </View>

          {/* Role Pill */}
          <View style={[styles.rolePill, { backgroundColor: roleConfig.bg }]}>
            <Ionicons name={roleConfig.icon} size={14} color={roleConfig.color} />
            <Text style={[styles.roleLabel, { color: roleConfig.color }]}>{roleConfig.label}</Text>
          </View>

          <Text style={styles.title}>
            {isRegistering ? 'Create Account' : isResetMode ? 'Reset Password' : isForgotMode ? 'Forgot Password' : 'Welcome back'}
          </Text>
          <Text style={styles.subtitle}>
            {isRegistering ? 'Register for a new workspace account' : 'Sign in to access your workspace'}
          </Text>

          {/* Form */}
          <View style={styles.form}>
            {isRegistering && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    placeholderTextColor={colors.textMuted}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Date of Birth</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    value={dateOfBirth}
                    onChangeText={setDateOfBirth}
                  />
                </View>
                <View style={styles.row}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.formLabel}>PAN Card</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="ABCDE1234F"
                      placeholderTextColor={colors.textMuted}
                      value={panDetails}
                      onChangeText={setPanDetails}
                      autoCapitalize="characters"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Aadhaar Card</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="1234 5678 9012"
                      placeholderTextColor={colors.textMuted}
                      value={aadharCard}
                      onChangeText={setAadharCard}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Mobile Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+91 9876543210"
                    placeholderTextColor={colors.textMuted}
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    keyboardType="phone-pad"
                  />
                </View>
              </>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email Address</Text>
              <TextInput
                style={[styles.input, isResetMode && styles.disabledInput]}
                placeholder="you@company.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isResetMode}
              />
            </View>

            {isResetMode && isSecurityMode && (
              <View style={styles.securityBox}>
                <Text style={styles.securityLabel}>Security Question</Text>
                <Text style={styles.securityText}>{securityQuestion}</Text>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Security Answer</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Your answer"
                    placeholderTextColor={colors.textMuted}
                    value={securityAnswer}
                    onChangeText={setSecurityAnswer}
                  />
                </View>
              </View>
            )}

            {isResetMode && !isSecurityMode && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>6-Digit OTP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  placeholderTextColor={colors.textMuted}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                />
              </View>
            )}

            {(!isForgotMode || isResetMode) && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{isResetMode ? 'New Password' : 'Password'}</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, { flex: 1, borderHeight: 0 }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!isRegistering && !isForgotMode && (
              <TouchableOpacity onPress={() => setIsForgotMode(true)} style={styles.forgotLink}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleAction}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Text style={styles.submitBtnText}>
                {loading ? 'Processing...' : isResetMode ? 'Reset Password' : isForgotMode ? 'Send OTP' : isRegistering ? 'Create Account' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {!isForgotMode && (
              <TouchableOpacity
                onPress={() => setIsRegistering(!isRegistering)}
                style={styles.toggleBtn}
              >
                <Text style={styles.toggleBtnText}>
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
                style={styles.toggleBtn}
              >
                <Text style={styles.toggleBtnText}>Back to Sign In</Text>
              </TouchableOpacity>
            )}

            {!isRegistering && !isForgotMode && (
              <TouchableOpacity onPress={fillDemoCredentials} style={styles.demoBtn} activeOpacity={0.8}>
                <Ionicons name="sparkles" size={14} color={colors.brand} />
                <Text style={styles.demoText}>Quick Fill Demo Credentials</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 15,
    paddingBottom: 40,
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginLeft: 6,
    fontWeight: typography.weights.medium,
  },
  loginCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    width: 32,
    height: 32,
    backgroundColor: colors.navy,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    fontSize: 18,
    fontWeight: typography.weights.extraBold,
    color: colors.navy,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: typography.weights.bold,
    marginLeft: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  form: {
    width: '100%',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 44,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  disabledInput: {
    backgroundColor: colors.backgroundSecondary,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  eyeBtn: {
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -4,
  },
  forgotText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: typography.weights.semibold,
  },
  submitBtn: {
    height: 44,
    backgroundColor: colors.brand,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: typography.weights.bold,
  },
  toggleBtn: {
    alignItems: 'center',
    marginTop: 16,
  },
  toggleBtnText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: typography.weights.semibold,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    height: 40,
    borderWidth: 1.5,
    borderColor: colors.brandLight,
    borderRadius: 10,
    backgroundColor: colors.brandLight,
  },
  demoText: {
    color: colors.brandDark,
    marginLeft: 6,
    fontWeight: typography.weights.bold,
    fontSize: 13,
  },
  securityBox: {
    backgroundColor: colors.backgroundSecondary,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  securityLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    marginBottom: 4,
  },
  securityText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: typography.weights.bold,
    marginBottom: 12,
  },
});

export default LoginScreen;
