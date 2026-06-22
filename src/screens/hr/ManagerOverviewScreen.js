import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../theme/colors';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import Card from '../../components/Card';
import Badge from '../../components/Badge';

const ManagerOverviewScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [projects, setProjects] = useState([]);
  const [people, setPeople] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [logs, setLogs] = useState([]);

  const fetchManagerData = useCallback(async () => {
    try {
      const todayStr = new Date().toLocaleDateString('en-CA');
      const [projRes, userRes, escRes, leavesRes, logsRes] = await Promise.all([
        api.get('/api/projects').catch(() => ({ data: [] })),
        api.get('/api/users').catch(() => ({ data: [] })),
        api.get('/api/escalations').catch(() => ({ data: [] })),
        api.get('/api/leaves').catch(() => ({ data: [] })),
        api.get(`/api/daily-status?date=${todayStr}`).catch(() => ({ data: [] }))
      ]);

      setProjects(projRes.data || []);
      setPeople(userRes.data || []);
      setEscalations(escRes.data || []);
      setLeaves(leavesRes.data || []);
      setLogs(logsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchManagerData();
  }, [fetchManagerData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchManagerData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Syncing Management Hub...</Text>
      </View>
    );
  }

  const todayStr = new Date().toLocaleDateString('en-CA');
  const approvedLeavesToday = leaves.filter(l => 
    l.status === 'Approved' && 
    l.startDate <= todayStr && 
    l.endDate >= todayStr
  );

  const onLeaveIds = new Set(
    approvedLeavesToday
      .map(l => l.employee?._id || l.employee)
      .filter(Boolean)
      .map(id => id.toString())
  );
  
  const presentEmployees = people.filter(p => p && p._id && !onLeaveIds.has(p._id.toString()));
  const pendingLeaves = leaves.filter(l => l.status === 'Pending');

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Management Dashboard</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            {` · ${user?.role}`}
          </Text>
        </View>
        <Badge variant="brand">Admin Portal</Badge>
      </View>

      {/* Admin Quick stats */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Ionicons name="folder-open-outline" size={24} color={colors.accent} style={styles.statIcon} />
          <Text style={styles.statVal}>{projects.length}</Text>
          <Text style={styles.statLabel}>Active Projects</Text>
        </Card>

        <Card style={styles.statCard}>
          <Ionicons name="people-outline" size={24} color={colors.success} style={styles.statIcon} />
          <Text style={styles.statVal}>{people.length}</Text>
          <Text style={styles.statLabel}>Staff Count</Text>
        </Card>

        <TouchableOpacity 
          style={styles.statCardWrapper} 
          onPress={() => navigation.navigate('Approvals')}
        >
          <Card style={styles.statCard}>
            <Ionicons name="airplane-outline" size={24} color={colors.primary} style={styles.statIcon} />
            <Text style={[styles.statVal, { color: colors.primary }]}>{pendingLeaves.length}</Text>
            <Text style={styles.statLabel}>Pending Leaves</Text>
          </Card>
        </TouchableOpacity>

        <Card style={styles.statCard}>
          <Ionicons name="warning-outline" size={24} color={colors.danger} style={styles.statIcon} />
          <Text style={[styles.statVal, { color: colors.danger }]}>
            {escalations.filter(e => e.status !== 'Resolved').length}
          </Text>
          <Text style={styles.statLabel}>Escalations</Text>
        </Card>
      </View>

      {/* Today's Attendance Split */}
      <Card style={styles.attendanceCard}>
        <Text style={styles.cardTitle}>Today's Attendance</Text>
        
        <View style={styles.attendanceSplit}>
          {/* Coming */}
          <View style={styles.attendanceCol}>
            <Text style={[styles.attendanceHeading, { color: colors.success }]}>
              <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} /> Present ({presentEmployees.length})
            </Text>
            {presentEmployees.map(emp => (
              <View key={emp._id} style={styles.attendanceBadge}>
                <Text style={styles.attendanceBadgeText}>{emp.name}</Text>
              </View>
            ))}
            {presentEmployees.length === 0 && <Text style={styles.emptyText}>No present records.</Text>}
          </View>

          {/* On Leave */}
          <View style={styles.attendanceCol}>
            <Text style={[styles.attendanceHeading, { color: colors.danger }]}>
              <Ionicons name="airplane-outline" size={14} color={colors.danger} /> Leave/WFH ({approvedLeavesToday.length})
            </Text>
            {approvedLeavesToday.map(leave => (
              <View key={leave._id} style={[styles.attendanceBadge, { borderColor: colors.danger + '40' }]}>
                <Text style={styles.attendanceBadgeText}>{leave.employee?.name || 'Staff'}</Text>
                <Badge variant={leave.type === 'Work from Home' ? 'info' : 'danger'} style={{ marginTop: 2 }}>
                  {leave.type === 'Work from Home' ? 'WFH' : 'Leave'}
                </Badge>
              </View>
            ))}
            {approvedLeavesToday.length === 0 && <Text style={styles.emptyText}>No leaves today.</Text>}
          </View>
        </View>
      </Card>

      {/* Projects list */}
      <Text style={styles.sectionTitle}>Active Projects</Text>
      {projects.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyCardText}>No active projects found.</Text>
        </Card>
      ) : (
        projects.slice(0, 4).map((p) => (
          <Card key={p._id} style={styles.projectListItem}>
            <View style={styles.projectItemRow}>
              <View style={[styles.projectIconBox, { backgroundColor: p.iconBg || colors.primary + '15' }]}>
                <Ionicons name="folder-outline" size={20} color={p.iconColor || colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.projectName}>{p.name}</Text>
                <Text style={styles.projectDesc} numberOfLines={1}>{p.description || 'No description'}</Text>
              </View>
              <Badge variant={p.status === 'At risk' ? 'danger' : p.status === 'On track' ? 'success' : 'info'}>
                {p.status}
              </Badge>
            </View>
          </Card>
        ))
      )}

      {/* Active Escalations */}
      <Text style={styles.sectionTitle}>Escalations</Text>
      {escalations.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyCardText}>No active escalations.</Text>
        </Card>
      ) : (
        escalations.filter(e => e.status !== 'Resolved').slice(0, 3).map((esc) => (
          <Card key={esc._id} style={styles.escalationCard}>
            <View style={styles.escHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.escTitle}>{esc.title}</Text>
                <Text style={styles.escMeta}>By: {esc.raisedBy?.name || 'Staff'}</Text>
              </View>
              <Badge variant={esc.level === 'Red' ? 'danger' : esc.level === 'Amber' ? 'warning' : 'info'}>
                {esc.level} Alert
              </Badge>
            </View>
            <Text style={styles.escDesc}>{esc.description}</Text>
          </Card>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: typography.sizes.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    marginTop: Platform.OS === 'ios' ? 40 : 20,
  },
  greeting: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  date: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCardWrapper: {
    width: '48%',
  },
  statCard: {
    width: '48%',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statIcon: {
    marginBottom: 8,
  },
  statVal: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },
  attendanceCard: {
    marginBottom: 20,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: 16,
  },
  attendanceSplit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attendanceCol: {
    width: '48%',
  },
  attendanceHeading: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    marginBottom: 10,
  },
  attendanceBadge: {
    backgroundColor: colors.cardBgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 6,
    alignSelf: 'stretch',
  },
  attendanceBadgeText: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontStyle: 'italic',
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
    paddingVertical: 20,
    marginBottom: 10,
  },
  emptyCardText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  projectListItem: {
    marginBottom: 10,
  },
  projectItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectName: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  projectDesc: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  escalationCard: {
    marginBottom: 10,
  },
  escHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
    marginBottom: 8,
  },
  escTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  escMeta: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  escDesc: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    lineHeight: 16,
  },
});

export default ManagerOverviewScreen;
