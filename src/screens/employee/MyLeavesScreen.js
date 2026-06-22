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
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../theme/colors';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import Card from '../../components/Card';
import Button from '../../components/Button';
import InputField from '../../components/InputField';
import Badge from '../../components/Badge';

const LEAVE_TYPES = [
  { value: 'Annual leave', label: 'Annual Leave', icon: 'sunny-outline', color: colors.accent },
  { value: 'Sick leave', label: 'Sick Leave', icon: 'medical-outline', color: colors.primary },
  { value: 'Personal', label: 'Personal', icon: 'person-outline', color: colors.info },
  { value: 'Work from Home', label: 'WFH', icon: 'home-outline', color: colors.success },
];

const MyLeavesScreen = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [leaveType, setLeaveType] = useState('Annual leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchLeavesData();
  }, []);

  const fetchLeavesData = async () => {
    try {
      setLoading(true);
      const [leavesRes, balanceRes] = await Promise.all([
        api.get('/api/leaves'),
        user?._id ? api.get(`/api/leaves/balance/${user._id}`).catch(() => ({ data: null })) : Promise.resolve({ data: null })
      ]);
      setLeaves(leavesRes.data || []);
      setBalance(balanceRes.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load leaves data');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0;
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleApply = async () => {
    const days = calculateDays(startDate, endDate);
    if (days <= 0) {
      Alert.alert('Validation Error', 'End date must be after or equal to start date (use format YYYY-MM-DD)');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Validation Error', 'Please specify a reason');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/leaves', {
        type: leaveType,
        startDate,
        endDate,
        reason,
        days
      });
      Alert.alert('Success', 'Leave request submitted successfully');
      setShowApplyModal(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchLeavesData();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to submit request';
      Alert.alert('Error', errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const totalDays = calculateDays(startDate, endDate);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Leaves & WFH</Text>
            <Text style={styles.subtitle}>Track balance and request time off</Text>
          </View>
          <TouchableOpacity style={styles.applyBtn} onPress={() => setShowApplyModal(true)}>
            <Ionicons name="add" size={20} color={colors.text} style={{ marginRight: 4 }} />
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Widget */}
        {balance && (
          <View style={styles.balanceGrid}>
            <Card style={[styles.balanceCard, { borderLeftColor: colors.success, borderLeftWidth: 3 }]}>
              <Text style={[styles.balanceVal, { color: colors.success }]}>{balance.available}</Text>
              <Text style={styles.balanceLabel}>Available</Text>
            </Card>

            <Card style={[styles.balanceCard, { borderLeftColor: colors.warning, borderLeftWidth: 3 }]}>
              <Text style={[styles.balanceVal, { color: colors.warning }]}>{balance.taken}</Text>
              <Text style={styles.balanceLabel}>Taken</Text>
            </Card>

            <Card style={[styles.balanceCard, { borderLeftColor: colors.primary, borderLeftWidth: 3 }]}>
              <Text style={[styles.balanceVal, { color: colors.primary }]}>{balance.total}</Text>
              <Text style={styles.balanceLabel}>Total Allowed</Text>
            </Card>
          </View>
        )}

        <Text style={styles.sectionTitle}>Request History</Text>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : leaves.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={36} color={colors.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No leave or WFH requests logged yet.</Text>
          </Card>
        ) : (
          leaves.map((l) => (
            <Card key={l._id} style={styles.historyCard}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyType}>{l.type}</Text>
                  <Text style={styles.historyDates}>
                    {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}
                  </Text>
                </View>
                <Badge variant={l.status === 'Approved' ? 'success' : l.status === 'Rejected' ? 'danger' : 'warning'}>
                  {l.status}
                </Badge>
              </View>
              <Text style={styles.historyDays}>{l.days} Day{l.days > 1 ? 's' : ''}</Text>
              {l.reason ? <Text style={styles.historyReason}>"{l.reason}"</Text> : null}
            </Card>
          ))
        )}
      </ScrollView>

      {/* Apply Leave Modal */}
      <Modal visible={showApplyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Request Leave / WFH</Text>
                <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Leave Type Grid */}
              <Text style={styles.modalInputLabel}>Request Type</Text>
              <View style={styles.typeGrid}>
                {LEAVE_TYPES.map((lt) => (
                  <TouchableOpacity
                    key={lt.value}
                    style={[
                      styles.typeCard,
                      leaveType === lt.value && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                    ]}
                    onPress={() => setLeaveType(lt.value)}
                  >
                    <Ionicons name={lt.icon} size={20} color={leaveType === lt.value ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.typeLabel, leaveType === lt.value && { color: colors.primary, fontWeight: '700' }]}>
                      {lt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row}>
                <InputField
                  label="Start Date (YYYY-MM-DD)"
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="e.g. 2026-06-25"
                  style={{ flex: 1, marginRight: 10 }}
                />
                <InputField
                  label="End Date (YYYY-MM-DD)"
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="e.g. 2026-06-26"
                  style={{ flex: 1 }}
                />
              </View>

              {totalDays > 0 && (
                <View style={[styles.daysDurationBox, { backgroundColor: leaveType === 'Work from Home' ? colors.info + '20' : colors.primary + '20' }]}>
                  <Text style={[styles.daysDurationText, { color: leaveType === 'Work from Home' ? colors.info : colors.primary }]}>
                    Duration: {totalDays} Day{totalDays > 1 ? 's' : ''} {leaveType === 'Work from Home' ? '(WFH — No deduction)' : '(Leave)'}
                  </Text>
                </View>
              )}

              <InputField
                label="Reason"
                value={reason}
                onChangeText={setReason}
                placeholder="Reason for request..."
                multiline
                numberOfLines={3}
              />

              <Button
                title={submitting ? 'Submitting...' : 'Submit Request'}
                onPress={handleApply}
                loading={submitting}
                variant="primary"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
    marginTop: 40,
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
  applyBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  applyBtnText: {
    color: colors.text,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  balanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  balanceCard: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  balanceVal: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  balanceLabel: {
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
  historyCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyType: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  historyDates: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },
  historyDays: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginTop: 8,
  },
  historyReason: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontStyle: 'italic',
    marginTop: 6,
    backgroundColor: colors.cardBgSecondary,
    padding: 8,
    borderRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 16,
  },
  modalTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  modalInputLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: 10,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  typeCard: {
    width: '48%',
    backgroundColor: colors.cardBgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
  },
  daysDurationBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  daysDurationText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
});

export default MyLeavesScreen;
