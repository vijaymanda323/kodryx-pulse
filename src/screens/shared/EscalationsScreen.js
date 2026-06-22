import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Platform,
  Dimensions,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../theme/colors';
import api from '../../services/api';
import Card from '../../components/Card';

const { width } = Dimensions.get('window');

const EscalationsScreen = ({ navigation }) => {
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/api/escalations');
      setEscalations(data || []);
    } catch (err) {
      console.error('Failed to load escalations', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  // derived metrics
  const openCount = escalations.filter(e => e.status === 'Open').length;
  const criticalCount = escalations.filter(e => e.priority === 'critical' || e.priority === 'Critical').length;
  const inProgressCount = escalations.filter(e => e.status === 'In Progress' || e.status === 'In progress').length;
  const resolvedCount = escalations.filter(e => e.status === 'Resolved').length;

  const statCards = [
    { label: 'Total Open', value: openCount, color: colors.danger },
    { label: 'Critical', value: criticalCount, color: '#DC2626' },
    { label: 'In Progress', value: inProgressCount, color: colors.warning },
    { label: 'Resolved', value: resolvedCount, color: colors.success },
  ];

  const filtered = escalations.filter(e => {
    if (!q) return true;
    const hay = `${e.member} ${e.category} ${e.project} ${e.task} ${e.description} ${e.escId} ${e.owner} ${e.status}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const getPriorityStyle = (p) => {
    const pri = p?.toLowerCase();
    if (pri === 'critical' || pri === 'high') {
      return { dot: colors.danger, text: 'CRITICAL', color: colors.dangerText, bg: colors.dangerBg };
    }
    if (pri === 'medium') {
      return { dot: colors.warning, text: 'MEDIUM', color: colors.warningText, bg: colors.warningBg };
    }
    return { dot: colors.textMuted, text: 'LOW', color: colors.textSecondary, bg: colors.backgroundSecondary };
  };

  const getStatusBadgeStyle = (s) => {
    const status = s?.toLowerCase();
    if (status === 'open') return { bg: colors.dangerBg, text: colors.dangerText };
    if (status === 'in progress' || status === 'in-progress') return { bg: colors.warningBg, text: colors.warningText };
    if (status === 'resolved') return { bg: colors.successBg, text: colors.successText };
    return { bg: colors.backgroundSecondary, text: colors.textSecondary };
  };

  const renderEscalationItem = ({ item }) => {
    const prio = getPriorityStyle(item.priority);
    const status = getStatusBadgeStyle(item.status);
    const timeStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'recently';

    return (
      <Card style={styles.escCard}>
        <View style={styles.escHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.prioDot, { backgroundColor: prio.dot }]} />
            <Text style={[styles.prioText, { color: prio.dot }]}>{prio.text}</Text>
            <Text style={styles.escId}>{item.escId || '#ESC'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.text }]}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.member}>{item.member} · {item.category}</Text>
        <Text style={styles.projectText}>
          <Ionicons name="folder-outline" size={12} /> {item.project} · {item.task || 'General'}
        </Text>
        <Text style={styles.desc}>{item.description}</Text>

        <View style={styles.footer}>
          <Text style={styles.ownerText}>Owner: {item.owner || 'Unassigned'}</Text>
          <Text style={styles.timeText}>{timeStr}</Text>
        </View>
      </Card>
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
          <Text style={styles.headerTitle}>Escalation Center</Text>
          <Text style={styles.headerSub}>{openCount} open cases</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View style={styles.statsRow}>
          {statCards.map((c, i) => (
            <View key={i} style={styles.statBox}>
              <View style={[styles.statAccent, { backgroundColor: c.color }]} />
              <Text style={styles.statVal}>{c.value}</Text>
              <Text style={styles.statLbl}>{c.label}</Text>
            </View>
          ))}
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by member, project, keyword..."
            placeholderTextColor={colors.textMuted}
            value={q}
            onChangeText={setQ}
          />
        </View>

        <Text style={styles.sectionTitle}>All Escalations ({filtered.length})</Text>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderEscalationItem}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={40} color={colors.success} />
              <Text style={styles.emptyText}>No escalations found</Text>
            </View>
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    padding: 16,
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
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  statAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    height: 3,
  },
  statVal: {
    fontSize: 18,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  statLbl: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 12,
  },
  escCard: {
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  escHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  prioText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  escId: {
    fontSize: 10,
    color: colors.textMuted,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
  member: {
    fontSize: 13,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  projectText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  desc: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  ownerText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
});

export default EscalationsScreen;
