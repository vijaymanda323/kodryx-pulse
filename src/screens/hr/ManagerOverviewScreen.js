import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../theme/colors';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import Card from '../../components/Card';
import Badge from '../../components/Badge';

const { width } = Dimensions.get('window');

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
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand} />
        <Text style={styles.loadingText}>Synthesizing Overview...</Text>
      </SafeAreaView>
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
  const activeEscalations = escalations.filter(e => e.status !== 'Resolved');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
        }
      >
      {/* Greeting and Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Good morning, {user?.name?.split(' ')[0] || 'Admin'} 👋</Text>
          <Text style={styles.dateSub}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            {` · ${people.length} people · ${projects.length} projects`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.escalateBtn}
          onPress={() => navigation.navigate('Escalations')}
        >
          <Ionicons name="alert-circle-outline" size={14} color="#FFFFFF" />
          <Text style={styles.escalateBtnText}>Escalate</Text>
        </TouchableOpacity>
      </View>

      {/* AI Insights Quick-Access Banner */}
      <TouchableOpacity
        style={styles.aiBanner}
        onPress={() => navigation.navigate('AIInsights')}
        activeOpacity={0.9}
      >
        <View style={styles.aiBannerLeft}>
          <View style={styles.aiIconCircle}>
            <Ionicons name="sparkles" size={16} color={colors.brand} />
          </View>
          <View>
            <Text style={styles.aiBannerTitle}>AI Insights Center</Text>
            <Text style={styles.aiBannerSub}>View live briefings, risks, and recommendations</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.brand} />
      </TouchableOpacity>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('Projects')}
          activeOpacity={0.8}
        >
          <View style={[styles.statAccent, { backgroundColor: colors.brand }]} />
          <Ionicons name="folder-outline" size={20} color={colors.brand} style={styles.statIcon} />
          <Text style={styles.statVal}>{projects.length}</Text>
          <Text style={styles.statLabel}>Active Projects</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('Team')}
          activeOpacity={0.8}
        >
          <View style={[styles.statAccent, { backgroundColor: colors.success }]} />
          <Ionicons name="people-outline" size={20} color={colors.success} style={styles.statIcon} />
          <Text style={styles.statVal}>{people.length}</Text>
          <Text style={styles.statLabel}>Team Members</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('Approvals')}
          activeOpacity={0.8}
        >
          <View style={[styles.statAccent, { backgroundColor: colors.primary }]} />
          <Ionicons name="airplane-outline" size={20} color={colors.primary} style={styles.statIcon} />
          <Text style={[styles.statVal, { color: colors.primary }]}>{pendingLeaves.length}</Text>
          <Text style={styles.statLabel}>Pending Leaves</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('Escalations')}
          activeOpacity={0.8}
        >
          <View style={[styles.statAccent, { backgroundColor: colors.danger }]} />
          <Ionicons name="warning-outline" size={20} color={colors.danger} style={styles.statIcon} />
          <Text style={[styles.statVal, { color: colors.danger }]}>{activeEscalations.length}</Text>
          <Text style={styles.statLabel}>Active Escalations</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Attendance Split */}
      <Card style={styles.attendanceCard}>
        <Text style={styles.cardTitle}>Today's Attendance</Text>
        <View style={styles.attendanceSplit}>
          {/* Present Column */}
          <View style={styles.attendanceCol}>
            <Text style={[styles.attendanceHeading, { color: colors.success }]}>
              ● Present ({presentEmployees.length})
            </Text>
            {presentEmployees.map(emp => (
              <View key={emp._id} style={styles.attendanceBadge}>
                <Text style={styles.attendanceBadgeText}>{emp.name}</Text>
              </View>
            ))}
            {presentEmployees.length === 0 && <Text style={styles.emptyText}>No check-ins yet</Text>}
          </View>

          {/* Leave Column */}
          <View style={styles.attendanceCol}>
            <Text style={[styles.attendanceHeading, { color: colors.danger }]}>
              ● Leave/WFH ({approvedLeavesToday.length})
            </Text>
            {approvedLeavesToday.map(leave => (
              <View key={leave._id} style={styles.attendanceBadge}>
                <Text style={styles.attendanceBadgeText}>{leave.employee?.name || 'Staff'}</Text>
                <View style={[styles.miniBadge, { backgroundColor: leave.type === 'Work from Home' ? colors.infoBg : colors.dangerBg }]}>
                  <Text style={[styles.miniBadgeText, { color: leave.type === 'Work from Home' ? colors.infoText : colors.dangerText }]}>
                    {leave.type === 'Work from Home' ? 'WFH' : 'Leave'}
                  </Text>
                </View>
              </View>
            ))}
            {approvedLeavesToday.length === 0 && <Text style={styles.emptyText}>No leaves today</Text>}
          </View>
        </View>
      </Card>

      {/* Active Projects List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Projects</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Projects')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      {projects.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyCardText}>No active projects found</Text>
        </Card>
      ) : (
        projects.slice(0, 3).map((p) => (
          <TouchableOpacity
            key={p._id}
            onPress={() => navigation.navigate('ProjectDetail', { id: p._id })}
            activeOpacity={0.8}
          >
            <Card style={styles.projectListItem}>
              <View style={styles.projectItemRow}>
                <View style={[styles.projectIconBox, { backgroundColor: p.iconBg || colors.brandLight }]}>
                  <Ionicons name="folder-outline" size={16} color={p.iconColor || colors.brand} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.projectName}>{p.name}</Text>
                  <Text style={styles.projectDesc} numberOfLines={1}>{p.description || 'No description'}</Text>
                </View>
                <View style={[styles.miniBadge, { backgroundColor: p.status === 'At risk' ? colors.dangerBg : colors.successBg }]}>
                  <Text style={[styles.miniBadgeText, { color: p.status === 'At risk' ? colors.dangerText : colors.successText }]}>
                    {p.status}
                  </Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}

      {/* Active Escalations List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Escalations Center</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Escalations')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      {activeEscalations.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyCardText}>No active escalations</Text>
        </Card>
      ) : (
        activeEscalations.slice(0, 2).map((esc) => (
          <TouchableOpacity
            key={esc._id}
            onPress={() => navigation.navigate('Escalations')}
            activeOpacity={0.8}
          >
            <Card style={styles.escalationCard}>
              <View style={styles.escHeaderCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.escTitle}>{esc.member} · {esc.category}</Text>
                  <Text style={styles.escMeta}>By: {esc.owner || 'Unassigned'}</Text>
                </View>
                <View style={[styles.miniBadge, { backgroundColor: colors.dangerBg }]}>
                  <Text style={[styles.miniBadgeText, { color: colors.dangerText }]}>
                    {esc.priority || 'Alert'}
                  </Text>
                </View>
              </View>
              <Text style={styles.escDesc}>{esc.description}</Text>
            </Card>
          </TouchableOpacity>
        ))
      )}
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
    paddingHorizontal: 16,
    paddingBottom: 40,
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
    paddingVertical: 16,
    marginTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    color: colors.text,
    fontSize: 18,
    fontWeight: typography.weights.bold,
  },
  dateSub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  escalateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  escalateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: typography.weights.bold,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.navy,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(193, 154, 75, 0.4)',
  },
  aiBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiBannerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: typography.weights.bold,
  },
  aiBannerSub: {
    color: colors.onNavyMuted,
    fontSize: 11,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 42) / 2,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  statAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  statIcon: {
    marginBottom: 6,
  },
  statVal: {
    color: colors.text,
    fontSize: 22,
    fontWeight: typography.weights.bold,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  attendanceCard: {
    marginBottom: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: typography.weights.bold,
    marginBottom: 14,
  },
  attendanceSplit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attendanceCol: {
    width: '48%',
  },
  attendanceHeading: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    marginBottom: 10,
  },
  attendanceBadge: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 6,
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendanceBadgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
  miniBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: typography.weights.bold,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: typography.weights.bold,
    color: colors.brandDark,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyCardText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  projectListItem: {
    marginBottom: 10,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  projectItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: typography.weights.bold,
  },
  projectDesc: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  escalationCard: {
    marginBottom: 10,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  escHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
    marginBottom: 6,
  },
  escTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: typography.weights.semibold,
  },
  escMeta: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  escDesc: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 16,
  },
});

export default ManagerOverviewScreen;
