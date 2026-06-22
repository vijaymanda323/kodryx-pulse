import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../theme/colors';
import api from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'leave', label: 'Leaves' },
  { key: 'wfh', label: 'WFH' },
  { key: 'all', label: 'All' },
];

const ManagerApprovalsScreen = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/leaves');
      setLeaves(data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    setActioningId(id);
    // Optimistic UI update
    const previousLeaves = [...leaves];
    setLeaves(prev => prev.map(l => l._id === id ? { ...l, status } : l));

    try {
      await api.put(`/api/leaves/${id}`, { status });
      Alert.alert('Success', `Request has been ${status.toLowerCase()}`);
    } catch (err) {
      console.error(err);
      setLeaves(previousLeaves);
      Alert.alert('Error', err.response?.data?.message || 'Failed to update leave status');
    } finally {
      setActioningId(null);
    }
  };

  const filteredLeaves = leaves.filter(l => {
    if (activeTab === 'pending') return l.status === 'Pending';
    if (activeTab === 'wfh') return l.type === 'Work from Home';
    if (activeTab === 'leave') return l.type !== 'Work from Home';
    return true;
  });

  const getStatusColor = (s) => {
    if (s === 'Approved') return 'success';
    if (s === 'Rejected') return 'danger';
    return 'warning';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Approvals Hub</Text>
          <Text style={styles.subtitle}>Review employee leave & WFH submissions</Text>
        </View>
        {leaves.filter(l => l.status === 'Pending').length > 0 && (
          <Badge variant="warning">
            {leaves.filter(l => l.status === 'Pending').length} Pending
          </Badge>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.activeTabBtn]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : filteredLeaves.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="mail-open-outline" size={40} color={colors.textMuted} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No requests found for this filter.</Text>
        </Card>
      ) : (
        <FlatList
          data={filteredLeaves}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <Card style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.avatarRow}>
                  <View style={[styles.avatarCircle, { backgroundColor: item.employee?.avatar?.bg || colors.border }]}>
                    <Text style={styles.avatarText}>
                      {item.employee?.avatar?.initials || item.employee?.name?.[0] || 'E'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.employeeName}>{item.employee?.name || 'Staff'}</Text>
                    <Text style={styles.employeeDep}>{item.employee?.department || 'Operations'}</Text>
                  </View>
                </View>
                <Badge variant={getStatusColor(item.status)}>{item.status}</Badge>
              </View>

              <View style={styles.requestDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>{item.type}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dates:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(item.startDate).toLocaleDateString()} to {new Date(item.endDate).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration:</Text>
                  <Text style={[styles.detailValue, { fontWeight: '700' }]}>{item.days} Day(s)</Text>
                </View>
                {item.reason ? (
                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonLabel}>Reason:</Text>
                    <Text style={styles.reasonText}>{item.reason}</Text>
                  </View>
                ) : null}
              </View>

              {item.status === 'Pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleAction(item._id, 'Approved')}
                    disabled={actioningId === item._id}
                  >
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleAction(item._id, 'Rejected')}
                    disabled={actioningId === item._id}
                  >
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 4,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabBtn: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  activeTabText: {
    color: colors.text,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    marginBottom: 8,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
  requestCard: {
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
    marginBottom: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: '800',
  },
  employeeName: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  employeeDep: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  requestDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginVertical: 3,
  },
  detailLabel: {
    width: 80,
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  detailValue: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.xs,
  },
  reasonBox: {
    backgroundColor: colors.cardBgSecondary,
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reasonLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  reasonText: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: colors.success + '15',
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  approveBtnText: {
    color: colors.success,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.xs,
  },
  rejectBtn: {
    backgroundColor: colors.danger + '15',
    borderWidth: 1,
    borderColor: colors.danger + '40',
  },
  rejectBtnText: {
    color: colors.danger,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.xs,
  },
});

export default ManagerApprovalsScreen;
