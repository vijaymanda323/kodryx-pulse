import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../theme/colors';
import api from '../../services/api';
import Card from '../../components/Card';

const { width } = Dimensions.get('window');

const ProjectDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const [project, setProject] = useState(null);
  const [leavesByUser, setLeavesByUser] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [p, l] = await Promise.all([
          api.get(`/api/projects/${id}`),
          api.get('/api/leaves').catch(() => ({ data: [] })),
        ]);
        setProject(p.data);
        const grouped = {};
        (l.data || []).forEach((lv) => {
          const eid = lv.employee?._id || lv.employee;
          (grouped[eid] = grouped[eid] || []).push(lv);
        });
        setLeavesByUser(grouped);
      } catch (err) {
        console.error('Failed to load project details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand} />
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Project not found</Text>
      </SafeAreaView>
    );
  }

  const tasksCompleted = Math.round(project.progress * 0.5);
  const openTasks = Math.round((100 - project.progress) * 0.3);

  const getMemberStatus = (mid) => {
    const userLeaves = leavesByUser[mid] || [];
    const todayStr = new Date().toLocaleDateString('en-CA');
    const todayLeave = userLeaves.find(l => l.status === 'Approved' && l.startDate <= todayStr && l.endDate >= todayStr);
    
    if (todayLeave) {
      return todayLeave.type === 'Work from Home' ? { label: 'WFH', bg: colors.infoBg, text: colors.infoText } : { label: 'Leave', bg: colors.dangerBg, text: colors.dangerText };
    }
    return { label: 'Present', bg: colors.successBg, text: colors.successText };
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Project Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Details Card */}
        <Card style={styles.mainCard}>
          <View style={styles.cardTop}>
            <View style={[styles.iconWrap, { backgroundColor: project.iconBg || colors.brandLight }]}>
              <Ionicons name={project.icon ? 'folder-open-outline' : 'folder-outline'} size={28} color={project.iconColor || colors.brand} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.projName}>{project.name}</Text>
              <Text style={styles.projDesc}>{project.description}</Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: project.status === 'At risk' ? colors.dangerBg : colors.successBg }]}>
              <Text style={[styles.statusText, { color: project.status === 'At risk' ? colors.dangerText : colors.successText }]}>{project.status}</Text>
            </View>
            {project.teamLead && (
              <View style={styles.leadBadge}>
                <Ionicons name="crown" size={10} color={colors.brand} />
                <Text style={styles.leadText}>Lead: {project.teamLead.name}</Text>
              </View>
            )}
            <View style={styles.metaBadge}>
              <Ionicons name="calendar-outline" size={10} color={colors.textSecondary} />
              <Text style={styles.metaBadgeText}>Due {project.dueDate}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressTitle}>Completion progress</Text>
              <Text style={styles.progressPct}>{project.progress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${project.progress}%`, backgroundColor: project.barColor || colors.brand }]} />
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{project.members?.length || 0}</Text>
              <Text style={styles.statLabel}>Team members</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: colors.success }]}>{tasksCompleted}</Text>
              <Text style={styles.statLabel}>Tasks completed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: colors.warning }]}>{openTasks}</Text>
              <Text style={styles.statLabel}>Open tasks</Text>
            </View>
          </View>
        </Card>

        {/* Team Members List */}
        <Text style={styles.sectionTitle}>Team Members</Text>
        <View style={styles.membersList}>
          {project.members?.map((m) => {
            const status = getMemberStatus(m._id);
            return (
              <TouchableOpacity
                key={m._id}
                style={styles.memberItem}
                onPress={() => navigation.navigate('EmployeeWorkflow', { id: m._id })}
                activeOpacity={0.8}
              >
                <View style={[styles.avatar, { backgroundColor: m.avatar?.bg || colors.brandLight }]}>
                  <Text style={[styles.avatarText, { color: m.avatar?.color || colors.brandDark }]}>
                    {m.avatar?.initials || m.name?.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{m.name}</Text>
                  <Text style={styles.memberDesignation}>{m.designation || 'Team Member'}</Text>
                </View>
                <View style={[styles.memberStatusBadge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.memberStatusText, { color: status.text }]}>{status.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={styles.arrow} />
              </TouchableOpacity>
            );
          })}
          {(!project.members || project.members.length === 0) && (
            <Text style={styles.noMembersText}>No members assigned to this project.</Text>
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
  mainCard: {
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  projName: {
    fontSize: 18,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  projDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
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
  leadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  leadText: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  metaBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressTitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressPct: {
    fontSize: 13,
    fontWeight: typography.weights.bold,
    color: colors.brandDark,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
    marginTop: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 20,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 12,
  },
  membersList: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: typography.weights.bold,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 13,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  memberDesignation: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  memberStatusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginRight: 8,
  },
  memberStatusText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
  arrow: {
    marginLeft: 4,
  },
  noMembersText: {
    paddingVertical: 20,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
  },
});

export default ProjectDetailScreen;
