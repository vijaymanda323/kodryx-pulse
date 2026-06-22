import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../theme/colors';
import api from '../../services/api';
import Card from '../../components/Card';

const { width } = Dimensions.get('window');
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const EmployeeWorkflowScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [statusLogs, setStatusLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState(null);

  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        const [empRes, tasksRes, logsRes] = await Promise.all([
          api.get(`/api/users/${id}`),
          api.get('/api/tasks').catch(() => ({ data: [] })),
          api.get(`/api/daily-status/employee/${id}`).catch(() => ({ data: [] })),
        ]);
        setEmployee(empRes.data);
        setTasks((tasksRes.data || []).filter(t => t.assignee?._id === id || t.assignee === id));
        setStatusLogs(logsRes.data || []);
      } catch (err) {
        console.error('Failed to load employee workflow', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkflow();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand} />
      </SafeAreaView>
    );
  }

  if (!employee) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Employee not found</Text>
      </SafeAreaView>
    );
  }

  const countOf = (key) => tasks.filter(t => t.status === key).length;

  // Calculate stats for chart
  const recentLogs = statusLogs.slice(0, 30);
  const weekBars = [0, 0, 0, 0, 0, 0, 0];
  recentLogs.forEach(log => {
    const d = new Date(log.date + 'T12:00:00');
    const dow = (d.getDay() + 6) % 7; // 0=Mon ... 6=Sun
    weekBars[dow] += (log.tasks || []).length;
  });
  const maxBar = Math.max(...weekBars) || 1;

  const totalLogged = recentLogs.reduce((s, l) => s + (l.tasks || []).length, 0);
  const totalHours = recentLogs.reduce((s, l) =>
    s + (l.tasks || []).reduce((a, t) => a + (t.hoursSpent || 0), 0), 0);

  const statDefs = [
    { key: 'Completed', label: 'Completed', icon: 'checkmark-circle-outline', color: colors.success },
    { key: 'In Progress', label: 'In Progress', icon: 'sync-outline', color: colors.info },
    { key: 'Blocked', label: 'Blocked', icon: 'ban-outline', color: colors.warning },
    { key: 'Overdue', label: 'Overdue', icon: 'alert-circle-outline', color: colors.danger },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workflow Timeline</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={[styles.avatar, { backgroundColor: employee.avatar?.bg || colors.brandLight }]}>
              <Text style={[styles.avatarText, { color: employee.avatar?.color || colors.brandDark }]}>
                {employee.avatar?.initials || employee.name?.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{employee.name}</Text>
              <Text style={styles.profileRole}>{employee.designation} · {employee.department}</Text>
              <Text style={styles.profileEmail}><Ionicons name="mail-outline" size={12} /> {employee.email}</Text>
            </View>
          </View>
          <View style={styles.profileBadges}>
            <View style={[styles.badge, { backgroundColor: colors.successBg }]}>
              <Text style={[styles.badgeText, { color: colors.successText }]}>Available</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                {employee.leaveBalance?.available ?? 0} leaves left
              </Text>
            </View>
          </View>
        </Card>

        {/* 4 Stat Cards */}
        <View style={styles.statsGrid}>
          {statDefs.map((def) => {
            const count = countOf(def.key);
            const isActive = activePanel === def.key;
            return (
              <TouchableOpacity
                key={def.key}
                style={[styles.statCard, isActive && { borderColor: def.color }]}
                onPress={() => setActivePanel(isActive ? null : def.key)}
                activeOpacity={0.8}
              >
                <View style={[styles.statAccent, { backgroundColor: def.color }]} />
                <View style={styles.statHeader}>
                  <Ionicons name={def.icon} size={16} color={def.color} />
                  <Text style={styles.statLabel} numberOfLines={1}>{def.label}</Text>
                </View>
                <Text style={styles.statValue}>{count}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Active Tasks Panel */}
        {activePanel && (() => {
          const def = statDefs.find(c => c.key === activePanel);
          const filtered = tasks.filter(t => t.status === activePanel);
          return (
            <Card style={[styles.panelCard, { borderTopColor: def.color }]}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>{def.label} Tasks ({filtered.length})</Text>
                <TouchableOpacity onPress={() => setActivePanel(null)}>
                  <Ionicons name="close-circle-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {filtered.length === 0 ? (
                <Text style={styles.noTasksText}>No tasks in this status</Text>
              ) : (
                filtered.map((t) => (
                  <View key={t._id} style={styles.taskRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.taskTitle}>{t.title}</Text>
                      <Text style={styles.taskDue}>Due: {t.dueDate || '—'}</Text>
                    </View>
                    <View style={[styles.prioBadge, t.priority === 'Urgent' && { backgroundColor: colors.dangerBg }]}>
                      <Text style={[styles.prioText, t.priority === 'Urgent' && { color: colors.dangerText }]}>
                        {t.priority || 'Normal'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </Card>
          );
        })()}

        {/* Productivity Section */}
        <Card style={styles.productivityCard}>
          <Text style={styles.sectionTitle}>Productivity (Last 30 Logs)</Text>
          <View style={styles.totalRow}>
            <View style={styles.totalBox}>
              <Text style={styles.totalVal}>{totalLogged}</Text>
              <Text style={styles.totalLbl}>Tasks logged</Text>
            </View>
            <View style={styles.totalBox}>
              <Text style={styles.totalVal}>{totalHours.toFixed(1)}h</Text>
              <Text style={styles.totalLbl}>Hours logged</Text>
            </View>
          </View>

          <Text style={styles.chartTitle}>Activity by Day of Week</Text>
          <View style={styles.chartContainer}>
            {weekBars.map((v, i) => {
              const barHeight = v > 0 ? Math.round((v / maxBar) * 60) + 6 : 4;
              return (
                <View key={i} style={styles.chartCol}>
                  <Text style={styles.colVal}>{v > 0 ? v : ''}</Text>
                  <View style={[styles.colBar, { height: barHeight }]} />
                  <Text style={styles.colLabel}>{DAYS[i]}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Historical Status Logs */}
        <Text style={styles.sectionTitle}>Historical Status Logs</Text>
        <Card style={styles.logsCard}>
          {statusLogs.length === 0 ? (
            <Text style={styles.noLogsText}>No daily logs submitted yet</Text>
          ) : (
            statusLogs.slice(0, 15).map((log, i) => {
              const done = (log.tasks || []).filter(t => t.status === 'Completed').length;
              const inProg = (log.tasks || []).filter(t => t.status === 'In Progress').length;
              const blocked = (log.tasks || []).filter(t => t.status === 'Blocked').length;
              return (
                <View key={log._id} style={[styles.logItem, i === statusLogs.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.logDate}>
                    {new Date(log.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  <View style={styles.logContent}>
                    <Text style={styles.logTaskCount}>
                      {log.tasks?.length || 0} tasks logged
                    </Text>
                    <View style={styles.dotsRow}>
                      {done > 0 && <Text style={styles.dotLabel}>● {done} done</Text>}
                      {inProg > 0 && <Text style={styles.dotLabel}>● {inProg} active</Text>}
                      {blocked > 0 && <Text style={[styles.dotLabel, { color: colors.warning }]}>● {blocked} blocked</Text>}
                    </View>
                    {log.tasks?.slice(0, 2).map((t, idx) => (
                      <Text key={idx} style={styles.logTaskPreview}>
                        - {t.task} {t.notes ? `(${t.notes})` : ''}
                      </Text>
                    ))}
                  </View>
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: typography.weights.bold,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  profileRole: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profileEmail: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  profileBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 42) / 2,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
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
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  panelCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    padding: 16,
    marginBottom: 20,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  noTasksText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 12,
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  taskDue: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  prioBadge: {
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  prioText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
  },
  productivityCard: {
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  totalBox: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  totalVal: {
    fontSize: 18,
    fontWeight: typography.weights.bold,
    color: colors.brandDark,
  },
  totalLbl: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 10,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    paddingBottom: 10,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
  },
  colVal: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 2,
  },
  colBar: {
    width: 20,
    backgroundColor: colors.brandLight,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  colLabel: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 4,
  },
  logsCard: {
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noLogsText: {
    paddingVertical: 20,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
  },
  logItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logDate: {
    width: 60,
    fontSize: 12,
    fontWeight: typography.weights.bold,
    color: colors.brandDark,
  },
  logContent: {
    flex: 1,
  },
  logTaskCount: {
    fontSize: 13,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  dotLabel: {
    fontSize: 10,
    color: colors.success,
  },
  logTaskPreview: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    fontStyle: 'italic',
  },
});

export default EmployeeWorkflowScreen;
