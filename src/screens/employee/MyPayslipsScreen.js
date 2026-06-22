import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../theme/colors';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';

const MyPayslipsScreen = () => {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPay, setSelectedPay] = useState(null);

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/payroll/me');
      setPayslips(data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  const parseVal = (val) => {
    if (!val) return 0;
    return parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
  };

  const ytdNet = payslips.reduce((sum, p) => sum + parseVal(p.netPay || p.baseSalary), 0);
  const ytdDeductions = payslips.reduce((sum, p) => sum + parseVal(p.deductions), 0);

  const handleViewPayslip = (pay) => {
    setSelectedPay(pay);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Payslips</Text>
            <Text style={styles.subtitle}>View your payroll records</Text>
          </View>
          <Badge variant="info">{payslips.length} Record{payslips.length !== 1 ? 's' : ''}</Badge>
        </View>

        {/* YTD Stats */}
        {payslips.length > 0 && (
          <View style={styles.statsGrid}>
            <Card style={[styles.statCard, { borderLeftColor: colors.success, borderLeftWidth: 3 }]}>
              <Text style={[styles.statVal, { color: colors.success }]}>
                ₹{ytdNet.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.statLabel}>YTD Net Earned</Text>
            </Card>

            <Card style={[styles.statCard, { borderLeftColor: colors.danger, borderLeftWidth: 3 }]}>
              <Text style={[styles.statVal, { color: colors.danger }]}>
                ₹{ytdDeductions.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.statLabel}>YTD Deductions</Text>
            </Card>
          </View>
        )}

        <Text style={styles.sectionTitle}>History</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : payslips.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={36} color={colors.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No payslips issued yet.</Text>
          </Card>
        ) : (
          payslips.map((pay) => (
            <Card key={pay._id} style={styles.payslipCard}>
              <View style={styles.payslipHeader}>
                <View>
                  <Text style={styles.periodText}>{pay.month} {pay.year}</Text>
                  <Text style={styles.baseText}>Base: ₹{pay.baseSalary}</Text>
                </View>
                <Badge variant={pay.status === 'Paid' ? 'success' : 'warning'}>
                  {pay.status}
                </Badge>
              </View>

              <View style={styles.payslipDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Net Salary</Text>
                  <Text style={styles.detailValue}>₹{pay.netPay || pay.baseSalary}</Text>
                </View>
                {pay.deductions ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Deductions</Text>
                    <Text style={[styles.detailValue, { color: colors.danger }]}>- ₹{pay.deductions}</Text>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity style={styles.viewBtn} onPress={() => handleViewPayslip(pay)}>
                <Ionicons name="eye-outline" size={16} color={colors.primary} />
                <Text style={styles.viewBtnText}>View Receipt</Text>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Digital Receipt Modal */}
      <Modal visible={!!selectedPay} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.receiptContainer}>
            <View style={styles.receiptHeader}>
              <View style={styles.logoRow}>
                <View style={styles.logoCircle}>
                  <Text style={styles.logoText}>K</Text>
                </View>
                <Text style={styles.logoTitle}>KODRYX Pulse</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedPay(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedPay && (
              <View style={styles.receiptContent}>
                <Text style={styles.receiptPeriod}>{selectedPay.month} {selectedPay.year}</Text>
                <Text style={styles.receiptUser}>{user?.name || 'Employee'}</Text>
                
                <View style={styles.divider} />
                
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Base Salary</Text>
                  <Text style={styles.receiptValue}>₹{selectedPay.baseSalary}</Text>
                </View>

                {selectedPay.deductions ? (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Deductions</Text>
                    <Text style={[styles.receiptValue, { color: colors.danger }]}>- ₹{selectedPay.deductions}</Text>
                  </View>
                ) : null}

                <View style={styles.divider} />

                <View style={[styles.receiptRow, { marginTop: 10 }]}>
                  <Text style={styles.netLabel}>Net Salary Paid</Text>
                  <Text style={styles.netValue}>₹{selectedPay.netPay || selectedPay.baseSalary}</Text>
                </View>

                <View style={styles.statusBox}>
                  <Text style={styles.statusBoxText}>Payment status: {selectedPay.status}</Text>
                </View>
              </View>
            )}

            <Button title="Close" variant="secondary" onPress={() => setSelectedPay(null)} />
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginTop: 0,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  statCard: {
    width: '48%',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  statVal: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: 12,
    marginTop: 10,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    marginBottom: 8,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
  payslipCard: {
    marginBottom: 12,
  },
  payslipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
    marginBottom: 10,
  },
  periodText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  baseText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  payslipDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  detailValue: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderRadius: 8,
    backgroundColor: colors.primary + '05',
  },
  viewBtnText: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.xs,
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  receiptContainer: {
    width: '90%',
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  logoTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  receiptContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  receiptPeriod: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  receiptUser: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: 4,
    marginBottom: 12,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 6,
  },
  receiptLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  receiptValue: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  netLabel: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  netValue: {
    color: colors.success,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  statusBox: {
    backgroundColor: colors.success + '20',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  statusBoxText: {
    color: colors.success,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
});

export default MyPayslipsScreen;
