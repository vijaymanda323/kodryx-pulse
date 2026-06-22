import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../theme/colors';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Syncing Workspace...</Text>
      </View>
    );
  }

  const openTasks = tasks.filter(t => t.status !== 'Completed');
  const overdueTasks = tasks.filter(t => t.status === 'Overdue');
  const blockedTasks = tasks.filter(t => t.status === 'Blocked');
  const todayTasks = todayLog?.tasks || [];
  const todayDone = todayTasks.filter(t => t.status === 'Completed').length;
  const activeTasks = tasks.filter(t => t.status === 'In Progress' || t.status === 'Not Started').slice(0, 4);

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
          <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            {user?.designation ? ` · ${user.designation}` : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Summary Grid */}
      <View style={styles.statsGrid}>
        <TouchableOpacity style={styles.statCardWrapper} onPress={() => navigation.navigate('Tasks')}>
          <Card style={styles.statCard}>
            <Ionicons name="list-circle-outline" size={24} color={colors.primary} style={styles.statIcon} />
            <Text style={styles.statVal}>{openTasks.length}</Text>
            <Text style={styles.statLabel}>Open Tasks</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCardWrapper} onPress={() => navigation.navigate('DailyStatus')}>
          <Card style={styles.statCard}>
            <Ionicons name="checkbox-outline" size={24} color={todayLog ? colors.success : colors.warning} style={styles.statIcon} />
            <Text style={[styles.statVal, { color: todayLog ? colors.success : colors.warning }]}>
              {todayLog ? todayDone : '—'}
            </Text>
            <Text style={styles.statLabel}>Today's Log</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCardWrapper} onPress={() => navigation.navigate('Leaves')}>
          <Card style={styles.statCard}>
            <Ionicons name="airplane-outline" size={24} color={colors.success} style={styles.statIcon} />
            <Text style={[styles.statVal, { color: colors.success }]}>
              {balance?.available ?? '—'}
            </Text>
            <Text style={styles.statLabel}>Leaves Left</Text>
          </Card>
        </TouchableOpacity>

        <Card style={[styles.statCard, { flex: 1, minWidth: '45%' }]}>
          <Ionicons name="alert-circle-outline" size={24} color={overdueTasks.length > 0 ? colors.danger : colors.success} style={styles.statIcon} />
          <Text style={[styles.statVal, { color: overdueTasks.length > 0 ? colors.danger : colors.text }]}>
            {overdueTasks.length + blockedTasks.length}
          </Text>
          <Text style={styles.statLabel}>Attention</Text>
        </Card>
      </View>

      {/* Warning banner */}
      {!todayLog && (
        <Card style={styles.warningBanner} useGradient gradientColors={['#2A1B1B', '#1B1414']}>
          <View style={styles.warningRow}>
            <Ionicons name="time-outline" size={24} color={colors.primary} />
            <View style={styles.warningTextContainer}>
              <Text style={styles.warningTitle}>Pending Daily Status</Text>
              <Text style={styles.warningDesc}>Submit your updates before the 11 AM standup.</Text>
            </View>
            <TouchableOpacity
              style={styles.warningAction}
              onPress={() => navigation.navigate('DailyStatus')}
            >
              <Text style={styles.warningActionText}>Log Now</Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('DailyStatus')}>
          <View style={[styles.actionIconWrap, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="create-outline" size={24} color={colors.primary} />
          </View>
          <Text style={styles.actionText}>Log Status</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Leaves')}>
          <View style={[styles.actionIconWrap, { backgroundColor: colors.success + '15' }]}>
            <Ionicons name="calendar-outline" size={24} color={colors.success} />
          </View>
          <Text style={styles.actionText}>Apply Leave</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Tasks')}>
          <View style={[styles.actionIconWrap, { backgroundColor: colors.info + '15' }]}>
            <Ionicons name="briefcase-outline" size={24} color={colors.info} />
          </View>
          <Text style={styles.actionText}>My Tasks</Text>
        </TouchableOpacity>
      </View>

      {/* Active Tasks Checklist */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>My Active Tasks</Text>
          <Badge variant="info">{openTasks.length}</Badge>
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
                <Badge variant={t.status === 'Completed' ? 'success' : t.status === 'Blocked' ? 'danger' : 'info'}>
                  {t.status}
                </Badge>
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
      <Text style={styles.sectionTitle}>My Team Updates</Text>
      {teamMembers.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyCardText}>No team logs recorded today.</Text>
        </Card>
      ) : (
        teamMembers.map((member) => {
          const log = teamLogs.find(l => l.employee?._id === member._id);
          return (
            <Card key={member._id} style={styles.teamCard}>
              <View style={styles.teamHeader}>
                <View style={styles.avatarRow}>
                  <View style={[styles.avatarCircle, { backgroundColor: member.avatar?.bg || colors.border }]}>
                    <Text style={styles.avatarText}>{member.avatar?.initials || member.name[0]}</Text>
                  </View>
                  <View>
                    <Text style={styles.teamMemberName}>{member.name}</Text>
                    <Text style={styles.teamMemberRole}>{member.role || 'Team Member'}</Text>
                  </View>
                </View>
                <Badge variant={member.status === 'on-leave' ? 'danger' : 'success'}>
                  {member.status === 'on-leave' ? 'On Leave' : 'Working'}
                </Badge>
              </View>
              {log ? (
                <View style={styles.teamLogContainer}>
                  <Text style={styles.teamLogTitle}>Today's Updates:</Text>
                  {log.tasks.slice(0, 3).map((t, idx) => (
                    <View key={idx} style={styles.teamTaskRow}>
                      <Text style={styles.teamTaskText} numberOfLines={1}>• {t.task}</Text>
                      <Badge variant={t.status === 'Completed' ? 'success' : 'info'}>{t.status}</Badge>
                    </View>
                  ))}
                  {log.tasks.length > 3 && (
                    <Text style={styles.teamLogMore}>+{log.tasks.length - 3} more updates</Text>
                  )}
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
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extraBold,
  },
  date: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },
  logoutBtn: {
    padding: 10,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
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
  warningBanner: {
    borderWidth: 1,
    borderColor: colors.primary + '50',
    marginBottom: 20,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  warningDesc: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  warningAction: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  warningActionText: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: 12,
    marginTop: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionBtn: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  sectionCard: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  listItemTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  listItemSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },
  listBadgeContainer: {
    alignItems: 'flex-end',
  },
  listDueDate: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },
  teamCard: {
    marginBottom: 12,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: colors.text,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  teamMemberName: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  teamMemberRole: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  teamLogContainer: {
    backgroundColor: colors.cardBgSecondary,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  teamLogTitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    marginBottom: 6,
  },
  teamTaskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  teamTaskText: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    flex: 1,
    marginRight: 10,
  },
  teamLogMore: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontStyle: 'italic',
    marginTop: 6,
  },
  teamLogEmpty: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontStyle: 'italic',
  },
});

export default EmployeeOverviewScreen;
