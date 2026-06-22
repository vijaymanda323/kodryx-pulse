import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../theme/colors';
import api from '../../services/api';
import Card from '../../components/Card';

const { width } = Dimensions.get('window');

const ProjectsScreen = ({ navigation }) => {
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProjects = async () => {
    try {
      const today = new Date().toLocaleDateString('en-CA');
      const [p, l] = await Promise.all([
        api.get('/api/projects'),
        api.get(`/api/daily-status?date=${today}`).catch(() => ({ data: [] })),
      ]);
      setProjects(p.data || []);
      setLogs(Array.isArray(l.data) ? l.data : []);
    } catch (error) {
      console.error('Failed to load projects', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  const getStatusConfig = (s) => {
    switch (s) {
      case 'At risk':
        return { bg: colors.dangerBg, text: colors.dangerText, label: 'At risk' };
      case 'In progress':
      case 'On track':
        return { bg: colors.successBg, text: colors.successText, label: s };
      default:
        return { bg: colors.backgroundSecondary, text: colors.textSecondary, label: s || 'Active' };
    }
  };

  const summaryFor = (pid) => {
    const id = pid?.toString();
    let updates = 0, planned = 0, blocked = 0;
    const people = new Set();
    logs.forEach((l) => {
      const emp = (l.employee?._id || l.employee)?.toString();
      (l.tasks || []).forEach((t) => {
        if ((t.project?._id || t.project)?.toString() === id) {
          updates++;
          if (emp) people.add(emp);
          if (t.status === 'Blocked') blocked++;
        }
      });
      (l.tomorrow || []).forEach((t) => {
        if ((t.project?._id || t.project)?.toString() === id) planned++;
      });
    });
    return { updates, planned, blocked, contributors: people.size };
  };

  const renderProjectCard = ({ item }) => {
    const statusCfg = getStatusConfig(item.status);
    const summary = summaryFor(item._id);

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ProjectDetail', { id: item._id })}
        activeOpacity={0.9}
      >
        <Card style={styles.projCard}>
          <View style={[styles.borderAccent, { backgroundColor: item.barColor || colors.brand }]} />
          
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: item.iconBg || colors.brandLight }]}>
              <Ionicons name={item.icon ? 'folder-open-outline' : 'folder-outline'} size={20} color={item.iconColor || colors.brand} />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
              <Text style={[styles.statusText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
            </View>
          </View>

          <Text style={styles.projName}>{item.name}</Text>
          <Text style={styles.projDesc} numberOfLines={2}>{item.description}</Text>

          {item.teamLead && (
            <View style={styles.leadRow}>
              <Ionicons name="ribbon-outline" size={14} color={colors.brand} />
              <Text style={styles.leadLabel}>Lead: </Text>
              <Text style={styles.leadName}>{item.teamLead.name}</Text>
            </View>
          )}

          <View style={styles.progressRow}>
            <Text style={styles.membersCount}>{item.members?.length || 0} members</Text>
            <Text style={styles.progressPct}>{item.progress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${item.progress}%`, backgroundColor: item.barColor || colors.brand }]} />
          </View>

          {/* Today's standup summary */}
          <View style={styles.todaySummary}>
            <Text style={styles.todayLabel}>TODAY</Text>
            <View style={styles.badgesContainer}>
              {summary.updates > 0 ? (
                <View style={[styles.summaryBadge, { backgroundColor: colors.successBg }]}>
                  <Text style={[styles.summaryBadgeText, { color: colors.successText }]}>{summary.updates} updates</Text>
                </View>
              ) : (
                <View style={[styles.summaryBadge, { backgroundColor: colors.backgroundSecondary }]}>
                  <Text style={[styles.summaryBadgeText, { color: colors.textSecondary }]}>No updates</Text>
                </View>
              )}
              {summary.planned > 0 && (
                <View style={[styles.summaryBadge, { backgroundColor: colors.infoBg }]}>
                  <Text style={[styles.summaryBadgeText, { color: colors.infoText }]}>{summary.planned} planned</Text>
                </View>
              )}
              {summary.blocked > 0 && (
                <View style={[styles.summaryBadge, { backgroundColor: colors.dangerBg }]}>
                  <Text style={[styles.summaryBadgeText, { color: colors.dangerText }]}>{summary.blocked} blocked</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.dueDateText}>Due {item.dueDate || '—'}</Text>
            <Text style={styles.updatedText}>Updated {item.updated || 'recently'}</Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>All Projects</Text>
          <Text style={styles.headerSub}>{projects.length} active projects</Text>
        </View>
      </View>

      <FlatList
        data={projects}
        keyExtractor={(item) => item._id}
        renderItem={renderProjectCard}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.brand]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No active projects found</Text>
          </View>
        }
      />
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
  headerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  projCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  borderAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  projName: {
    fontSize: 16,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  projDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 12,
  },
  leadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  leadLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  leadName: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  membersCount: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  progressPct: {
    fontSize: 12,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  todaySummary: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginBottom: 10,
  },
  todayLabel: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  summaryBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  summaryBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  dueDateText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  updatedText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
});

export default ProjectsScreen;
