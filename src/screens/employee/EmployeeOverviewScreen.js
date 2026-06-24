import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Alert,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../theme/colors';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';

const { width } = Dimensions.get('window');

const EmployeeOverviewScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [tasks, setTasks] = useState([]);
  const [todayLog, setTodayLog] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLogs, setTeamLogs] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const todayStr = new Date().toLocaleDateString('en-CA');
      
      const [tasksRes, logRes, leavesRes, balanceRes, teamRes, teamLogsRes] = await Promise.all([
        api.get('/api/tasks').catch(() => ({ data: [] })),
        api.get(`/api/daily-status/my-status?date=${todayStr}`).catch(() => ({ data: [] })),
        api.get('/api/leaves').catch(() => ({ data: [] })),
        user?._id
          ? api.get(`/api/leaves/balance/${user._id}`).catch(() => ({ data: null }))
          : Promise.resolve({ data: null }),
        api.get('/api/users').catch(() => ({ data: [] })),
        api.get(`/api/daily-status?date=${todayStr}`).catch(() => ({ data: [] })),
      ]);

      setTasks(tasksRes.data || []);
      setTodayLog((logRes.data || [])[0] || null);
      setLeaves(leavesRes.data || []);
      setBalance(balanceRes.data);
      setTeamMembers((teamRes.data || []).filter(u => u._id !== user?._id));
      setTeamLogs((teamLogsRes.data || []).filter(l => l.employee?._id !== user?._id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand} />
        <Text style={styles.loadingText}>Syncing Workspace...</Text>
      </SafeAreaView>
    );
  }

  const openTasks = tasks.filter(t => t.status !== 'Completed');
  const overdueTasks = tasks.filter(t => t.status === 'Overdue');
  const blockedTasks = tasks.filter(t => t.status === 'Blocked');
  const todayTasks = todayLog?.tasks || [];
  const todayDone = todayTasks.filter(t => t.status === 'Completed').length;
  const activeTasks = tasks.filter(t => t.status === 'In Progress' || t.status === 'Not Started').slice(0, 4);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
        }
      >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Employee'} 👋</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            {user?.designation ? ` · ${user.designation}` : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={22} color={colors.brandDark} />
        </TouchableOpacity>
      </View>

      {/* Warning Banner */}
      {!todayLog && (
        <Card style={styles.warningBanner}>
          <View style={styles.warningRow}>
            <View style={styles.warningIconCircle}>
              <Ionicons name="time" size={20} color={colors.brand} />
            </View>
            <View style={styles.warningTextContainer}>
              <Text style={styles.warningTitle}>Daily Log Pending</Text>
              <Text style={styles.warningDesc}>Submit status updates before the standup.</Text>
            </View>
            <TouchableOpacity
              style={styles.warningAction}
              onPress={() => navigation.navigate('Daily Log')}
            >
              <Text style={styles.warningActionText}>Log Now</Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {/* Stats Summary Grid */}
      <View style={styles.statsGrid}>
        <TouchableOpacity style={styles.statCardWrapper} onPress={() => navigation.navigate('Tasks')}>
          <Card style={styles.statCard}>
            <View style={[styles.statAccent, { backgroundColor: colors.brand }]} />
            <Ionicons name="list-circle-outline" size={20} color={colors.brand} style={styles.statIcon} />
            <Text style={styles.statVal}>{openTasks.length}</Text>
            <Text style={styles.statLabel}>Open Tasks</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCardWrapper} onPress={() => navigation.navigate('Daily Log')}>
          <Card style={styles.statCard}>
            <View style={[styles.statAccent, { backgroundColor: todayLog ? colors.success : colors.warning }]} />
            <Ionicons name="checkbox-outline" size={20} color={todayLog ? colors.success : colors.warning} style={styles.statIcon} />
            <Text style={[styles.statVal, { color: todayLog ? colors.success : colors.warning }]}>
              {todayLog ? todayDone : '—'}
            </Text>
            <Text style={styles.statLabel}>Today's Log</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCardWrapper} onPress={() => navigation.navigate('Leaves')}>
          <Card style={styles.statCard}>
            <View style={[styles.statAccent, { backgroundColor: colors.success }]} />
            <Ionicons name="airplane-outline" size={20} color={colors.success} style={styles.statIcon} />
            <Text style={[styles.statVal, { color: colors.success }]}>
              {balance?.available ?? '—'}
            </Text>
            <Text style={styles.statLabel}>Leaves Left</Text>
          </Card>
        </TouchableOpacity>

        <View style={styles.statCardWrapper}>
          <Card style={styles.statCard}>
            <View style={[styles.statAccent, { backgroundColor: overdueTasks.length > 0 ? colors.danger : colors.success }]} />
            <Ionicons name="alert-circle-outline" size={20} color={overdueTasks.length > 0 ? colors.danger : colors.success} style={styles.statIcon} />
            <Text style={[styles.statVal, { color: overdueTasks.length > 0 ? colors.danger : colors.text }]}>
              {overdueTasks.length + blockedTasks.length}
            </Text>
            <Text style={styles.statLabel}>Attention</Text>
          </Card>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Daily Log')}>
          <View style={[styles.actionIconWrap, { backgroundColor: colors.brandLight }]}>
            <Ionicons name="create-outline" size={20} color={colors.brandDark} />
          </View>
          <Text style={styles.actionText}>Log Status</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Leaves')}>
          <View style={[styles.actionIconWrap, { backgroundColor: colors.successBg }]}>
            <Ionicons name="calendar-outline" size={20} color={colors.successText} />
          </View>
          <Text style={styles.actionText}>Apply Leave</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Tasks')}>
          <View style={[styles.actionIconWrap, { backgroundColor: colors.infoBg }]}>
            <Ionicons name="briefcase-outline" size={20} color={colors.infoText} />
          </View>
          <Text style={styles.actionText}>My Tasks</Text>
        </TouchableOpacity>
      </View>

      {/* Active Tasks Checklist */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>My Active Tasks</Text>
          <View style={styles.taskCountBadge}>
            <Text style={styles.taskCountText}>{openTasks.length}</Text>
          </View>
        </View>
        {activeTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle-outline" size={36} color={colors.success} />
            <Text style={styles.emptyText}>All caught up! No active tasks.</Text>
          </View>
        ) : (
          activeTasks.map((t, idx) => (
            <View key={t._id} style={[styles.listItem, idx === activeTasks.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.listTextContainer}>
                <Text style={styles.listItemTitle}>{t.title}</Text>
                {t.project?.name && <Text style={styles.listItemSubtitle}>{t.project.name}</Text>}
              </View>
              <View style={styles.listBadgeContainer}>
                <View style={[styles.miniBadge, { backgroundColor: t.status === 'Completed' ? colors.successBg : t.status === 'Blocked' ? colors.dangerBg : colors.infoBg }]}>
                  <Text style={[styles.miniBadgeText, { color: t.status === 'Completed' ? colors.successText : t.status === 'Blocked' ? colors.dangerText : colors.infoText }]}>
                    {t.status}
                  </Text>
                </View>
                {t.dueDate && (
                  <Text style={[styles.listDueDate, t.status === 'Overdue' && { color: colors.danger }]}>
                    Due {t.dueDate}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </Card>

      {/* Team updates */}
      <Text style={styles.sectionTitle}>Team Status</Text>
      {teamMembers.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyCardText}>No team updates recorded today.</Text>
        </Card>
      ) : (
        teamMembers.map((member) => {
          const log = teamLogs.find(l => l.employee?._id === member._id || l.employee === member._id);
          return (
            <Card key={member._id} style={styles.teamCard}>
              <View style={styles.teamHeader}>
                <View style={styles.avatarRow}>
                  <View style={[styles.avatarCircle, { backgroundColor: member.avatar?.bg || colors.brandLight }]}>
                    <Text style={[styles.avatarText, { color: member.avatar?.color || colors.brandDark }]}>
                      {member.avatar?.initials || member.name[0]}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.teamMemberName}>{member.name}</Text>
                    <Text style={styles.teamMemberRole}>{member.designation || 'Team Member'}</Text>
                  </View>
                </View>
                <View style={[styles.miniBadge, { backgroundColor: member.status === 'on-leave' ? colors.dangerBg : colors.successBg }]}>
                  <Text style={[styles.miniBadgeText, { color: member.status === 'on-leave' ? colors.dangerText : colors.successText }]}>
                    {member.status === 'on-leave' ? 'On Leave' : 'Available'}
                  </Text>
                </View>
              </View>
              {log ? (
                <View style={styles.teamLogContainer}>
                  <Text style={styles.teamLogTitle}>Today's Updates:</Text>
                  {log.tasks?.slice(0, 2).map((t, idx) => (
                    <View key={idx} style={styles.teamTaskRow}>
                      <Text style={styles.teamTaskText} numberOfLines={1}>• {t.task}</Text>
                      <View style={[styles.miniBadge, { backgroundColor: t.status === 'Completed' ? colors.successBg : colors.infoBg }]}>
                        <Text style={[styles.miniBadgeText, { color: t.status === 'Completed' ? colors.successText : colors.infoText }]}>
                          {t.status}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.teamLogEmpty}>No status updates submitted today.</Text>
              )}
            </Card>
          );
        })
      )}
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
  greeting: {
    color: colors.text,
    fontSize: 18,
    fontWeight: typography.weights.bold,
  },
  date: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  warningBanner: {
    borderWidth: 1.5,
    borderColor: 'rgba(193, 154, 75, 0.4)',
    backgroundColor: colors.navy,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warningIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: typography.weights.bold,
  },
  warningDesc: {
    color: colors.onNavyMuted,
    fontSize: 11,
    marginTop: 2,
  },
  warningAction: {
    backgroundColor: colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  warningActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCardWrapper: {
    width: (width - 42) / 2,
  },
  statCard: {
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
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: typography.weights.bold,
    marginBottom: 12,
    marginTop: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
  sectionCard: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: typography.weights.bold,
  },
  taskCountBadge: {
    backgroundColor: colors.brandLight,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  taskCountText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.brandDark,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  listItemTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: typography.weights.semibold,
  },
  listItemSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  listBadgeContainer: {
    alignItems: 'flex-end',
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
  listDueDate: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  teamCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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
    fontWeight: typography.weights.bold,
    fontSize: 12,
  },
  teamMemberName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: typography.weights.semibold,
  },
  teamMemberRole: {
    color: colors.textMuted,
    fontSize: 10,
  },
  teamLogContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  teamLogTitle: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  teamTaskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  teamTaskText: {
    color: colors.text,
    fontSize: 11,
    flex: 1,
    marginRight: 10,
  },
  teamLogEmpty: {
    color: colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
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
});

export default EmployeeOverviewScreen;
