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

const AIInsightsScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA');
    Promise.all([
      api.get('/api/tasks').catch(() => ({ data: [] })),
      api.get('/api/users').catch(() => ({ data: [] })),
      api.get(`/api/daily-status?date=${today}`).catch(() => ({ data: [] })),
    ]).then(([t, u, l]) => {
      setTasks(t.data || []);
      setUsers(u.data || []);
      setLogs(l.data || []);
    }).catch(err => {
      console.error('Failed to load insights data', err);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand} />
        <Text style={styles.loadingText}>Generating insights...</Text>
      </SafeAreaView>
    );
  }

  const employees = users.filter(u => u.role === 'Employee' || u.role === 'Intern');
  const overdueTasks = tasks.filter(t => t.status === 'Overdue');
  const blockedTasks = tasks.filter(t => t.status === 'Blocked');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress' || t.status === 'In review');
  const completedTasks = tasks.filter(t => t.status === 'Completed');

  // Members who haven't submitted a log today
  const submittedIds = new Set(logs.map(l => (l.employee?._id || l.employee)?.toString()));
  const missingLogs = employees.filter(e => !submittedIds.has(e._id?.toString()));

  // High-workload members
  const highWorkload = employees.filter(e => (e.workStats?.workload || 0) >= 85);

  // Top performers
  const topPerformers = [...employees]
    .sort((a, b) => (b.workStats?.performance || 0) - (a.workStats?.performance || 0))
    .slice(0, 4);

  // Daily briefing items
  const briefing = [];

  if (overdueTasks.length > 0) {
    const names = [...new Set(overdueTasks.map(t => t.assignee?.name).filter(Boolean))];
    briefing.push({
      type: 'danger',
      icon: 'alert-circle',
      label: 'Critical',
      text: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} across ${names.length} member${names.length > 1 ? 's' : ''} (${names.slice(0, 2).join(', ')}${names.length > 2 ? '…' : ''}). Immediate follow-up needed.`,
    });
  }

  if (blockedTasks.length > 0) {
    const names = [...new Set(blockedTasks.map(t => t.assignee?.name).filter(Boolean))];
    briefing.push({
      type: 'warning',
      icon: 'warning',
      label: 'At risk',
      text: `${blockedTasks.length} task${blockedTasks.length > 1 ? 's' : ''} blocked (${names.slice(0, 2).join(', ')}). Unblocking these should free team velocity.`,
    });
  }

  if (missingLogs.length > 0) {
    briefing.push({
      type: 'warning',
      icon: 'time',
      label: 'No log today',
      text: `${missingLogs.length} member${missingLogs.length > 1 ? 's' : ''} haven't submitted a daily status log yet: ${missingLogs.slice(0, 3).map(m => m.name.split(' ')[0]).join(', ')}${missingLogs.length > 3 ? '…' : ''}.`,
    });
  }

  if (completedTasks.length > 0 && overdueTasks.length === 0) {
    briefing.push({
      type: 'success',
      icon: 'checkmark-circle',
      label: 'Strong delivery',
      text: `${completedTasks.length} task${completedTasks.length > 1 ? 's' : ''} completed with no overdue items. Team is on track.`,
    });
  }

  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Risk signals
  const risks = [];
  missingLogs.slice(0, 3).forEach(m => {
    risks.push({ label: `${m.name} — no log today`, badge: 'High risk', color: colors.dangerText, bg: colors.dangerBg });
  });
  highWorkload.forEach(m => {
    risks.push({ label: `${m.name} — ${m.workStats.workload}% workload`, badge: 'Overloaded', color: colors.warningText, bg: colors.warningBg });
  });
  if (blockedTasks.length >= 3) {
    risks.push({ label: `${blockedTasks.length} tasks blocked`, badge: 'Medium', color: colors.warningText, bg: colors.warningBg });
  }
  if (risks.length === 0) {
    risks.push({ label: 'No risk signals detected today', badge: 'All clear', color: colors.successText, bg: colors.successBg });
  }

  // Recommendations
  const recs = [];
  if (overdueTasks.length > 0) {
    const t = overdueTasks[0];
    recs.push({
      icon: 'person-remove-outline',
      title: `Review ${t.taskId || 'overdue task'}`,
      desc: `"${t.title}" is overdue. Consider reassigning or adjusting the deadline.`,
      bg: colors.dangerBg,
      text: colors.dangerText,
    });
  }
  if (blockedTasks.length > 0) {
    const t = blockedTasks[0];
    recs.push({
      icon: 'lock-open-outline',
      title: `Unblock ${t.assignee?.name?.split(' ')[0] || 'member'}`,
      desc: `"${t.title}" is blocked. Quick intervention could unblock downstream work.`,
      bg: colors.warningBg,
      text: colors.warningText,
    });
  }
  if (highWorkload.length > 0) {
    const m = highWorkload[0];
    recs.push({
      icon: 'scale-outline',
      title: 'Rebalance workload',
      desc: `${m.name} is at ${m.workStats.workload}% capacity. Consider redistributing tasks.`,
      bg: colors.infoBg,
      text: colors.infoText,
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>AI Insights</Text>
          <View style={styles.liveBadge}>
            <Ionicons name="sparkles" size={10} color={colors.brandDark} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerSub}>
          Derived from {tasks.length} tasks · {employees.length} employees · {logs.length} logs today
        </Text>

        {/* Daily Briefing */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Daily Briefing</Text>
            <View style={styles.autoBadge}>
              <Text style={styles.autoText}>Auto-generated</Text>
            </View>
          </View>
          {briefing.map((item, i) => (
            <View key={i} style={[styles.insightRow, styles[item.type + 'Insight']]}>
              <Ionicons
                name={item.icon === 'checkmark-circle' ? 'checkmark-circle-outline' : item.icon === 'warning' ? 'warning-outline' : 'alert-circle-outline'}
                size={18}
                color={item.type === 'danger' ? colors.danger : item.type === 'warning' ? colors.warning : colors.success}
              />
              <Text style={styles.insightText}>
                <Text style={styles.insightLabel}>{item.label}: </Text>
                {item.text}
              </Text>
            </View>
          ))}
          {briefing.length === 0 && (
            <Text style={styles.noInsightsText}>All clear. No urgent actions required.</Text>
          )}
        </Card>

        {/* Risk Signals */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Risk Signals</Text>
          <View style={styles.table}>
            {risks.map((r, i) => (
              <View key={i} style={[styles.tableRow, i === risks.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={styles.tableCellLabel} numberOfLines={1}>{r.label}</Text>
                <View style={[styles.tableBadge, { backgroundColor: r.bg }]}>
                  <Text style={[styles.tableBadgeText, { color: r.color }]}>{r.badge}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Top Performers */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Top Performers</Text>
          {topPerformers.length === 0 ? (
            <Text style={styles.noDataText}>No performance data yet</Text>
          ) : (
            topPerformers.map((m, i) => (
              <View key={m._id} style={[styles.performerRow, i === topPerformers.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={styles.rank}>{i + 1}</Text>
                <View style={[styles.avatar, { backgroundColor: m.avatar?.bg || colors.brandLight }]}>
                  <Text style={[styles.avatarText, { color: m.avatar?.color || colors.brandDark }]}>
                    {m.avatar?.initials || m.name?.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.performerInfo}>
                  <Text style={styles.performerName}>{m.name}</Text>
                  <Text style={styles.performerDesignation}>{m.designation}</Text>
                </View>
                <View style={styles.perfValBadge}>
                  <Text style={styles.perfValText}>{m.workStats?.performance ?? 0}%</Text>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Task Health */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Task Health</Text>
          <View style={styles.healthStats}>
            <View style={[styles.healthStatBox, { backgroundColor: colors.successBg }]}>
              <Text style={[styles.healthStatVal, { color: colors.successText }]}>{completedTasks.length}</Text>
              <Text style={styles.healthStatLbl}>Completed</Text>
            </View>
            <View style={[styles.healthStatBox, { backgroundColor: colors.infoBg }]}>
              <Text style={[styles.healthStatVal, { color: colors.infoText }]}>{inProgressTasks.length}</Text>
              <Text style={styles.healthStatLbl}>Active</Text>
            </View>
            <View style={[styles.healthStatBox, { backgroundColor: colors.warningBg }]}>
              <Text style={[styles.healthStatVal, { color: colors.warningText }]}>{blockedTasks.length}</Text>
              <Text style={styles.healthStatLbl}>Blocked</Text>
            </View>
            <View style={[styles.healthStatBox, { backgroundColor: colors.dangerBg }]}>
              <Text style={[styles.healthStatVal, { color: colors.dangerText }]}>{overdueTasks.length}</Text>
              <Text style={styles.healthStatLbl}>Overdue</Text>
            </View>
          </View>
          <Text style={styles.completionLabel}>
            Completion rate — {completionRate}% ({completedTasks.length}/{tasks.length} tasks)
          </Text>
          <View style={styles.completionBar}>
            <View
              style={[
                styles.completionFill,
                {
                  width: `${completionRate}%`,
                  backgroundColor: completionRate >= 70 ? colors.success : completionRate >= 40 ? colors.info : colors.warning
                }
              ]}
            />
          </View>
        </Card>

        {/* Recommendations */}
        <Text style={styles.sectionTitle}>Recommendations</Text>
        <View style={styles.recsContainer}>
          {recs.map((r, i) => (
            <Card key={i} style={[styles.recCard, { backgroundColor: r.bg }]}>
              <View style={styles.recHeader}>
                <View style={styles.recIconWrap}>
                  <Ionicons name={r.icon} size={16} color={r.text} />
                </View>
                <Text style={[styles.recTitle, { color: r.text }]}>{r.title}</Text>
              </View>
              <Text style={[styles.recDesc, { color: r.text }]}>{r.desc}</Text>
            </Card>
          ))}
          {recs.length === 0 && (
            <Card style={styles.recCardEmpty}>
              <Ionicons name="sparkles-outline" size={24} color={colors.success} style={{ marginBottom: 6 }} />
              <Text style={styles.recTitleEmpty}>Team Is Healthy</Text>
              <Text style={styles.recDescEmpty}>No immediate actions needed. All systems normal.</Text>
            </Card>
          )}
        </View>
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
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandLight,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginLeft: 10,
    gap: 4,
  },
  liveText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: colors.brandDark,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  card: {
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 12,
  },
  autoBadge: {
    backgroundColor: colors.brandLight,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  autoText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: colors.brandDark,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    gap: 10,
  },
  dangerInsight: {
    backgroundColor: colors.dangerBg,
  },
  warningInsight: {
    backgroundColor: colors.warningBg,
  },
  successInsight: {
    backgroundColor: colors.successBg,
  },
  insightText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  insightLabel: {
    fontWeight: typography.weights.bold,
  },
  noInsightsText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 12,
  },
  table: {
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCellLabel: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
    marginRight: 10,
  },
  tableBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  tableBadgeText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
  noDataText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 16,
  },
  performerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rank: {
    width: 20,
    fontSize: 14,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    textAlign: 'center',
    marginRight: 6,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 13,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  performerDesignation: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  perfValBadge: {
    backgroundColor: colors.successBg,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  perfValText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.successText,
  },
  healthStats: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  healthStatBox: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  healthStatVal: {
    fontSize: 16,
    fontWeight: typography.weights.bold,
  },
  healthStatLbl: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  completionLabel: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  completionBar: {
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  recsContainer: {
    gap: 12,
  },
  recCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 0,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  recIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recTitle: {
    fontSize: 13,
    fontWeight: typography.weights.bold,
  },
  recDesc: {
    fontSize: 11,
    lineHeight: 15,
    opacity: 0.85,
  },
  recCardEmpty: {
    padding: 16,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 0,
  },
  recTitleEmpty: {
    fontSize: 14,
    fontWeight: typography.weights.bold,
    color: colors.successText,
    marginBottom: 4,
  },
  recDescEmpty: {
    fontSize: 11,
    color: colors.successText,
    opacity: 0.8,
    textAlign: 'center',
  },
});

export default AIInsightsScreen;
